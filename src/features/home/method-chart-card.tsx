import { useState } from 'react'
import { LazyMethodChart, MethodChartFallback } from '@/components/charts/method-chart-lazy'
import { Segmented } from '@/components/ui/segmented'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import type { GlossaryTerm } from '@/lib/glossary'
import { formatCompactCurrency, formatCount } from '@/lib/format'
import type { ChartData, Metric } from '@/mocks/api'

const METRIC_OPTIONS = [
  { value: 'amount' as const, label: 'Amount' },
  { value: 'count' as const, label: 'Count' },
]

/**
 * One of the two headline charts — Payments or Payouts.
 *
 * The Amount/Count toggle switches between two pre-computed datasets rather
 * than refetching, so it responds instantly. A spinner on a two-state control
 * reads as broken.
 *
 * The headline total tracks the toggle too: showing a dollar figure above a
 * chart plotting transaction counts is the kind of mismatch that gets a number
 * quoted in a meeting and then walked back.
 */
export function MethodChartCard({ title, term, description, data, loading }: {
  title: string
  term: GlossaryTerm
  description: string
  data: ChartData | null
  loading: boolean
}) {
  const [metric, setMetric] = useState<Metric>('amount')
  const [focused, setFocused] = useState<string | null>(null)
  const active = data?.[metric]

  // The headline follows the chart. When a method is isolated it states that
  // method's total, not the grand total the plot is no longer showing.
  const focusedEntry = focused ? active?.series.find((entry) => entry.key === focused) : undefined
  const total = focused
    ? focusedEntry?.total ?? 0
    : active?.series.reduce((sum, entry) => sum + entry.total, 0) ?? 0

  return (
    <section className="flex flex-col rounded-[var(--radius-surface)] border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
            <InfoHint term={term} label={title} />
          </span>
          <p className="truncate text-sm text-ink-muted">{description}</p>
        </div>
        {loading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <div className="shrink-0 text-right">
            <p className="text-xl font-semibold tabular-nums text-ink">
              {metric === 'amount' ? formatCompactCurrency(total) : formatCount(total)}
            </p>
            {focusedEntry && (
              <p className="text-xs text-ink-faint">{focusedEntry.label}</p>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <Segmented
          value={metric}
          onChange={setMetric}
          options={METRIC_OPTIONS}
          ariaLabel={`${title} metric`}
        />
      </div>

      {loading || !active ? (
        <MethodChartFallback />
      ) : (
        <LazyMethodChart
          points={active.points}
          series={active.series}
          metric={metric}
          focused={focused}
          onFocusChange={setFocused}
        />
      )}
    </section>
  )
}
