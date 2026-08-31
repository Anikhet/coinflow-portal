import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
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
        'text-[13px] text-ink outline-none transition-colors',
        'data-[highlighted]:bg-surface-hover [&_svg]:size-3.5 [&_svg]:text-ink-faint',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownCheckboxItem({ className, ...props }: ComponentProps<typeof DropdownPrimitive.CheckboxItem>) {
  return (
    <DropdownPrimitive.CheckboxItem
      className={cn(
        // Same px-2 as every other row. The tick used to be absolutely placed
        // at the left with pl-7 reserving its lane, which pushed labels 20px in
        // from the menu's own padding and left a conspicuous empty gutter
        // whenever nothing was selected. It now sits at the trailing edge, so
        // rows start where the label starts.
        'flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-2 py-1.5',
        'text-[13px] text-ink outline-none transition-colors',
        'data-[highlighted]:bg-surface-hover',
        className,
      )}
      {...props}
    />
  )
}

export const DropdownItemIndicator = DropdownPrimitive.ItemIndicator

export function DropdownLabel({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn('px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint', className)}
      {...props}
    />
  )
}
