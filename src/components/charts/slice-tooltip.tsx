import type { ReactNode } from 'react'

/**
 * SLICE TOOLTIP
 * =============================================================================
 * The hover card shared by every breakdown mark — donut, stacked rings, ranked
 * bars. One component because the three were already the same object with
 * three sets of drifting spacing, and because a reader who hovers a Visa arc
 * and then a Visa bar should not be handed two differently shaped cards.
 *
 * ARRANGEMENT. Three bands, top to bottom, in descending order of what
 * identifies the thing:
 *
 *   1. Eyebrow — WHICH CUT this belongs to ("By brand"), uppercase and
 *      letterspaced so it reads as a category heading rather than as data.
 *   2. Subject — the mark and its name, the largest type in the card.
 *   3. Figures — a hairline rule, then label/value pairs.
 *
 * Everything is FLUSH LEFT on one axis: the eyebrow, the mark, and the figure
 * labels all start at the same x. The values are the single exception — they
 * are flush RIGHT in their own column, set in tabular numerals, so digits line
 * up vertically and two values can be compared down the column instead of
 * being read as prose. That opposition (labels left, numbers right, rule
 * between) is the whole layout; there is no centring, no colon, and no middot
 * doing a separator's job.
 *
 * Splitting the figures onto their own rows is what the run-on line could not
 * do: "$973.2K · 53.9%" made two unrelated quantities into one string, and the
 * middot had to be read as "and also". Named rows say which number is which.
 */

export interface TooltipFigure {
  label: string
  value: string
}

export function SliceTooltip({ eyebrow, mark, label, figures }: {
  /** The dimension this slice belongs to, e.g. "By brand". */
  eyebrow?: string
  /** The row's logo, avatar or glyph — the same mark used everywhere else. */
  mark?: ReactNode
  label: string
  figures: TooltipFigure[]
}) {
  return (
    <div
      className={[
        // Floor, not a fixed width: the card must not resize as the pointer
        // moves between a short label and a long one, which reads as flicker.
        'min-w-[184px] rounded-[var(--radius-control)] border border-border',
        'bg-surface p-3 shadow-xl',
      ].join(' ')}
    >
      {eyebrow && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
          {eyebrow}
        </p>
      )}

      <div className="flex items-center gap-2">
        {mark && <span className="grid size-5 shrink-0 place-items-center">{mark}</span>}
        <span className="text-base font-medium leading-tight text-ink">{label}</span>
      </div>

      {/* A rule, not a gap. It separates identity from measurement, and gives
          the value column a top edge to align against. */}
      <dl className="mt-2.5 space-y-1.5 border-t border-border pt-2.5">
        {figures.map((figure) => (
          <div key={figure.label} className="flex items-baseline justify-between gap-8">
            <dt className="text-xs text-ink-faint">{figure.label}</dt>
            <dd className="text-xs font-medium tabular-nums text-ink">{figure.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
