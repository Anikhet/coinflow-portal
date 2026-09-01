import {
  LazyDonutChart, LazyRankedBarChart, LazyStackedDonutChart,
} from '@/components/charts/breakdown-chart-lazy'
import { formatShare, sliceSwatch } from '@/components/charts/donut-slices'
import { formatCompactCurrency, formatCount } from '@/lib/format'
import { Truncated } from '@/components/ui/truncated'
import { InfoHint } from '@/components/ui/info-hint'
import type { BreakdownGroup, BreakdownView } from '@/types/breakdown'

/**
 * BREAKDOWN VIEWS
 * =============================================================================
 * Three ways to draw the same part-to-whole split, switched by the tab control
 * on the card. They are not decoration — each is genuinely better at a
 * different question, and which question matters changes by dataset and by who
 * is looking:
 *
 *  - DONUT answers "what is the SHAPE of this split?". The whole is drawn, so
 *    one dominant slice versus an even spread reads instantly. It is the worst
 *    of the three at comparing two similar slices, because that is an angle
 *    judgement.
 *
 *  - BARS answer "how much bigger is this than that?". A shared zero baseline
 *    turns every comparison into a length judgement, which people make
 *    accurately. It gives up drawing the whole to do it.
 *
 *  - LIST answers "what are the exact numbers?" — the ranked table, with a
 *    short bar in the column grid, scaled to the LEADER, as a secondary cue.
 *    It is the only view that carries counts alongside amounts, and the only
 *    one that stays readable past a dozen rows.
 *
 * Colour: the donut and the bars share one ramp, stepped by rank, so a
 * merchant sits at the same depth in both. The list opts out and draws every
 * row in flat brand — its bars are normalised to the leader rather than to the
 * whole, so a colour carried over from the other two would be claiming a
 * correspondence that no longer holds.
 *
 * The Donut view is the one that changes shape with the data. A card carrying
 * TWO dimensions of one total — brand and funding type, both partitioning the
 * same volume — draws them as one mark: a ring around a disc, rather than two
 * separate pies that made the card look like two unrelated charts. See
 * StackedDonutChart for why nesting these two particular cuts is honest and
 * what stops it reading as a hierarchy.
 */

/**
 * The Donut view for a whole card, because with two dimensions the ring is one
 * mark spanning both groups and can no longer be rendered per group.
 *
 * THE LEGEND IS A TABLE, not a list of captions, and it is set on one grid that
 * spans BOTH dimensions:
 *
 *   keyline │ mark │ label ………………………… │ share │ amount
 *
 * The two number columns have fixed widths, so every figure in the card aligns
 * — the funding-type amounts sit directly under the brand amounts even though
 * they belong to a different cut. That vertical alignment is the point: set in
 * tabular numerals on a shared right edge, the column can be read down as a
 * column. Ragged figures have to be read one at a time, as prose.
 *
 * ONE MARK PER ROW. The original carried a colour chip AND a logo in the same
 * leading slot — two devices doing identity, which is the redundancy this
 * layout most wanted rid of. What survives is the logo, because it identifies
 * the thing; the colour is demoted to a 3px keyline at the row's edge, where it
 * still ties the row to its arc but stops competing with the mark for the
 * reader's first glance.
 *
 * A rule under each dimension heading, and nothing between the rows. The rule
 * says "a new cut starts here", which is a structural fact; a rule between rows
 * would be drawing a border around every cell for no reason.
 *
 * ONE VERTICAL MODULE, 28px, AND NOTHING ELSE. Every band in the legend — each
 * heading, each row — is exactly one module tall, and the groups butt directly
 * against each other with no gap between them. So the rhythm never breaks: the
 * distance from the Visa row to the Mastercard row is the distance from the
 * last brand row to the funding-type heading, and the eye can travel the whole
 * legend at one cadence.
 *
 * The previous arrangement set row spacing, heading margin and group spacing
 * independently — 8px here, 16px there, 6px under a rule — which produced four
 * different gaps in a block eight rows tall. None of them was wrong on its own;
 * together they read as drift, because a reader measures gaps against each
 * other, not against intent. Separation is carried by the RULE under each
 * heading instead, which costs no vertical space.
 *
 * Within its module every band is CENTRED, headings included. Setting the
 * heading on the rule instead pushed its text to the bottom of its band, which
 * opened a gap above it and closed one below — so the one element meant to
 * introduce the rows beneath it sat nearer to the group it had just ended.
 * Centred, the space above and below each piece of text is equal, and the
 * cadence holds across headings and rows alike.
 *
 * Eight modules also stand the legend at 224px — the height of the ring beside
 * it — so the two halves of the card end on the same line.
 *
 * The two columns are TOP-ALIGNED, not centred. A legend shorter than its ring
 * — six merchant rows against a 213px disc — was being centred against it, so
 * the leftover height was split into a gap above the first row and an equal
 * gap below the last. Two mystery gaps, in the one place the eye reads for
 * where the list begins. Top-aligned, the list starts level with the top of
 * the mark and whatever is left over collects in a single place at the foot of
 * the shorter column, where it reads as margin rather than as spacing.
 */
