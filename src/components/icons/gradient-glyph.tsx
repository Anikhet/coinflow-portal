import { useId } from 'react'
import { EmptyGlyph, type EmptyGlyphName } from '@/components/icons/empty-glyphs'

/**
 * GRADIENT GLYPH
 * =============================================================================
 * A filled glyph painted with the brand vertical gradient, at any size.
 *
 * Extracted from `EmptyStateMark`, which owned this logic alone until the stat
 * cards wanted the same treatment. The two differ only in box size and in the
 * critical-tone stop pair, so what is shared is the paint — a per-instance
 * gradient definition and the fill reference that points at it.
 *
 * WHY A UNIQUE GRADIENT ID (unchanged reasoning, now in one place)
 *   SVG ids are document-global. Two gradient glyphs on one page sharing a
 *   fixed id means the first definition wins for both, so the second silently
 *   adopts the first one's stops. `useId` per instance removes the collision.
 *
 * WHY THE <defs> RIDES ALONG
 *   A gradient has to be defined in the same document as the shape that
 *   references it, so it is emitted inside this component rather than hoisted
 *   to a shared <defs> every caller has to remember to mount.
 *
 * `size` is always a fixed pixel value, never content-derived, so the glyph
 * occupies identical space whether or not it has painted.
 */

export function GradientGlyph({ name, size, from = 'var(--glyph-from)', to = 'var(--glyph-to)', className }: {
  name: EmptyGlyphName
  size: number
  /** Top stop — saturated end of the ramp. */
  from?: string
  /** Baseline stop — the light tint the ramp falls to. */
  to?: string
  className?: string
}) {
  const gradientId = `glyph-${useId().replace(/:/g, '')}`

  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      <EmptyGlyph name={name} paint={`url(#${gradientId})`} size={size} className={className} />
    </>
  )
}
