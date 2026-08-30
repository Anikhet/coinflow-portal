import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends ComponentProps<'input'> {
  icon?: ReactNode
  /** Rendered at the trailing edge — e.g. a ⌘K hint or a clear button. */
  trailing?: ReactNode
}

export function Input({ className, icon, trailing, ...props }: InputProps) {
  return (
    <div
      className={cn(
        'flex h-8 items-center gap-2 rounded-[var(--radius-control)] bg-surface px-2.5',
        'ring-1 ring-inset ring-border transition-shadow',
        'focus-within:ring-2 focus-within:ring-brand',
        className,
      )}
    >
      {icon && <span className="shrink-0 text-ink-faint [&_svg]:size-3.5">{icon}</span>}
      <input
        className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint"
        {...props}
      />
      {trailing && <span className="shrink-0">{trailing}</span>}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface-sunk px-1 py-0.5 font-sans text-[10px] font-medium text-ink-faint">
      {children}
    </kbd>
  )
}
