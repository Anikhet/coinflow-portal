import { CardBrandGlyph } from '@/components/icons/method-icon'
import { EmptyState } from '@/components/table/empty-state'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/detail'
import { Pill } from '@/components/ui/pill'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/cn'
import { formatCount, formatDateOnly } from '@/lib/format'
import { useUiStore } from '@/stores/ui-store'
import type { Customer } from '@/types'
import { Trash2 } from 'lucide-react'

/** Methods: stored cards, with removal gated on payment history. */

export function MethodsTab({ customer }: { customer: Customer }) {
  const timezone = useUiStore((state) => state.timezone)

  if (customer.cards.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center p-5">
        <EmptyState
          glyph="payments"
          title="No saved payment methods"
          description="Cards are saved on the first opted-in payment."
        />
      </div>
    )
  }

  return (
    <Section title={`Cards (${customer.cards.length})`}>
      <ul className="space-y-1.5">
        {customer.cards.map((card) => {
          const isUnused = card.paymentCount === 0
          return (
            <li key={card.id} className="flex items-start gap-3 rounded-[var(--radius-control)] border border-border p-2.5">
              <span className="mt-0.5"><CardBrandGlyph brand={card.brand} /></span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base text-ink">••{card.last4}</span>
                  <span className="font-mono text-sm text-ink-faint">{card.expiry}</span>
                  {isUnused && <Pill tone="neutral" variant="ghost">Unused</Pill>}
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {card.paymentCount > 0 ? `${formatCount(card.paymentCount)} payments` : 'No payments'}
                  {' · Added '}{formatDateOnly(card.addedAt, timezone)}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-faint">{card.billingAddress}</p>
              </div>

              {/* Deleting a card with payment history would orphan those
                  records, so the action is only offered on unused cards. */}
              <Tooltip content={isUnused ? 'Remove card' : 'Cards with payment history cannot be removed'}>
                <span>
                  <Button variant="ghost" size="icon-sm" aria-label="Remove card" disabled={!isUnused}
                    className={cn(isUnused && 'text-[var(--tone-critical-fg)]')}>
                    <Trash2 />
                  </Button>
                </span>
              </Tooltip>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
