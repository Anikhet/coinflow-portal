import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { EmptyStateTone } from './empty-state'

/**
 * EMPTY STATE MARK
 * =============================================================================
 * The icon treatment for an empty state: a gradient-filled disc, lit by a
 * radial highlight that agrees with the gradient's own direction.
 *
 * ONE OBJECT, NOT AN ORNAMENT
 *   The disc is deliberately bare. Concentric halo rings were tried here and
 *   removed: they read as a target/radar motif that this product has no reason
 *   to invoke, and they pulled the eye outward to the rings instead of inward
 *   to the glyph that actually names the state. A single solid disc says
 *   everything the mark needs to say.
 *
 * SIZE, NOT DECORATION, CARRIES THE LAYOUTS
 *   A 44px disc is the right weight inside a 420px card and undersized in a
 *   full-page empty region, where it reads as a stray bullet in a large void.
 *   The fix is simply a bigger disc for the page layout — the mark gains
 *   presence by growing, not by acquiring furniture.
 *
 * NO LAYOUT SHIFT
 *   Both sizes are fixed pixel values, never content-derived, so the mark
 *   occupies identical space whether or not the icon has painted and switching
 *   tone cannot reflow the copy underneath it.
 */

/** Fixed geometry per size. Values, not formulas — see the no-layout-shift note. */
const SIZES = {
  contained: { disc: 44, icon: 'size-5', gap: 'mb-4' },
  page: { disc: 56, icon: 'size-6', gap: 'mb-4' },
} as const

export type EmptyStateMarkSize = keyof typeof SIZES

export function EmptyStateMark({ icon: Icon, tone, size }: {
  icon: LucideIcon
  tone: EmptyStateTone
  size: EmptyStateMarkSize
}) {
  const { disc, icon, gap } = SIZES[size]

  return (
    <span
      style={{ width: disc, height: disc }}
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full',
        // Inset highlight reads as a light source on the gradient and keeps
        // the chip from looking flat against the card.
        'ring-1 ring-inset ring-[var(--gradient-sheen)]',
        tone === 'critical'
          ? 'bg-[image:var(--mark-critical)] text-tone-critical-contrast shadow-[0_4px_12px_var(--tone-critical-ring)]'
          : 'bg-[image:var(--mark-brand)] text-brand-contrast shadow-[0_4px_12px_var(--brand-ring)]',
        gap,
      )}
    >
      <Icon className={icon} strokeWidth={1.75} />
    </span>
  )
}
