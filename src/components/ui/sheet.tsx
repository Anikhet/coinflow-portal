import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Right-side drawer used for both the payment and customer detail views.
 *
 * Both surfaces share this shell deliberately. The original app used two
 * different drawer models — one scroll-forever with duplicated actions, one
 * tabbed with record paging — which forced operators to learn the product
 * twice. One shell, one mental model.
 *
 * Enter and exit both animate (see `.sheet-panel` in index.css): the panel
 * slides its full width in and back out, so it reads as a surface arriving from
 * and returning to the edge rather than one that blinks out of existence when
 * dismissed. Transform and opacity only, never width, so the table behind it
 * never reflows.
 */

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  /** Wider for records with tabular sub-content (customers). */
  size?: 'md' | 'lg'
  label: string
}

export function Sheet({ open, onOpenChange, children, size = 'md', label }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'sheet-overlay fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]',
          )}
        />
        <Dialog.Content
          aria-label={label}
          className={cn(
            'sheet-panel fixed inset-y-0 right-0 z-50 flex flex-col bg-surface shadow-2xl',
            'border-l border-border outline-none',
            size === 'lg' ? 'w-full max-w-[680px]' : 'w-full max-w-[600px]',
          )}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const SheetTitle = Dialog.Title
export const SheetClose = Dialog.Close
