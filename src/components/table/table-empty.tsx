import { useMemo } from 'react'
import { FilterX, RotateCw, SearchX, TriangleAlert, type LucideIcon } from 'lucide-react'
import { EmptyState } from './empty-state'
import { Button } from '@/components/ui/button'
import { useTableView } from '@/stores/table-view-context'
import { describeCriteria } from '@/lib/criteria'

/**
 * TABLE EMPTY
 * =============================================================================
 * Decides WHICH empty state a table should show. Three distinct situations look
 * identical to a naive implementation ("no rows") but need different copy and
 * different actions:
 *
 *   1. FAILED     — the request errored. Nothing is missing; we simply do not
 *                   know. Showing "no results" here is a lie that sends the
 *                   user hunting through filters for a problem on our side.
 *                   Action: retry.
 *   2. NO RESULTS — the dataset has rows, the current search/filters exclude
 *                   them all. The user caused this and can undo it, so we echo
 *                   back exactly what is applied and offer to clear it.
 *   3. NO DATA    — the scope genuinely holds nothing. "Clear filters" would be
 *                   a dead button, so it is not rendered; the copy explains
 *                   when rows will appear instead.
 *
 * It reads search/filter/toggle state from the table-view store rather than
 * receiving it as props: the page above does not use those values for its own
 * rendering, and threading them down would make it a message bus.
 */
export interface TableEmptyProps {
  /** Plural noun for the rows, lowercase — "payments", "customers". */
  entity: string
  /** Icon for the no-data case; the filtered and error cases have their own. */
  icon: LucideIcon
  /** Unfiltered row count for the scope. Distinguishes "no results" from "no data". */
  totalCount: number
  error?: Error | null
  onRetry?: () => void
}

export function TableEmpty({ entity, icon, totalCount, error, onRetry }: TableEmptyProps) {
  const search = useTableView((state) => state.search)
  const filters = useTableView((state) => state.filters)
  const toggles = useTableView((state) => state.toggles)
  const clearFilters = useTableView((state) => state.clearFilters)

  // Built as a memo rather than a store selector: a selector returning a fresh
  // array would change identity on every store read and re-render endlessly.
  const criteria = useMemo(() => describeCriteria(search, filters, toggles), [search, filters, toggles])

  if (error) {
    return (
      <EmptyState
        icon={TriangleAlert}
        tone="critical"
        title={`Could not load ${entity}`}
        description="The request failed before any rows came back. This is not an empty result — your filters are untouched."
        action={
          onRetry && (
            <Button variant="primary" size="md" onClick={onRetry}>
              <RotateCw />
              Try again
            </Button>
          )
        }
      />
    )
  }

  if (criteria.length > 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No ${entity} match these filters`}
        description={`All ${totalCount.toLocaleString()} ${entity} in this scope were excluded. Remove a condition to widen the search.`}
        detail={<CriteriaList criteria={criteria} />}
        action={
          <Button variant="primary" size="md" onClick={clearFilters}>
            <FilterX />
            Clear all filters
          </Button>
        }
      />
    )
  }

  return (
    <EmptyState
      icon={icon}
      title={`No ${entity} yet`}
      description={`Nothing has been recorded in this scope. New ${entity} appear here as soon as they are processed.`}
    />
  )
}

/** Echoes the applied conditions back so the emptiness is explainable, not mysterious. */
function CriteriaList({ criteria }: { criteria: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {criteria.map((label) => (
        <li
          key={label}
          className="rounded-[var(--radius-control)] bg-surface-sunk px-2 py-0.5 text-[12px] text-ink-muted ring-1 ring-inset ring-border"
        >
          {label}
        </li>
      ))}
    </ul>
  )
}
