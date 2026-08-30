import { create } from 'zustand'

interface DrawerState {
  paymentId: string | null
  customerId: string | null
  openPayment: (id: string) => void
  openCustomer: (id: string) => void
  closeAll: () => void
}

/**
 * Which detail record is open.
 *
 * Kept in a store because the trigger (a table row, deep inside a virtualised
 * body) and the consumer (the drawer, a sibling of the page) have no useful
 * common ancestor other than the page itself. Routing this through props would
 * mean the page owning state purely to distribute it to two children — the
 * fan-out drilling signal.
 *
 * Opening one record closes the other: only one drawer may occupy the right
 * edge, and letting both open would stack two panels over the table.
 */
export const useDrawerStore = create<DrawerState>((set) => ({
  paymentId: null,
  customerId: null,
  openPayment: (paymentId) => set({ paymentId, customerId: null }),
  openCustomer: (customerId) => set({ customerId, paymentId: null }),
  closeAll: () => set({ paymentId: null, customerId: null }),
}))
