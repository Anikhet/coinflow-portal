import { PAYMENTS, PAYOUTS, CUSTOMERS, DATASET_NOW } from './seed-data'
import { latency } from './latency'
import type { Payment, MerchantPayout, CardSlice } from '@/types'
import type { PayoutRail } from '@/types/payout'
import type { OverviewMetrics, SeriesPoint, MethodSeries } from '@/types/analytics'
import { methodLabel } from '@/lib/method-labels'
import type { PaymentMethod } from '@/types/payment'

/**
 * ANALYTICS
 * =============================================================================
 * Everything the dashboard aggregates: the charted period, the daily series
 * behind both charts, the headline metrics and the two breakdowns.
 *
 * Split from the record queries in `api.ts` because they answer a different
 * kind of question — those return rows a user asked for, these compute figures
 * over the whole corpus — and because one file holding both had grown past the
 * point where either was easy to find.
 */

const DAY = 86_400_000

/**
 * First instant of the charted window, snapped to a calendar day boundary.
 *
 * The charts bucket by calendar day, so the window they cover starts at
 * midnight of the earliest bucket — NOT at "now minus seven days". Any KPI
 * summing a different range reports a different number for the same thing:
 * the payouts KPI and the payouts chart were out by $31,747 because the KPI
 * counted the partial day the charts drop.
 */
function periodStart(days: number): number {
  const earliest = new Date(DATASET_NOW - (days - 1) * DAY)
  earliest.setUTCHours(0, 0, 0, 0)
  return earliest.getTime()
}

/** Whether a record falls inside the charted window. */
function inPeriod(iso: string, days: number): boolean {
  return +new Date(iso) >= periodStart(days)
}

function dayKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

/**
 * Builds the per-method daily series for the home charts.
 *
 * Returns series already ranked by total volume so the chart can render the top
 * N and fold the remainder into "Other". The original dashboard plotted all ten
 * methods at once, where Card is ~90% of volume and the other nine sit flat on
 * the zero line — technically complete and practically unreadable.
 */
export async function fetchMethodSeries(days = 7): Promise<{ points: SeriesPoint[]; series: MethodSeries[] }> {
  await latency(300)

  const start = DATASET_NOW - (days - 1) * DAY
  const buckets = new Map<string, Map<string, number>>()

  for (let i = 0; i < days; i += 1) {
    buckets.set(dayKey(start + i * DAY), new Map())
  }

  const totals = new Map<string, number>()

  for (const payment of PAYMENTS) {
    // Same window as everything else. Summing all time here produced a net
    // settlement figure larger than the period's gross volume — arithmetically
    // impossible, and the first thing a reviewer would catch.
    if (payment.status !== 'settled' || !inPeriod(payment.createdAt, days)) continue
    const key = dayKey(+new Date(payment.createdAt))
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.set(payment.method, (bucket.get(payment.method) ?? 0) + payment.subtotal)
    totals.set(payment.method, (totals.get(payment.method) ?? 0) + payment.subtotal)
  }

  const series: MethodSeries[] = [...totals.entries()]
    .map(([key, total]) => ({ key, label: methodLabel(key as PaymentMethod), total }))
    .sort((a, b) => b.total - a.total)

  const points: SeriesPoint[] = [...buckets.entries()].map(([date, bucket]) => {
    const point: SeriesPoint = { date }
    for (const { key } of series) point[key] = Math.round((bucket.get(key) ?? 0) * 100) / 100
    return point
  })

  return { points, series }
}



