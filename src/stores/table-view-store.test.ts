import { describe, expect, it } from 'vitest'
import { createTableViewStore } from './table-view-store'

const init = { sortBy: 'createdAt' as const }

describe('createTableViewStore', () => {
  it('starts on page 1 with the supplied sort', () => {
    const store = createTableViewStore({ sortBy: 'amount', sortDir: 'asc' })
    expect(store.getState()).toMatchObject({ page: 1, sortBy: 'amount', sortDir: 'asc' })
  })

  it('defaults to descending sort', () => {
    expect(createTableViewStore(init).getState().sortDir).toBe('desc')
  })

  /**
   * The core invariant. Any change that alters the result set must return to
   * page 1 — otherwise the user lands on a page that no longer exists and sees
   * an empty table.
   */
  it.each([
    ['search', (s: ReturnType<typeof createTableViewStore>) => s.getState().setSearch('abc')],
    ['filter', (s: ReturnType<typeof createTableViewStore>) => s.getState().setFilter('status', ['failed'])],
    ['sort', (s: ReturnType<typeof createTableViewStore>) => s.getState().toggleSort('amount')],
    ['toggle', (s: ReturnType<typeof createTableViewStore>) => s.getState().setToggle('riskOnly', true)],
  ])('resets to page 1 when %s changes', (_label, act) => {
    const store = createTableViewStore(init)
    store.getState().setPage(5)
    expect(store.getState().page).toBe(5)
    act(store)
    expect(store.getState().page).toBe(1)
  })

  it('flips direction when re-sorting the same column', () => {
    const store = createTableViewStore(init)
    store.getState().toggleSort('createdAt')
    expect(store.getState().sortDir).toBe('asc')
    store.getState().toggleSort('createdAt')
    expect(store.getState().sortDir).toBe('desc')
  })

  it('starts a new column descending rather than inheriting the previous direction', () => {
    const store = createTableViewStore(init)
    store.getState().toggleSort('createdAt')
    expect(store.getState().sortDir).toBe('asc')
    store.getState().toggleSort('amount')
    expect(store.getState()).toMatchObject({ sortBy: 'amount', sortDir: 'desc' })
  })

  it('keeps filter groups independent', () => {
    const store = createTableViewStore(init)
    store.getState().setFilter('status', ['failed'])
    store.getState().setFilter('method', ['venmo'])
    expect(store.getState().filters).toEqual({ status: ['failed'], method: ['venmo'] })
  })

  it('clearFilters wipes search, filters and toggles but preserves sort', () => {
    const store = createTableViewStore(init)
    store.getState().setSearch('abc')
    store.getState().setFilter('status', ['failed'])
    store.getState().setToggle('riskOnly', true)
    store.getState().toggleSort('createdAt')

    store.getState().clearFilters()

    expect(store.getState()).toMatchObject({
      search: '', filters: {}, toggles: {}, page: 1, sortDir: 'asc',
    })
  })

  it('does not mutate the previous filters object', () => {
    const store = createTableViewStore(init)
    store.getState().setFilter('status', ['failed'])
    const before = store.getState().filters
    store.getState().setFilter('method', ['venmo'])
    expect(store.getState().filters).not.toBe(before)
    expect(before).toEqual({ status: ['failed'] })
  })

  it('creates independent instances so two tables cannot collide', () => {
    const a = createTableViewStore(init)
    const b = createTableViewStore(init)
    a.getState().setSearch('only-a')
    expect(b.getState().search).toBe('')
  })
})
