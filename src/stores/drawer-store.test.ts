import { beforeEach, describe, expect, it } from 'vitest'
import { useDrawerStore } from './drawer-store'

/**
 * The invariant worth pinning here is mutual exclusion. Only one drawer may
 * occupy the right edge; if both ids could be set at once the two panels would
 * stack over each other and over the table.
 */
describe('useDrawerStore', () => {
  beforeEach(() => useDrawerStore.getState().closeAll())

  it('starts with nothing open', () => {
    expect(useDrawerStore.getState()).toMatchObject({ paymentId: null, customerId: null })
  })

  it('opening a payment closes any open customer', () => {
    useDrawerStore.getState().openCustomer('cus_1')
    useDrawerStore.getState().openPayment('pay_1')
    expect(useDrawerStore.getState()).toMatchObject({ paymentId: 'pay_1', customerId: null })
  })

  it('opening a customer closes any open payment', () => {
    useDrawerStore.getState().openPayment('pay_1')
    useDrawerStore.getState().openCustomer('cus_1')
    expect(useDrawerStore.getState()).toMatchObject({ paymentId: null, customerId: 'cus_1' })
  })

  it('supports navigating straight from one record to another of the same kind', () => {
    useDrawerStore.getState().openPayment('pay_1')
    useDrawerStore.getState().openPayment('pay_2')
    expect(useDrawerStore.getState().paymentId).toBe('pay_2')
  })

  it('closeAll clears both', () => {
    useDrawerStore.getState().openPayment('pay_1')
    useDrawerStore.getState().closeAll()
    expect(useDrawerStore.getState()).toMatchObject({ paymentId: null, customerId: null })
  })
})
