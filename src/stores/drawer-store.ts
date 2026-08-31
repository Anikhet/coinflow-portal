import { create } from 'zustand'

interface DrawerState {
  paymentId: string | null
  customerId: string | null
  /**
   * Ids of the rows currently on screen, in display order, so the drawer can
   * step to the next record without going back to the table.
   *
   * The table owns this list and the drawer consumes it, with no useful common
   * ancestor between them — the same reason the open record itself lives here.
   */
  recordIds: string[]
  openPayment: (id: string) => void
  openCustomer: (id: string) => void
  closeAll: () => void
  setRecordIds: (ids: string[]) => void
  /** Steps the open record by an offset within recordIds; a no-op at the ends. */
  step: (offset: number) => void
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
  recordIds: [],
  openPayment: (paymentId) => set({ paymentId, customerId: null }),
  openCustomer: (customerId) => set({ customerId, paymentId: null }),
  closeAll: () => set({ paymentId: null, customerId: null }),

  setRecordIds: (recordIds) => set({ recordIds }),

  step: (offset) =>
    set((state) => {
      const openId = state.customerId ?? state.paymentId
      if (!openId) return {}
      const index = state.recordIds.indexOf(openId)
      const next = state.recordIds[index + offset]
      if (index === -1 || next === undefined) return {}
      return state.customerId ? { customerId: next } : { paymentId: next }
    }),
}))
