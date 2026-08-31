import { Columns3, Download, Filter, Rows3, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pill } from '@/components/ui/pill'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Dropdown, DropdownCheckboxItem, DropdownContent,
  DropdownLabel, DropdownTrigger,
} from '@/components/ui/dropdown'
import { useUiStore } from '@/stores/ui-store'
import { useTableView } from '@/stores/table-view-context'
import { cn } from '@/lib/cn'

/**
 * Shared toolbar for every table.
 *
 * The original mixed native `<input type="date">` controls with custom
 * components, so the toolbar had two visual languages and inconsistent heights.
 * Everything here is a single 32px control on one baseline.
 *
 * Active filters render as removable pills beneath the controls rather than
 * being hidden inside dropdowns. Filter state that you cannot see is filter
 * state you forget you applied — the most common cause of "the data is wrong"
 * support tickets on tables like this.
 */

/**
 * One entry in the column-visibility menu. A plain {id,label} pair rather than a
 * TanStack `Column` instance: the toolbar has no business reaching into table
 * internals, and the previous `as never` cast at the call site was hiding a
 * genuine type error (ColumnDef has no `.columnDef` property).
 */
export interface ColumnOption {
  id: string
  label: string
}

export interface FilterOption {
  value: string
  label: string
  icon?: ReactNode
}

/**
 * A filter group declares only its identity and its options. The SELECTED
 * values live in the table view store, so the page never has to hold or forward
 * them.
 */
export interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
}

interface TableToolbarProps {
  searchPlaceholder?: string
  filters?: FilterGroup[]
  columns?: ColumnOption[]
  resultCount?: number
  totalCount?: number
  extra?: ReactNode
}

export function TableToolbar({
  searchPlaceholder = 'Search…',
  filters = [], columns = [],
  resultCount, totalCount, extra,
}: TableToolbarProps) {
  const density = useUiStore((state) => state.density)
  const setDensity = useUiStore((state) => state.setDensity)

  const search = useTableView((state) => state.search)
  const setSearch = useTableView((state) => state.setSearch)
  const selectedFilters = useTableView((state) => state.filters)
  const setFilter = useTableView((state) => state.setFilter)
  const clearFilters = useTableView((state) => state.clearFilters)
  const columnVisibility = useTableView((state) => state.columnVisibility)
  const setColumnVisibility = useTableView((state) => state.setColumnVisibility)

  // Resolve labels through a Map rather than a .find() per selected value:
  // with several groups of many options the nested scan is quadratic, and it
  // runs on every keystroke because the toolbar re-renders with the search box.
  const activeFilters = filters.flatMap((group) => {
    const selected = selectedFilters[group.id] ?? []
    if (selected.length === 0) return []
    const labels = new Map(group.options.map((option) => [option.value, option.label]))
    return selected.map((value) => ({ group, value, label: labels.get(value) ?? value }))
  })

  const hasActiveFilters = activeFilters.length > 0 || search.length > 0

  return (
    <div className="shrink-0 border-b border-border bg-canvas px-4 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          icon={<Search />}
          className="min-w-[220px] max-w-[520px] flex-1"
          trailing={
            search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="grid size-4 place-items-center rounded text-ink-faint hover:text-ink"
              >
                <X className="size-3" />
              </button>
            ) : undefined
          }
        />

        {filters.map((group) => {
          const selected = selectedFilters[group.id] ?? []
          // Set membership rather than Array.includes inside the options map:
          // the dropdown re-renders on every toggle, and a long filter list
          // would otherwise scan the selection once per option.
          const selectedSet = new Set(selected)
          return (
          <Dropdown key={group.id}>
            <DropdownTrigger asChild>
              <Button variant="secondary" size="md">
                <Filter />
                {group.label}
                {selected.length > 0 && (
                  <Pill tone="brand" variant="solid" size="sm" className="ml-0.5 rounded-full">
                    {selected.length}
                  </Pill>
                )}
              </Button>
            </DropdownTrigger>
            <DropdownContent className="max-h-[320px] overflow-y-auto">
              <DropdownLabel>{group.label}</DropdownLabel>
              {group.options.map((option) => {
                const checked = selectedSet.has(option.value)
                return (
                  <DropdownCheckboxItem
                    key={option.value}
                    checked={checked}
                    onCheckedChange={(next) =>
                      setFilter(
                        group.id,
                        next
                          ? [...selected, option.value]
                          : selected.filter((value) => value !== option.value),
                      )
                    }
                    onSelect={(event) => event.preventDefault()}
                  >
                    {/* Fixed 20px slot: status filters supply 14px lucide
                        glyphs while method/processor filters supply 20px brand
                        marks, so without it the labels start at a different x
                        in each menu. */}
                    {option.icon && (
                      <span className="grid size-5 shrink-0 place-items-center">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </DropdownCheckboxItem>
                )
              })}
            </DropdownContent>
          </Dropdown>
          )
        })}

        {extra}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {resultCount != null && (
            <span className="text-sm tabular-nums text-ink-muted">
              {resultCount === totalCount
                ? `${resultCount.toLocaleString()} records`
                : `${resultCount.toLocaleString()} of ${(totalCount ?? 0).toLocaleString()}`}
            </span>
          )}

          <Tooltip content={density === 'compact' ? 'Comfortable rows' : 'Compact rows'}>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Toggle row density"
              onClick={() => setDensity(density === 'compact' ? 'cozy' : 'compact')}
            >
              <Rows3 />
            </Button>
          </Tooltip>

          {columns.length > 0 && (
            <Dropdown>
              <DropdownTrigger asChild>
                <Tooltip content="Columns">
                  <Button variant="secondary" size="icon" aria-label="Choose columns">
                    <Columns3 />
                  </Button>
                </Tooltip>
              </DropdownTrigger>
              <DropdownContent className="max-h-[360px] overflow-y-auto">
                <DropdownLabel>Visible columns</DropdownLabel>
                {columns.map((column) => {
                  const visible = columnVisibility[column.id] !== false
                  return (
                    <DropdownCheckboxItem
                      key={column.id}
                      checked={visible}
                      onCheckedChange={(next) =>
                        setColumnVisibility({ ...columnVisibility, [column.id]: Boolean(next) })
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      <span className="truncate">{column.label}</span>
                    </DropdownCheckboxItem>
                  )
                })}
              </DropdownContent>
            </Dropdown>
          )}

          <Tooltip content="Export CSV">
            <Button variant="secondary" size="icon" aria-label="Export CSV">
              <Download />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Active filter pills. Reserved space is not needed — this row appears
          below the controls and pushes nothing above it. */}
      {hasActiveFilters && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {search && (
            <Pill tone="neutral" variant="ghost">
              <span className="text-ink-faint">search</span>
              <span className="text-ink">{search}</span>
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search filter">
                <X className="size-3 text-ink-faint hover:text-ink" />
              </button>
            </Pill>
          )}
          {activeFilters.map(({ group, value, label }) => (
            <Pill key={`${group.id}-${value}`} tone="neutral" variant="ghost">
              <span className="text-ink-faint">{group.label.toLowerCase()}</span>
              <span className="text-ink">{label}</span>
              <button
                type="button"
                aria-label={`Remove ${label} filter`}
                onClick={() =>
                  setFilter(group.id, (selectedFilters[group.id] ?? []).filter((item) => item !== value))
                }
              >
                <X className="size-3 text-ink-faint hover:text-ink" />
              </button>
            </Pill>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className={cn('ml-1 text-sm font-medium text-brand hover:underline')}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
