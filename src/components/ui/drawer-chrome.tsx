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
  'flex h-[88px] shrink-0 items-start gap-3 border-b border-border px-5 py-4'

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
    <div className="flex-1 space-y-2">
      <Skeleton className={titleClassName} />
      <Skeleton className="h-3 w-56" />
    </div>
  )
}
