import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { KpiCard } from './kpi-card'
import { LazyMethodChart, MethodChartFallback } from '@/components/charts/method-chart-lazy'
import { Skeleton } from '@/components/ui/skeleton'
import { Pill } from '@/components/ui/pill'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/table/empty-state'
import { useAsync } from '@/hooks/use-async'
import { fetchOverview, fetchMethodSeries, fetchPayments } from '@/mocks/api'
import { formatCompactCurrency, formatCount, formatCurrency, formatRelative } from '@/lib/format'
import { paymentStatusTone } from '@/lib/tone-map'
import { MethodGlyph } from '@/components/icons/method-icon'
import { methodLabel } from '@/lib/method-labels'
import { useDrawerStore } from '@/stores/drawer-store'
import { PaymentDrawer } from '@/features/purchases/payment-drawer'
import { Calendar, CheckCircle2, RotateCw, TriangleAlert } from 'lucide-react'

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
export function HomePage() {
  const overview = useAsync(() => fetchOverview(), [])
  const chart = useAsync(() => fetchMethodSeries(7), [])
  const recent = useAsync(() => fetchPayments({ statuses: ['failed'], pageSize: 6 }), [])

  const openPayment = useDrawerStore((state) => state.openPayment)
  const metrics = overview.data

  return (
    <AppShell>
      <PageHeader
        title="Overview"
        description="High level analytics across all merchants"
        actions={
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] bg-surface px-2.5 text-[12px] font-medium text-ink-muted ring-1 ring-inset ring-border">
            <Calendar className="size-3.5 text-ink-faint" />
            Aug 24 – Aug 30, 2026
          </span>
        }
      />

      <div className="flex-1 space-y-4 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            loading={overview.loading}
            label="Settled volume"
            value={metrics ? formatCurrency(metrics.payments.amount) : ''}
            secondary={metrics ? `${formatCount(metrics.payments.count)} payments` : undefined}
            deltaPct={metrics?.payments.deltaPct}
            spark={metrics?.payments.spark}
            href="/purchases"
          />
          <KpiCard
            loading={overview.loading}
            label="Payouts"
            value={metrics ? formatCurrency(metrics.payouts.amount) : ''}
            secondary={metrics ? `${formatCount(metrics.payouts.count)} withdrawals` : undefined}
            deltaPct={metrics?.payouts.deltaPct}
            spark={metrics?.payouts.spark}
          />
          <KpiCard
            loading={overview.loading}
            label="Customers"
            value={metrics ? formatCount(metrics.customers.count) : ''}
            secondary="with completed purchases"
            deltaPct={metrics?.customers.deltaPct}
            spark={metrics?.customers.spark}
            href="/customers"
          />
          <KpiCard
            loading={overview.loading}
            label="Authorization rate"
            value={metrics ? `${metrics.authRate.pct.toFixed(1)}%` : ''}
            secondary="of attempted payments"
            deltaPct={metrics?.authRate.deltaPct}
            spark={metrics?.authRate.spark}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <section className="flex flex-col rounded-[var(--radius-surface)] border border-border bg-surface p-4 xl:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight text-ink">Volume by method</h2>
                <p className="text-[12px] text-ink-muted">Settled payments · last 7 days</p>
              </div>
              {chart.data && (
                <p className="shrink-0 text-[18px] font-semibold tabular-nums text-ink">
                  {formatCompactCurrency(chart.data.series.reduce((sum, entry) => sum + entry.total, 0))}
                </p>
              )}
            </div>

            {chart.loading || !chart.data ? (
              /* Same 220px + 24px legend box as the real chart, so mounting it shifts nothing. */
              <MethodChartFallback />
            ) : (
              <LazyMethodChart points={chart.data.points} series={chart.data.series} />
            )}
          </section>

          <section className="rounded-[var(--radius-surface)] border border-border bg-surface p-4">
            <div className="mb-3">
              <h2 className="text-[14px] font-semibold tracking-tight text-ink">Needs attention</h2>
              <p className="text-[12px] text-ink-muted">Most recent failed payments</p>
            </div>

            {/* All three states — loading, empty, populated — occupy the same
                box, so the card never grows or collapses as the request
                resolves and the grid row beside the chart stays put. */}
            <div className="min-h-[342px]">
              {recent.loading ? (
                <div className="space-y-1.5">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-[52px] w-full" />
                  ))}
                </div>
              ) : recent.error ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    icon={TriangleAlert}
                    tone="critical"
                    title="Could not load failures"
                    description="This panel could not reach the payments service. The numbers above are unaffected."
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
                    icon={CheckCircle2}
                    title="Nothing needs attention"
                    description="No payments have failed in this period. New failures surface here within a minute of occurring."
                  />
                </div>
              ) : (
                <ul className="space-y-1.5">
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
                            <span className="block truncate text-[13px] font-medium leading-tight text-ink">
                              {payment.customerName}
                            </span>
                            <span className="block truncate text-[11px] leading-tight text-ink-faint">
                              {methodLabel(payment.method)} · {formatRelative(payment.createdAt)} · code {payment.responseCode}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-[13px] font-medium tabular-nums text-ink">
                              {formatCurrency(payment.subtotal)}
                            </span>
                            <Pill tone={status.tone} variant="ghost" dot>{status.label}</Pill>
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