export async function fetchOverview(): Promise<OverviewMetrics> {
  await latency(220)

  const DAYS = 7

  const settled = PAYMENTS.filter(
    (payment) => payment.status === 'settled' && inPeriod(payment.createdAt, DAYS),
  )
  const amounts = settled.map((payment) => payment.subtotal)
  const paymentsTotal = amounts.reduce((sum, value) => sum + value, 0)

  // Payouts come from the payout fixture, not a share of inbound volume. They
  // were previously modelled as 48% of payments, which contradicted the Payouts
  // chart on the same screen — two different numbers for one thing.
  const completedPayouts = PAYOUTS.filter(
    (payout) => payout.status === 'completed' && inPeriod(payout.createdAt, DAYS),
  )
  const payoutsTotal = completedPayouts.reduce((sum, payout) => sum + payout.amount, 0)

  const currentStart = periodStart(DAYS)
  const priorStart = periodStart(DAYS * 2)

  // "New customers" means new IN THE PERIOD, matching production. Counting the
  // whole corpus instead would report the same figure every day forever.
  const newCustomers = CUSTOMERS.filter(
    (customer) => +new Date(customer.createdAt) >= currentStart,
  )
  const priorCustomers = CUSTOMERS.filter((customer) => {
    const created = +new Date(customer.createdAt)
    return created >= priorStart && created < currentStart
  })

  const changePct = (current: number, previous: number) =>
    previous === 0 ? 0 : ((current - previous) / previous) * 100

  /** Same length of window, immediately before the current one. */
  const inPriorWindow = (iso: string) => {
    const at = +new Date(iso)
    return at >= priorStart && at < currentStart
  }

  // The payments and payouts deltas were hardcoded literals (12.4 and -2.8).
  // They never moved with the data, so the arrow and the percentage beside a
  // live figure were decoration. Both are now measured against the preceding
  // window of the same length.
  const priorPayments = PAYMENTS.filter(
    (p) => p.status === 'settled' && inPriorWindow(p.createdAt),
  )
  const priorPaymentsTotal = priorPayments.reduce((sum, p) => sum + p.subtotal, 0)

  // -- rate metrics --------------------------------------------------------
  // An "attempt" excludes payments still in flight: a payment the issuer has
  // not answered yet is neither an approval nor a decline, and counting it as
  // a decline would make the rate sag every time traffic spikes.
  const attempted = PAYMENTS.filter(
    (p) => p.status !== 'initiated' && inPeriod(p.createdAt, DAYS),
  )
  const approved = attempted.filter((p) => p.status !== 'failed')

  const priorAttempted = PAYMENTS.filter(
    (p) => p.status !== 'initiated' && inPriorWindow(p.createdAt),
  )
  const priorApproved = priorAttempted.filter((p) => p.status !== 'failed')

  const rate = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100)

  const approvalPct = rate(approved.length, attempted.length)
  const priorApprovalPct = rate(priorApproved.length, priorAttempted.length)

  // Disputes over settled-plus-disputed: a dispute can only arise on a payment
  // that went through, so failures do not belong in the denominator.
  const disputed = PAYMENTS.filter(
    (p) => p.status === 'disputed' && inPeriod(p.createdAt, DAYS),
  )
  const disputeBase = settled.length + disputed.length

  const priorDisputed = PAYMENTS.filter(
    (p) => p.status === 'disputed' && inPriorWindow(p.createdAt),
  )
  const priorSettled = PAYMENTS.filter(
    (p) => p.status === 'settled' && inPriorWindow(p.createdAt),
  )

  const chargebackPct = rate(disputed.length, disputeBase)
  const priorChargebackPct = rate(priorDisputed.length, priorSettled.length + priorDisputed.length)

  const priorPayouts = PAYOUTS.filter(
    (p) => p.status === 'completed' && inPriorWindow(p.createdAt),
  )
  const priorPayoutsTotal = priorPayouts.reduce((sum, p) => sum + p.amount, 0)

  return {
    payments: {
      amount: paymentsTotal,
      count: settled.length,
      deltaPct: changePct(paymentsTotal, priorPaymentsTotal),
    },
    customers: {
      count: newCustomers.length,
      deltaPct: changePct(newCustomers.length, priorCustomers.length),
    },
    payouts: {
      amount: payoutsTotal,
      count: completedPayouts.length,
      deltaPct: changePct(payoutsTotal, priorPayoutsTotal),
    },
    approvalRate: {
      pct: approvalPct,
      deltaPct: approvalPct - priorApprovalPct,
      approved: approved.length,
      attempted: attempted.length,
    },
    chargebackRate: {
      pct: chargebackPct,
      deltaPct: chargebackPct - priorChargebackPct,
      disputes: disputed.length,
      /** Visa's monitoring programme entry point. Mastercard's is close to it. */
      threshold: 0.9,
    },
  }
}


