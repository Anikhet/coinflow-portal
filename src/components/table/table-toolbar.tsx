import { Columns3, Download, Rows3, Search, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pill } from '@/components/ui/pill'
import { FilterChip } from './filter-chip'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Dropdown, DropdownCheckboxItem, DropdownContent,
  DropdownLabel, DropdownTrigger,
} from '@/components/ui/dropdown'
import { useUiStore } from '@/stores/ui-store'
import { useTableView } from '@/stores/table-view-context'

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
  /** Plain text. Always required — the active-filter chips read this. */
  label: string
  icon?: ReactNode
  /**
   * Renders in place of the icon+label pair when the facet's values already
   * have a canonical rendering elsewhere in the app.
   *
   * Status is the case that forced it. The menu drew a bare 14px glyph beside
   * grey text while the column it filters draws the same value as a solid
   * tinted pill, so the reader had to map "small green tick" onto "green
   * SETTLED pill" themselves — two appearances for one meaning, which is the
   * failure status-pill.tsx exists to prevent. Handing the row a StatusPill
   * makes the thing you pick identical to the thing you get back.
   *
   * `label` stays required regardless: the chips below the toolbar and the
   * accessible name are text, not pills.
   */
  display?: ReactNode
}

/**
 * A filter group declares only its identity and its options. The SELECTED
 * values live in the table view store, so the page never has to hold or forward
 * them.
 */
export interface FilterGroup {
  id: string
  label: string
  /**
   * The facet's own mark, NOT a funnel.
   *
   * Three adjacent triggers all wearing the same funnel spend the row's entire
   * icon budget restating what their position already says — that these are
   * filters — and leave the reader to tell Status from Method from Processor by
   * reading three labels. An icon that repeats across every sibling carries
   * zero information, which is the same failure the sidebar had when five
   * routes shared a shield.
   *
   * Required, not optional with a funnel fallback: a filter group added later
   * must choose a mark rather than silently rejoining the identical set. Pick
   * for what the facet DEPICTS, following the rule in lib/nav.ts.
   */
  icon: LucideIcon
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

  /**
   * Search and facet filters render as ONE list of chips.
   *
   * They were previously two near-identical JSX blocks that had already
   * drifted — the search chip labelled itself "search" while a facet chip
   * lowercased its group label — so the same control was built twice and
   * looked like two. Normalising them to {field, value, onRemove} here means
   * the chip is described once and rendered once.
   */
  const chips = [
    ...(search
      ? [{ id: 'search', field: 'Search', value: search, onRemove: () => setSearch('') }]
      : []),
    ...activeFilters.map(({ group, value, label }) => ({
      id: `${group.id}-${value}`,
      field: group.label,
      value: label,
      onRemove: () =>
        setFilter(group.id, (selectedFilters[group.id] ?? []).filter((item) => item !== value)),
    })),
  ]

  return (
    <div className="shrink-0 border-b border-border bg-surface px-4 py-2">
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
                <group.icon />
                {group.label}
                {selected.length > 0 && (
                  <Pill tone="brand" variant="solid" size="sm" className="ml-0.5 rounded-full">
                    {selected.length}
                  </Pill>
                )}
              </Button>
            </DropdownTrigger>
            <DropdownContent>
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
                    {option.display ?? (
                      <>
                        {/* Fixed 20px slot: method/processor filters supply
                            20px brand marks and anything narrower would start
                            its label at a different x. */}
                        {option.icon && (
                          <span className="grid size-5 shrink-0 place-items-center">{option.icon}</span>
                        )}
                        <span className="truncate">{option.label}</span>
                      </>
                    )}
                  </DropdownCheckboxItem>
                )
              })}
            </DropdownContent>
          </Dropdown>
          )
        })}

        {extra}

        {/*
          The right cluster, grouped by KIND rather than run together as one
          row of six things.

          A count is a statement about the data; the buttons are controls that
          act on it. They were separated by the same 6px that separated the
          buttons from each other, so the reader had no cue that "260" was not
          a third label belonging to the icons beside it. A hairline rule with
          equal air either side says where reading stops and operating starts —
          the same device the applied-filter row already uses to divide its
          chips from "Clear all".

          The three buttons stay tight against each other, because they ARE one
          set: everything here changes how this table is presented.
        */}
        <div className="ml-auto flex shrink-0 items-center gap-4">
          {resultCount != null && (
            <p className="text-sm tabular-nums text-ink-muted">
              {/* The figure is the message, so it carries the weight and the
                  noun stays quiet — reversing that made the row read as prose
                  and the number had to be hunted for. */}
              <span className="font-medium text-ink">{resultCount.toLocaleString()}</span>
              {totalCount != null && totalCount !== resultCount
                ? ` of ${totalCount.toLocaleString()}`
                : ' records'}
            </p>
          )}

          {resultCount != null && <span aria-hidden className="h-4 w-px bg-border" />}

          <div className="flex items-center gap-1.5">
            {columns.length > 0 && (
              <Dropdown>
                {/* Tooltip OUTSIDE the trigger, not inside it.
                    `DropdownTrigger asChild` hands its props and ref to its
                    child; with Tooltip in that slot they landed on a plain
                    function component that accepts only {content, children,
                    side} and drops the rest, so the open handler never reached
                    the button and this menu could not be opened at all. Nested
                    this way both Radix triggers compose down onto the Button. */}
                <Tooltip content="Columns">
                  <DropdownTrigger asChild>
                    <Button variant="secondary" size="icon" aria-label="Choose columns">
                      <Columns3 />
                    </Button>
                  </DropdownTrigger>
                </Tooltip>
                {/* Aligned to the trigger's RIGHT edge. The default aligns
                    from the left, which for a control this close to the window
                    edge overflowed — so Radix's collision handling shoved the
                    panel flush against the viewport, 0px from the edge, and it
                    read as jammed into the corner. Ending it on the button's
                    own right edge leaves the page margin intact and gives the
                    menu a shared edge with the control it belongs to. */}
                <DropdownContent align="end">
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

            <Tooltip content="Export CSV">
              <Button variant="secondary" size="icon" aria-label="Export CSV">
                <Download />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/*
        The applied-conditions row.

        Flush left on the same 16px rule as the controls above it, separated by
        one 8px module rather than a half step — the row is a distinct band of
        information, not a continuation of the toolbar, and the space is what
        says so. No reserved height is needed: it appears below the controls
        and pushes nothing above it.
      */}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <FilterChip
              key={chip.id}
              field={chip.field}
              value={chip.value}
              onRemove={chip.onRemove}
            />
          ))}
          {/* A rule, not a gap, divides the per-chip removals from the action
              that clears them all. Without it "Clear all" reads as one more
              chip in the sequence rather than as the operation on the set. */}
          <span aria-hidden className="h-3.5 w-px shrink-0 bg-border" />
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-brand hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
