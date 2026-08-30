import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <main
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200 ease-out',
          collapsed ? 'pl-[60px]' : 'pl-[232px]',
        )}
      >
        {children}
      </main>
    </div>
  )
}

/**
 * Page header. Height is fixed so the sticky table header below it can be
 * offset by a constant, and so switching pages never nudges content vertically.
 */
export function PageHeader({ title, description, actions }: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-canvas/85 px-6 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        {description && <p className="truncate text-[12px] leading-tight text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
