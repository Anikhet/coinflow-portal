import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { KpiCard } from './kpi-card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { MethodChartCard } from './method-chart-card'
import { BreakdownCard } from './breakdown-card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/table/empty-state'
import { Truncated } from '@/components/ui/truncated'
import { useAsync } from '@/hooks/use-async'
import { fetchPayments } from '@/mocks/api'
import { fetchOverview, fetchPaymentsChart, fetchPayoutsChart, fetchCardBreakdown, fetchMerchantPayouts } from '@/mocks/analytics'
import { formatCount, formatCurrency, formatRelative, formatTotal } from '@/lib/format'
import { paymentStatusTone } from '@/lib/tone-map'
import { CardBrandGlyph, MethodGlyph } from '@/components/icons/method-icon'
import { Avatar } from '@/components/ui/avatar'
import { methodLabel } from '@/lib/method-labels'
import { useDrawerStore } from '@/stores/drawer-store'
import { PaymentDrawer } from '@/features/purchases/payment-drawer'
import { CreditCard, Landmark, RotateCw, WalletCards, type LucideIcon } from 'lucide-react'

/**
 * HOME
 * =============================================================================
 * Structured as answer-first: the four numbers an operator opens the console to
 * check, then the trend behind the largest of them, then the live tail of
 * failures they may need to act on.
 *
 * "Auth rate" is added as a fourth KPI. It was absent from the original despite
 * being the single most operationally actionable number on the page — volume
 * tells you what happened, auth rate tells you whether something is wrong right
 * now.
 */
/**
 * Marks for the breakdown rows.
 *
 * Brands reuse the same card logos the payments table draws, and merchants the
 * same name-derived avatar as the sidebar switcher and the merchant column, so
 * a merchant is one recognisable object everywhere it appears rather than a
 * different-looking string per screen.
 *
 * Funding type has no logo to borrow — it is a property of a card, not a brand
 * — so it takes a neutral glyph chip that says what the money is: a bank
 * balance, a line of credit, a loaded card.
 */
const FUNDING_ICON: Record<string, LucideIcon> = {
  debit: Landmark,
  credit: CreditCard,
  prepaid: WalletCards,
}

function FundingMark({ fundingKey }: { fundingKey: string }) {
  const Icon = FUNDING_ICON[fundingKey] ?? CreditCard
  return (
    <span className="grid size-5 place-items-center rounded-[4px] bg-surface-sunk text-ink-faint">
      <Icon className="size-3" />
    </span>
  )
}

