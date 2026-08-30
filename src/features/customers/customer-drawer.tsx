import { Ban, CreditCard, Fingerprint, History, MapPin, ShieldCheck, Trash2, User, X } from 'lucide-react'
import { Sheet, SheetClose, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from '@/components/ui/tabs'
import { Pill } from '@/components/ui/pill'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { CopyButton } from '@/components/ui/copy-button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/table/empty-state'
import { Fact, FactGrid, Section } from '@/components/ui/detail'
import { CardBrandGlyph } from '@/components/icons/method-icon'
import { RecordUnavailable } from '@/components/ui/record-unavailable'
import { useDrawerStore } from '@/stores/drawer-store'
import { useAsync } from '@/hooks/use-async'
import { fetchCustomer } from '@/mocks/api'
import { activityTone, customerExceptions, kycTone, signalCountTone, CONTROL_LABELS } from '@/lib/tone-map'
import { formatCurrency, formatCount, formatDateOnly, formatDateTime, truncateId } from '@/lib/format'
import type { Customer, CustomerActivity, SignalRow } from '@/types'
import { cn } from '@/lib/cn'

/**
 * CUSTOMER DRAWER
 * =============================================================================
 * Shares the shell, header geometry and tab mechanics of the payment drawer so
 * the two records behave identically.
 *
 * The Overview tab is deliberately organised as a fraud-triage surface rather
 * than a profile page, because that is what the data is for. The original
 * signalled this only through a single red parenthesised count next to
 * "IP LOCATIONS (5)" — easy to miss. Here, elevated cardinality is stated
 * explicitly at the top of the tab.
 */

export function CustomerDrawer() {
  const customerId = useDrawerStore((state) => state.customerId)
  const closeAll = useDrawerStore((state) => state.closeAll)

  const { data: customer, loading, error, reload } = useAsync(
    () => (customerId ? fetchCustomer(customerId) : Promise.resolve(null)),
    [customerId],
  )

  return (
    <Sheet
      open={customerId != null}
      onOpenChange={(open) => !open && closeAll()}
      size="lg"
      label="Customer detail"
    >
      {loading ? (
        <CustomerDrawerSkeleton />
      ) : !customer ? (
        <RecordUnavailable entity="customer" error={error} onRetry={reload} />
      ) : (
        <CustomerDrawerContent customer={customer} />
      )}
    </Sheet>
  )
}

function CustomerDrawerSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[92px] shrink-0 items-start gap-3 border-b border-border px-5 py-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  )
}

