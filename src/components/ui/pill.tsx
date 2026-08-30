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
 *   3. Attributes use `variant="ghost"` — no fill, hairline ring, muted text.
 *      They sit visually beneath status so they never compete with it.
 *
 *   4. Identity is NOT a pill. Method, processor, merchant and card brand are
 *      rendered as glyph + plain text. They describe what a payment *is*, not
 *      how it is *doing*. Pilling them is the single biggest source of noise in
 *      the original UI.
 *
 *   5. Defaults render nothing. A `standard` / `N/A` / `false` attribute
 *      returns an em-dash via <EmptyCell>, never a pill. This inverts the
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
  positive: 'text-[var(--tone-positive-fg)] ring-[var(--tone-positive-ring)]',
  caution:  'text-[var(--tone-caution-fg)] ring-[var(--tone-caution-ring)]',
  critical: 'text-[var(--tone-critical-fg)] ring-[var(--tone-critical-ring)]',
  info:     'text-[var(--tone-info-fg)] ring-[var(--tone-info-ring)]',
  neutral:  'text-ink-muted ring-[var(--tone-neutral-ring)]',
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
        'inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)]',
        'px-1.5 text-[11px] font-medium leading-none ring-1 ring-inset',
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
      {children}
    </span>
  )
}

/**
 * The default state. Rule 5 of the taxonomy: an attribute at its default value
 * renders as a muted dash, never a pill. Fixed width so columns of mixed
 * dashes and pills keep a stable rhythm.
 */
export function EmptyCell({ label = 'Not applicable' }: { label?: string }) {
  return (
    <span className="text-ink-faint select-none" title={label} aria-label={label}>
      —
    </span>
  )
}
