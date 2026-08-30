import {
  ArrowUpRight, ExternalLink, Flag, ShieldCheck, ShieldOff, Undo2, User, X,
} from 'lucide-react'
import { Sheet, SheetClose, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pill } from '@/components/ui/pill'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { CopyButton } from '@/components/ui/copy-button'
import { CardVisual } from '@/components/ui/card-visual'
import { Callout, Fact, FactGrid, Row, Section } from '@/components/ui/detail'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrawerStore } from '@/stores/drawer-store'
import { useUiStore } from '@/stores/ui-store'
import { useAsync } from '@/hooks/use-async'
import { fetchPayment } from '@/mocks/api'
import { paymentStatusTone } from '@/lib/tone-map'
import { formatCurrency, formatDateTime, truncateId } from '@/lib/format'
import { processorLabel, methodLabel, ProcessorGlyph } from '@/components/icons/method-icon'
import { SolanaMark } from '@/components/icons/brand-marks'
import type { Payment } from '@/types'
import { cn } from '@/lib/cn'

/**
 * PAYMENT DRAWER
 * =============================================================================
 * Restructured from the original in three ways:
 *
 * 1. TABBED, not scroll-forever. The original stacked identity, card art,
 *    orchestration, a full fee ledger and an actions list into one column
 *    several screens tall, so answering "which processor ran this?" meant
 *    scrolling past everything else. Three tabs put each question one click
 *    away.
 *
 * 2. ACTIONS APPEAR ONCE. The original showed five icon buttons in the header
 *    and then repeated the same five as a labelled list at the bottom under
 *    "Options" — the same commands in two places, which forces the reader to
 *    work out whether they differ. Here they live in the header only, with
 *    labels on hover.
 *
 * 3. SHARED SHELL with the customer drawer, so both records behave identically.
 */

export function PaymentDrawer() {
  const paymentId = useDrawerStore((state) => state.paymentId)
  const closeAll = useDrawerStore((state) => state.closeAll)
  const openCustomer = useDrawerStore((state) => state.openCustomer)

  const { data: payment, loading } = useAsync(
    () => (paymentId ? fetchPayment(paymentId) : Promise.resolve(null)),
    [paymentId],
  )

  return (
    <Sheet open={paymentId != null} onOpenChange={(open) => !open && closeAll()} label="Payment detail">
      {loading || !payment ? (
        <PaymentDrawerSkeleton />
      ) : (
        <PaymentDrawerContent payment={payment} onViewCustomer={() => openCustomer(payment.customerId)} />
      )}
    </Sheet>
  )
}

function PaymentDrawerSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Mirrors the loaded header's exact geometry so nothing shifts on swap. */}
      <div className="flex h-[92px] shrink-0 items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="size-8 rounded-[8px]" />
      </div>
      <div className="space-y-3 p-5">
        <Skeleton className="w-full rounded-[14px]" style={{ aspectRatio: '1.586' }} />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  )
}

