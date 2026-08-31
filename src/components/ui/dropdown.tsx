import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export const Dropdown = DropdownPrimitive.Root
export const DropdownTrigger = DropdownPrimitive.Trigger

/**
 * Menus align to their trigger's LEADING edge by default. Radix centres them,
 * which left every filter menu floating a few pixels off its own button — the
 * menu and the control it belongs to have no shared edge to read them as one
 * object. Callers can still override for a menu whose trigger sits at the right
 * of the viewport.
 */
export function DropdownContent({ className, align = 'start', ...props }: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={6}
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

export function DropdownItem({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-2 py-1.5',
        'text-base text-ink outline-none transition-colors',
        'data-[highlighted]:bg-surface-hover [&_svg]:size-3.5 [&_svg]:text-ink-faint',
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
