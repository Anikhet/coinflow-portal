import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import { Segmented } from '@/components/ui/segmented'
import type { GlossaryTerm } from '@/lib/glossary'
import { formatTotal } from '@/lib/format'
import { BreakdownDimension, BreakdownDonutView } from './breakdown-views'
import {
  DonutChartFallback, RankedBarChartFallback, StackedDonutFallback,
} from '@/components/charts/breakdown-chart-lazy'
import type { BreakdownGroup, BreakdownView } from '@/types/breakdown'

/**
 * BREAKDOWN CARD
 * =============================================================================
 * The "Card payments breakdown" and "Merchant Payouts" sections.
 *
 * Both answer a part-to-whole question — which brands, which funding types,
 * which merchants — and there is no single best drawing of one. Shape, ranking
 * and exact figures are three different questions, and a dashboard read by
 * both an analyst and an operator gets asked all three. So the drawing is a
 * VIEW, switched by a tab control, over one dataset: see breakdown-views.tsx
 * for what each is good at.
 *
 * The view is deliberately local to each card rather than shared. The two cards
 * hold different-shaped data — three card brands versus a long merchant list —
 * and the right drawing for three slices is not the right one for twelve.
 */

const VIEW_OPTIONS = [
  { value: 'donut' as const, label: 'Donut' },
  { value: 'bars' as const, label: 'Bars' },
  { value: 'list' as const, label: 'List' },
]

interface BreakdownCardProps {
  title: string
  term: GlossaryTerm
  description: string
  total: number
  /**
   * How this card's total relates to settled volume, e.g. "70% of settled
   * volume". Both breakdowns are derived from the same headline figure, and
   * without saying so they read as two unrelated numbers.
   */
  relation?: string
  groups: BreakdownGroup[]
  loading?: boolean
  /** Rendered beside each row's count — e.g. "payments". */
  unit?: string
  /** The drawing to open on. See the note above on why this is per-card. */
  defaultView?: BreakdownView
  /**
   * How many dimensions this card will draw once loaded. Known to the caller
   * but not derivable while `groups` is still empty, and the skeleton has to
   * reserve the right box or the row below jumps when the data lands.
   */
  dimensions?: number
}

export function BreakdownCard({
  title, term, description, total, relation, groups,
  loading = false, unit = 'payments', defaultView = 'donut', dimensions = 1,
}: BreakdownCardProps) {
  const [view, setView] = useState<BreakdownView>(defaultView)

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
          <Skeleton className="h-6 w-28" />
        ) : (
          <div className="shrink-0 text-right">
            <p className="text-xl font-semibold tabular-nums text-ink">{formatTotal(total)}</p>
            {relation && <p className="mt-0.5 text-sm text-ink-faint">{relation}</p>}
          </div>
        )}
      </div>

      {/* Switching redraws the same numbers, so it must feel instantaneous —
          every view reads from data already in memory and none refetches. */}
      <div className="mb-4">
        <Segmented value={view} onChange={setView} options={VIEW_OPTIONS} ariaLabel={`${title} chart type`} />
      </div>

      {loading ? (
        <BreakdownSkeleton dimensions={dimensions} view={view} />
      ) : (
        /* Donut is one mark for the whole card — two dimensions become
           concentric rings — so it owns the layout itself. Bars and List stay
           per dimension, stacked down the card under their own headings. */
        view === 'donut' ? (
          <BreakdownDonutView groups={groups} />
        ) : (
          <div className="flex flex-1 flex-col gap-5">
            {/* The dimension heading is the view's business, not the card's:
                bars want it standing above the chart, the list wants it as the
                first column head. See BreakdownDimension. */}
            {groups.map((group) => (
              <BreakdownDimension
                key={group.label}
                group={group}
                view={view}
                unit={unit}
                labelled={groups.length > 1}
              />
            ))}
          </div>
        )
      )}
    </section>
  )
}

/**
 * Holds the box the loaded card will occupy for the CURRENT view, so nothing
 * below moves when the request resolves — a donut skeleton standing in for a
 * bar chart would shift the page by the difference.
 */
function BreakdownSkeleton({ dimensions, view }: { dimensions: number; view: BreakdownView }) {
  // Donut is a single mark for the card whatever the dimension count, so its
  // skeleton mirrors that layout rather than repeating per dimension.
  if (view === 'donut') {
    return (
      <div className="flex flex-1 flex-col items-center gap-4 md:flex-row">
        <div className="flex w-full justify-center md:w-[40%] md:shrink-0">
          {dimensions > 1 ? <StackedDonutFallback /> : <DonutChartFallback />}
        </div>
        <div className="w-full flex-1 space-y-2">
          {Array.from({ length: dimensions * 3 }, (_, row) => (
            <Skeleton key={row} className="h-5 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: dimensions }, (_, index) => index).map((group) => (
        <div key={group}>
          {dimensions > 1 && <Skeleton className="mb-2 h-3 w-16" />}
          {view === 'bars' ? (
            <RankedBarChartFallback rows={3} />
          ) : (
            <div className="space-y-2.5">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-[38px] w-full" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
