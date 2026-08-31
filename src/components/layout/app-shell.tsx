import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)

  return (
    <div className="h-screen overflow-hidden bg-canvas">
      <Sidebar />
      {/*
        The shell is pinned to the VIEWPORT height, not min-height.
        
        With `min-h-screen` the document itself scrolled, so a table's
        `overflow-auto` never engaged: there was no scroll container for the
        sticky header to stick inside, and the paginator sat ~900px below the
        fold. Constraining the shell makes each page's own body the scrolling
        region, which is what an operations console wants — the page header,
        toolbar and paginator stay put, and only the rows move.
      */}
      <main
        className={cn(
          'flex h-screen flex-col overflow-hidden transition-[padding] duration-200 ease-out',
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
    <header className="z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-canvas px-8">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        {description && <p className="truncate text-sm leading-tight text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
