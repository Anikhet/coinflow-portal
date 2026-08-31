import { useState } from 'react'
import { LazyMethodChart, MethodChartFallback } from '@/components/charts/method-chart-lazy'
import { Segmented } from '@/components/ui/segmented'
import { Skeleton } from '@/components/ui/skeleton'
import { SeriesPicker } from './series-picker'
import { TOTAL_KEY } from '@/components/charts/series'
import { InfoHint } from '@/components/ui/info-hint'
import type { GlossaryTerm } from '@/lib/glossary'
import { formatCompactCurrency, formatCount, formatTotal } from '@/lib/format'
import type { ChartData, Metric } from '@/mocks/analytics'

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
  const [selected, setSelected] = useState<string[]>([TOTAL_KEY])
  const active = data?.[metric]

  // The headline follows the selection: it states the total of exactly what the
  // plot is drawing, not the grand total the plot may no longer be showing.
  const grandTotal = active?.series.reduce((sum, entry) => sum + entry.total, 0) ?? 0
  const total = selected.includes(TOTAL_KEY)
    ? grandTotal
    : (active?.series ?? [])
        .filter((entry) => selected.includes(entry.key))
        .reduce((sum, entry) => sum + entry.total, 0)

  const headlineNote =
    selected.length === 1 && selected[0] === TOTAL_KEY
      ? undefined
      : selected.length === 1
        ? active?.series.find((entry) => entry.key === selected[0])?.label
        : `${selected.length} series`

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
        {/*
          Fixed-height slot, deliberately empty in the default state.

          Showing the total here repeated the KPI card directly above it
          verbatim — the same figure twice in one quadrant, which reads as two
          metrics rather than one. It earns its place only once a series is
          selected, because that total is something the KPI cannot show. The
          slot keeps its height either way so selecting a series does not
          shift the chart.
        */}
        <div className="h-10 shrink-0 text-right">
          {loading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            headlineNote && (
              <>
                <p className="text-xl font-semibold tabular-nums text-ink">
                  {metric === 'amount' ? formatTotal(total) : formatCount(total)}
                </p>
                <p className="text-xs text-ink-faint">{headlineNote}</p>
              </>
            )
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Segmented
          value={metric}
          onChange={setMetric}
          options={METRIC_OPTIONS}
          ariaLabel={`${title} metric`}
        />
        <div className="ml-auto">
          <SeriesPicker
            series={active?.series ?? []}
            selected={selected}
            onChange={setSelected}
            formatValue={metric === 'amount' ? formatCompactCurrency : formatCount}
          />
        </div>
      </div>

      {loading || !active ? (
        <MethodChartFallback />
      ) : (
        <LazyMethodChart
          points={active.points}
          series={active.series}
          metric={metric}
          selected={selected}
        />
      )}
    </section>
  )
}
