import { useId } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCompactCurrency, formatCount } from '@/lib/format'
import { formatShare, sliceSwatch } from './donut-slices'
import { SliceTooltip } from './slice-tooltip'
import type { BreakdownGroup, BreakdownRow } from '@/types/breakdown'

/**
 * STACKED DONUT CHART
 * =============================================================================
 * Two dimensions of the SAME whole, drawn as concentric rings — shadcn's
 * stacked pie applied to the card breakdown, where the inner ring is card
 * volume by brand and the outer ring is the identical volume by funding type.
 *
 * WHY THIS IS HONEST HERE. Nested rings normally imply a HIERARCHY: the outer
 * ring subdivides the inner one, as in a sunburst. That is not the relationship
 * here — funding type is not a child of brand — and drawing it as one would
 * invite a reader to conclude that the debit arc "belongs to" the Visa arc
 * beneath it. What makes the pairing legitimate is that both rings partition
 * the same total: every card payment has exactly one brand and exactly one
 * funding type, so each ring is a complete, independent cut of $1.8M. The
 * shared centre figure is therefore true of both, which is the whole reason
 * they can share a chart at all.
 *
 * COLOUR RESTARTS PER RING, and under this palette that is the correct choice
 * rather than a compromise. The `--slice-*` ramp encodes RANK, not identity —
 * deep is the largest share, pale the smallest — so each ring has to start at
 * the deep end to say "this is the biggest part OF THIS CUT". Running the ramp
 * straight through both rings instead would render every funding slice paler
 * than every brand slice and imply funding is the smaller quantity, when the
 * two rings are the same $1.8M partitioned twice.
 *
 * The consequence is that Visa and Debit share a fill, both being first in
 * their ring. That is not a claim that they are related: the ramp means rank,
 * not identity, and the two are told apart by which RING they sit in, by the
 * legend's headings, and by a tooltip that names its dimension ("By brand")
 * so an arc is never ambiguous about which cut it belongs to.
 *
 * NO FIGURE IN THE MIDDLE, and the inner dimension is a SOLID DISC rather than
 * a second ring. The card's header already states the total four lines above,
 * so a copy in the hole was the same number twice in one card — and it was the
 * copy that had to be abbreviated to "$1.8M", so the two disagreed on
 * precision. With the total gone the hole earns nothing, and closing it gives
 * the inner cut the full disc: more area for the dimension that would
 * otherwise be squeezed into the thinnest ring.
 *
 * A reader who wants the actual cross-tab — debit Visa versus credit Visa — is
 * not served by this or by any pie; that is a different query, and the honest
 * answer is that this card does not carry it.
 */

interface RingDatum extends BreakdownRow {
  /** Ring this arc came from, so the tooltip can name its dimension. */
  ring: string
}

export function StackedDonutChart({ groups }: { groups: BreakdownGroup[] }) {
  // SVG ids are document-global and several donuts render on this page.
  const chartId = useId()

  const rings = groups.map((group) => ({
    label: group.label,
    data: group.rows.map((row): RingDatum => ({ ...row, ring: group.label })),
  }))

  // Each band is 20% of the radius with a 7% gutter, so adding a third
  // dimension later thins the bands rather than overflowing the box — no call
  // site has to recompute radii.
  //
  // The gutter is wide on purpose. Both bands open with the same deep tone —
  // rank one of each cut — so where they meet, a narrow gutter left two
  // identical navies touching and the mark read as one blob with white cuts
  // scored into it. The gap has to be wide enough to be seen as SPACE between
  // two objects rather than as a line drawn on one.
  const BAND = 20
  const GUTTER = 7
  const outerEdge = 96

  return (
    <div className="aspect-square w-full max-w-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<StackedTooltip />} cursor={false} wrapperStyle={{ zIndex: 10 }} />
          {rings.map((ring, index) => {
            // Ring 0 is the OUTERMOST, working inward, so the first dimension
            // listed reads first — outside in, the way the eye enters the mark.
            const outer = outerEdge - index * (BAND + GUTTER)
            // The innermost cut closes into a full disc — there is no centre
            // figure for a hole to hold open.
            const innermost = index === rings.length - 1
            return (
              <Pie
                key={ring.label}
                data={ring.data}
                dataKey="amount"
                nameKey="label"
                innerRadius={innermost ? 0 : `${outer - BAND}%`}
                outerRadius={`${outer}%`}
                // Hairline separators. At 2° of padding plus a 2px stroke the
                // white wedges between slices grew to ~6px at this radius —
                // wide enough to read as gaps cut INTO the disc rather than as
                // divisions between its parts, and wide enough to distort the
                // areas they separate. One degree and one pixel is enough to
                // part two slices that already differ in tone.
                paddingAngle={1}
                strokeWidth={1}
                stroke="var(--surface)"
                isAnimationActive={false}
              >
                {/* Rank WITHIN the ring — see the note on colour above. */}
                {ring.data.map((slice, rank) => (
                  <Cell key={`${chartId}-${slice.key}`} fill={sliceSwatch(rank)} />
                ))}
              </Pie>
            )
          })}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

interface StackedTooltipEntry {
  payload?: RingDatum
}

function StackedTooltip({ active, payload }: { active?: boolean; payload?: StackedTooltipEntry[] }) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null

  return (
    <SliceTooltip
      // The ring's name leads. Without it an arc is just a colour, and the
      // reader has to guess which of the two cuts they are pointing at.
      eyebrow={slice.ring}
      mark={slice.media}
      label={slice.label}
      figures={[
        { label: 'Amount', value: formatCompactCurrency(slice.amount) },
        { label: 'Share', value: formatShare(slice.share) },
        { label: 'Payments', value: formatCount(slice.count) },
      ]}
    />
  )
}