export function HomePage() {
  const overview = useAsync(() => fetchOverview(), [])
  // Seeded to the fixture window. The picker is live — presets and range
  // selection both work — though this prototype's mock API always returns the
  // same seven days, so the charts do not refetch on change.
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date('2026-08-24T00:00:00'),
    to: new Date('2026-08-30T00:00:00'),
  })

  const paymentsChart = useAsync(() => fetchPaymentsChart(7), [])
  const payoutsChart = useAsync(() => fetchPayoutsChart(7), [])
  const cardBreakdown = useAsync(() => fetchCardBreakdown(), [])
  const merchantPayouts = useAsync(() => fetchMerchantPayouts(), [])
  const recent = useAsync(() => fetchPayments({ statuses: ['failed'], pageSize: 6 }), [])

  const openPayment = useDrawerStore((state) => state.openPayment)
  const metrics = overview.data

  return (
    <AppShell>
      <PageHeader
        title="Overview"
        description="High level analytics across all merchants"
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Five across. The row previously held three cards and a sparkline apiece;
            dropping the sparklines — which redrew the chart below at a
            twentieth the size — freed the height to add the two numbers a
            payments dashboard is actually opened for. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <KpiCard
            loading={overview.loading}
            label="Settled volume"
            glyph="payments"
            term="settledVolume"
            value={metrics ? formatTotal(metrics.payments.amount) : ''}
            secondary={metrics ? `${formatCount(metrics.payments.count)} payments` : undefined}
            deltaPct={metrics?.payments.deltaPct}
          />
          <KpiCard
            loading={overview.loading}
            label="Approval rate"
            glyph="authentication"
            term="approvalRate"
            value={metrics ? `${metrics.approvalRate.pct.toFixed(1)}%` : ''}
            secondary={
              metrics
                ? `${formatCount(metrics.approvalRate.approved)} of ${formatCount(metrics.approvalRate.attempted)}`
                : undefined
            }
            deltaPct={metrics?.approvalRate.deltaPct}
            deltaUnit="points"
          />
          <KpiCard
            loading={overview.loading}
            label="Chargeback rate"
            glyph="disputes"
            term="chargebackRate"
            value={metrics ? `${metrics.chargebackRate.pct.toFixed(2)}%` : ''}
            secondary={
              metrics ? `${formatCount(metrics.chargebackRate.disputes)} disputes` : undefined
            }
            deltaPct={metrics?.chargebackRate.deltaPct}
            deltaUnit="points"
            // More chargebacks is bad, so the delta's colouring inverts.
            invertDelta
          />
          <KpiCard
            loading={overview.loading}
            label="Customer payouts"
            glyph="liquidity"
            term="payouts"
            value={metrics ? formatTotal(metrics.payouts.amount) : ''}
            secondary={metrics ? `${formatCount(metrics.payouts.count)} withdrawals` : undefined}
            deltaPct={metrics?.payouts.deltaPct}
          />
          <KpiCard
            loading={overview.loading}
            label="New customers"
            glyph="customers"
            term="customers"
            value={metrics ? formatCount(metrics.customers.count) : ''}
            secondary="in this period"
            deltaPct={metrics?.customers.deltaPct}
          />
        </div>

        {/* Two charts side by side, as in production: money in by method and
            money out by rail. They are different flows and answer different
            questions, so neither can stand in for the other. */}
        {/* lg, not 2xl. The 2xl breakpoint is 1536px, so on a 1440 or 1512 laptop —
            which is what this is actually used on — the two charts stacked and
            you saw half of one and nothing else. Side by side from 1024px up. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MethodChartCard
            title="Payments"
            term="settledVolume"
            description="Settled payments by method · last 7 days"
            data={paymentsChart.data}
            loading={paymentsChart.loading}
          />
          <MethodChartCard
            title="Payouts"
            term="payouts"
            description="Customer withdraws by method · last 7 days"
            data={payoutsChart.data}
            loading={payoutsChart.loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <BreakdownCard
            title="Card payments breakdown"
            term="cardBreakdown"
            description="All card-backed volume, including Apple Pay and Google Pay"
            total={cardBreakdown.data?.total ?? 0}
            relation={
              metrics && cardBreakdown.data
                ? `${Math.round((cardBreakdown.data.total / metrics.payments.amount) * 100)}% of settled volume`
                : undefined
            }
            loading={cardBreakdown.loading}
            groups={
              cardBreakdown.data
                ? [
                    {
                      label: 'By brand',
                      rows: cardBreakdown.data.byBrand.map((row) => ({
                        ...row,
                        media: <CardBrandGlyph brand={row.key as 'visa' | 'mastercard' | 'amex'} />,
                      })),
                    },
                    {
                      label: 'By funding type',
                      term: 'fundingType',
                      rows: cardBreakdown.data.byFunding.map((row) => ({
                        ...row,
                        media: <FundingMark fundingKey={row.key} />,
                      })),
                    },
                  ]
                : []
            }
          />

          <BreakdownCard
            title="Merchant Payouts"
            term="merchantPayouts"
            description="Net settlement owed to each merchant, after fees"
            total={merchantPayouts.data?.total ?? 0}
            relation={
              metrics && merchantPayouts.data
                ? `settled volume less ${formatTotal(metrics.payments.amount - merchantPayouts.data.total)} in fees`
                : undefined
            }
            loading={merchantPayouts.loading}
            groups={
              merchantPayouts.data
                ? [{
                    label: 'By merchant',
                    rows: merchantPayouts.data.rows.map((row) => ({
                      key: row.merchant,
                      label: row.merchant,
                      amount: row.amount,
                      count: row.count,
                      share: row.share,
                      media: <Avatar name={row.merchant} size={20} />,
                    })),
                  }]
                : []
            }
          />

        </div>

        {/* Its own full-width row. Squeezed into a third of a line beside two
            dense breakdowns, every entry truncated its email and amount; the
            queue is meant to be actioned, not skimmed. */}
        <div>
          <section className="rounded-[var(--radius-surface)] border border-border bg-surface p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Needs attention</h2>
              <p className="text-sm text-ink-muted">Most recent failed payments</p>
            </div>

            {/* All three states — loading, empty, populated — occupy the same
                box, so the card never grows or collapses as the request
                resolves and the grid row beside the chart stays put. */}
            <div className="min-h-[212px]">
              {recent.loading ? (
                <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-[66px] w-full" />
                  ))}
                </div>
              ) : recent.error ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    glyph="error"
                    tone="critical"
                    title="Could not load failures"
                    description="The numbers above are unaffected."
                    action={
                      <Button variant="secondary" size="md" onClick={recent.reload}>
                        <RotateCw />
                        Try again
                      </Button>
                    }
                  />
                </div>
              ) : recent.data && recent.data.rows.length === 0 ? (
                /* An empty queue here is the good outcome, so it is stated as
                   success rather than as an absence of data. */
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    glyph="allClear"
                    title="Nothing needs attention"
                    description="No payments failed in this period."
                  />
                </div>
              ) : (
                <ul className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                  {recent.data?.rows.map((payment) => {
                    const status = paymentStatusTone(payment.status)
                    return (
                      <li key={payment.id}>
                        <button
                          type="button"
                          onClick={() => openPayment(payment.id)}
                          className="flex w-full items-center gap-2.5 rounded-[var(--radius-control)] border border-border p-2.5 text-left transition-colors hover:bg-surface-hover"
                        >
                          <MethodGlyph method={payment.method} cardBrand={payment.cardBrand} />
                          <span className="min-w-0 flex-1">
                            <Truncated className="block text-base font-medium leading-tight text-ink">
                              {payment.customerName}
                            </Truncated>
                            <Truncated className="block text-xs leading-tight text-ink-faint">
                              {methodLabel(payment.method)} · {formatRelative(payment.createdAt)} · code {payment.responseCode}
                            </Truncated>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-base font-medium tabular-nums text-ink">
                              {formatCurrency(payment.subtotal)}
                            </span>
                            <StatusPill descriptor={status} />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

      </div>

      <PaymentDrawer />
    </AppShell>
  )
}
