import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { BreakdownGroup, BreakdownRow } from '@/types/breakdown'

/**
 * Same reasoning as the method chart's lazy wrapper: recharts is the heaviest
 * dependency in the app and renders on one screen only, so it is never in the
 * bundle an operator downloads to open a table.
 *
 * Both breakdown views load from here, and each fallback holds the exact box
 * its chart occupies so resolving the chunk swaps content in without moving
 * anything beneath it.
 */
const DonutChart = lazy(() =>
  import('./donut-chart').then((module) => ({ default: module.DonutChart })),
)

const StackedDonutChart = lazy(() =>
  import('./stacked-donut-chart').then((module) => ({ default: module.StackedDonutChart })),
)

const RankedBarChart = lazy(() =>
  import('./ranked-bar-chart').then((module) => ({ default: module.RankedBarChart })),
)

export function LazyDonutChart(props: { slices: BreakdownRow[]; total: number; centerLabel: string }) {
  return (
    <Suspense fallback={<DonutChartFallback />}>
      <DonutChart {...props} />
    </Suspense>
  )
}

export function LazyStackedDonutChart(props: { groups: BreakdownGroup[] }) {
  return (
    <Suspense fallback={<StackedDonutFallback />}>
      <StackedDonutChart {...props} />
    </Suspense>
  )
}

export function LazyRankedBarChart(props: { slices: BreakdownRow[]; height?: number }) {
  return (
    <Suspense fallback={<RankedBarChartFallback height={props.height} rows={props.slices.length} />}>
      <RankedBarChart {...props} />
    </Suspense>
  )
}

export function DonutChartFallback() {
  return (
    <div className="grid h-[196px] w-full place-items-center">
      <Skeleton className="size-[184px] rounded-full" />
    </div>
  )
}

export function StackedDonutFallback() {
  return (
    <div className="grid aspect-square w-full max-w-[240px] place-items-center">
      <Skeleton className="size-full rounded-full" />
    </div>
  )
}

export function RankedBarChartFallback({ height, rows = 3 }: { height?: number; rows?: number }) {
  return (
    <div className="w-full flex-1" style={{ minHeight: height ?? Math.max(rows * 34 + 16, 120) }}>
      <Skeleton className="size-full" />
    </div>
  )
}
