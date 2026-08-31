import { PAYMENTS, CUSTOMERS } from './seed-data'
import { latency } from './latency'
import type { Payment, Customer } from '@/types'

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
