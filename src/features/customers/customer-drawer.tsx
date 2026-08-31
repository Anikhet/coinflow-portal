import { Ban, Fingerprint, MapPin, Trash2, User, X } from 'lucide-react'
import { Sheet, SheetClose, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Pill } from '@/components/ui/pill'
import { StatusPill, AttributePill } from '@/components/ui/status-pill'
import { StatusCell } from '@/components/table/cells'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { CopyButton } from '@/components/ui/copy-button'
import { DrawerSkeleton, DRAWER_HEADER_CLASS } from '@/components/ui/drawer-chrome'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/table/empty-state'
import { Callout, ControlValue, Fact, FactGrid, Section } from '@/components/ui/detail'
import { CardBrandGlyph } from '@/components/icons/method-icon'
import { RecordUnavailable } from '@/components/ui/record-unavailable'
import { useDrawerStore } from '@/stores/drawer-store'
import { useUiStore, type Timezone } from '@/stores/ui-store'
import { useAsync } from '@/hooks/use-async'
import { fetchCustomer } from '@/mocks/api'
import {
  allClearTone, activityTone, attemptLimitTone, blockedTone, customerExceptions, customerProtectionTone, fraudOverrideTone, kycTone, signalCountTone, threeDSProcessingTone, verificationTone, type ToneDescriptor,
} from '@/lib/tone-map'
import { formatCurrency, formatCount, formatDateOnly, formatTimeOnly, truncateId } from '@/lib/format'
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
    <DrawerSkeleton avatar>
      {/* Two 87px fact cards — the measured height of the Overview tab's
          lifetime grid, not a rounded guess. */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-[87px]" />
        <Skeleton className="h-[87px]" />
      </div>
      <Skeleton className="h-14 w-full" />
    </DrawerSkeleton>
  )
}

