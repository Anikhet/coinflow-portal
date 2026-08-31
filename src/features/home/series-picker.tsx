import { ChevronDown } from 'lucide-react'
import type { MethodSeries } from '@/types/analytics'
import { Button } from '@/components/ui/button'
import {
  Dropdown, DropdownCheckboxItem, DropdownContent, DropdownItem,
  DropdownLabel, DropdownTrigger,
} from '@/components/ui/dropdown'
import { TOTAL_KEY, SERIES_SWATCH } from '@/components/charts/series'
import { SeriesGlyph } from '@/components/charts/series-glyph'

/**
 * Chooses which series the chart draws.
 *
 * Replaces click-to-isolate on the legend, which could only ever show ONE
 * method at a time — so the obvious question ("how does Apple Pay compare with
 * Google Pay?") had no answer at all. A multi-select makes comparison the
 * default capability rather than an omission.
 *
 * "Total" is offered as a series in its own right rather than as a separate
 * mode, so there is one mental model: everything in this list is a line you can
 * turn on or off, and the chart is whatever you checked.
 */
export function SeriesPicker({ series, selected, onChange, formatTotal }: {
  series: MethodSeries[]
  selected: string[]
  onChange: (next: string[]) => void
  formatTotal: (value: number) => string
}) {
  const grandTotal = series.reduce((sum, entry) => sum + entry.total, 0)
  const options = [{ key: TOTAL_KEY, label: 'Total', total: grandTotal }, ...series]

  const toggle = (key: string) => {
    const next = selected.includes(key)
      ? selected.filter((item) => item !== key)
      : [...selected, key]
    // Never leave the chart empty — unchecking the last series falls back to
    // the total rather than rendering a blank plot with no obvious way back.
    onChange(next.length === 0 ? [TOTAL_KEY] : next)
  }

  const label =
    selected.length === 1
      ? options.find((option) => option.key === selected[0])?.label ?? 'Series'
      : `${selected.length} series`

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="secondary" size="sm">
          {label}
          <ChevronDown className="text-ink-faint" />
        </Button>
      </DropdownTrigger>

      <DropdownContent align="end" className="min-w-[240px]">
        <DropdownLabel>Show on chart</DropdownLabel>

        {options.map((option, index) => (
          <DropdownCheckboxItem
            key={option.key}
            checked={selected.includes(option.key)}
            onCheckedChange={() => toggle(option.key)}
            // Keep the menu open: choosing what to compare usually takes
            // several clicks, and closing after each one makes that tedious.
            onSelect={(event) => event.preventDefault()}
          >
            {/* Swatch AND mark: the swatch ties the row to its band in the
                plot, the mark identifies the rail at a glance. Neither
                substitutes for the other — a logo says nothing about which
                colour the band is. */}
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: SERIES_SWATCH(option.key, index - 1) }}
            />
            <SeriesGlyph seriesKey={option.key} />
            <span className="flex-1 truncate">{option.label}</span>
            <span className="shrink-0 tabular-nums text-xs text-ink-faint">
              {formatTotal(option.total)}
            </span>
          </DropdownCheckboxItem>
        ))}

        <div className="mt-1 border-t border-border pt-1">
          <DropdownItem onSelect={() => onChange([TOTAL_KEY])}>Reset to total</DropdownItem>
          <DropdownItem onSelect={() => onChange(series.map((entry) => entry.key))}>
            Select all methods
          </DropdownItem>
        </div>
      </DropdownContent>
    </Dropdown>
  )
}
