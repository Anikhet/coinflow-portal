import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTableView } from '@/stores/table-view-context'
import { buildPageItems } from '@/lib/pagination'
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
 * Reads `page` from the table view store; `total` and `pageSize` stay props
 * because they describe the fetched result, not the user's view state.
 */
export function Pagination({ pageSize, total }: { pageSize: number; total: number }) {
  const page = useTableView((state) => state.page)
  const setPage = useTableView((state) => state.setPage)

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const items = buildPageItems(page, pageCount)

  // A constant slot COUNT is not enough — a three-digit "128" is wider than a
  // one-digit "5", so the control still resized as you paged. Every slot is
  // therefore sized for the widest page number in the set. Safe with tabular
  // figures, where each digit occupies the same advance width.
  const slotWidth = Math.max(28, 16 + String(pageCount).length * 8)

  return (
    <nav
      aria-label="Pagination"
      className="flex h-11 shrink-0 items-center justify-between gap-4 border-t border-border bg-canvas px-6"
    >
      <p className="shrink-0 text-[12px] tabular-nums text-ink-muted">
        {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </p>

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

        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              // Index is part of the identity here: the two gaps are
              // indistinguishable by value and their position is what
              // distinguishes them.
              key={`gap-${index}`}
              aria-hidden
              style={{ width: slotWidth }}
              className="grid h-7 shrink-0 place-items-center text-[12px] text-ink-faint"
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
                'h-7 shrink-0 rounded-[6px] text-[12px] tabular-nums transition-colors',
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
