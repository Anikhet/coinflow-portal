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
 */
export function DrawerSkeleton({ avatar = false, children }: {
  /** Customer drawer leads with a round avatar; payment drawer leads with text. */
  avatar?: boolean
  /** Body placeholders, sized by the caller to match that drawer's first tab. */
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={DRAWER_HEADER_CLASS}>
        {avatar && <Skeleton className="size-10 shrink-0 rounded-full" />}
        <div className="flex-1 space-y-2">
          <Skeleton className={avatar ? 'h-5 w-40' : 'h-7 w-32'} />
          <Skeleton className="h-3 w-56" />
        </div>
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
