import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SeriesPoint, MethodSeries } from '@/types/analytics'
import {
  formatCompactCount, formatCompactCurrency, formatCount, formatCurrency, formatDateOnly,
} from '@/lib/format'
import { cn } from '@/lib/cn'

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
 *  - The legend doubles as a filter. Selecting a method redraws the chart as
 *    that method alone, on its own axis, where its shape is finally legible
 *    rather than squeezed between neighbours. Selecting it again returns to the
 *    total.
 *
 *  - The mix — the part-to-whole question stacking was trying to answer — is
 *    served better by the legend's per-method totals, by the tooltip's full
 *    breakdown, and by the breakdown cards below, all of which give exact
 *    numbers instead of asking the eye to compare areas.
 */

const TOP_N = 5

/** Ramp positions for legend swatches; the area itself always uses the brand. */
const SWATCH = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
]

const TOTAL_KEY = '__total'

export function MethodChart({ points, series, metric = 'amount', focused, onFocusChange }: {
  /**
   * Isolated series key, or null for the total. Owned by the card above so the
   * headline figure can follow the chart — a headline reading the total while
   * the plot shows one method is the same mismatch the Amount/Count toggle
   * avoids.
   */
  focused: string | null
  onFocusChange: (key: string | null) => void
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

  const { legend, chartPoints } = useMemo(() => {
    const top = series.slice(0, TOP_N)
    const rest = series.slice(TOP_N)

    const legend = [
      ...top,
      ...(rest.length > 0
        ? [{
            key: '__other',
            label: `Other (${rest.length})`,
            total: rest.reduce((sum, entry) => sum + entry.total, 0),
          }]
        : []),
    ]

    // Every point carries each visible key, the folded "other", and the total —
    // so switching focus is a dataKey change, never a refetch or a re-bucket.
    const chartPoints = points.map((point) => {
      const next: SeriesPoint = { date: point.date }
      let total = 0
      for (const entry of series) total += Number(point[entry.key] ?? 0)
      for (const { key } of top) next[key] = point[key] ?? 0
      if (rest.length > 0) {
        next.__other = rest.reduce((sum, entry) => sum + Number(point[entry.key] ?? 0), 0)
      }
      next[TOTAL_KEY] = Math.round(total * 100) / 100
      return next
    })

    return { legend, chartPoints }
  }, [points, series])

  const activeKey = focused ?? TOTAL_KEY
  const activeLabel = focused
    ? legend.find((entry) => entry.key === focused)?.label ?? 'Total'
    : 'All methods'

  return (
    <div className="flex h-full flex-col">
      {/* Minimum height reserves the box before mount; the chart then grows to
          fill whatever height the card has, so no dead space is left below. */}
      <div className="min-h-[220px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
              </linearGradient>
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
              content={<ChartTooltip formatValue={formatValue} legend={legend} focused={focused} />}
              cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            />

            <Area
              // `monotone` is safe here because there is a single series: the
              // curve cannot be distorted by a neighbour's baseline.
              type="monotone"
              dataKey={activeKey}
              name={activeLabel}
              stroke="var(--brand)"
              strokeWidth={2}
              fill="url(#area-fill)"
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: 'var(--surface)' }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend doubles as the filter, centred beneath the plot so the x-axes
          of the two charts on this page line up. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {legend.map((entry, index) => {
          const isFocused = focused === entry.key
          const dimmed = focused !== null && !isFocused
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => onFocusChange(isFocused ? null : entry.key)}
              aria-pressed={isFocused}
              className={cn(
                'flex items-center gap-1.5 rounded-[6px] px-1.5 py-0.5 text-xs transition-colors',
                'hover:bg-surface-hover',
                dimmed && 'opacity-45',
                isFocused && 'bg-surface-hover',
              )}
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-[2px]"
                style={{ background: SWATCH[index % SWATCH.length] }}
              />
              <span className="text-ink-muted">{entry.label}</span>
              <span className="tabular-nums text-ink-faint">{formatAxis(entry.total)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface TooltipPayloadEntry {
  value?: number
  payload?: SeriesPoint
}

/**
 * Shows the full per-method split even when the chart is drawing only the
 * total — the breakdown stacking used to convey, without asking the eye to
 * measure areas for it.
 */
function ChartTooltip({ active, payload, label, formatValue, legend, focused }: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  formatValue: (value: number) => string
  legend: MethodSeries[]
  focused: string | null
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const rows = focused
    ? legend.filter((entry) => entry.key === focused)
    : legend
  const total = Number(point[TOTAL_KEY] ?? 0)

  return (
    <div className="min-w-[200px] rounded-[var(--radius-control)] border border-border bg-surface p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-ink-faint">
        {label ? formatDateOnly(`${label}T00:00:00`) : ''}
      </p>
      <div className="space-y-1">
        {rows.map((entry, index) => (
          <div key={entry.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: SWATCH[index % SWATCH.length] }}
            />
            <span className="flex-1 text-ink-muted">{entry.label}</span>
            <span className="tabular-nums text-ink">{formatValue(Number(point[entry.key] ?? 0))}</span>
          </div>
        ))}
      </div>
      {!focused && (
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-border pt-2 text-sm">
          <span className="font-medium text-ink">Total</span>
          <span className="font-semibold tabular-nums text-ink">{formatValue(total)}</span>
        </div>
      )}
    </div>
  )
}
