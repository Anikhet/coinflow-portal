import { createStore } from 'zustand/vanilla'
import type { VisibilityState } from '@tanstack/react-table'

export type SortDirection = 'asc' | 'desc'

export interface TableViewState {
  search: string
  /** Multi-select filters, keyed by filter group id. */
  filters: Record<string, string[]>
  sortBy: string
  sortDir: SortDirection
  page: number
  columnVisibility: VisibilityState
  /** Page-specific boolean toggles (e.g. "exceptions only"). */
  toggles: Record<string, boolean>

  setSearch: (search: string) => void
  setFilter: (groupId: string, values: string[]) => void
  clearFilters: () => void
  toggleSort: (columnId: string) => void
  setPage: (page: number) => void
  setColumnVisibility: (visibility: VisibilityState) => void
  setToggle: (key: string, value: boolean) => void
}

export interface TableViewInit {
  sortBy: string
  sortDir?: SortDirection
  columnVisibility?: VisibilityState
  toggles?: Record<string, boolean>
}

/**
 * SCOPED TABLE VIEW STORE
 * =============================================================================
 * Holds everything that describes "what the user is currently looking at" in a
 * table: search, filters, sort, page, column visibility and page-level toggles.
 *
 * WHY A STORE RATHER THAN PAGE STATE
 * This state is consumed by three sibling components — the toolbar (search,
 * filters, columns), the table (sort, visibility) and the pagination bar (page)
 * — none of which is an ancestor of the others. Holding it in the page meant
 * the page owned eight pieces of state purely to distribute them downward, and
 * passed the same values to multiple children. That is fan-out prop drilling:
 * the parent is acting as a message bus, not a consumer.
 *
 * The store is created PER TABLE and provided through context rather than being
 * a module-level singleton, so the payments and customers views cannot collide,
 * and each unmounts with its own state.
 *
 * INVARIANT: any change that alters the result set resets to page 1. Keeping
 * this inside the store means no call site can forget it — previously every
 * filter handler had to remember to call setPage(1), which is duplicated logic
 * waiting to drift.
 */
export function createTableViewStore(init: TableViewInit) {
  return createStore<TableViewState>()((set) => ({
    search: '',
    filters: {},
    sortBy: init.sortBy,
    sortDir: init.sortDir ?? 'desc',
    page: 1,
    columnVisibility: init.columnVisibility ?? {},
    toggles: init.toggles ?? {},

    setSearch: (search) => set({ search, page: 1 }),

    setFilter: (groupId, values) =>
      set((state) => ({ filters: { ...state.filters, [groupId]: values }, page: 1 })),

    clearFilters: () => set({ search: '', filters: {}, toggles: {}, page: 1 }),

    toggleSort: (columnId) =>
      set((state) =>
        state.sortBy === columnId
          ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc', page: 1 }
          : { sortBy: columnId, sortDir: 'desc', page: 1 },
      ),

    setPage: (page) => set({ page }),

    setColumnVisibility: (columnVisibility) => set({ columnVisibility }),

    setToggle: (key, value) =>
      set((state) => ({ toggles: { ...state.toggles, [key]: value }, page: 1 })),
  }))
}

export type TableViewStore = ReturnType<typeof createTableViewStore>
