import { Section } from '@/components/ui/detail'
import { formatDateOnly } from '@/lib/format'
import type { Customer } from '@/types'

/** Audit log: who changed what, and whether it was a human or a rule. */

/**
 * Audit trail. Actor is stated on every row because the whole value of this
 * view is telling an automated action apart from a human one.
 */
export function AuditTab({ customer }: { customer: Customer }) {
  return (
    <Section title={`Audit log (${customer.auditLog.length})`}>
      <ul className="space-y-1.5">
        {customer.auditLog.map((entry) => (
          <li key={entry.id} className="rounded-[var(--radius-control)] border border-border p-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-medium text-ink">{entry.action}</span>
              <span className="shrink-0 text-sm tabular-nums text-ink-faint">
                {formatDateOnly(entry.at)}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{entry.detail}</p>
            <p className="mt-1 text-sm text-ink-faint">
              {entry.actor === 'System' ? 'Automated' : entry.actor}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
