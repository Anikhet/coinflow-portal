import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { CalendarDays } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Calendar } from './calendar'
import { Button } from './button'
import { cn } from '@/lib/cn'
import { formatDateOnly } from '@/lib/format'

/**
 * Period picker for the dashboard.
 *
 * The original showed the range as static text, so the single most common
 * dashboard action — "show me last month instead" — had nowhere to start.
 *
 * Presets sit beside the calendar rather than behind it because they cover
 * nearly every real use: an operator wants "last 7 days" far more often than a
 * specific fortnight in March. The calendar is there for the exception, not as
 * the primary path.
 */

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const

export function DateRangePicker({ value, onChange, className }: {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const applyPreset = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - (days - 1))
    onChange({ from, to })
    setOpen(false)
  }

  const label =
    value?.from && value?.to
      ? `${formatDateOnly(value.from.toISOString())} – ${formatDateOnly(value.to.toISOString())}`
      : 'Select a period'

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="secondary" size="md" className={cn('gap-2', className)}>
          <CalendarDays className="text-ink-faint" />
          <span className="tabular-nums">{label}</span>
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-[60] overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface shadow-xl animate-in-up"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="flex shrink-0 flex-col gap-0.5 border-b border-border p-2 sm:border-b-0 sm:border-r">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.days)}
                  className="rounded-[6px] px-2.5 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              // A range that has not been completed yet should not close the
              // popover — the second click is still to come.
              autoFocus
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
