import { useId } from 'react'

/**
 * FILLED GLYPH SET
 * =============================================================================
 * Solid counterparts to the lucide outline icons used by the tone registry.
 *
 * Lucide ships outline only. At the 12px these render at, a 1.5px stroke on a
 * shield or a padlock collapses into a grey smudge — the silhouette that is
 * supposed to identify the column stops being legible, which defeats the point
 * of having a glyph rather than a coloured dot. A solid body holds its shape at
 * that size and reversed out on a solid pill.
 *
 * Construction, in three layers:
 *
 *  - `body`    — the silhouette, filled with currentColor.
 *  - `mark`    — the distinguishing mark (tick, cross, slash), KNOCKED OUT of
 *                the body with an SVG mask rather than painted on top. These
 *                glyphs render on a solid pill, a ghost pill and a bare menu
 *                row; a painted mark has to know what colour sits behind it and
 *                gets it wrong on two of the three. A knockout is transparent,
 *                so it is correct on all of them for free.
 *  - `overlay` — stroked in currentColor for parts OUTSIDE the body, which a
 *                knockout cannot express: a padlock's shackle is the only case.
 *
 * Geometry is drawn on lucide's 24×24 grid so these sit on the same optical
 * baseline as the outline icons they appear beside.
 */

interface GlyphProps {
  className?: string
  'aria-hidden'?: boolean
}

interface FilledGlyphProps extends GlyphProps {
  /** Filled silhouette. */
  body: string
  /** Cut out of the body. */
  mark?: string
  /** Stroked in currentColor, for geometry outside the body. */
  overlay?: string
  /** Knockout weight. Heavier than a lucide stroke so the cut survives at 12px. */
  markWidth?: number
}

function FilledGlyph({ body, mark, overlay, markWidth = 2.4, className, ...rest }: FilledGlyphProps) {
  // useId, because two glyphs in one document must not share a mask id — the
  // second would silently adopt the first one's shape.
  const maskId = useId()
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      {mark && (
        <mask id={maskId}>
          {/* White keeps, black cuts. */}
          <rect width="24" height="24" fill="white" />
          <path d={mark} stroke="black" strokeWidth={markWidth} strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      )}
      <path d={body} fill="currentColor" mask={mark ? `url(#${maskId})` : undefined} />
      {overlay && (
        <path d={overlay} stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" fill="none" />
      )}
    </svg>
  )
}

/* -- circles: payment outcome ---------------------------------------------- */

const DISC = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z'

export function CircleCheckFilled(props: GlyphProps) {
  return <FilledGlyph body={DISC} mark="m8.5 12.3 2.5 2.5 4.5-5" {...props} />
}

export function CircleXFilled(props: GlyphProps) {
  return <FilledGlyph body={DISC} mark="M15 9l-6 6M9 9l6 6" {...props} />
}

export function BanFilled(props: GlyphProps) {
  return <FilledGlyph body={DISC} mark="M7.4 7.4 16.6 16.6" {...props} />
}

/* -- shields: chargeback protection ---------------------------------------- */

const SHIELD = 'M12 2.1 4.5 5.05v6.6c0 5 3.3 8.1 7.5 10.1 4.2-2 7.5-5.1 7.5-10.1v-6.6z'

export function ShieldCheckFilled(props: GlyphProps) {
  return <FilledGlyph body={SHIELD} mark="m9 11.9 2.2 2.2 4-4.3" {...props} />
}

export function ShieldXFilled(props: GlyphProps) {
  return <FilledGlyph body={SHIELD} mark="m14.2 9.8-4.4 4.4m0-4.4 4.4 4.4" {...props} />
}

export function ShieldOffFilled(props: GlyphProps) {
  // A slash, matching the near-universal "disabled" convention, rather than
  // lucide's torn-shield outline — that silhouette is unreadable filled.
  //
  // The slash runs corner to corner, past the edges of the shield on both
  // ends. A cut that stops inside the body reads as a two-tone shield rather
  // than a struck-out one; only a full crossing says "disabled".
  return <FilledGlyph body={SHIELD} mark="M5.4 5.2 18.6 18.4" markWidth={2.7} {...props} />
}

/* -- padlocks: 3D Secure ---------------------------------------------------
   Body is the case; the shackle is an overlay because it sits outside the
   filled shape. The three states differ by shackle alone, which is the whole
   reason this column reads at a glance. */

const LOCK_CASE = 'M5.7 10.4h12.6a1.8 1.8 0 0 1 1.8 1.8v7.6a1.8 1.8 0 0 1-1.8 1.8H5.7a1.8 1.8 0 0 1-1.8-1.8v-7.6a1.8 1.8 0 0 1 1.8-1.8z'
/** Knocked out of the case so the shape still reads as a lock, not a card. */
const KEYHOLE = 'M12 14.6v2.8'

export function LockFilled(props: GlyphProps) {
  return <FilledGlyph body={LOCK_CASE} mark={KEYHOLE} markWidth={2.2} overlay="M7.6 10.4V7.2a4.4 4.4 0 0 1 8.8 0v3.2" {...props} />
}

export function LockOpenFilled(props: GlyphProps) {
  return <FilledGlyph body={LOCK_CASE} mark={KEYHOLE} markWidth={2.2} overlay="M7.6 10.4V7.2a4.4 4.4 0 0 1 8.6-1.3" {...props} />
}

/**
 * Shackle mirrored to the right, exactly as lucide separates `unlock` from
 * `lock-open`. Two states that mean different things ("3DS degraded" vs "3DS
 * off") must not share a silhouette.
 */
export function UnlockFilled(props: GlyphProps) {
  return <FilledGlyph body={LOCK_CASE} mark={KEYHOLE} markWidth={2.2} overlay="M16.4 10.4V7.2a4.4 4.4 0 0 0-8.6-1.3" {...props} />
}
