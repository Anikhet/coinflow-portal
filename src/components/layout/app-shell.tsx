import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)

  // The shell ground is WHITE, and the content still floats on it as a card.
  //
  // That combination is the constraint worth naming: a card normally separates
  // itself from its ground by FILL, and here it cannot — both are `surface`.
  // So the separation is carried entirely by EDGE and ELEVATION: the 1px
  // border draws the boundary, and a two-layer shadow (a tight contact shadow
  // plus a wide soft one) lifts the card off the plane. A single flat shadow
  // is not enough on a white ground; it reads as a smudge along the bottom
  // rather than as height.
  //
  // The 8px gutter is what makes this legible — the shadow needs somewhere to
  // fall. It is also what separates the rail from the content, which is why
  // the sidebar carries no right border.
  //
  // The card's own FILL is `surface-sunk`, not white — it is a ground, and the
  // things that hold content sit on it: the white page header, the home page's
  // KPI and chart sections. White sections on a white card had no way to show
  // where one ended and the next began.
  //
  // A table does NOT get inset into a container of its own on that ground. It
  // runs edge to edge and is white throughout — toolbar, rows and paginator —
  // with only its sticky column header tinted. Wrapping it would spend a gutter
  // of grey on every side of the one view whose job is fitting columns on
  // screen, so on a table page the ground shows only below the last row.
  return (
    <div className="h-screen overflow-hidden bg-surface">
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
          'flex h-screen flex-col overflow-hidden p-2 transition-[padding] duration-200 ease-out',
          // Sidebar width + the 8px gutter, so the card's left edge is the
          // same distance from the rail as it is from every other viewport edge.
          collapsed ? 'pl-[68px]' : 'pl-[240px]',
        )}
      >
        {/*
          Content card. `min-h-0` is load-bearing: without it the flex child
          refuses to shrink below its content height and the inner
          `overflow-auto` never engages, which is the same bug the viewport
          pinning above exists to avoid. `overflow-hidden` clips the page
          header and any sticky table header to the rounded corners.
        */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface-sunk shadow-[var(--shadow-card)]">
          {children}
        </div>
      </main>
    </div>
  )
}

/**
 * Page header. Height is fixed so the sticky table header below it can be
 * offset by a constant, and so switching pages never nudges content vertically.
 *
 * The description sits on its own line beneath the title; the header height is
 * fixed either way, so pages with and without one line up. The gutter is the
 * same 16px used by the toolbar, the paginator and the outer table cells, so
 * every band of chrome starts on one vertical rule.
 */
export function PageHeader({ title, description, actions }: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    // White against the card's grey ground, and it takes the card's top
    // corners since it is the first thing in it. The bottom rule keeps the
    // seam crisp where the header meets a white container beneath it.
    <header className="z-20 flex h-16 shrink-0 items-center gap-3 rounded-t-[var(--radius-surface)] border-b border-border bg-surface px-4">
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h1 className="truncate text-lg font-semibold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="truncate text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