/** Corpus sizes, so pages do not hardcode a total that drifts from the data. */
/** Amount or transaction count — the axis each chart's toggle switches between. */
export type Metric = 'amount' | 'count'

export interface MetricSeries {
  points: SeriesPoint[]
  series: MethodSeries[]
}

/** Both metrics for one chart, so the toggle needs no refetch. */
export interface ChartData {
  amount: MetricSeries
  count: MetricSeries
}

const RAIL_LABEL: Record<PayoutRail, string> = {
  'asap-rtp': 'ASAP (RTP)',
  'same-day': 'Same Day',
  standard: 'Standard',
  card: 'Card',
  paypal: 'PayPal',
  venmo: 'Venmo',
  iban: 'IBAN',
  wire: 'Wire',
  interac: 'Interac',
  eft: 'EFT',
}

/**
 * Generic daily series builder.
 *
 * Buckets any record set by day and key, and returns BOTH the amount and the
 * count view. Computing both up front means the Amount/Count toggle is a pure
 * client-side switch rather than a refetch — the original dashboard's toggle
 * has to feel instant, and a spinner on a two-state control reads as broken.
 */
function buildDailySeries<T>(
  records: T[],
  days: number,
  getDate: (record: T) => string,
  getKey: (record: T) => string,
  getAmount: (record: T) => number,
  label: (key: string) => string,
): ChartData {
  const start = DATASET_NOW - (days - 1) * DAY
  const amountBuckets = new Map<string, Map<string, number>>()
  const countBuckets = new Map<string, Map<string, number>>()

  for (let i = 0; i < days; i += 1) {
    const key = dayKey(start + i * DAY)
    amountBuckets.set(key, new Map())
    countBuckets.set(key, new Map())
  }

  const amountTotals = new Map<string, number>()
  const countTotals = new Map<string, number>()

  for (const record of records) {
    const day = dayKey(+new Date(getDate(record)))
    const amountBucket = amountBuckets.get(day)
    const countBucket = countBuckets.get(day)
    if (!amountBucket || !countBucket) continue

    const key = getKey(record)
    const amount = getAmount(record)
    amountBucket.set(key, (amountBucket.get(key) ?? 0) + amount)
    countBucket.set(key, (countBucket.get(key) ?? 0) + 1)
    amountTotals.set(key, (amountTotals.get(key) ?? 0) + amount)
    countTotals.set(key, (countTotals.get(key) ?? 0) + 1)
  }

  const rank = (totals: Map<string, number>): MethodSeries[] =>
    [...totals.entries()]
      .map(([key, total]) => ({ key, label: label(key), total }))
      .sort((a, b) => b.total - a.total)

  const project = (
    buckets: Map<string, Map<string, number>>,
    series: MethodSeries[],
    round: boolean,
  ): SeriesPoint[] =>
    [...buckets.entries()].map(([date, bucket]) => {
      const point: SeriesPoint = { date }
      for (const { key } of series) {
        const value = bucket.get(key) ?? 0
        point[key] = round ? Math.round(value * 100) / 100 : value
      }
      return point
    })

  const amountSeries = rank(amountTotals)
  const countSeries = rank(countTotals)

  return {
    amount: { points: project(amountBuckets, amountSeries, true), series: amountSeries },
    count: { points: project(countBuckets, countSeries, false), series: countSeries },
  }
}

/** Settled payments by method — the left-hand chart. */
export async function fetchPaymentsChart(days = 7): Promise<ChartData> {
  await latency(300)
  return buildDailySeries(
    PAYMENTS.filter((payment) => payment.status === 'settled'),
    days,
    (payment) => payment.createdAt,
    (payment) => payment.method,
    (payment) => payment.subtotal,
    (key) => methodLabel(key as PaymentMethod),
  )
}

