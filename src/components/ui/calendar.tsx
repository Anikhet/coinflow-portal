import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * Calendar — react-day-picker, styled through the app's tokens rather than
 * react-day-picker's stylesheet, so it inherits the theme (including dark mode)
 * and the declared type scale like every other surface.
 *
 * Used in range mode for the dashboard's period picker. Two months are shown
 * side by side because selecting a range across a month boundary is the common
 * case, and paging back and forth to do it is the usual frustration with these.
 */
export function Calendar({ className, classNames, ...props }: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-3',
        month_caption: 'flex h-7 items-center justify-center',
        caption_label: 'text-sm font-semibold text-ink',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'absolute left-3 top-3 z-10 grid size-7 place-items-center rounded-[6px]',
          'text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink',
        ),
        button_next: cn(
          'absolute right-3 top-3 z-10 grid size-7 place-items-center rounded-[6px]',
          'text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-8 text-xs font-medium text-ink-faint',
        week: 'mt-1 flex w-full',
        day: 'relative size-8 p-0 text-center text-sm',
        day_button: cn(
          'size-8 rounded-[6px] font-normal text-ink transition-colors',
          'hover:bg-surface-hover focus-visible:outline-none',
        ),
        selected: 'bg-brand text-brand-contrast hover:bg-brand hover:text-brand-contrast',
        range_start: 'range-start bg-brand text-brand-contrast rounded-[6px]',
        range_end: 'range-end bg-brand text-brand-contrast rounded-[6px]',
        // Days between the endpoints carry the soft band, so the range reads
        // as one continuous selection rather than two disconnected markers.
        range_middle: 'bg-brand-soft text-ink rounded-none hover:bg-brand-soft',
        today: 'font-semibold text-brand',
        outside: 'text-ink-faint/50',
        disabled: 'text-ink-faint/40',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft className="size-4" />
            : <ChevronRight className="size-4" />,
      }}
      {...props}
    />
  )
}
