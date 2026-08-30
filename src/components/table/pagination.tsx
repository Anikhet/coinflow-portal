import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Pagination({ page, pageSize, total, onPageChange }: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
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
          disabled={page <= 1} onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 text-[12px] tabular-nums text-ink-muted">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="ghost" size="icon-sm" aria-label="Next page"
          disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
