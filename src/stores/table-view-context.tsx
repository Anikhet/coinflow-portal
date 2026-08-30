import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import {
  createTableViewStore,
  type TableViewInit,
  type TableViewState,
  type TableViewStore,
} from './table-view-store'

const TableViewContext = createContext<TableViewStore | null>(null)

/**
 * Provides one table-view store to a page's toolbar, table and pagination.
 *
 * The store is built by useState's lazy initialiser: it runs exactly once per
 * mount, is never recreated on re-render, and — unlike assigning through a ref
 * — performs no write during the render phase, which is unsafe under concurrent
 * rendering because a render may be discarded and replayed.
 */
export function TableViewProvider({ init, children }: {
  init: TableViewInit
  children: ReactNode
}) {
  const [store] = useState<TableViewStore>(() => createTableViewStore(init))

  return (
    <TableViewContext.Provider value={store}>
      {children}
    </TableViewContext.Provider>
  )
}

/**
 * Subscribes to one slice of the table view.
 *
 * Always select the narrowest value you need — a component that reads `page`
 * should not re-render when `search` changes.
 */
export function useTableView<T>(selector: (state: TableViewState) => T): T {
  const store = useContext(TableViewContext)
  if (!store) {
    throw new Error('useTableView must be used within a <TableViewProvider>.')
  }
  return useStore(store, selector)
}
