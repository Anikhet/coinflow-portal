import { useId } from 'react'
import { EmptyGlyph, type EmptyGlyphName } from '@/components/icons/empty-glyphs'
import type { EmptyStateTone } from './empty-state'

/**
 * EMPTY STATE MARK
 * =============================================================================
 * A large glyph painted with the brand gradient — no disc, no halo, no shadow.
 *
 * WHY NO CONTAINER
 *   The mark previously sat inside a gradient-filled circle ringed by two
 *   concentric halos. That is three shapes to say one thing, and the circle was
 *   doing the work the glyph should do: at 44px the icon was a small white
 *   detail on a large coloured button, so the eye read "button", not "wallet".
 *   Removing the container lets the silhouette itself be the mark, which is
 *   what makes it identifiable at a glance — a wallet, a shield, a gavel.
 *
 * WHY A SEPARATE GLYPH SET
 *   The mark is FILLED, not stroked, because a gradient across a 1.5px outline
 *   is barely visible — the ramp needs area to run across. The app's lucide
 *   icons are open paths and cannot be filled (they close the wrong regions),
 *   so the mark draws from `empty-glyphs.tsx` instead: solid silhouettes on the
 *   same 24px grid, keyed by STATE rather than by picture.
 *
 * WHY A VERTICAL GRADIENT
 *   Saturated at the top falling to a light tint at the baseline. The mark
 *   carries weight where the eye lands first and releases toward the copy
 *   beneath it, so the icon leads into the text rather than sitting on top of
 *   it as a uniform block of colour. Stops come from `--glyph-from` /
 *   `--glyph-to`, which invert with the theme.
 *
 * WHY A UNIQUE GRADIENT ID
 *   SVG ids are document-global. Two empty states on one page — a table's and
 *   a panel's — sharing a fixed id means the first definition wins for both,
 *   so the second silently adopts the first one's stops. `useId` per instance
 *   removes the collision.
 *
 * NO LAYOUT SHIFT
 *   Both sizes are fixed pixel values, never content-derived, so the mark
 *   occupies identical space whether or not the icon has painted, and switching
 *   tone cannot reflow the copy underneath it.
 */

/** Fixed geometry per size. Values, not formulas — see the no-layout-shift note. */
const SIZES = {
  contained: { box: 56 },
  page: { box: 76 },
} as const

export type EmptyStateMarkSize = keyof typeof SIZES

export function EmptyStateMark({ glyph, tone, size }: {
  glyph: EmptyGlyphName
  tone: EmptyStateTone
  size: EmptyStateMarkSize
}) {
  const { box } = SIZES[size]
  const gradientId = `empty-mark-${useId().replace(/:/g, '')}`

  const from = tone === 'critical' ? 'var(--glyph-critical-from)' : 'var(--glyph-from)'
  const to = tone === 'critical' ? 'var(--glyph-critical-to)' : 'var(--glyph-to)'

  return (
    <span className="mb-4 grid shrink-0 place-items-center" style={{ width: box, height: box }} aria-hidden>
      {/* The gradient has to be defined in the same document as the glyph that
          references it, so it rides along inside this span rather than being
          hoisted to a shared <defs> the caller has to remember to mount. */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>

      <EmptyGlyph name={glyph} paint={`url(#${gradientId})`} size={box} />
    </span>
  )
}
