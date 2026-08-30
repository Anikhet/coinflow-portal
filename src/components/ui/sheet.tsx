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
 * Enter/exit animates transform + opacity only, never width, so opening the
 * drawer cannot reflow the table behind it.
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
            'fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=open]:fade-in',
          )}
          style={{ animation: 'ledger-in 0.2s ease-out' }}
        />
        <Dialog.Content
          aria-label={label}
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex flex-col bg-surface shadow-2xl',
            'border-l border-border outline-none',
            size === 'lg' ? 'w-full max-w-[680px]' : 'w-full max-w-[600px]',
          )}
          style={{ animation: 'sheet-slide 0.28s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const SheetTitle = Dialog.Title
export const SheetDescription = Dialog.Description
export const SheetClose = Dialog.Close
