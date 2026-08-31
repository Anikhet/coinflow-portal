import type { ReactNode } from 'react'
import { Skeleton } from './skeleton'

/**
 * DRAWER CHROME
 * =============================================================================
 * Shared geometry for the payment and customer drawers.
 *
 * The header and tab strip are FIXED height rather than content-sized, and both
 * the real drawer and its skeleton reference the same constants here. Two
 * things follow:
 *
 *  1. The skeleton cannot drift from the loaded layout. Previously each drawer
 *     hardcoded its own guess (92px) against a real header that measured 87px
 *     and 82px, and neither skeleton reserved the 41px tab strip at all — so a
 *     tab bar appeared out of nowhere on load and shoved the body down.
 *
 *  2. The two drawers now share one chrome height, which is the point of them
 *     sharing a shell: switching from a payment to a customer should not move
 *     the furniture.
 */

export const DRAWER_HEADER_CLASS =
  'flex h-[104px] shrink-0 items-start gap-3 border-b border-border px-5 py-4'

/**
 * The header's secondary facts, as a label/value grid.
 *
 * Two columns at FIXED widths, not a flex row. Previously the timestamp began
 * wherever the ID happened to end, so its left edge was a function of the
 * record's id length — scrolling through a queue made the second line jitter
 * sideways. Locking the columns gives the eye one vertical edge per field to
 * track down a stack of records.
 *
 * The labels are the other half of the change: an unlabelled mono string and
 * an unlabelled date ask the reader to infer what each one is from its shape.
 * A tracked 12px caption names it outright, and it is the same label/value
 * pairing the Detail rows in the body below already use — so the header stops
 * being a special case and becomes the first row of the record.
 */
export function HeaderFields({ children }: { children: ReactNode }) {
  return (
    <div className="group/row mt-2.5 grid grid-cols-[minmax(0,190px)_minmax(0,1fr)] gap-x-6">
      {children}
    </div>
  )
}

export function HeaderField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs font-medium uppercase leading-none tracking-[0.08em] text-ink-faint">
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-1 text-sm leading-5">{children}</span>
    </div>
  )
}

/** Matches the rendered <TabsList>: py-2.5 triggers on a 1px bottom border. */
const DRAWER_TABS_HEIGHT = 41

/**
 * Loading state for a drawer. Renders the exact chrome boxes the loaded drawer
 * will occupy, so resolving the record swaps content in without moving
 * anything.
 *
 * The header is a SLOT rather than a shape selected by an `avatar` flag. The
 * two drawers lead with genuinely different things — a round avatar beside a
 * short name, versus a tall amount with no mark — and a boolean that swaps both
 * the mark and the title's dimensions is two components wearing one name. What
 * must stay shared is the CHROME (the 88px header box, the 41px tab strip),
 * and that is what this frame owns; what goes inside the header is the caller's
 * business.
 */
export function DrawerSkeleton({ header, children }: {
  /** Placeholders for this drawer's own header content. */
  header: ReactNode
  /** Body placeholders, sized by the caller to match that drawer's first tab. */
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={DRAWER_HEADER_CLASS}>
        {header}
        <Skeleton className="size-8 shrink-0 rounded-[8px]" />
      </div>

      {/* Reserve the tab strip. Without it the tabs pop in on load. */}
      <div
        style={{ height: DRAWER_TABS_HEIGHT }}
        className="flex shrink-0 items-center gap-4 border-b border-border px-4"
      >
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>

      <div className="flex-1 space-y-3 p-5">{children}</div>
    </div>
  )
}

/** Title-and-subtitle placeholder stack, shared by both drawer headers. */
export function DrawerSkeletonHeading({ titleClassName }: { titleClassName: string }) {
  return (
    <div className="flex-1">
      <Skeleton className={titleClassName} />
      {/* Mirrors HeaderFields: two columns on the same 190px/1fr track, each a
          caption over a value, so the box the skeleton reserves is the box the
          loaded header fills. */}
      <div className="mt-2.5 grid grid-cols-[minmax(0,190px)_minmax(0,1fr)] gap-x-6">
        <div className="space-y-1.5"><Skeleton className="h-2.5 w-16" /><Skeleton className="h-3.5 w-32" /></div>
        <div className="space-y-1.5"><Skeleton className="h-2.5 w-16" /><Skeleton className="h-3.5 w-28" /></div>
      </div>
    </div>
  )
}
