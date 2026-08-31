import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import type { GlossaryTerm } from '@/lib/glossary'
import { formatCompactCurrency, formatCount, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * BREAKDOWN CARD
 * =============================================================================
 * The "Card payments breakdown" and "Merchant Payouts" sections.
 *
 * Both answer a part-to-whole question — which brands, which merchants — so
 * they render as a ranked list with a proportional bar rather than as a pie.
 * A ranked bar list is directly readable (rows are sorted, lengths compare on a
 * shared baseline) where a pie forces angle comparison, and it degrades
 * gracefully as the number of slices grows.
 *
 * Bars use the brand violet at varying opacity rather than a categorical
 * palette: these slices are one quantity split up, not independent series, so
 * giving each its own hue would imply a distinction that is not there — and
 * would spend colour that the tone system reserves for status.
 */

export interface BreakdownRow {
  key: string
  label: string
  amount: number
  count: number
  /** 0–1 share of the total. */
  share: number
  /**
   * Leading mark — a card logo, a merchant avatar, a rail glyph. Supplied by
   * the caller rather than derived here: this card renders part-to-whole rows
   * for anything, and teaching it about brands and merchants would tie a
   * generic chart to two specific datasets.
   */
  media?: ReactNode
}

interface BreakdownCardProps {
  title: string
  term: GlossaryTerm
  description: string
  total: number
  /** Optional grouping label above a set of rows, e.g. "By brand". */
  groups: Array<{ label: string; rows: BreakdownRow[]; term?: GlossaryTerm }>
  loading?: boolean
  /** Rendered beside each row's amount — e.g. a payment count. */
  unit?: string
  action?: ReactNode
}

export function BreakdownCard({
  title, term, description, total, groups, loading = false, unit = 'payments', action,
}: BreakdownCardProps) {
  return (
    <section className="flex flex-col rounded-[var(--radius-surface)] border border-border bg-surface p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
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
          <p className="shrink-0 text-xl font-semibold tabular-nums text-ink">
            {formatCurrency(total)}
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-5">
          {[0, 1].map((group) => (
            <div key={group} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-[38px] w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              {groups.length > 1 && (
                <div className="mb-2 flex items-center gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-faint">
                    {group.label}
                  </p>
                  {group.term && <InfoHint term={group.term} label={group.label} />}
                </div>
              )}
              <ul className="space-y-2.5">
                {group.rows.map((row) => (
                  <li key={row.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        {/* Fixed 20px slot, so labels start on one vertical
                            line whether or not a row has a mark — a ragged
                            left edge would undo the shared baseline the bars
                            below are built on. */}
                        {row.media && (
                          <span className="grid size-5 shrink-0 translate-y-px place-items-center">
                            {row.media}
                          </span>
                        )}
                        <span className="min-w-0 truncate text-base text-ink">{row.label}</span>
                      </span>
                      <span className="flex shrink-0 items-baseline gap-2">
                        <span className="text-xs tabular-nums text-ink-faint">
                          {formatCount(row.count)} {unit}
                        </span>
                        <span className="text-base font-medium tabular-nums text-ink">
                          {formatCompactCurrency(row.amount)}
                        </span>
                      </span>
                    </div>
                    {/* Track is always full width so every bar shares a baseline
                        and lengths are directly comparable down the column. */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                      <div
                        className={cn('h-full rounded-full bg-brand transition-[width] duration-300')}
                        style={{ width: `${Math.max(row.share * 100, 1.5)}%`, opacity: 0.35 + row.share * 0.65 }}
                        role="presentation"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {action && <div className="mt-3">{action}</div>}
    </section>
  )
}
