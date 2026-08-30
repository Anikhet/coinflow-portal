import { describe, expect, it } from 'vitest'
import {
  fetchPayments, fetchPayment, fetchCustomers, fetchCustomer,
  fetchMethodSeries, fetchOverview, listFilterOptions,
  PAYMENT_TOTAL, CUSTOMER_TOTAL,
} from './api'

/**
 * The mock API is the seam the real backend will replace, so its contract is
 * worth pinning: filtering, sorting and pagination must behave the way a real
 * paginated endpoint does. The dataset is seeded, so these assertions are
 * stable across runs.
 */

describe('fetchPayments', () => {
  it('paginates without overlapping or dropping records', async () => {
    const first = await fetchPayments({ page: 1, pageSize: 10 })
    const second = await fetchPayments({ page: 2, pageSize: 10 })

    expect(first.rows).toHaveLength(10)
    expect(second.rows).toHaveLength(10)
    expect(first.total).toBe(PAYMENT_TOTAL)

    const overlap = first.rows.filter((row) => second.rows.some((other) => other.id === row.id))
    expect(overlap).toEqual([])
  })

  it('defaults to newest first', async () => {
    const { rows } = await fetchPayments({ pageSize: 20 })
    const timestamps = rows.map((row) => +new Date(row.createdAt))
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a))
  })

  it('sorts ascending by amount when asked', async () => {
    const { rows } = await fetchPayments({ sortBy: 'subtotal', sortDir: 'asc', pageSize: 20 })
    const amounts = rows.map((row) => row.subtotal)
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b))
  })

  it('filters by status', async () => {
    const { rows, total } = await fetchPayments({ statuses: ['failed'], pageSize: 50 })
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThan(PAYMENT_TOTAL)
    expect(rows.every((row) => row.status === 'failed')).toBe(true)
  })

  it('intersects multiple filter groups rather than unioning them', async () => {
    const statusOnly = await fetchPayments({ statuses: ['settled'], pageSize: 1 })
    const combined = await fetchPayments({ statuses: ['settled'], methods: ['venmo'], pageSize: 1 })
    expect(combined.total).toBeLessThanOrEqual(statusOnly.total)
  })

  it('applies an amount range inclusively', async () => {
    const { rows } = await fetchPayments({ minAmount: 100, maxAmount: 200, pageSize: 50 })
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.subtotal >= 100 && row.subtotal <= 200)).toBe(true)
  })

  it('searches case-insensitively across customer fields', async () => {
    const { rows } = await fetchPayments({ pageSize: 1 })
    const target = rows[0]
    const found = await fetchPayments({ search: target.customerEmail.toUpperCase(), pageSize: 50 })
    expect(found.rows.some((row) => row.id === target.id)).toBe(true)
  })

  it('returns an empty page rather than throwing when nothing matches', async () => {
    const result = await fetchPayments({ search: 'zzz-no-such-record-zzz' })
    expect(result.rows).toEqual([])
    expect(result.total).toBe(0)
  })
})

describe('fetchPayment', () => {
  it('resolves a known id and returns null for an unknown one', async () => {
    const { rows } = await fetchPayments({ pageSize: 1 })
    await expect(fetchPayment(rows[0].id)).resolves.toMatchObject({ id: rows[0].id })
    await expect(fetchPayment('not-a-real-id')).resolves.toBeNull()
  })
})

describe('fetchCustomers', () => {
  it('reports the full corpus when unfiltered', async () => {
    const { total } = await fetchCustomers({ pageSize: 5 })
    expect(total).toBe(CUSTOMER_TOTAL)
  })

  it('riskOnly returns a strict subset, every member of which has an exception', async () => {
    const all = await fetchCustomers({ pageSize: 500 })
    const risky = await fetchCustomers({ riskOnly: true, pageSize: 500 })

    expect(risky.total).toBeGreaterThan(0)
    expect(risky.total).toBeLessThan(all.total)

    const hasException = risky.rows.every((customer) =>
      customer.blocked ||
      !customer.protectionEnabled ||
      customer.threeDSProcessing !== 'functional' ||
      customer.attemptLimit !== 'standard' ||
      customer.verification !== 'enforced' ||
      customer.fraudOverride !== 'standard' ||
      customer.disputeCount > 0,
    )
    expect(hasException).toBe(true)
  })

  it('resolves a customer by id', async () => {
    const { rows } = await fetchCustomers({ pageSize: 1 })
    await expect(fetchCustomer(rows[0].id)).resolves.toMatchObject({ id: rows[0].id })
    await expect(fetchCustomer('missing')).resolves.toBeNull()
  })
})

describe('fetchMethodSeries', () => {
  it('returns one point per requested day', async () => {
    const { points } = await fetchMethodSeries(7)
    expect(points).toHaveLength(7)
  })

  it('ranks series by total volume descending, so the chart can take the top N', async () => {
    const { series } = await fetchMethodSeries(7)
    const totals = series.map((entry) => entry.total)
    expect(totals).toEqual([...totals].sort((a, b) => b - a))
  })

  it('gives every point a numeric value for every series, so stacking never gaps', async () => {
    const { points, series } = await fetchMethodSeries(7)
    for (const point of points) {
      for (const entry of series) {
        expect(typeof point[entry.key]).toBe('number')
      }
    }
  })
})

describe('fetchOverview', () => {
  it('produces a plausible authorization rate', async () => {
    const metrics = await fetchOverview()
    expect(metrics.authRate.pct).toBeGreaterThan(0)
    expect(metrics.authRate.pct).toBeLessThanOrEqual(100)
  })

  it('returns a non-empty sparkline for every metric', async () => {
    const metrics = await fetchOverview()
    for (const key of ['payments', 'customers', 'payouts', 'authRate'] as const) {
      expect(metrics[key].spark.length).toBeGreaterThan(1)
    }
  })
})

describe('listFilterOptions', () => {
  it('returns de-duplicated options for every filterable column', () => {
    const options = listFilterOptions()
    for (const values of Object.values(options)) {
      expect(new Set(values).size).toBe(values.length)
      expect(values.length).toBeGreaterThan(0)
    }
  })
})