function PaymentDrawerContent({ payment, onViewCustomer }: {
  payment: Payment
  onViewCustomer: () => void
}) {
  const timezone = useUiStore((state) => state.timezone)
  const status = paymentStatusTone(payment.status)

  const actions = [
    { icon: Undo2, label: 'Refund transaction', disabled: payment.status !== 'settled' },
    { icon: Flag, label: 'Report as fraud', disabled: false },
    { icon: User, label: 'View customer', disabled: false, onClick: onViewCustomer },
    {
      icon: ExternalLink,
      label: payment.chainTx ? 'View on Solana explorer' : 'Not settled on chain',
      disabled: !payment.chainTx,
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-ink">
              {formatCurrency(payment.subtotal)}
            </SheetTitle>
            <Pill tone={status.tone} variant="solid" dot pulse={status.pulse}>{status.label}</Pill>
          </div>
          <div className="group/row mt-1.5 flex items-center gap-1">
            <span className="truncate font-mono text-[12px] text-ink-faint">{truncateId(payment.id, 12, 8)}</span>
            <CopyButton value={payment.id} label="Copy payment ID" />
            <span className="mx-1 text-ink-faint">·</span>
            <span className="shrink-0 text-[12px] text-ink-muted">
              {formatDateTime(payment.createdAt, timezone)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {actions.map(({ icon: Icon, label, disabled, onClick }) => (
            <Tooltip key={label} content={label}>
              <Button variant="ghost" size="icon" aria-label={label} disabled={disabled} onClick={onClick}>
                <Icon />
              </Button>
            </Tooltip>
          ))}
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close"><X /></Button>
          </SheetClose>
        </div>
      </header>

      <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab payment={payment} />
        </TabsContent>
        <TabsContent value="routing">
          <RoutingTab payment={payment} />
        </TabsContent>
        <TabsContent value="fees">
          <FeesTab payment={payment} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryTab({ payment }: { payment: Payment }) {
  const protectionApproved = payment.protection === 'approved'

  return (
    <>
      {payment.cardBrand && payment.cardLast4 && (
        <div className="px-5 pt-4">
          <CardVisual
            brand={payment.cardBrand}
            last4={payment.cardLast4}
            expiry={payment.cardExpiry ?? '––/––'}
            holder={payment.customerName}
          />
        </div>
      )}

      <Section title="Risk posture">
        <div className="space-y-2">
          <Callout
            icon={protectionApproved ? <ShieldCheck /> : <ShieldOff />}
            tone={protectionApproved ? 'info' : 'neutral'}
            title={protectionApproved ? 'Chargeback protection approved' : 'No chargeback protection'}
            description={
              protectionApproved
                ? 'All chargeback liability is shifted away from the merchant for this payment.'
                : 'The merchant retains full chargeback liability for this payment.'
            }
          />
          {payment.status === 'failed' && (
            <Callout
              icon={<Flag />}
              tone="critical"
              title={`Declined · code ${payment.responseCode}`}
              description={`${payment.responseLabel}. CVV response ${payment.cvvResponse} (${payment.cvvLabel}).`}
            />
          )}
        </div>
      </Section>

      <Section title="Payment details">
        <FactGrid>
          <Fact label="Customer" value={payment.customerName} hint={payment.customerEmail} />
          <Fact label="Issuer" value={payment.issuer} hint={`${payment.issuerCountry} · ${payment.fundingType}`} />
          <Fact label="Method" value={methodLabel(payment.method)} hint={payment.transactionType} />
          <Fact label="CVV response" value={payment.cvvLabel} badge={<Pill tone="neutral">{payment.cvvResponse}</Pill>} />
          <Fact
            label="Statement descriptor"
            value={payment.statementDescriptor}
            hint="Shown on the customer's bank statement where the issuer supports custom descriptors."
          />
          <Fact label="Merchant" value={payment.merchant} hint={`Disbursed: ${payment.disbursed ? 'yes' : 'not yet'}`} />
        </FactGrid>
      </Section>

      {payment.chainTx && payment.chainWallet && (
        <Section
          title="Solana ledgering"
          action={
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
            >
              Explorer <ArrowUpRight className="size-3" />
            </a>
          }
        >
          <div className="rounded-[var(--radius-control)] border border-border p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <SolanaMark className="w-4" />
              <span className="text-[12px] font-medium text-ink">Settled on Solana</span>
            </div>
            <div className="group/row space-y-1">
              <ChainRow label="Wallet" value={payment.chainWallet} />
              <ChainRow label="Transaction" value={payment.chainTx} />
            </div>
          </div>
        </Section>
      )}
    </>
  )
}

function ChainRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-[12px] text-ink-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate font-mono text-[11px] text-ink">{truncateId(value, 10, 8)}</span>
        <CopyButton value={value} label={`Copy ${label}`} />
      </span>
    </div>
  )
}

/**
 * The routing chain is the highest-value thing in this drawer: it shows whether
 * a payment succeeded on its first processor or was rescued by a retry. Drawn
 * as an explicit sequence rather than the original's cramped
 * "fifththird → mvb" text so the outcome of each hop is legible.
 */
function RoutingTab({ payment }: { payment: Payment }) {
  return (
    <>
      <Section title="Orchestration">
        <Row label="Rule" value={payment.orchestrationRule} mono />
        <Row label="Attempts" value={String(payment.attempts.length)} />
        <Row
          label="Final result"
          value={
            <Pill
              tone={payment.attempts.at(-1)?.outcome === 'succeeded' ? 'positive' : 'critical'}
              variant="solid"
              dot
            >
              {payment.attempts.at(-1)?.outcome === 'succeeded' ? 'Succeeded' : 'Failed'}
            </Pill>
          }
        />
      </Section>

      <Section title="Processor chain">
        <ol className="space-y-1.5">
          {payment.attempts.map((attempt, index) => {
            const succeeded = attempt.outcome === 'succeeded'
            return (
              <li
                key={`${attempt.processor}-${index}`}
                className="flex items-center gap-3 rounded-[var(--radius-control)] border border-border p-2.5"
              >
                <span className="w-4 shrink-0 text-center font-mono text-[11px] text-ink-faint">{index + 1}</span>
                <ProcessorGlyph processor={attempt.processor} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                  {processorLabel(attempt.processor)}
                </span>
                <Pill tone={succeeded ? 'positive' : 'critical'} variant="ghost" dot>
                  {succeeded ? 'Succeeded' : 'Failed over'}
                </Pill>
              </li>
            )
          })}
        </ol>
        {payment.attempts.length > 1 && (
          <p className="mt-2 text-[12px] leading-snug text-ink-muted">
            The first processor declined and the rule automatically retried on a fallback. The customer
            experienced a single attempt.
          </p>
        )}
      </Section>
    </>
  )
}

/**
 * Fee ledger. The original nested every fee as a parent row with two children
 * ("Paid by merchant" / "Paid by customer") always expanded, producing a wall
 * of mostly-$0.00 rows. Here the split renders inline and only when the
 * customer actually bears part of the fee, which is the only case where the
 * distinction carries information.
 */
function FeesTab({ payment }: { payment: Payment }) {
  const totalFees = payment.fees.reduce((sum, fee) => sum + fee.total, 0)
  const net = payment.subtotal - totalFees

  return (
    <>
      <Section title="Settlement">
        <Row label="Subtotal" value={<span className="tabular-nums">{formatCurrency(payment.subtotal)}</span>} />
        <Row
          label="Total fees"
          value={<span className="tabular-nums text-[var(--tone-critical-fg)]">−{formatCurrency(totalFees)}</span>}
        />
        <Row
          label="Net to merchant"
          value={<span className="font-semibold tabular-nums">{formatCurrency(net)}</span>}
        />
      </Section>

      <Section title="Fee breakdown">
        <div className="space-y-1">
          {payment.fees.map((fee) => {
            const isZero = fee.total === 0
            const splitWithCustomer = fee.paidByCustomer > 0

            return (
              <div
                key={fee.label}
                className={cn(
                  'flex items-center justify-between gap-3 border-b border-border py-2 last:border-0',
                  isZero && 'opacity-45',
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-ink">{fee.label}</p>
                  {splitWithCustomer && (
                    <p className="text-[11px] text-ink-faint">
                      Merchant {formatCurrency(fee.paidByMerchant)} · Customer {formatCurrency(fee.paidByCustomer)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 tabular-nums text-[13px] text-ink">{formatCurrency(fee.total)}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[12px] leading-snug text-ink-faint">
          Fees at $0.00 are shown dimmed rather than hidden, so the absence of a gas fee or a
          protection fee is verifiable rather than ambiguous.
        </p>
      </Section>
    </>
  )
}
