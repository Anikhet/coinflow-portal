import { ShieldCheckFilled } from '@/components/icons/filled-glyphs'
import { Callout, Section } from '@/components/ui/detail'
import { AttributePill } from '@/components/ui/status-pill'
import { formatCurrency, formatDateOnly } from '@/lib/format'
import { disputeStatusTone } from '@/lib/tone-map'
import type { Customer } from '@/types'

/** Disputes raised against this customer's payments. */

/**
 * ACTIVITY TIMELINE
 * =============================================================================
 * Rebuilt on International Typographic Style lines, because the previous
 * version had the failure the style exists to prevent: every event sat in its
 * own rounded, bordered card, so nine events drew nine boxes plus their date
 * headings — eighteen containers to present eighteen facts. Structure was being
 * carried by decoration instead of by position.
 *
 * Four things changed, each removing ink rather than adding it:
 *
 * 1. NO CONTAINERS. Cards become rows on a shared grid, divided by a single
 *    hairline. Alignment does what the borders were doing, and the eye tracks
 *    one continuous left edge instead of re-entering a new box every 56px.
 *
 * 2. NO REPEATED DATE. The heading says AUG 29, 2026, so the row says 10:00 PM.
 *    The date was previously printed twice within 40px of itself.
 *
 * 3. TIME IS A COLUMN. Times sit in a fixed 60px tabular column, so they form a
 *    vertical rule of their own and can be compared down the page. In the card
 *    version they floated at a different x on every row, after a metadata
 *    string of varying length.
 *
 * 4. HIERARCHY BY SIZE AND WEIGHT, NOT COLOUR. A pill appears only for an
 *    outcome that is not routine. "Completed" on six consecutive rows is not
 *    information — it is the base rate, and pilling it made the two genuine
 *    failures no louder than everything around them. This is pill taxonomy
 *    rule 5, applied to a list instead of a table.
 */
/** Disputes raised against this customer's payments. */
export function DisputesTab({ customer }: { customer: Customer }) {
  if (customer.disputes.length === 0) {
    return (
      <Section title="Disputes">
        <Callout
          descriptor={{ tone: 'positive', label: 'No disputes', icon: ShieldCheckFilled }}
          title="No disputes"
          description="No payment from this customer has been disputed."
        />
      </Section>
    )
  }

  return (
    <Section title={`Disputes (${customer.disputes.length})`}>
      <ul className="space-y-1.5">
        {customer.disputes.map((dispute) => (
          <li
            key={dispute.id}
            className="flex items-start gap-3 rounded-[var(--radius-control)] border border-border p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-ink">{formatCurrency(dispute.amount)}</span>
                <AttributePill descriptor={disputeStatusTone(dispute.status)} />
              </div>
              <p className="mt-1 truncate text-sm text-ink-muted">
                {dispute.reason}
              </p>
              <p className="mt-0.5 text-sm text-ink-faint">
                Reason code {dispute.reasonCode} · opened {formatDateOnly(dispute.openedAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
