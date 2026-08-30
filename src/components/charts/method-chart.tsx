import { useState, useMemo } from 'react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { SeriesPoint, MethodSeries } from '@/types/analytics'
import { formatCompactCurrency, formatCurrency, formatDateOnly } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * METHOD VOLUME CHART
 * =============================================================================
 * The original plotted all ten payment methods as raw lines on a shared linear
 * axis. Because card volume is roughly an order of magnitude larger than every
 * other method, nine of the ten series rendered as a single flat line along
 * zero — the chart was technically complete and conveyed almost nothing.
 *
 * Two changes fix it:
 *
 *  - TOP N + OTHER. Only the highest-volume series get their own band; the
 *    remainder are summed into "Other". Six bands is near the limit of what a
 *    reader can track, and the long tail is still represented rather than
 *    dropped.
 *
 *  - STACKED AREA, not overlaid lines. The question this chart answers is
 *    "what is the volume mix and how is it trending", which is a part-to-whole
 *    question. Stacking shows both the total (the top edge) and the mix (band
 *    thickness) at once; overlaid lines show neither well.
 *
 * Series can be toggled from the legend to isolate one method.
 */

const TOP_N = 5
const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
]

export function MethodChart({ points, series }: {
  points: SeriesPoint[]
  series: MethodSeries[]
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const { chartSeries, chartPoints } = useMemo(() => {
    const top = series.slice(0, TOP_N)
    const rest = series.slice(TOP_N)

    const chartSeries = [
      ...top,
      ...(rest.length > 0
        ? [{ key: '__other', label: `Other (${rest.length})`, total: rest.reduce((sum, s) => sum + s.total, 0) }]
        : []),
    ]

    const chartPoints = points.map((point) => {
      const next: SeriesPoint = { date: point.date }
      for (const { key } of top) next[key] = point[key] ?? 0
      if (rest.length > 0) {
        next.__other = rest.reduce((sum, s) => sum + Number(point[s.key] ?? 0), 0)
      }
      return next
    })

    return { chartSeries, chartPoints }
  }, [points, series])

  const toggle = (key: string) => {
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Minimum height reserves the box before mount; the chart then grows
          to fill whatever height the card has, so no dead space is left below. */}
      <div className="min-h-[220px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <defs>
              {chartSeries.map((entry, index) => (
                <linearGradient key={entry.key} id={`fill-${entry.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.18} />
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
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} />

            {chartSeries.map((entry, index) => (
              <Area
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.label}
                stackId="volume"
                hide={hidden.has(entry.key)}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={1.5}
                fill={`url(#fill-${entry.key})`}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {chartSeries.map((entry, index) => {
          const isHidden = hidden.has(entry.key)
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => toggle(entry.key)}
              aria-pressed={!isHidden}
              className={cn(
                'flex items-center gap-1.5 rounded text-[11px] transition-opacity',
                isHidden ? 'opacity-40' : 'opacity-100',
              )}
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-[2px]"
                style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-ink-muted">{entry.label}</span>
              <span className="tabular-nums text-ink-faint">{formatCompactCurrency(entry.total)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface TooltipPayloadEntry {
  name?: string
  value?: number
  color?: string
  dataKey?: string
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0)

  return (
    <div className="rounded-[var(--radius-control)] border border-border bg-surface p-2.5 shadow-xl">
      <p className="mb-1.5 text-[11px] font-medium text-ink-faint">
        {label ? formatDateOnly(`${label}T00:00:00`) : ''}
      </p>
      <div className="space-y-1">
        {/* Reversed so the tooltip order matches the visual stacking order. */}
        {[...payload].reverse().map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-[12px]">
            <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{ background: entry.color }} />
            <span className="flex-1 text-ink-muted">{entry.name}</span>
            <span className="tabular-nums text-ink">{formatCurrency(entry.value ?? 0)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-border pt-1.5 text-[12px]">
        <span className="font-medium text-ink">Total</span>
        <span className="font-semibold tabular-nums text-ink">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
