/**
 * Shared series constants for the dashboard charts.
 *
 * Lives outside the chart component so the picker dropdown and the chart agree
 * on the total's key and on which swatch belongs to which series — a legend
 * whose colours disagree with the plot is worse than no legend.
 */

/** Synthetic key for the summed total, offered as a series in its own right. */
export const TOTAL_KEY = '__total'

/**
 * Hue positions. Index order matches the series ranking, largest first.
 *
 * These are HUES, not steps of one ramp — see the chart-series block in
 * index.css for why the palette is categorical. There is one per payment
 * method, so no two methods share a colour.
 */
const RAMP = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
  'var(--chart-7)', 'var(--chart-8)', 'var(--chart-9)',
]

/**
 * The total always draws in the brand colour; methods take hue positions.
 *
 * `index` is the method's rank in the FULL method list, not its position in the
 * current selection, so deselecting a method never repaints the ones left on
 * the plot. A colour that moves between reads makes the legend the only way to
 * identify a line, which defeats having colour at all.
 *
 * Positions past the end CLAMP rather than wrap. The palette currently has a
 * hue per method so this cannot trigger; it is a guard for a tenth method being
 * added, where two lines sharing the last hue is a smaller failure than a line
 * silently adopting the colour another method is already using.
 */
export function SERIES_SWATCH(key: string, index: number): string {
  if (key === TOTAL_KEY) return 'var(--brand)'
  return RAMP[Math.min(Math.max(index, 0), RAMP.length - 1)]
}
