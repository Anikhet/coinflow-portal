import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Tone } from '@/types'

/**
 * THE PILL TAXONOMY
 * =============================================================================
 * Dense operational tables fail when every cell is decorated — if everything is
 * a colored badge, nothing reads as notable. This component exists to enforce a
 * narrow, consistent set of rules across every table and drawer in the app.
 *
 *   1. ONE anatomy. 20px tall, 6px radius, 11px/500 label, optional 6px dot.
 *      There is no "large pill" or "square pill". Size never varies.
 *
 *   2. ONE tinted pill per row — the status. `variant="solid"` is reserved for
 *      status columns exclusively. It is the anchor your eye lands on first.
 *
 *   3. Attributes use `variant="ghost"` — the SURFACE colour as fill, a tone
 *      ring and tone text. It is not tinted, so it stays quieter than the
 *      status pill, but it is a real chip: an opaque fill means the pill keeps
 *      its shape over a hovered or selected row instead of dissolving into the
 *      row tint, and the ring reads as a boundary rather than a smudge.
 *
 *   4. Identity is NOT a pill. Method, processor, merchant and card brand are
 *      rendered as glyph + plain text. They describe what a payment *is*, not
 *      how it is *doing*. Pilling them is the single biggest source of noise in
 *      the original UI.
 *
 *   5. Defaults render nothing. A `standard` / `N/A` / `false` attribute
 *      renders a muted em-dash, never a pill. This inverts the
 *      signal-to-noise ratio: because normal rows are quiet, the presence of a
 *      pill always means "look here". It is what turns six columns of identical
 *      green badges into a handful of genuine exceptions.
 *
 * Colors come only from tone tokens, so a pill can never introduce a new color.
 */

const TONE_SOLID: Record<Tone, string> = {
  positive: 'bg-[var(--tone-positive-bg)] text-[var(--tone-positive-fg)] ring-[var(--tone-positive-ring)]',
  caution:  'bg-[var(--tone-caution-bg)] text-[var(--tone-caution-fg)] ring-[var(--tone-caution-ring)]',
  critical: 'bg-[var(--tone-critical-bg)] text-[var(--tone-critical-fg)] ring-[var(--tone-critical-ring)]',
  info:     'bg-[var(--tone-info-bg)] text-[var(--tone-info-fg)] ring-[var(--tone-info-ring)]',
  neutral:  'bg-[var(--tone-neutral-bg)] text-[var(--tone-neutral-fg)] ring-[var(--tone-neutral-ring)]',
}

const TONE_GHOST: Record<Tone, string> = {
  positive: 'bg-surface text-[var(--tone-positive-fg)] ring-[var(--tone-positive-ring)]',
  caution:  'bg-surface text-[var(--tone-caution-fg)] ring-[var(--tone-caution-ring)]',
  critical: 'bg-surface text-[var(--tone-critical-fg)] ring-[var(--tone-critical-ring)]',
  info:     'bg-surface text-[var(--tone-info-fg)] ring-[var(--tone-info-ring)]',
  neutral:  'bg-surface text-ink-muted ring-[var(--tone-neutral-ring)]',
}

const TONE_DOT: Record<Tone, string> = {
  positive: 'bg-[var(--tone-positive-dot)]',
  caution:  'bg-[var(--tone-caution-dot)]',
  critical: 'bg-[var(--tone-critical-dot)]',
  info:     'bg-[var(--tone-info-dot)]',
  neutral:  'bg-[var(--tone-neutral-dot)]',
}

interface PillProps {
  tone?: Tone
  variant?: 'solid' | 'ghost'
  /** Status pills carry a dot; attribute pills generally do not. */
  dot?: boolean
  /** Animates the dot — for genuinely in-flight states only. */
  pulse?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Pill({
  tone = 'neutral',
  variant = 'ghost',
  dot = false,
  pulse = false,
  icon,
  children,
  className,
}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-0 max-w-full shrink-0 items-center gap-1 rounded-[var(--radius-pill)]',
        'text-[11px] font-medium leading-none ring-1 ring-inset',
        // A leading glyph optically fills the left inset, so the padding is
        // asymmetric — equal padding makes an icon pill look left-heavy.
        icon || dot ? 'pl-1.5 pr-2' : 'px-2',
        variant === 'solid' ? TONE_SOLID[tone] : TONE_GHOST[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn('size-1.5 shrink-0 rounded-full', TONE_DOT[tone], pulse && 'animate-pulse-dot')}
        />
      )}
      {icon}
      {/* Truncate INSIDE the chip. Without this the pill overflows a narrow
          column and the cell clips it, so the rounded right edge disappears and
          the label trails off into the next column's whitespace — the pill
          stops looking like a pill. */}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}
