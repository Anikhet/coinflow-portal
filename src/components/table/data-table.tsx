import {
  flexRender, getCoreRowModel, useReactTable, type ColumnDef,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useUiStore, ROW_HEIGHT } from '@/stores/ui-store'
import { useTableView } from '@/stores/table-view-context'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

/**
 * DATA TABLE
 * =============================================================================
 * The core surface of the product. Design decisions, and why:
 *
 * STICKY HEADER + FROZEN FIRST COLUMN
 *   These tables scroll in both axes. Without a frozen leading column, scrolling
 *   right to read a status detaches the value from the record it belongs to —
 *   the operator loses their place. The first column is pinned via
 *   position:sticky with an explicit z-index and an opaque background, plus a
 *   hairline right edge that only appears once scrolled so it does not add a
 *   permanent visual seam.
 *
 * FIXED ROW HEIGHT
 *   Row height comes from the density token, not from content. A cell whose
 *   content grows (two pills instead of one) must not make its row taller than
 *   its neighbours — ragged rows destroy horizontal scanning and cause layout
 *   shift as async cells resolve. Overflowing cell content truncates.
 *
 * SKELETONS MATCH THE REAL BOX
 *   Loading rows render at the identical height and column widths as loaded
 *   rows, so the transition from skeleton to data shifts nothing.
 *
 * WHOLE-ROW ACTIVATION
 *   Rows are buttons, not links with a chevron column. Clicking anywhere opens
 *   the record; Enter and Space do the same from the keyboard.
 */

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  loading?: boolean
  /** Number of skeleton rows while loading. Should match the page size. */
  skeletonRows?: number
  onRowClick?: (row: T) => void
  activeRowId?: string | null
  getRowId: (row: T) => string
  empty?: ReactNode
}

/**
 * Sort and column-visibility state are read from the table view store, not
 * passed down. They are shared with the toolbar, and threading them through the
 * page would make the page a message bus for state it does not itself use.
 */
export function DataTable<T>({
  data, columns, loading = false, skeletonRows = 12,
  onRowClick, activeRowId, getRowId, empty,
}: DataTableProps<T>) {
  const density = useUiStore((state) => state.density)
  const rowHeight = ROW_HEIGHT[density]

  const sortBy = useTableView((state) => state.sortBy)
  const sortDir = useTableView((state) => state.sortDir)
  const toggleSort = useTableView((state) => state.toggleSort)
  const columnVisibility = useTableView((state) => state.columnVisibility)
  const setColumnVisibility = useTableView((state) => state.setColumnVisibility)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    state: { columnVisibility },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility(typeof updater === 'function' ? updater(columnVisibility) : updater)
    },
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  })

  const visibleColumns = table.getVisibleLeafColumns()
  const showEmpty = !loading && data.length === 0

  return (
    <div className="relative flex-1 overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-[13px]">
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                const canSort = header.column.columnDef.enableSorting !== false
                const isSorted = sortBy === header.column.id
                const meta = header.column.columnDef.meta

                return (
                  <th
                    key={header.id}
                    scope="col"
                    style={{ width: header.getSize() }}
                    className={cn(
                      'h-9 border-b border-border bg-canvas px-3 text-left align-middle',
                      'text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-faint',
                      meta?.align === 'right' && 'text-right',
                      // Pin the first column across both axes.
                      index === 0 && 'sticky left-0 z-20',
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(header.column.id)}
                        className={cn(
                          // `uppercase` is repeated here deliberately: a <button>
                          // does not reliably inherit text-transform from its
                          // <th>, which left sortable headers title-cased and
                          // non-sortable ones uppercased in the same row.
                          'group/sort inline-flex items-center gap-1 rounded uppercase transition-colors hover:text-ink',
                          isSorted && 'text-brand',
                          meta?.align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted ? (
                          sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-0 transition-opacity group-hover/sort:opacity-60" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {loading &&
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`} style={{ height: rowHeight }}>
                {visibleColumns.map((column, columnIndex) => (
                  <td
                    key={column.id}
                    className={cn(
                      'border-b border-border bg-surface px-3',
                      columnIndex === 0 && 'sticky left-0 z-10',
                    )}
                  >
                    <Skeleton
                      className="h-3"
                      // Deterministic pseudo-random widths keep the skeleton
                      // from looking like a uniform grid without re-randomising
                      // on every render.
                      style={{ width: `${45 + ((rowIndex * 7 + columnIndex * 13) % 45)}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}

          {!loading &&
            table.getRowModel().rows.map((row) => {
              const id = getRowId(row.original)
              const isActive = activeRowId === id

              return (
                <tr
                  key={row.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onRowClick(row.original)
                    }
                  }}
                  style={{ height: rowHeight }}
                  className={cn(
                    'group/row transition-colors',
                    onRowClick && 'cursor-pointer',
                    isActive ? '[&>td]:bg-brand-soft' : '[&>td]:bg-surface hover:[&>td]:bg-surface-hover',
                  )}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const meta = cell.column.columnDef.meta
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'max-w-0 truncate border-b border-border px-3 align-middle text-ink transition-colors',
                          meta?.align === 'right' && 'text-right',
                          meta?.mono && 'font-mono text-[12px]',
                          cellIndex === 0 && 'sticky left-0 z-10',
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
        </tbody>
      </table>

      {showEmpty && (
        /* Reserve roughly the height a full page of rows would occupy (capped so
           a tall page size does not strand the message off-screen). The message
           lands where the rows were, and nothing below the table moves when the
           result set flips between empty and populated. */
        <div
          className="flex items-center justify-center p-6"
          style={{ minHeight: Math.min(skeletonRows * rowHeight, 420) }}
        >
          {empty}
        </div>
      )}
    </div>
  )
}