function CustomerDrawerContent({ customer }: { customer: Customer }) {
  const kyc = kycTone(customer.kyc)
  const exceptions = customerExceptions(customer)

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
          {customer.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <SheetTitle className="truncate text-[17px] font-semibold leading-tight tracking-tight text-ink">
              {customer.name}
            </SheetTitle>
            <Pill tone={kyc.tone} variant="solid" dot>{kyc.label}</Pill>
            {customer.blocked && <Pill tone="critical" variant="solid" dot>Blocked</Pill>}
          </div>
          <div className="group/row mt-1 flex items-center gap-1.5">
            <span className="truncate text-[12px] text-ink-muted">{customer.email}</span>
            <span className="text-ink-faint">·</span>
            <span className="shrink-0 font-mono text-[11px] text-ink-faint">{truncateId(customer.id, 8, 4)}</span>
            <CopyButton value={customer.id} label="Copy customer ID" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip content={customer.blocked ? 'Unblock customer' : 'Block customer'}>
            <Button variant="ghost" size="icon" aria-label="Block customer"><Ban /></Button>
          </Tooltip>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close"><X /></Button>
          </SheetClose>
        </div>
      </header>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">
            Activity<TabCount value={customer.activity.length} />
          </TabsTrigger>
          <TabsTrigger value="methods">
            Methods<TabCount value={customer.cards.length} />
          </TabsTrigger>
          <TabsTrigger value="signals">Risk signals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab customer={customer} exceptions={exceptions} /></TabsContent>
        <TabsContent value="activity"><ActivityTab activity={customer.activity} /></TabsContent>
        <TabsContent value="methods"><MethodsTab customer={customer} /></TabsContent>
        <TabsContent value="signals"><SignalsTab customer={customer} /></TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab({ customer, exceptions }: {
  customer: Customer
  exceptions: ReturnType<typeof customerExceptions>
}) {
  return (
    <>
      <Section title="Lifetime">
        <FactGrid>
          <Fact
            label="Total volume"
            value={<span className="text-[18px] tabular-nums">{formatCurrency(customer.totalVolume)}</span>}
            hint={`${formatCount(customer.paymentCount)} payments`}
          />
          <Fact
            label="Overridden volume"
            value={<span className="text-[18px] tabular-nums">{formatCurrency(customer.overriddenVolume)}</span>}
            hint={`${formatCount(customer.overriddenCount)} payments`}
          />
        </FactGrid>
      </Section>

      <Section title="Exceptions">
        {exceptions.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-[var(--radius-control)] border border-border p-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-[var(--tone-positive-bg)] text-[var(--tone-positive-fg)]">
              <ShieldCheck className="size-3.5" />
            </span>
            <p className="text-[13px] text-ink-muted">
              No exceptions. All controls are at their default posture.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {exceptions.map((exception) => (
              <Pill key={exception.label} tone={exception.tone} variant="solid" dot>
                {exception.label}
              </Pill>
            ))}
          </div>
        )}
      </Section>

      <Section title="Controls">
        <FactGrid>
          <Fact label="Chargeback protection" value={customer.protectionEnabled ? 'Enabled' : 'Disabled'} />
          <Fact label="3DS processing" value={CONTROL_LABELS.threeDSProcessing[customer.threeDSProcessing]} />
          <Fact label="Attempt limit" value={CONTROL_LABELS.attemptLimit[customer.attemptLimit]} />
          <Fact label="Verification" value={CONTROL_LABELS.verification[customer.verification]} />
          <Fact label="Fraud override" value={CONTROL_LABELS.fraudOverride[customer.fraudOverride]} />
          <Fact label="Member since" value={formatDateOnly(customer.createdAt)} hint={customer.merchant} />
        </FactGrid>
      </Section>
    </>
  )
}

/**
 * Activity timeline. Events are grouped under a sticky date heading so the
 * date is always visible while scrolling a long history — the original repeated
 * a static date header that scrolled away, leaving events undated mid-list.
 */
function ActivityTab({ activity }: { activity: CustomerActivity[] }) {
  // A brand-new customer has no history yet. Rendering nothing leaves the tab
  // blank below a populated tab bar, which reads as a failed render.
  if (activity.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center p-5">
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Authorizations, captures and refunds for this customer will be listed here as they happen."
        />
      </div>
    )
  }

  const groups = activity.reduce<Record<string, CustomerActivity[]>>((accumulator, event) => {
    const key = formatDateOnly(event.at)
    ;(accumulator[key] ??= []).push(event)
    return accumulator
  }, {})

  return (
    <div className="pb-4">
      {Object.entries(groups).map(([date, events]) => (
        <div key={date}>
          <p className="sticky top-0 z-10 bg-surface/92 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint backdrop-blur">
            {date}
          </p>
          <ul className="space-y-1.5 px-5">
            {events.map((event) => {
              const tone = activityTone(event.status)
              return (
                <li
                  key={event.id}
                  className="flex items-center gap-3 rounded-[var(--radius-control)] border border-border p-2.5"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center">
                    {event.brand ? (
                      <CardBrandGlyph brand={event.brand} />
                    ) : (
                      <span className="grid size-5 place-items-center rounded-[4px] bg-surface-sunk text-ink-faint">
                        <CreditCard className="size-3" />
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium capitalize text-ink">
                        {event.kind.replace('-', ' ')}
                      </span>
                      <Pill tone={tone.tone} variant="ghost" dot pulse={tone.pulse}>{tone.label}</Pill>
                      {event.rail && <span className="text-[11px] text-ink-faint">{event.rail}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                      {formatDateTime(event.at)}
                      {event.responseCode && event.responseCode !== '00' && ` · code ${event.responseCode}`}
                      {event.note && ` · ${event.note}`}
                    </p>
                  </div>

                  {event.amount > 0 && (
                    <span className="shrink-0 font-mono text-[13px] tabular-nums text-ink">
                      {formatCurrency(event.amount)}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

function MethodsTab({ customer }: { customer: Customer }) {
  if (customer.cards.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center p-5">
        <EmptyState
          icon={CreditCard}
          title="No saved payment methods"
          description="This customer has not stored a card. Cards are saved on the first successful payment that opts in."
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
                  <span className="font-mono text-[13px] text-ink">••{card.last4}</span>
                  <span className="font-mono text-[11px] text-ink-faint">{card.expiry}</span>
                  {isUnused && <Pill tone="neutral" variant="ghost">Unused</Pill>}
                </div>
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  {card.paymentCount > 0 ? `${formatCount(card.paymentCount)} payments` : 'No payments'}
                  {' · Added '}{formatDateOnly(card.addedAt)}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-ink-faint">{card.billingAddress}</p>
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

function SignalsTab({ customer }: { customer: Customer }) {
  return (
    <>
      <SignalTable icon={<User className="size-3.5" />} title="Names" rows={customer.names} threshold={1} />
      <SignalTable icon={<MapPin className="size-3.5" />} title="Billing addresses" rows={customer.billingAddresses} threshold={2} />
      <SignalTable icon={<Fingerprint className="size-3.5" />} title="IP locations" rows={customer.ipLocations} threshold={3} />
    </>
  )
}

/**
 * A distinct-value table. The heading carries the cardinality tone: the row
 * values themselves are never colored, because no individual address is
 * suspicious — it is the *number of them* that is.
 */
function SignalTable({ icon, title, rows, threshold }: {
  icon: React.ReactNode
  title: string
  rows: SignalRow[]
  threshold: number
}) {
  const tone = signalCountTone(rows.length, threshold)

  return (
    <Section
      title={title}
      action={
        <Pill tone={tone} variant={tone === 'neutral' ? 'ghost' : 'solid'} icon={icon}>
          {rows.length} distinct
        </Pill>
      }
    >
      <div className="overflow-hidden rounded-[var(--radius-control)] border border-border">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border bg-surface-sunk">
              <th scope="col" className="px-2.5 py-1.5 text-left font-medium text-ink-faint">Value</th>
              <th scope="col" className="px-2.5 py-1.5 text-right font-medium text-ink-faint">Count</th>
              <th scope="col" className="px-2.5 py-1.5 text-right font-medium text-ink-faint">Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.value} className="border-b border-border last:border-0">
                <td className="max-w-0 truncate px-2.5 py-1.5 text-ink">{row.value}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums text-ink-muted">{row.count}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums text-ink">{formatCurrency(row.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tone !== 'neutral' && (
        <p className="mt-2 text-[12px] leading-snug text-ink-muted">
          {rows.length} distinct values is above the expected range for a single customer and may
          indicate account sharing or takeover.
        </p>
      )}
    </Section>
  )
}