function CustomerDrawerContent({ customer }: { customer: Customer }) {
  const kyc = kycTone(customer.kyc)
  const exceptions = customerExceptions(customer)

  return (
    <div className="flex h-full flex-col">
      <header className={DRAWER_HEADER_CLASS}>
        <Avatar name={customer.name} size={40} className="rounded-full" />

        <div className="min-w-0 flex-1">
          {/* Baseline-aligned and proximity-grouped, matching the payment
              drawer header — the two records share a shell precisely so that
              switching between them moves no furniture. */}
          <div className="flex items-baseline gap-2">
            <SheetTitle className="truncate text-xl font-semibold leading-tight tracking-tight text-ink">
              {customer.name}
            </SheetTitle>
            <StatusPill descriptor={kyc} />
            {customer.blocked && <StatusPill descriptor={blockedTone(true)} />}
          </div>
          <div className="group/row mt-1 flex items-center gap-3">
            <span className="truncate text-sm text-ink-muted">{customer.email}</span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="font-mono text-sm text-ink-faint">{truncateId(customer.id, 8, 4)}</span>
              <CopyButton value={customer.id} label="Copy customer ID" />
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip content={customer.blocked ? 'Unblock customer' : 'Block customer'}>
            <Button variant="ghost" size="icon" aria-label="Block customer"><Ban /></Button>
          </Tooltip>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close" className="ml-2"><X /></Button>
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
  const timezone = useUiStore((state) => state.timezone)

  return (
    <>
      <Section title="Lifetime">
        <FactGrid>
          <Fact
            label="Total volume"
            value={<span className="text-xl tabular-nums">{formatCurrency(customer.totalVolume)}</span>}
            hint={`${formatCount(customer.paymentCount)} payments`}
          />
          <Fact
            label="Overridden volume"
            term="overriddenVolume"
            value={<span className="text-xl tabular-nums">{formatCurrency(customer.overriddenVolume)}</span>}
            hint={`${formatCount(customer.overriddenCount)} payments`}
          />
        </FactGrid>
      </Section>

      <Section title="Exceptions">
        {exceptions.length === 0 ? (
          <Callout
            descriptor={allClearTone()}
            title="No exceptions"
            description="All controls are at their default posture."
          />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {exceptions.map((exception) => (
              <StatusCell key={exception.label} descriptor={exception} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Controls">
        <FactGrid>
          {/* Every control renders through the same tone registry the tables
              use, so a restricted attempt limit is a struck-through hand here
              and a struck-through hand there. The label text now comes from the
              descriptor rather than CONTROL_LABELS, which keeps one spelling
              per state instead of two that can drift apart. */}
          <Fact label="Chargeback protection" term="chargebackProtection" value={<ControlValue descriptor={customerProtectionTone(customer.protectionEnabled)} />} />
          <Fact label="3DS processing" term="threeDSProcessing" value={<ControlValue descriptor={threeDSProcessingTone(customer.threeDSProcessing)} />} />
          <Fact label="Attempt limit" term="attemptLimit" value={<ControlValue descriptor={attemptLimitTone(customer.attemptLimit)} />} />
          <Fact label="Verification" term="verification" value={<ControlValue descriptor={verificationTone(customer.verification)} />} />
          <Fact label="Fraud override" term="fraudOverride" value={<ControlValue descriptor={fraudOverrideTone(customer.fraudOverride)} />} />
          <Fact label="Member since" value={formatDateOnly(customer.createdAt, timezone)} hint={customer.merchant} />
        </FactGrid>
      </Section>
    </>
  )
}

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
function ActivityTab({ activity }: { activity: CustomerActivity[] }) {
  // Read from the store, not a prop: the tabs are siblings and none of them is
  // an ancestor of the others, so threading the timezone down would make the
  // drawer a message bus for a value it does not itself render.
  const timezone = useUiStore((state) => state.timezone)

  // A brand-new customer has no history yet. Rendering nothing leaves the tab
  // blank below a populated tab bar, which reads as a failed render.
  if (activity.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center p-5">
        <EmptyState
          glyph="activity"
          title="No activity yet"
          description="Authorizations and refunds appear here."
        />
      </div>
    )
  }

  const groups = activity.reduce<Record<string, CustomerActivity[]>>((accumulator, event) => {
    const key = formatDateOnly(event.at, timezone)
    ;(accumulator[key] ??= []).push(event)
    return accumulator
  }, {})

  return (
    <div className="pb-6">
      {Object.entries(groups).map(([date, events]) => (
        <section key={date}>
          {/* The heading is the only rule in the layout, and it stays visible
              while its own events scroll — a long history should never leave
              the reader looking at undated rows. */}
          <h3 className="sticky top-0 z-10 border-b border-border bg-surface/95 px-5 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint backdrop-blur">
            {date}
          </h3>

          <ul>
            {events.map((event) => (
              <ActivityRow key={event.id} event={event} timezone={timezone} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ActivityRow({ event, timezone }: { event: CustomerActivity; timezone: Timezone }) {
  const tone = activityTone(event.status)
  // Routine outcomes are stated in words; only a deviation earns a pill.
  const isRoutine = tone.tone === 'positive'

  return (
    <li className="grid grid-cols-[60px_1fr_auto] items-baseline gap-3 border-b border-border px-5 py-2.5 last:border-0">
      <span className="text-sm tabular-nums leading-5 text-ink-faint">
        {formatTimeOnly(event.at, timezone)}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          {/* The brand mark rides with the label rather than owning a column of
              its own: only card events have one, so a dedicated column was
              empty on every payout and left a ragged gutter. */}
          {event.brand && <CardBrandGlyph brand={event.brand} />}
          <span className="truncate text-base font-medium capitalize leading-5 text-ink">
            {event.kind.replace('-', ' ')}
          </span>
          {!isRoutine && <StatusCell descriptor={tone} />}
        </span>

        {(event.rail || event.responseCode || event.note) && (
          <span className="mt-0.5 block truncate text-sm leading-4 text-ink-faint">
            {[
              event.rail,
              event.responseCode && event.responseCode !== '00' && `code ${event.responseCode}`,
              event.note,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
      </span>

      {event.amount > 0 && (
        <span className="w-[88px] shrink-0 text-base tabular-nums leading-5 text-ink">
          {formatCurrency(event.amount)}
        </span>
      )}
    </li>
  )
}

function MethodsTab({ customer }: { customer: Customer }) {
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

function SignalsTab({ customer }: { customer: Customer }) {
  return (
    <>
      <SignalTable icon={User} title="Names" rows={customer.names} threshold={1} />
      <SignalTable icon={MapPin} title="Billing addresses" rows={customer.billingAddresses} threshold={2} />
      <SignalTable icon={Fingerprint} title="IP locations" rows={customer.ipLocations} threshold={3} />
    </>
  )
}

/**
 * A distinct-value table. The heading carries the cardinality tone: the row
 * values themselves are never colored, because no individual address is
 * suspicious — it is the *number of them* that is.
 */
function SignalTable({ icon, title, rows, threshold }: {
  /** Component, not a node — so it can be handed straight to a ToneDescriptor. */
  icon: ToneDescriptor['icon']
  title: string
  rows: SignalRow[]
  threshold: number
}) {
  const tone = signalCountTone(rows.length, threshold)

  return (
    <Section
      title={title}
      action={
        <AttributePill descriptor={{ tone, label: `${rows.length} distinct`, icon }} />
      }
    >
      <div className="overflow-hidden rounded-[var(--radius-control)] border border-border">
        <table className="w-full text-sm">
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
        <p className="mt-2 text-sm leading-snug text-ink-muted">
          {rows.length} distinct values is above the expected range for a single customer and may
          indicate account sharing or takeover.
        </p>
      )}
    </Section>
  )
}