export function BreakdownDonutView({ groups }: { groups: BreakdownGroup[] }) {
  const stacked = groups.length > 1
  const total = groups[0]?.rows.reduce((sum, row) => sum + row.amount, 0) ?? 0

  return (
    /* Legend beside the rings, not beneath: the mark is square and would
       otherwise leave half the card's width empty. */
    <div className="flex flex-1 flex-col items-center gap-5 md:flex-row md:items-start">
      <div className="flex w-full justify-center md:w-[38%] md:shrink-0">
        {stacked ? (
          <LazyStackedDonutChart groups={groups} />
        ) : (
          <LazyDonutChart slices={groups[0]?.rows ?? []} total={total} centerLabel="total" />
        )}
      </div>

      <div className="w-full min-w-0 flex-1">
        {groups.map((group) => (
          <section key={group.label}>
            {/* The rings have no room for their own dimension labels, so the
                legend carries them — otherwise two cuts of six slices arrive
                with no statement of what either one IS. */}
            {stacked && (
              <div className="flex h-7 items-center gap-1.5 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-[0.06em] leading-none text-ink-faint">
                  {group.label}
                </h3>
                {group.term && <InfoHint term={group.term} label={group.label} />}
              </div>
            )}

            <ul>
              {group.rows.map((row, rank) => (
                <li key={row.key} className="flex h-7 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-4 w-[3px] shrink-0 rounded-full"
                    style={{ background: sliceSwatch(rank) }}
                  />
                  {row.media && (
                    <span className="grid size-5 shrink-0 place-items-center">{row.media}</span>
                  )}
                  <Truncated className="min-w-0 flex-1 text-sm text-ink">{row.label}</Truncated>
                  {/* Share, then amount — smallest unit to largest, left to
                      right, so the eye lands last on the figure the card is
                      actually about. Counts are one tab away in List; squeezed
                      in here they left no width for the label and truncated
                      merchant names to "north…". */}
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-muted">
                    {formatShare(row.share)}
                  </span>
                  <span className="w-[72px] shrink-0 text-right text-sm font-medium tabular-nums text-ink">
                    {formatCompactCurrency(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export function BreakdownDimension({ group, view, unit, labelled }: {
  group: BreakdownGroup
  view: Exclude<BreakdownView, 'donut'>
  unit: string
  /** False when the card draws a single dimension, where the card title already says it. */
  labelled: boolean
}) {
  if (view === 'bars') {
    return (
      <div className="flex flex-1 flex-col">
        {labelled && (
          <div className="mb-2 flex items-center gap-1.5">
            <DimensionLabel>{group.label}</DimensionLabel>
            {group.term && <InfoHint term={group.term} label={group.label} />}
          </div>
        )}
        <LazyRankedBarChart slices={group.rows} />
      </div>
    )
  }

  // Bars are scaled to the LEADER, not to the whole. These shares cluster
  // tightly — a merchant list runs 19.5% down to 15.2% — so against the whole
  // they would be six lengths within 4% of each other, a difference no one can
  // see. Normalising to the largest row spends the bar on the range that
  // actually varies. Nothing is lost: the share of the whole is stated exactly
  // as a number in the very next column.
  const peak = Math.max(...group.rows.map((row) => row.share), 0)

  return (
    <div className="flex flex-1 flex-col">
      <FigureHeadings unit={unit} group={group} />
      <ul className="flex-1">
        {group.rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-2">
              {/* Fixed 20px slot, so labels start on one vertical line whether
                  or not a row has a mark — a ragged left edge would undo the
                  shared baseline the bars are built on. */}
              {row.media && (
                <span className="grid size-5 shrink-0 place-items-center">{row.media}</span>
              )}
              <Truncated className="text-base text-ink">{row.label}</Truncated>
            </span>
            <RowFigures row={row} peak={peak} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Shared column widths. Values are flush LEFT within them, so every column
 * starts on one vertical rule and the figures scan down as columns rather than
 * as three ragged runs — the same grid discipline the row labels follow.
 *
 * The widths are what make that work: without a fixed cell, a left-aligned
 * `455` and `1,204` would push their neighbours around and there would be no
 * column at all.
 */
const FIGURE_COLUMNS = {
  count: 'w-16',
  bar: 'w-24',
  share: 'w-12',
  amount: 'w-20',
} as const

/** The one uppercase label treatment, so a heading cannot drift between views. */
function DimensionLabel({ children }: { children: string }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-faint">
      {children}
    </span>
  )
}

/**
 * "By brand" names a section; "brand" names a column. Same word doing a
 * different job once it moves into the header row, so the preposition comes
 * off — "BY BRAND | PAYMENTS | SHARE | AMOUNT" reads as a sentence fragment
 * where "BRAND | PAYMENTS | SHARE | AMOUNT" reads as a table.
 */
function columnHead(label: string): string {
  return label.replace(/^by\s+/i, '')
}

/**
 * Column heads for the list.
 *
 * The first head is the dimension itself, which is what the column under it
 * holds. The unit heads the COUNT column, where it belongs: "455" under
 * "payments" says the same thing as "455 payments" on every row, once, and
 * gives the numbers back the width the repeated word was taking.
 *
 * The bar column takes no heading: it is the graphic form of the share sitting
 * immediately to its right, under that column's heading, not a fourth quantity.
 */
function FigureHeadings({ unit, group }: { unit: string; group: BreakdownGroup }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border-strong pb-1.5">
      <span className="flex min-w-0 items-center gap-1.5">
        <DimensionLabel>{columnHead(group.label)}</DimensionLabel>
        {group.term && <InfoHint term={group.term} label={group.label} />}
      </span>
      <span className="flex shrink-0 items-baseline gap-2">
        <span className={`${FIGURE_COLUMNS.count} text-left`}>
          <DimensionLabel>{unit}</DimensionLabel>
        </span>
        <span className={FIGURE_COLUMNS.bar} aria-hidden />
        <span className={`${FIGURE_COLUMNS.share} text-left`}>
          <DimensionLabel>share</DimensionLabel>
        </span>
        <span className={`${FIGURE_COLUMNS.amount} text-left`}>
          <DimensionLabel>amount</DimensionLabel>
        </span>
      </span>
    </div>
  )
}

/**
 * Count, bar, share and amount, in one horizontal band.
 *
 * The bar used to be a full-width track UNDER each row, which was wrong twice
 * over. It read as a progress bar — an idiom that means "distance travelled
 * toward a goal", where this is one quantity's part of a whole. And it put the
 * length comparison on a different line from the numbers, so the eye had to
 * work two reading zones for one row, at double the row height.
 *
 * Sitting it in the column grid instead puts the graphic and its number side
 * by side, and spends the dead gap between a short merchant name and the
 * figures on the one thing that gap could usefully carry.
 */
function RowFigures({ row, peak }: { row: BreakdownGroup['rows'][number]; peak: number }) {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className={`${FIGURE_COLUMNS.count} text-left text-xs tabular-nums text-ink-faint`}>
        {formatCount(row.count)}
      </span>
      {/* Square ends, and the track is drawn: without it a bar at 78% of the
          leader has no visible extent to be 78% OF. */}
      <span className={`${FIGURE_COLUMNS.bar} h-1.5 bg-surface-sunk`} aria-hidden>
        <span
          className="block h-full bg-brand transition-[width] duration-300"
          style={{ width: `${peak > 0 ? Math.max((row.share / peak) * 100, 2) : 0}%` }}
        />
      </span>
      <span className={`${FIGURE_COLUMNS.share} text-left text-xs tabular-nums text-ink-muted`}>
        {formatShare(row.share)}
      </span>
      <span className={`${FIGURE_COLUMNS.amount} text-left text-sm font-medium tabular-nums text-ink`}>
        {formatCompactCurrency(row.amount)}
      </span>
    </span>
  )
}
