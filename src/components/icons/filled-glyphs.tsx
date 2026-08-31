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
  /** Overlay stroke weight. */
  overlayWidth?: number
  /** Knockout weight. Heavier than a lucide stroke so the cut survives at 12px. */
  markWidth?: number
}

function FilledGlyph({ body, mark, overlay, markWidth = 2.4, overlayWidth = 2.1, className, ...rest }: FilledGlyphProps) {
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
        <path d={overlay} stroke="currentColor" strokeWidth={overlayWidth} strokeLinecap="round" fill="none" />
      )}
    </svg>
  )
}

/**
 * The shared strike-through.
 *
 * A knockout ALONE was wrong here. Cutting a 2.6-wide transparent band across a
 * 14px glyph erases a fifth of it and splits the silhouette in two, and on a
 * light ghost pill that band reads as white damage rather than as a slash.
 *
 * So the slash is drawn twice: a wider knockout carves a gap, and a narrower
 * solid bar sits inside it. The result is a slash in the glyph's own colour
 * with a hairline of background isolating it from the body — visible on every
 * ground, and it never eats the shape it is marking. (The shield and padlock
 * use a bare knockout because their bodies are large enough to survive one.)
 */
const SLASH = { mark: 'M4.8 4.8 19.2 19.2', markWidth: 4, overlay: 'M4.8 4.8 19.2 19.2', overlayWidth: 2 }

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

/* -- octagon: refusal ------------------------------------------------------
   The stop-sign silhouette. Reserved for states where something was actively
   REFUSED — a declined protection claim, a failed authentication — as opposed
   to merely absent. Its outline is distinguishable from a disc at a glance
   even before the knocked-out mark resolves, which is what makes a refusal
   readable at 12px in a column of otherwise round glyphs. */

const OCTAGON = 'M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z'

export function OctagonXFilled(props: GlyphProps) {
  return <FilledGlyph body={OCTAGON} mark="M15 9l-6 6M9 9l6 6" {...props} />
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
  // Same gap-plus-bar slash as the hand and the person (see SLASH). A bare
  // knockout here read as a two-tone shield — a shield with a pale wedge
  // missing — rather than a struck-out one.
  return <FilledGlyph body={SHIELD} {...SLASH} {...props} />
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

/* -- clocks and people: customer attributes -------------------------------- */

export function ClockFilled(props: GlyphProps) {
  return <FilledGlyph body={DISC} mark="M12 6.9v5.4l3.4 2" markWidth={2.2} {...props} />
}


/**
 * A raised palm, struck through — "Attempts restricted".
 *
 * The lucide outline hand was ambiguous at 12px: an open palm alone reads as
 * "stop" OR "wave" OR a generic hand-shaped blob. The slash resolves it to one
 * meaning, and reuses the slash already carried by the disabled shield and the
 * 3DS-off padlock, so "struck through" means the same thing in every column.
 *
 * Built as a palm plus four separate finger caps rather than one traced
 * outline. A single freehand path at this size produced a lopsided lump whose
 * fingers only read on one side; discrete, evenly pitched fingers give the
 * silhouette the repetition that makes the eye recognise a hand.
 */
const HAND = [
  'M5.5 11.5h13v3.4a6.5 6.5 0 0 1-13 0z',          // palm
  'M5.6 9.3a1.4 1.4 0 0 1 2.8 0v3H5.6z',           // little finger
  'M8.8 6.7a1.4 1.4 0 0 1 2.8 0v5.6H8.8z',         // ring
  'M12 6.3a1.4 1.4 0 0 1 2.8 0v6H12z',             // middle
  'M15.2 8.1a1.4 1.4 0 0 1 2.8 0v4.2h-2.8z',       // index
].join(' ')

export function HandOffFilled(props: GlyphProps) {
  return <FilledGlyph body={HAND} {...SLASH} {...props} />
}

/**
 * A person, struck through — verification not found / unverified. Same slash
 * vocabulary again.
 */
const PERSON = 'M12 3.9a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6zM4.4 20.2a7.6 7.6 0 0 1 15.2 0 1.3 1.3 0 0 1-1.3 1.3H5.7a1.3 1.3 0 0 1-1.3-1.3z'

export function UserOffFilled(props: GlyphProps) {
  return <FilledGlyph body={PERSON} {...SLASH} {...props} />
}

/**
 * Rising trend. The shaft is stroked at solid weight rather than filled,
 * because a line has no interior to fill — what makes it read as "solid" beside
 * the other glyphs is weight, not area. The arrowhead is a real filled
 * triangle, which is where the eye lands.
 */
export function TrendingUpFilled({ className, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path d="M3.4 17.6 9.6 11.4l3.4 3.4 4.6-4.6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.2 5.2v6.1l-6.1-6.1z" fill="currentColor" />
    </svg>
  )
}
