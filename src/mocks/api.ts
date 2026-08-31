import { PAYMENTS, PAYOUTS, CUSTOMERS, DATASET_NOW } from './seed-data'
import type { Payment, Customer, MerchantPayout, CardSlice } from '@/types'
import type { PayoutRail } from '@/types/payout'
import type { OverviewMetrics, SeriesPoint, MethodSeries } from '@/types/analytics'
import { methodLabel } from '@/lib/method-labels'
import type { PaymentMethod } from '@/types/payment'

/**
 * MOCK API
 * =============================================================================
 * Stands in for the real backend. Every function is async and artificially
 * latent so the UI is built against the same conditions it will face in
 * production — loading states, skeletons and empty states are exercised on
 * every navigation rather than being afterthoughts bolted on at integration
 * time.
 *
 * Filtering and sorting run server-side here (i.e. inside these functions)
 * rather than in the table component, mirroring how a real paginated endpoint
 * behaves. Swapping this module for `fetch` calls should require no changes to
 * any component.
 */

const latency = (ms = 260) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export interface PaymentQuery {
  search?: string
  statuses?: string[]
  methods?: string[]
  processors?: string[]
  merchants?: string[]
  minAmount?: number
  maxAmount?: number
  sortBy?: keyof Payment
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface Paged<T> {
  rows: T[]
  total: number
  page: number
  pageSize: number
}

function matchesSearch(payment: Payment, term: string) {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  return (
    payment.id.toLowerCase().includes(needle) ||
    payment.merchant.toLowerCase().includes(needle) ||
    payment.customerName.toLowerCase().includes(needle) ||
    payment.customerEmail.toLowerCase().includes(needle) ||
    (payment.cardLast4 ?? '').includes(needle) ||
    String(payment.subtotal).includes(needle)
  )
}

export async function fetchPayments(query: PaymentQuery = {}): Promise<Paged<Payment>> {
  await latency()

  const {
    search = '', statuses = [], methods = [], processors = [], merchants = [],
    minAmount, maxAmount, sortBy = 'createdAt', sortDir = 'desc',
    page = 1, pageSize = 25,
  } = query

  const filtered = PAYMENTS.filter((payment) => {
    if (!matchesSearch(payment, search)) return false
    if (statuses.length && !statuses.includes(payment.status)) return false
    if (methods.length && !methods.includes(payment.method)) return false
    if (processors.length && !processors.includes(payment.processor)) return false
    if (merchants.length && !merchants.includes(payment.merchant)) return false
    if (minAmount != null && payment.subtotal < minAmount) return false
    if (maxAmount != null && payment.subtotal > maxAmount) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const left = a[sortBy]
    const right = b[sortBy]
    let comparison: number
    if (typeof left === 'number' && typeof right === 'number') comparison = left - right
    else comparison = String(left).localeCompare(String(right))
    return sortDir === 'asc' ? comparison : -comparison
  })

  const start = (page - 1) * pageSize
  return { rows: sorted.slice(start, start + pageSize), total: sorted.length, page, pageSize }
}

export async function fetchPayment(id: string): Promise<Payment | null> {
  await latency(140)
  return PAYMENTS.find((payment) => payment.id === id) ?? null
}

export interface CustomerQuery {
  search?: string
  merchants?: string[]
  riskOnly?: boolean
  sortBy?: keyof Customer
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function fetchCustomers(query: CustomerQuery = {}): Promise<Paged<Customer>> {
  await latency()

  const {
    search = '', merchants = [], riskOnly = false,
    sortBy = 'createdAt', sortDir = 'desc', page = 1, pageSize = 25,
  } = query

  const needle = search.trim().toLowerCase()

  const filtered = CUSTOMERS.filter((customer) => {
    if (needle && !(
      customer.name.toLowerCase().includes(needle) ||
      customer.email.toLowerCase().includes(needle) ||
      customer.id.toLowerCase().includes(needle)
    )) return false
    if (merchants.length && !merchants.includes(customer.merchant)) return false
    if (riskOnly) {
      const hasException =
        customer.blocked || !customer.protectionEnabled ||
        customer.threeDSProcessing !== 'functional' ||
        customer.attemptLimit !== 'standard' ||
        customer.verification !== 'enforced' ||
        customer.fraudOverride !== 'standard' ||
        customer.disputeCount > 0
      if (!hasException) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const left = a[sortBy]
    const right = b[sortBy]
    let comparison: number
    if (typeof left === 'number' && typeof right === 'number') comparison = left - right
    else comparison = String(left).localeCompare(String(right))
    return sortDir === 'asc' ? comparison : -comparison
  })

  const start = (page - 1) * pageSize
  return { rows: sorted.slice(start, start + pageSize), total: sorted.length, page, pageSize }
}

export async function fetchCustomer(id: string): Promise<Customer | null> {
  await latency(140)
  return CUSTOMERS.find((customer) => customer.id === id) ?? null
}

// -- analytics --------------------------------------------------------------

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
    if (payment.status !== 'settled') continue
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

/** Records per calendar day across the window, oldest first. */
function dailyCounts(dates: string[], days: number): number[] {
  const buckets = new Map<string, number>()
  const start = periodStart(days)
  for (let i = 0; i < days; i += 1) buckets.set(dayKey(start + i * DAY), 0)
  for (const date of dates) {
    const key = dayKey(+new Date(date))
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, count]) => count)
}

function sparkline(values: number[], buckets = 12) {
  const size = Math.max(1, Math.ceil(values.length / buckets))
  const out: number[] = []
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size).reduce((sum, value) => sum + value, 0))
  }
  return out
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

  return {
    payments: {
      amount: paymentsTotal,
      count: settled.length,
      deltaPct: 12.4,
      spark: sparkline(amounts),
    },
    customers: {
      count: newCustomers.length,
      deltaPct: changePct(newCustomers.length, priorCustomers.length),
      // Daily signup counts — a sparkline of new customers' payment volumes
      // would be plotting a different quantity than the figure above it.
      spark: dailyCounts(newCustomers.map((customer) => customer.createdAt), DAYS),
    },
    payouts: {
      amount: payoutsTotal,
      count: completedPayouts.length,
      deltaPct: -2.8,
      spark: sparkline(completedPayouts.map((payout) => payout.amount)),
    },
  }
}


/** Corpus sizes, so pages do not hardcode a total that drifts from the data. */
export const PAYMENT_TOTAL = PAYMENTS.length
export const CUSTOMER_TOTAL = CUSTOMERS.length

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
export async function fetchCardBreakdown(): Promise<{
  total: number
  byBrand: CardSlice[]
  byFunding: CardSlice[]
}> {
  await latency(240)

  const cardPayments = PAYMENTS.filter(
    (payment) => payment.status === 'settled' && payment.cardBrand !== null,
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
export async function fetchMerchantPayouts(): Promise<{ total: number; rows: MerchantPayout[] }> {
  await latency(240)

  const byMerchant = new Map<string, { amount: number; count: number }>()

  for (const payment of PAYMENTS) {
    if (payment.status !== 'settled') continue
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

export function listFilterOptions() {
  return {
    merchants: [...new Set(PAYMENTS.map((payment) => payment.merchant))].sort(),
    methods: [...new Set(PAYMENTS.map((payment) => payment.method))],
    processors: [...new Set(PAYMENTS.map((payment) => payment.processor))],
    statuses: ['settled', 'initiated', 'failed', 'refunded', 'disputed'],
  }
}
