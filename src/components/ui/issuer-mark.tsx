import { issuerHue, issuerMonogram, issuerShortName } from '@/lib/issuer'
import { cn } from '@/lib/cn'

/**
 * Identity chip for a card issuer.
 *
 * Deliberately NOT `Avatar`, despite sharing its hue machinery: a rounded
 * square means "an account inside this system" (customer, merchant), and an
 * issuer is an outside institution nobody here onboarded. The circle keeps that
 * distinction readable at 20px, where a 6px radius and a full round are the
 * only two shapes the eye can still tell apart.
 *
 * The monogram is derived, not a logo — see lib/issuer.ts for why the real
 * marks are not shipped. `title` carries the colloquial short name so hovering
 * the chip answers "which bank" without the reader parsing the legal string.
 */
export function IssuerMark({ issuer, size = 20, className }: {
  issuer: string
  /** Box size in px. Fixed, never content-derived, so a chip cannot shift a row. */
  size?: number
  className?: string
}) {
  const hue = issuerHue(issuer)

  return (
    <span
      title={issuerShortName(issuer)}
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold leading-none',
        'ring-1 ring-inset ring-black/[0.04]',
        className,
      )}
      style={{
        width: size,
        height: size,
        // Font scales with the box, matching Avatar, so the two chips read as
        // one family at every size they are used at.
        fontSize: Math.round(size * 0.44),
        background: `oklch(var(--avatar-bg-l) var(--avatar-bg-c) ${hue})`,
        color: `oklch(var(--avatar-fg-l) var(--avatar-fg-c) ${hue})`,
      }}
    >
      {issuerMonogram(issuer)}
    </span>
  )
}
