import { ArrowUpRight, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Sparkline } from '@/components/charts/sparkline'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import type { GlossaryTerm } from '@/lib/glossary'
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
 * The card is a fixed 172px tall in both loading and loaded states. Deltas and
 * sparklines arrive asynchronously, and without a reserved box the whole KPI
 * row would jump on load.
 *
 * Loading is per-slot, not per-card. The label and its glossary hint are static
 * props known at first paint, so skeletoning them would be pure theatre — the
 * user waits to be told what they are waiting for. Only the four asynchronous
 * slots (value, delta, secondary count, sparkline) become skeletons, and each
 * occupies the box its content will occupy, so nothing moves when data lands.
 */

interface KpiCardProps {
  label: string
  /** Optional mark shown in front of the label, in a neutral chip. */
  icon?: LucideIcon
  /** Glossary key for the "?" hint beside the label. */
  term?: GlossaryTerm
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
  label, icon: Icon, term, value, secondary, deltaPct, spark, invertDelta = false, href, loading,
}: KpiCardProps) {
  // Brand-toned and unenclosed. The neutral chip is reserved for marks that
  // identify a *row's subject* (a card brand, a funding type); here the glyph
  // decorates the card's own title, so a container would make three headers
  // read as three data rows.
  //
  // 16px at 1.75 stroke, not the 12px the reference marks use. Those are solid
  // filled glyphs drawn on a 12px grid, so they hold their mass when small;
  // lucide draws on a 24px grid with 2px strokes and 1px interior gaps, which
  // at 12px close up into an illegible smudge — a credit card becomes a
  // featureless rectangle. Filling the box and thinning the stroke matches the
  // reference's optical weight, which is the thing worth copying, rather than
  // its pixel count, which is a property of its own icon grid.
  //
  // Rendered in both states so the label row keeps its height and the text
  // starts at the same x whether or not the data has arrived.
  const mark = Icon && (
    <Icon className="size-4 shrink-0 text-brand" strokeWidth={1.75} />
  )

  const isPositive = (deltaPct ?? 0) >= 0
  const isGood = invertDelta ? !isPositive : isPositive

  return (
    <div
      className={cn(
        'group/card flex h-[172px] flex-col rounded-[var(--radius-surface)] border border-border bg-surface p-5 transition-colors',
        !loading && 'hover:border-border-strong',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          {mark}
          <span className="text-sm font-medium text-ink-muted">{label}</span>
          {term && <InfoHint term={term} label={label} />}
        </span>
        {href && !loading && (
          <Link
            to={href}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-brand opacity-0 transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100"
          >
            View all <ArrowUpRight className="size-3" />
          </Link>
        )}
      </div>

      {loading ? (
        <Skeleton className="mt-2.5 h-6 w-32" />
      ) : (
        <p className="mt-2.5 text-2xl font-semibold leading-none tracking-tight tabular-nums text-ink">
          {value}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        {loading && <Skeleton className="h-3 w-24" />}
        {!loading && deltaPct != null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
              isGood ? 'text-[var(--tone-positive-fg)]' : 'text-[var(--tone-critical-fg)]',
            )}
          >
            {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {formatPercent(deltaPct)}
          </span>
        )}
        {!loading && secondary && (
          <span className="truncate text-xs text-ink-faint">{secondary}</span>
        )}
      </div>

      <div className="mt-auto">
        {/* Always brand-toned. Direction is communicated by the delta chip;
            coloring the sparkline too double-encodes it and makes a routine
            -2.8% move read as an incident. */}
        {loading ? <Skeleton className="h-8 w-full" /> : spark && <Sparkline values={spark} />}
      </div>
    </div>
  )
}
