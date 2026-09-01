/**
 * Shared slice constants for the donut breakdowns.
 *
 * Lives outside the chart component for the same reason `series.ts` does — the
 * legend and the ring have to agree on which colour belongs to which slice —
 * and for one more: `donut-chart.tsx` is lazily loaded to keep recharts out of
 * the main bundle, so a legend importing a helper from it would drag the whole
 * charting library back in eagerly and undo the split.
 */

/**
 * Slice fill by RANK (largest first), so a slice keeps its colour across
 * reloads as long as its position holds.
 *
 * These are the `--slice-*` ramp, NOT the `--chart-*` categorical hues the
 * line charts use. A breakdown is one total split into parts, already sorted
 * by size — a single brand-hue ramp running deep-to-pale says that, where nine
 * unrelated hues say "nine unrelated series" and make the ring read louder
 * than anything else on the page. See the breakdown-slices block in index.css.
 *
 * Positions past the end CLAMP rather than wrap: two slices sharing the last
 * step is a smaller failure than one silently adopting a colour already in use.
 */
const RAMP = [
  'var(--slice-1)', 'var(--slice-2)', 'var(--slice-3)',
  'var(--slice-4)', 'var(--slice-5)', 'var(--slice-6)',
  'var(--slice-7)', 'var(--slice-8)', 'var(--slice-9)',
]

export function sliceSwatch(index: number): string {
  return RAMP[Math.min(Math.max(index, 0), RAMP.length - 1)]
}

/**
 * 0–1 share as a percentage. Not `formatPercent`, which signs its output for
 * deltas — a leading "+" on a share of a whole reads as a change, not a part.
 */
export function formatShare(share: number): string {
  return `${(share * 100).toFixed(1)}%`
}
