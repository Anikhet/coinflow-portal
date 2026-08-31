import { TrendingDown, TrendingUp } from 'lucide-react'
import { GradientGlyph } from '@/components/icons/gradient-glyph'
import type { EmptyGlyphName } from '@/components/icons/empty-glyphs'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import type { GlossaryTerm } from '@/lib/glossary'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * KPI CARD
 * =============================================================================
 * The original cards showed a value and a date range only — a number with no
 * reference point, which cannot be acted on. Two additions make it a metric
 * rather than a readout:
 *
 *   - a period-over-period delta, so the number has direction
 *   - a secondary count, so volume and transaction count are read together
 *
 * A sparkline used to sit here too. Once the KPI and the chart below it were
 * fixed to share the same daily buckets it plotted exactly the series drawn
 * further down the page, at a twentieth the size and with no axis or hover —
 * strictly worse at the same job. Removing it freed the height that now
 * carries approval rate and chargeback rate.
 *
 * The card is a fixed 128px in both loading and loaded states, because the
 * value and delta arrive asynchronously and without a reserved box the whole
 * strip would jump on load.
 *
 * Loading is per-slot, not per-card. The label and its glossary hint are static
 * props known at first paint, so skeletoning them would be pure theatre — the
 * user waits to be told what they are waiting for. Only the asynchronous slots
 * become skeletons, each occupying the box its content will occupy.
 */

interface KpiCardProps {
  label: string
  /** Gradient glyph shown in front of the label. */
  glyph?: EmptyGlyphName
  /** Glossary key for the "?" hint beside the label. */
  term?: GlossaryTerm
  value: string
  secondary?: string
  deltaPct?: number
  /**
   * Renders the delta as points rather than a percentage. A rate metric moves
   * in percentage POINTS — "approval fell 1.2 points" is what a payments team
   * says. Formatting that as "-1.3%" would state a different, much smaller
   * quantity: a percentage of a percentage.
   */
  deltaUnit?: 'percent' | 'points'
  /** Inverts delta coloring for metrics where a decrease is good. */
  invertDelta?: boolean
  loading?: boolean
}

export function KpiCard({
  label, glyph, term, value, secondary, deltaPct, deltaUnit = 'percent', invertDelta = false, loading,
}: KpiCardProps) {
  // The same gradient glyph the empty states use, so one mark vocabulary runs
  // across the product rather than lucide outlines here and filled glyphs
  // there. Solid shapes on a 12px grid hold their mass at this size where a
  // 2px-stroke outline would close up into a smudge.
  //
  // Rendered in both states so the label row keeps its height and the text
  // starts at the same x whether or not the data has arrived.
  // Boxed at a fixed 16px square. Glyph paths differ in aspect ratio, and the
  // taller ones (the dispute scales) rendered past the declared size and
  // stretched the label row — which pushed that one card's figure 9px below
  // its neighbours and broke the strip's shared baseline.
  const mark = glyph && (
    <span className="grid size-5 shrink-0 place-items-center overflow-hidden">
      <GradientGlyph name={glyph} size={20} />
    </span>
  )

  const isPositive = (deltaPct ?? 0) >= 0
  const isGood = invertDelta ? !isPositive : isPositive

  return (
    <div
      className={cn(
        'group/card flex h-[128px] flex-col rounded-[var(--radius-surface)] border border-border bg-surface p-5 transition-colors',
        !loading && 'hover:border-border-strong',
      )}
    >
      {/* Fixed height. A longer label squeezed the "View all" link onto a
          second line, growing this row to 29px and dropping that one card's
          figure below the rest of the strip. */}
      <div className="flex h-6 items-center justify-between gap-2">
        {/* Fixed height and no wrapping. "Chargeback rate" wrapped to two lines
            at five-across, which pushed that card's figure a line below its
            neighbours and broke the row's shared baseline — the thing that
            makes a KPI strip scannable in one pass. */}
        <span className="flex h-6 items-center gap-2">
          {mark}
          <span className="truncate whitespace-nowrap text-base font-semibold text-ink">
            {label}
          </span>
          {term && <InfoHint term={term} label={label} />}
        </span>
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
            {deltaUnit === 'points'
              ? `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(2)} pts`
              : formatPercent(deltaPct)}
          </span>
        )}
        {!loading && secondary && (
          <span className="truncate text-xs text-ink-faint">{secondary}</span>
        )}
      </div>

    </div>
  )
}
