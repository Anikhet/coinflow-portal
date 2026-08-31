import {
  flexRender, getCoreRowModel, useReactTable, type ColumnDef,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { useUiStore, ROW_HEIGHT } from '@/stores/ui-store'
import { useTableView } from '@/stores/table-view-context'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
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

/**
 * Right-hand edge for the pinned column while scrolled. A hairline plus a short
 * soft shadow — enough to separate the layers without drawing a hard rule that
 * would compete with the row borders.
 */
const PINNED_EDGE =
  'after:absolute after:inset-y-0 after:-right-px after:w-px after:bg-border ' +
  'after:shadow-[6px_0_8px_-6px_rgba(0,0,0,0.18)]'

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  loading?: boolean
  /**
   * Rows to render while loading. MUST equal the page size — a skeleton that
   * is shorter than the page it stands in for means the table grows the moment
   * data arrives, which is the single largest layout shift in the app.
   */
  skeletonRows: number
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
  data, columns, loading = false, skeletonRows,
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

  // A frozen column with no edge reads as text overlapping text. The divider
  // appears only once the table is actually scrolled, so an unscrolled table
  // carries no gratuitous seam. Tracked in state (not CSS) because there is no
  // scroll-position selector.
  const [isScrolled, setIsScrolled] = useState(false)

  const visibleColumns = table.getVisibleLeafColumns()
  const showEmpty = !loading && data.length === 0

  // Sum of the declared column widths. Used as the table's min-width so columns
  // hold their intended size and the container scrolls, rather than every
  // column shrinking until its content is clipped.
  const minTableWidth = visibleColumns.reduce((total, column) => total + column.getSize(), 0)

  return (
    <div
      // flex-col so the empty block below the table can claim the leftover
      // height as a flex item. As a plain block it could only be sized by a
      // fixed min-height, which is why the empty state used to sit as a small
      // card marooned in the middle of a tall white void.
      className="relative flex flex-1 flex-col overflow-auto"
      onScroll={(event) => {
        const scrolled = event.currentTarget.scrollLeft > 0
        // Guard the write so a vertical scroll does not re-render every row.
        if (scrolled !== isScrolled) setIsScrolled(scrolled)
      }}
    >
      <table
        style={{ minWidth: minTableWidth }}
        // shrink-0: as a flex item the table would otherwise compress
        // vertically to make room for the empty block's flex-1.
        className="w-full shrink-0 border-separate border-spacing-0 text-base"
      >
        {/*
          LAYERING
          The header must outrank the pinned first COLUMN, or the top-left cell
          is contested by two sticky elements at once.

          `z-30` here is load-bearing. Setting a z-index on <thead> creates a
          stacking context, which means the pinned <th>'s own z-index is
          resolved INSIDE that context and cannot compete with the body cells.
          With thead at z-10 and the pinned <td>s also at z-10, the tie broke on
          DOM order and the first data row painted over the header.

          Order is therefore: thead (30) > pinned body cells (10) > normal cells.
        */}
        <thead className="sticky top-0 z-30">
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
                      'group/th relative h-8 border-b border-border bg-surface-sunk px-3 text-left align-middle first:pl-4 last:pr-4',
                      'text-xs font-semibold uppercase tracking-[0.04em] text-ink-faint',
                      // Headers never wrap. A two-line header makes its row
                      // taller than the 36px the header is sized for, so the
                      // sticky offset stops matching and the whole header band
                      // shifts. A label too long for its column truncates
                      // instead; the column menu carries the full name.
                      'overflow-hidden whitespace-nowrap',
                      // Pin the first column across both axes.
                      // Above sibling headers, so the corner cell wins when
                      // both axes are scrolled. Scoped within thead's context.
                      index === 0 && 'sticky left-0 z-20',
                      index === 0 && isScrolled && PINNED_EDGE,
                    )}
                  >
                    {/* Flex row rather than inline siblings: the hint used
                        `align-middle`, which centres against the x-height and
                        so sat visibly low beside an UPPERCASE label. A shared
                        flex baseline puts label, sort arrow and hint on one
                        centre line whatever the casing. */}
                    <span className="flex min-w-0 items-center gap-1">
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(header.column.id)}
                        className={cn(
                          // `uppercase` is repeated here deliberately: a <button>
                          // does not reliably inherit text-transform from its
                          // <th>, which left sortable headers title-cased and
                          // non-sortable ones uppercased in the same row.
                          'group/sort inline-flex min-w-0 max-w-full items-center gap-1 rounded uppercase transition-colors hover:text-ink',
                          isSorted && 'text-brand',
                        )}
                      >
                        <span className="min-w-0 truncate">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {/* Only the ACTIVE arrow sits in the flow. The hover
                            affordance is absolutely placed at the cell's
                            trailing edge, because reserving a slot for it
                            inline wedged 20px between a label and its info
                            hint — so a sortable column's hint floated away
                            from its label while a non-sortable one's sat
                            snug. Out of flow, it still costs no layout shift. */}
                        {isSorted && (
                          sortDir === 'asc'
                            ? <ArrowUp className="size-3 shrink-0" />
                            : <ArrowDown className="size-3 shrink-0" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                    {meta?.term && (
                      <InfoHint
                        term={meta.term}
                        label={meta.label ?? header.column.id}
                        side="bottom"
                      />
                    )}
                    </span>
                    {canSort && !isSorted && (
                      <ChevronsUpDown
                        aria-hidden
                        className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 opacity-0 transition-opacity group-hover/th:opacity-50"
                      />
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
                      'border-b border-border bg-surface px-3 first:pl-4 last:pr-4',
                      columnIndex === 0 && 'sticky left-0 z-10',
                      columnIndex === 0 && isScrolled && PINNED_EDGE,
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
                          'max-w-0 truncate border-b border-border px-3 align-middle text-ink transition-colors first:pl-4 last:pr-4',
                              meta?.mono && 'font-mono text-sm',
                          cellIndex === 0 && 'sticky left-0 z-10',
                          cellIndex === 0 && isScrolled && PINNED_EDGE,
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
        /* The empty state takes the whole region the rows would have occupied:
           `flex-1` claims every remaining pixel below the header, inset by the
           same 16px gutter every other band of chrome uses.

           The min-height is still declared as a FLOOR. When the table sits in a
           short container there is no leftover height for flex-1 to hand out,
           and without it the message would collapse against the header — so
           this reserves roughly the height a full page of rows would occupy
           (capped, so a tall page size cannot strand the message off-screen).
           Between the two, nothing below the table moves when the result set
           flips between empty and populated. */
        <div
          className="flex flex-1 p-4"
          style={{ minHeight: Math.min(skeletonRows * rowHeight, 420) }}
        >
          {empty}
        </div>
      )}
    </div>
  )
}
