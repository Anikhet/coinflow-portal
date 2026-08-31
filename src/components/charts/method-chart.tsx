import { useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SeriesPoint, MethodSeries } from '@/types/analytics'
import {
  formatCompactCount, formatCompactCurrency, formatCount, formatCurrency, formatDateOnly,
} from '@/lib/format'
import { TOTAL_KEY, SERIES_SWATCH } from './series'
import { SeriesGlyph } from './series-glyph'

/**
 * METHOD VOLUME CHART
 * =============================================================================
 * ONE SERIES BY DEFAULT, ISOLATE ON DEMAND.
 *
 * The production chart plotted all ten methods as raw lines on a shared linear
 * axis. Card volume is an order of magnitude larger than everything else, so
 * nine of ten series rendered as a flat line along zero — complete, and
 * conveying almost nothing.
 *
 * Stacking six of them fixed the flat-line problem and introduced a worse one.
 * Stacked areas are perceptually poor: every band except the bottom sits on a
 * MOVING BASELINE, so its thickness is the only cue to its value and its shape
 * is distorted by everything beneath it. Readers judge area badly at the best
 * of times, and six bands is well past the point where they can track any
 * single one. Recolouring the bands helped the noise but not the perception —
 * the problem was never the palette.
 *
 * So the chart answers one question at a time:
 *
 *  - By default it draws the TOTAL as a single filled area. That is what the
 *    headline figure above it states, and trend-of-total is the question a
 *    dashboard chart is actually opened for.
 *
 *  - A picker chooses which series to draw. One selected series renders as a
 *    filled area on its own axis, where its shape is finally legible rather
 *    than squeezed between neighbours; several render as overlaid lines, which
 *    compare directly because they share a baseline of zero.
 *
 *  - The mix — the part-to-whole question stacking was trying to answer — is
 *    served better by the picker's per-method totals, by the tooltip's full
 *    breakdown, and by the breakdown cards below, all of which give exact
 *    numbers instead of asking the eye to compare areas.
 */


export function MethodChart({ points, series, metric = 'amount', selected }: {
  /**
   * Keys to draw. Owned by the card above, because the headline figure has to
   * follow the selection — a headline reading the grand total while the plot
   * shows two methods is the same mismatch the Amount/Count toggle avoids.
   */
  selected: string[]
  /**
   * Which axis is being plotted. Formatting has to follow it — showing
   * "$1.2K" on a transaction count, or "1,203" on a dollar amount, makes the
   * chart actively misleading rather than merely unhelpful.
   */
  metric?: 'amount' | 'count'
  points: SeriesPoint[]
  series: MethodSeries[]
}) {
  const formatValue = metric === 'amount' ? formatCurrency : formatCount
  const formatAxis = metric === 'amount' ? formatCompactCurrency : formatCompactCount

  const chartPoints = useMemo(
    // Every point carries every series key plus the total, so changing the
    // selection is a dataKey change — never a refetch or a re-bucket.
    () =>
      points.map((point) => {
        const next: SeriesPoint = { date: point.date }
        let total = 0
        for (const entry of series) {
          const value = Number(point[entry.key] ?? 0)
          next[entry.key] = value
          total += value
        }
        next[TOTAL_KEY] = Math.round(total * 100) / 100
        return next
      }),
    [points, series],
  )

  // Draw in the order the picker lists them, so plot and menu agree.
  const drawn = [{ key: TOTAL_KEY, label: 'Total', total: 0 }, ...series]
    .map((entry, index) => ({ ...entry, swatch: SERIES_SWATCH(entry.key, index - 1) }))
    .filter((entry) => selected.includes(entry.key))

  // SVG ids are document-global. Two charts render on this page, so without a
  // per-instance suffix the second chart's <defs> would collide with the
  // first's and both would draw the first chart's gradients.
  const gradientId = useId()

  return (
    <div className="flex h-full flex-col">
      {/* Minimum height reserves the box before mount; the chart then grows to
          fill whatever height the card has, so no dead space is left below. */}
      <div className="min-h-[320px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <defs>
              {/* One gradient per series, in the shadcn area-chart style: a
                  strong stop at the band's top edge falling away to almost
                  nothing at its base, so a stack stays readable where bands
                  meet instead of becoming a wall of flat colour. */}
              {drawn.map((entry) => (
                <linearGradient key={entry.key} id={`fill-${gradientId}-${entry.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={entry.swatch} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={entry.swatch} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
              tickFormatter={(value: string) =>
                // Parse as LOCAL midnight. `new Date('2026-08-24')` is parsed as
                // UTC and renders as the 23rd in western timezones — an
                // off-by-one-day axis.
                new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
              minTickGap={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
              tickFormatter={(value: number) => formatAxis(value)}
            />
            <Tooltip
              content={<ChartTooltip formatValue={formatValue} drawn={drawn} showTotal={drawn.length > 1} />}
              cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            />

            {/* Drawn in reverse so the largest series sits at the BASE of the
                stack. Recharts stacks in render order, and putting the biggest
                band on top would leave every smaller one riding a wildly
                moving baseline. */}
            {[...drawn].reverse().map((entry) => (
              <Area
                key={entry.key}
                type="natural"
                dataKey={entry.key}
                name={entry.label}
                // Only stack when there is more than one band; a lone series
                // stacked against nothing just adds an id for no reason.
                stackId={drawn.length > 1 ? 'volume' : undefined}
                stroke={entry.swatch}
                strokeWidth={2}
                fill={`url(#fill-${gradientId}-${entry.key})`}
                fillOpacity={0.4}
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 2, stroke: 'var(--surface)' }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* A read-only key for what is drawn — the dropdown above is the control.
          Centred beneath the plot so the two charts' x-axes line up. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {drawn.map((entry) => (
          <span key={entry.key} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: entry.swatch }}
            />
            <SeriesGlyph seriesKey={entry.key} />
            <span className="text-ink-muted">{entry.label}</span>
            {entry.key !== TOTAL_KEY && (
              <span className="tabular-nums text-ink-faint">{formatAxis(entry.total)}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

interface TooltipPayloadEntry {
  value?: number
  payload?: SeriesPoint
}

/**
 * Shows every drawn series at the hovered day, plus their combined total when
 * more than one is drawn — the comparison the plot is being used to make.
 */
function ChartTooltip({ active, payload, label, formatValue, drawn, showTotal }: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  formatValue: (value: number) => string
  drawn: Array<{ key: string; label: string; swatch: string }>
  showTotal: boolean
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const combined = drawn.reduce((sum, entry) => sum + Number(point[entry.key] ?? 0), 0)

  return (
    <div className="min-w-[200px] rounded-[var(--radius-control)] border border-border bg-surface p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-ink-faint">
        {label ? formatDateOnly(`${label}T00:00:00`) : ''}
      </p>
      {/* Reversed to match the visual stacking order, so the row a reader is
          pointing at is the row they find in the list. */}
      <div className="space-y-1">
        {[...drawn].reverse().map((entry) => (
          <div key={entry.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: entry.swatch }}
            />
            <span className="flex-1 text-ink-muted">{entry.label}</span>
            <span className="tabular-nums text-ink">{formatValue(Number(point[entry.key] ?? 0))}</span>
          </div>
        ))}
      </div>
      {showTotal && (
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-border pt-2 text-sm">
          <span className="font-medium text-ink">Combined</span>
          <span className="font-semibold tabular-nums text-ink">{formatValue(combined)}</span>
        </div>
      )}
    </div>
  )
}
