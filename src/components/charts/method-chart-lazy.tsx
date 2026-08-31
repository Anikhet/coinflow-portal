import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { SeriesPoint, MethodSeries } from '@/types/analytics'

/**
 * Recharts is by far the heaviest dependency in the app and is used on exactly
 * one screen. Loading it eagerly meant every operator opening the purchases or
 * customers table — the two surfaces they actually live in — paid for a
 * charting library they never render.
 *
 * The fallback reserves the identical box as the loaded chart (a flexible area
 * with the same 220px floor plus a legend line), so resolving the chunk swaps
 * content in without shifting the card.
 */
const MethodChart = lazy(() =>
  import('./method-chart').then((module) => ({ default: module.MethodChart })),
)

export function LazyMethodChart({ points, series, metric, selected }: {
  points: SeriesPoint[]
  series: MethodSeries[]
  metric?: 'amount' | 'count'
  selected: string[]
}) {
  return (
    <Suspense fallback={<MethodChartFallback />}>
      <MethodChart points={points} series={series} metric={metric} selected={selected} />
    </Suspense>
  )
}

export function MethodChartFallback() {
  return (
    <div className="flex flex-1 flex-col">
      <Skeleton className="min-h-[320px] w-full flex-1" />
      <Skeleton className="mt-3 h-[17px] w-2/3" />
    </div>
  )
}
