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
      // `relative` is load-bearing: both nav buttons are absolutely
      // positioned, and without a positioned ancestor here they resolve
      // against the popover instead — which put the previous-month arrow on
      // top of the preset list beside the calendar.
      className={cn('relative p-3', className)}
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
        // Every selection state paints the CELL and then reaches into the day
        // button for the text colour.
        //
        // react-day-picker applies these classes to the cell, but the number is
        // rendered by the button inside it — and `day_button` sets its own
        // `text-ink`, which beats anything the parent merely passes down by
        // inheritance. That is why selected days rendered as near-black digits
        // on the dark brand fill: the token was right, it just never reached
        // the element doing the painting. Same reason the button's hover fill
        // has to be neutralised — otherwise hovering a selected day covered the
        // brand with `surface-hover`.
        selected: cn(
          'bg-brand rounded-[6px]',
          '[&>button]:text-brand-contrast [&>button:hover]:bg-transparent [&>button:hover]:text-brand-contrast',
        ),
        range_start: cn(
          'range-start bg-brand rounded-[6px]',
          '[&>button]:text-brand-contrast [&>button:hover]:bg-transparent [&>button:hover]:text-brand-contrast',
        ),
        range_end: cn(
          'range-end bg-brand rounded-[6px]',
          '[&>button]:text-brand-contrast [&>button:hover]:bg-transparent [&>button:hover]:text-brand-contrast',
        ),
        // Days between the endpoints carry the soft band, so the range reads
        // as one continuous selection rather than two disconnected markers.
        // Ink stays normal here — the band is a tint, not a fill.
        range_middle: cn(
          'bg-brand-soft rounded-none',
          '[&>button]:text-ink [&>button:hover]:bg-transparent',
        ),
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
