import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Sparkline } from '@/components/charts/sparkline'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * KPI CARD
 * =============================================================================
 * The original cards showed a value and a date range only — a number with no
 * reference point, which cannot be acted on. Three additions make it a metric
 * rather than a readout:
 *
 *   - a period-over-period delta, so the number has direction
 *   - a sparkline, so the shape of the change is visible (a steady climb and a
 *     spike-then-crash produce the same delta but demand different responses)
 *   - a secondary count, so volume and transaction count are read together
 *
 * The card is a fixed 148px tall in both loading and loaded states. Deltas and
 * sparklines arrive asynchronously, and without a reserved box the whole KPI
 * row would jump on load.
 */

interface KpiCardProps {
  label: string
  value: string
  secondary?: string
  deltaPct?: number
  spark?: number[]
  /** Inverts delta coloring for metrics where a decrease is good. */
  invertDelta?: boolean
  href?: string
  loading?: boolean
}

export function KpiCard({
  label, value, secondary, deltaPct, spark, invertDelta = false, href, loading,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="h-[148px] rounded-[var(--radius-surface)] border border-border bg-surface p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-2 h-3 w-24" />
        <Skeleton className="mt-4 h-8 w-full" />
      </div>
    )
  }

  const isPositive = (deltaPct ?? 0) >= 0
  const isGood = invertDelta ? !isPositive : isPositive

  return (
    <div className="group/card flex h-[148px] flex-col rounded-[var(--radius-surface)] border border-border bg-surface p-4 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-ink-muted">{label}</p>
        {href && (
          <Link
            to={href}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand opacity-0 transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100"
          >
            View all <ArrowUpRight className="size-3" />
          </Link>
        )}
      </div>

      <p className="mt-1.5 text-[24px] font-semibold leading-none tracking-tight tabular-nums text-ink">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {deltaPct != null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums',
              isGood ? 'text-[var(--tone-positive-fg)]' : 'text-[var(--tone-critical-fg)]',
            )}
          >
            {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {formatPercent(deltaPct)}
          </span>
        )}
        {secondary && <span className="truncate text-[11px] text-ink-faint">{secondary}</span>}
      </div>

      <div className="mt-auto">
        {/* Always brand-toned. Direction is communicated by the delta chip;
            coloring the sparkline too double-encodes it and makes a routine
            -2.8% move read as an incident. */}
        {spark && <Sparkline values={spark} />}
      </div>
    </div>
  )
}
