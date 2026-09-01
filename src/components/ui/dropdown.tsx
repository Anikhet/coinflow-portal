import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { useScrollFade } from '@/hooks/use-scroll-fade'
import { TONE_GLYPH } from '@/lib/tone-classes'
import type { Tone } from '@/types'

export const Dropdown = DropdownPrimitive.Root
export const DropdownTrigger = DropdownPrimitive.Trigger

/**
 * Menus align to their trigger's LEADING edge by default. Radix centres them,
 * which left every filter menu floating a few pixels off its own button — the
 * menu and the control it belongs to have no shared edge to read them as one
 * object. Callers can still override for a menu whose trigger sits at the right
 * of the viewport.
 */
export function DropdownContent({ className, align = 'start', onScroll, ...props }: ComponentProps<typeof DropdownPrimitive.Content>) {
  // A menu long enough to scroll shows its bar only while it is moving, so a
  // resting panel is not framed by a permanent grey rail. See use-scroll-fade.
  const scrollFade = useScrollFade<HTMLDivElement>()

  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={6}
        ref={scrollFade.ref}
        onScroll={(event) => {
          scrollFade.onScroll()
          onScroll?.(event)
        }}
        className={cn(
          // ONE size for every menu in the app. Width was previously decided
          // per call site — 200px here, 232px there, 240px somewhere else — so
          // opening two menus from the same toolbar produced two different
          // panels for no reason the user could see. A fixed width also stops
          // a menu resizing as its longest label changes with the data.
          //
          // 240px fits the longest option this app has ("Chargeback analytics"
          // plus a 20px mark and a checkmark) without wrapping.
          //
          // The height is deliberate arithmetic, not a round number: a row is
          // 32px (13px text on py-1.5) and the panel has 8px of padding, so
          // 344px = 8 + ten full rows + half of the eleventh. Ending on a half
          // row is the cue that there is more below — a menu cut exactly at a
          // row boundary looks complete, and people stop scrolling.
          // --scroll-track matches the thumb's inset border to the panel, not
          // to the canvas behind it.
          'scroll-fade [--scroll-track:var(--surface)]',
          'z-[60] max-h-[344px] w-60 overflow-y-auto overscroll-contain',
          'rounded-[var(--radius-surface)] border border-border',
          'bg-surface p-1 shadow-xl animate-in-up',
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  )
}

/**
 * A menu row.
 *
 * `tone` colours the row's glyph through the same five-tone set the pills and
 * the filter menu use. An action that BLOCKS someone and an action that exports
 * a CSV are not peers, and rendering both marks in ink-faint made the menu a
 * flat list where the consequential row had to be found by reading.
 *
 * Deliberately opt-in, and deliberately not the default: colour in this app
 * means a semantic state, so spending it on every row would spend it on
 * nothing. Rows without a real consequence stay `neutral` — that restraint is
 * what leaves the red row legible.
 */
export function DropdownItem({ className, tone = 'neutral', ...props }: ComponentProps<typeof DropdownPrimitive.Item> & {
  tone?: Tone
}) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-2 py-1.5',
        'text-base text-ink outline-none transition-colors',
        'data-[highlighted]:bg-surface-hover [&_svg]:size-3.5',
        TONE_GLYPH[tone],
        className,
      )}
      {...props}
    />
  )
}

/**
 * Multi-select row with a real checkbox.
 *
 * shadcn's own CheckboxItem reserves a `pl-8` lane and drops a bare tick into
 * it. That is fine for a menu where checked items are the exception, but this
 * app uses these for genuine multi-select — filter groups, chart series — where
 * the reader needs to see the UNCHECKED state as an affordance, not as an empty
 * gutter. A bare tick also collided with the colour swatches the series picker
 * puts in the same row.
 *
 * So the box is drawn by the component rather than by each call site: one
 * checkbox anatomy everywhere, and no caller has to remember to pass an
 * indicator. Keeps shadcn's `pl-8` lane so the geometry matches its menus.
 */
export function DropdownCheckboxItem({ className, children, ...props }: ComponentProps<typeof DropdownPrimitive.CheckboxItem>) {
  return (
    <DropdownPrimitive.CheckboxItem
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-[6px] py-1.5 pl-8 pr-2',
        'text-base text-ink outline-none transition-colors',
        'data-[highlighted]:bg-surface-hover',
        // The box fills from the ROW's checked state, so the empty box and the
        // filled box are the same element and cannot drift apart.
        '[&[data-state=checked]_[data-checkbox]]:border-brand',
        '[&[data-state=checked]_[data-checkbox]]:bg-brand',
        className,
      )}
      {...props}
    >
      <span
        data-checkbox
        aria-hidden
        className={cn(
          'absolute left-2 grid size-4 shrink-0 place-items-center rounded-[4px]',
          'border border-border-strong bg-surface transition-colors',
        )}
      >
        <DropdownPrimitive.ItemIndicator>
          <Check className="size-3 text-brand-contrast" strokeWidth={3} />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.CheckboxItem>
  )
}

/**
 * Footer band for a menu's ACTIONS, below its options.
 *
 * A rule, not a gap, separates them. In a multi-select menu every row above is
 * a thing you toggle; "Reset to total" is an operation on the whole set, and
 * without the rule it reads as an eleventh series you could check.
 *
 * Every row inside this band carries a leading icon — see DropdownItem. The
 * options above are identified by their own marks (a brand logo, an avatar, a
 * colour swatch), so an action rendered as bare text is the one row in the menu
 * with an empty leading slot, and reads as an unfinished list item rather than
 * as a command.
 */
export function DropdownFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-1 border-t border-border pt-1', className)} {...props} />
}

export function DropdownLabel({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn('px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint', className)}
      {...props}
    />
  )
}

/**
 * Single-select rows. Radix's radio group gives roving focus and the correct
 * `menuitemradio` semantics, which a list of plain items with a tick drawn on
 * the selected one does not — a screen reader would announce four unrelated
 * commands instead of one choice with four states.
 *
 * Drawn with a trailing check rather than the checkbox lane above: a checkbox
 * says "any number of these", a check on exactly one row says "one of these".
 */
export const DropdownRadioGroup = DropdownPrimitive.RadioGroup

export function DropdownRadioItem({ className, children, ...props }: ComponentProps<typeof DropdownPrimitive.RadioItem>) {
  return (
    <DropdownPrimitive.RadioItem
      className={cn(
        'flex cursor-pointer select-none items-center justify-between gap-2 rounded-[6px] px-2 py-1.5',
        'text-base text-ink outline-none transition-colors',
        'data-[highlighted]:bg-surface-hover',
        className,
      )}
      {...props}
    >
      {children}
      <DropdownPrimitive.ItemIndicator>
        <Check className="size-3.5 text-brand" strokeWidth={3} />
      </DropdownPrimitive.ItemIndicator>
    </DropdownPrimitive.RadioItem>
  )
}
