import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dropdown, DropdownContent, DropdownLabel, DropdownRadioGroup,
  DropdownRadioItem, DropdownTrigger,
} from '@/components/ui/dropdown'
import { useTableView } from '@/stores/table-view-context'
import { buildPageItems, PAGE_SIZE_OPTIONS, PAGE_SLOT_COUNT } from '@/lib/pagination'
import { cn } from '@/lib/cn'

/**
 * Bottom paginator.
 *
 * Prev/next alone is not navigation when there are a hundred pages — it can
 * only step. Numbered page items make the set traversable and, just as
 * importantly, communicate WHERE you are in it.
 *
 * Slot count is constant (see `buildPageItems`), and each button carries a
 * fixed minimum width with tabular figures, so the control's geometry never
 * changes as you page. A paginator that reflows when "9" becomes "10" slides
 * the Next button out from under the cursor between clicks.
 *
 * Reads `page` and `pageSize` from the table view store — page size is a view
 * preference the operator sets here and the page's fetch reads back, so it
 * belongs in the store rather than travelling down as a prop. `total` stays a
 * prop because it describes the fetched result, not the user's view state.
 */
export function Pagination({ total, loading = false }: {
  total: number
  /**
   * While loading, `total` is 0 — which would render "0–0 of 0" and a single
   * page slot, then snap to seven slots and a three-digit page count when data
   * lands. That is the same reflow the fixed slot sizing exists to prevent, so
   * the loading state renders placeholder slots at the SAME geometry instead.
   */
  loading?: boolean
}) {
  const page = useTableView((state) => state.page)
  const setPage = useTableView((state) => state.setPage)
  const pageSize = useTableView((state) => state.pageSize)
  const setPageSize = useTableView((state) => state.setPageSize)

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const items = buildPageItems(page, pageCount)

  // A constant slot COUNT is not enough — a three-digit "128" is wider than a
  // one-digit "5", so the control still resized as you paged. Every slot is
  // therefore sized for the widest page number in the set. Safe with tabular
  // figures, where each digit occupies the same advance width.
  const slotWidth = Math.max(28, 16 + String(loading ? 100 : pageCount).length * 8)

  return (
    <nav
      aria-label="Pagination"
      className="flex h-10 shrink-0 items-center justify-between gap-4 border-t border-border bg-surface px-4"
    >
      <div className="flex shrink-0 items-center gap-3">
        {/* The size control sits beside the range it governs — "25 rows" next
            to "1–25 of 4,812" makes the relationship legible without a label
            explaining it. It stays mounted while loading (its value is view
            state, not fetched data) so the row's geometry never changes. */}
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={`Rows per page: ${pageSize}`}>
              <span className="tabular-nums">{pageSize}</span>
              rows
              <ChevronsUpDown className="text-ink-faint" />
            </Button>
          </DropdownTrigger>
          <DropdownContent align="start" side="top" className="w-40">
            <DropdownLabel>Rows per page</DropdownLabel>
            <DropdownRadioGroup
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <DropdownRadioItem key={size} value={String(size)}>
                  <span className="tabular-nums">{size}</span>
                </DropdownRadioItem>
              ))}
            </DropdownRadioGroup>
          </DropdownContent>
        </Dropdown>

        {loading ? (
          <Skeleton className="h-3 w-28" />
        ) : (
          <p className="text-sm tabular-nums text-ink-muted">
            {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft />
        </Button>

        {loading
          ? Array.from({ length: PAGE_SLOT_COUNT }).map((_, index) => (
              <Skeleton
                key={`slot-${index}`}
                style={{ width: slotWidth }}
                className="h-7 rounded-[6px]"
              />
            ))
          : items.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              // Index is part of the identity here: the two gaps are
              // indistinguishable by value and their position is what
              // distinguishes them.
              key={`gap-${index}`}
              aria-hidden
              style={{ width: slotWidth }}
              className="grid h-7 shrink-0 place-items-center text-sm text-ink-faint"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => setPage(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              style={{ width: slotWidth }}
              className={cn(
                'h-7 shrink-0 rounded-[6px] text-sm tabular-nums transition-colors',
                item === page
                  ? 'bg-brand text-brand-contrast font-medium'
                  : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
              )}
            >
              {item}
            </button>
            ),
            )}

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
