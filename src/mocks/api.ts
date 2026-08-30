import { PAYMENTS, CUSTOMERS, DATASET_NOW } from './seed-data'
import type { Payment, Customer } from '@/types'
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

  const settled = PAYMENTS.filter((payment) => payment.status === 'settled')
  const amounts = settled.map((payment) => payment.subtotal)
  const paymentsTotal = amounts.reduce((sum, value) => sum + value, 0)

  const authRate = (settled.length / PAYMENTS.filter((p) => p.status !== 'initiated').length) * 100

  // Payouts are modelled as a share of inbound volume — this prototype has no
  // separate payout fixture, and the ratio is what the card actually conveys.
  const payoutsTotal = paymentsTotal * 0.48

  return {
    payments: {
      amount: paymentsTotal,
      count: settled.length,
      deltaPct: 12.4,
      spark: sparkline(amounts),
    },
    customers: {
      count: CUSTOMERS.length,
      deltaPct: 4.1,
      spark: sparkline(CUSTOMERS.map((customer) => customer.paymentCount)),
    },
    payouts: {
      amount: payoutsTotal,
      count: Math.round(settled.length * 0.34),
      deltaPct: -2.8,
      spark: sparkline(amounts.map((value) => value * 0.48)),
    },
    authRate: {
      pct: authRate,
      deltaPct: 0.6,
      spark: authRateByDay(),
    },
  }
}

/** Per-day authorisation rate, so the sparkline reflects real outcomes. */
function authRateByDay(): number[] {
  const byDay = new Map<string, { authorised: number; attempted: number }>()

  for (const payment of PAYMENTS) {
    if (payment.status === 'initiated') continue
    const key = dayKey(+new Date(payment.createdAt))
    const bucket = byDay.get(key) ?? { authorised: 0, attempted: 0 }
    bucket.attempted += 1
    if (payment.status !== 'failed') bucket.authorised += 1
    byDay.set(key, bucket)
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { authorised, attempted }]) => (attempted === 0 ? 0 : (authorised / attempted) * 100))
}

/** Corpus sizes, so pages do not hardcode a total that drifts from the data. */
export const PAYMENT_TOTAL = PAYMENTS.length
export const CUSTOMER_TOTAL = CUSTOMERS.length

export function listFilterOptions() {
  return {
    merchants: [...new Set(PAYMENTS.map((payment) => payment.merchant))].sort(),
    methods: [...new Set(PAYMENTS.map((payment) => payment.method))],
    processors: [...new Set(PAYMENTS.map((payment) => payment.processor))],
    statuses: ['settled', 'initiated', 'failed', 'refunded', 'disputed'],
  }
}
