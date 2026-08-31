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
          'z-[60] min-w-[200px] overflow-hidden rounded-[var(--radius-surface)] border border-border',
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

export const DropdownItemIndicator = DropdownPrimitive.ItemIndicator

export function DropdownLabel({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn('px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint', className)}
      {...props}
    />
  )
}