/** Customer withdrawals by rail — the right-hand chart. */
export async function fetchPayoutsChart(days = 7): Promise<ChartData> {
  await latency(300)
  return buildDailySeries(
    PAYOUTS.filter((payout) => payout.status === 'completed'),
    days,
    (payout) => payout.createdAt,
    (payout) => payout.rail,
    (payout) => payout.amount,
    (key) => RAIL_LABEL[key as PayoutRail],
  )
}

/**
 * Card volume split by brand and by funding type.
 *
 * Two dimensions rather than one because they answer different questions: brand
 * mix drives interchange cost, funding mix drives auth rates and chargeback
 * exposure. Both are things a payments team acts on.
 */
export async function fetchCardBreakdown(days = 7): Promise<{
  total: number
  byBrand: CardSlice[]
  byFunding: CardSlice[]
}> {
  await latency(240)

  // Scoped to the SAME window as the KPIs and charts. Without this the card
  // breakdown summed all time while everything beside it summed seven days, so
  // two figures on one screen described different periods with no way to tell.
  const cardPayments = PAYMENTS.filter(
    (payment) =>
      payment.status === 'settled' &&
      payment.cardBrand !== null &&
      inPeriod(payment.createdAt, days),
  )
  const total = cardPayments.reduce((sum, payment) => sum + payment.subtotal, 0)

  const group = (
    getKey: (payment: Payment) => string,
    label: (key: string) => string,
  ): CardSlice[] => {
    const amounts = new Map<string, { amount: number; count: number }>()
    for (const payment of cardPayments) {
      const key = getKey(payment)
      const entry = amounts.get(key) ?? { amount: 0, count: 0 }
      entry.amount += payment.subtotal
      entry.count += 1
      amounts.set(key, entry)
    }
    return [...amounts.entries()]
      .map(([key, entry]) => ({
        key,
        label: label(key),
        amount: Math.round(entry.amount * 100) / 100,
        count: entry.count,
        share: total === 0 ? 0 : entry.amount / total,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  const BRAND_LABEL: Record<string, string> = {
    visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express',
  }
  const FUNDING_LABEL: Record<string, string> = {
    debit: 'Debit', credit: 'Credit', prepaid: 'Prepaid',
  }

  return {
    total: Math.round(total * 100) / 100,
    byBrand: group((payment) => payment.cardBrand ?? 'visa', (key) => BRAND_LABEL[key] ?? key),
    byFunding: group((payment) => payment.fundingType, (key) => FUNDING_LABEL[key] ?? key),
  }
}

/**
 * Settlement owed to each merchant for the period.
 *
 * Distinct from the "Payouts" headline above, which counts CUSTOMER
 * withdrawals. Merchant settlement is net of fees, which is why it does not
 * equal gross payment volume.
 */
export async function fetchMerchantPayouts(days = 7): Promise<{ total: number; rows: MerchantPayout[] }> {
  await latency(240)

  const byMerchant = new Map<string, { amount: number; count: number }>()

  for (const payment of PAYMENTS) {
    // Same window as everything else. Summing all time here produced a net
    // settlement figure larger than the period's gross volume — arithmetically
    // impossible, and the first thing a reviewer would catch.
    if (payment.status !== 'settled' || !inPeriod(payment.createdAt, days)) continue
    const fees = payment.fees.reduce((sum, fee) => sum + fee.total, 0)
    const net = payment.subtotal - fees
    const entry = byMerchant.get(payment.merchant) ?? { amount: 0, count: 0 }
    entry.amount += net
    entry.count += 1
    byMerchant.set(payment.merchant, entry)
  }

  const total = [...byMerchant.values()].reduce((sum, entry) => sum + entry.amount, 0)

  const rows = [...byMerchant.entries()]
    .map(([merchant, entry]) => ({
      merchant,
      amount: Math.round(entry.amount * 100) / 100,
      count: entry.count,
      share: total === 0 ? 0 : entry.amount / total,
    }))
    .sort((a, b) => b.amount - a.amount)

  return { total: Math.round(total * 100) / 100, rows }
}
