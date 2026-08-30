import { Check, Columns3, Download, Filter, Rows3, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { VisibilityState, Column } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pill } from '@/components/ui/pill'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Dropdown, DropdownCheckboxItem, DropdownContent, DropdownItemIndicator,
  DropdownLabel, DropdownTrigger,
} from '@/components/ui/dropdown'
import { useUiStore } from '@/stores/ui-store'
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

export interface FilterOption {
  value: string
  label: string
  icon?: ReactNode
}

export interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

interface TableToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterGroup[]
  columns?: Column<never, unknown>[]
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  resultCount?: number
  totalCount?: number
  extra?: ReactNode
}

export function TableToolbar({
  search, onSearchChange, searchPlaceholder = 'Search…',
  filters = [], columns = [], columnVisibility = {}, onColumnVisibilityChange,
  resultCount, totalCount, extra,
}: TableToolbarProps) {
  const density = useUiStore((state) => state.density)
  const setDensity = useUiStore((state) => state.setDensity)

  const activeFilters = filters.flatMap((group) =>
    group.selected.map((value) => ({
      group,
      value,
      label: group.options.find((option) => option.value === value)?.label ?? value,
    })),
  )

  const hasActiveFilters = activeFilters.length > 0 || search.length > 0

  const clearAll = () => {
    onSearchChange('')
    filters.forEach((group) => group.onChange([]))
  }

  return (
    <div className="shrink-0 border-b border-border bg-canvas px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          icon={<Search />}
          className="w-[260px]"
          trailing={
            search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="grid size-4 place-items-center rounded text-ink-faint hover:text-ink"
              >
                <X className="size-3" />
              </button>
            ) : undefined
          }
        />

        {filters.map((group) => (
          <Dropdown key={group.id}>
            <DropdownTrigger asChild>
              <Button variant="secondary" size="md">
                <Filter />
                {group.label}
                {group.selected.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-brand-soft px-1.5 text-[10px] font-semibold tabular-nums text-brand">
                    {group.selected.length}
                  </span>
                )}
              </Button>
            </DropdownTrigger>
            <DropdownContent align="start" className="max-h-[320px] overflow-y-auto">
              <DropdownLabel>{group.label}</DropdownLabel>
              {group.options.map((option) => {
                const checked = group.selected.includes(option.value)
                return (
                  <DropdownCheckboxItem
                    key={option.value}
                    checked={checked}
                    onCheckedChange={(next) =>
                      group.onChange(
                        next
                          ? [...group.selected, option.value]
                          : group.selected.filter((value) => value !== option.value),
                      )
                    }
                    onSelect={(event) => event.preventDefault()}
                  >
                    <DropdownItemIndicator className="absolute left-2">
                      <Check className="size-3.5 text-brand" />
                    </DropdownItemIndicator>
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </DropdownCheckboxItem>
                )
              })}
            </DropdownContent>
          </Dropdown>
        ))}

        {extra}

        <div className="ml-auto flex items-center gap-2">
          {resultCount != null && (
            <span className="text-[12px] tabular-nums text-ink-muted">
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

          {columns.length > 0 && onColumnVisibilityChange && (
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
                  const label = column.columnDef.meta?.label ?? column.id
                  const visible = columnVisibility[column.id] !== false
                  return (
                    <DropdownCheckboxItem
                      key={column.id}
                      checked={visible}
                      onCheckedChange={(next) =>
                        onColumnVisibilityChange({ ...columnVisibility, [column.id]: Boolean(next) })
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      <DropdownItemIndicator className="absolute left-2">
                        <Check className="size-3.5 text-brand" />
                      </DropdownItemIndicator>
                      <span className="truncate capitalize">{label}</span>
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
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {search && (
            <Pill tone="neutral" variant="ghost">
              <span className="text-ink-faint">search</span>
              <span className="text-ink">{search}</span>
              <button type="button" onClick={() => onSearchChange('')} aria-label="Clear search filter">
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
                onClick={() => group.onChange(group.selected.filter((item) => item !== value))}
              >
                <X className="size-3 text-ink-faint hover:text-ink" />
              </button>
            </Pill>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className={cn('ml-1 text-[12px] font-medium text-brand hover:underline')}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
