import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { EmptyStateTone } from './empty-state'

/**
 * EMPTY STATE MARK
 * =============================================================================
 * The icon treatment for an empty state: a gradient-filled disc sitting at the
 * centre of two concentric halo rings.
 *
 * WHY A HALO AT ALL
 *   A 44px disc alone is the right weight inside a 420px card, and badly
 *   undersized in a full-page empty region — the mark stops being a focal point
 *   and reads as a stray bullet in a large void. Scaling the disc itself to fix
 *   that makes it look like a button. The halo instead grows the mark's
 *   FOOTPRINT without growing its mass: the disc stays a small solid object and
 *   the rings give it the presence to hold the centre of the region.
 *
 * WHY RINGS AND NOT A BLURRED GLOW
 *   A soft blur behind the disc is the obvious alternative and it is the wrong
 *   one here. Every other surface in this app is flat-with-a-hairline — cards,
 *   pills, the table itself — so a diffuse bloom reads as a foreign element. The
 *   rings are hairlines at decreasing opacity, which is the same drawing
 *   language as the rest of the system, just quieter with distance.
 *
 * ONE HUE, THREE OPACITIES
 *   The rings are the tone's own ring colour at 40% and 18%. They introduce no
 *   new colour, so the brand/critical swap below is the ONLY place tone is
 *   decided — the rings follow whatever the disc is wearing. This matters
 *   because the tone split is semantic (see `EmptyState`): violet-navy is
 *   identity, red is severity, and a halo that had its own colour could
 *   contradict the disc it surrounds.
 *
 * NO LAYOUT SHIFT
 *   The outer box is a fixed square sized to the LARGEST ring, and both rings
 *   and the disc are absolutely positioned inside it. The mark therefore
 *   occupies identical space whether or not the icon has painted yet, and
 *   switching tone or size cannot reflow the copy underneath it.
 */

/** Fixed geometry per size. Values, not formulas — see the no-layout-shift note. */
const SIZES = {
  contained: { box: 82, mid: 62, disc: 44, icon: 'size-5', gap: 'mb-2' },
  page: { box: 106, mid: 80, disc: 56, icon: 'size-6', gap: 'mb-3' },
} as const

export type EmptyStateMarkSize = keyof typeof SIZES

export function EmptyStateMark({ icon: Icon, tone, size }: {
  icon: LucideIcon
  tone: EmptyStateTone
  size: EmptyStateMarkSize
}) {
  const { box, mid, disc, icon, gap } = SIZES[size]
  const critical = tone === 'critical'

  return (
    <div
      // `--halo` is set once here and read by both rings, so the tone branch
      // below stays the single decision point.
      style={{ width: box, height: box, ['--halo' as string]: critical ? 'var(--tone-critical-ring)' : 'var(--brand-ring)' }}
      className={cn('relative grid shrink-0 place-items-center', gap)}
      aria-hidden
    >
      <Ring size={box} className="opacity-[0.18]" />
      <Ring size={mid} className="opacity-40" />
      <span
        style={{ width: disc, height: disc }}
        className={cn(
          'relative grid place-items-center rounded-full',
          // Inset highlight reads as a light source on the gradient and keeps
          // the chip from looking flat against the card.
          'ring-1 ring-inset ring-[var(--gradient-sheen)]',
          critical
            ? 'bg-[image:var(--mark-critical)] text-tone-critical-contrast shadow-[0_4px_12px_var(--tone-critical-ring)]'
            : 'bg-[image:var(--mark-brand)] text-brand-contrast shadow-[0_4px_12px_var(--brand-ring)]',
        )}
      >
        <Icon className={icon} strokeWidth={1.75} />
      </span>
    </div>
  )
}

/** One hairline circle, centred on the mark. */
function Ring({ size, className }: { size: number; className: string }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn('absolute rounded-full border border-[var(--halo)]', className)}
    />
  )
}
