import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTableView } from '@/stores/table-view-context'

/**
 * Reads `page` from the table view store rather than receiving it as a prop —
 * it is the only consumer of that value, so routing it through the page would
 * be pure drilling. `total` and `pageSize` remain props because they describe
 * the fetched result, not the user's view state.
 */
export function Pagination({ pageSize, total }: { pageSize: number; total: number }) {
  const page = useTableView((state) => state.page)
  const setPage = useTableView((state) => state.setPage)

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-t border-border bg-canvas px-6">
      <p className="text-[12px] tabular-nums text-ink-muted">
        {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="icon-sm" aria-label="Previous page"
          disabled={page <= 1} onClick={() => setPage(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 text-[12px] tabular-nums text-ink-muted">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="ghost" size="icon-sm" aria-label="Next page"
          disabled={page >= pageCount} onClick={() => setPage(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
