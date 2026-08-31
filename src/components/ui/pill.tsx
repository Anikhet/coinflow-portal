import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'
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
 *   3a. `variant="alert"` is the exception inside the exception: an attribute
 *      that records an active REFUSAL (a declined claim, a failed
 *      authentication) takes the tone tint. It stays rare by construction —
 *      only the critical tone qualifies — so it reads as an alarm rather than
 *      as decoration, and the rule that quiet rows make loud ones legible
 *      survives.
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
 *
 * RELATIONSHIP TO shadcn/ui's Badge
 * -----------------------------------------------------------------------------
 * Built on the same structure — cva variants, `data-slot`, `asChild` via Slot —
 * so it composes and can be styled the way any shadcn component can.
 *
 * What it does NOT take from Badge is the variant vocabulary. Badge's variants
 * (`default` / `secondary` / `destructive` / `outline`) describe how a chip
 * LOOKS; this app needs variants that describe what a value MEANS, because the
 * mapping from a domain value to a colour is centralised in the tone registry
 * and must not be re-decided at each call site. `destructive` also covers only
 * one of the five states this data has. So `tone` carries meaning, `variant`
 * carries emphasis, and no call site picks a colour.
 *
 * It keeps the name Pill because the rules above are referred to throughout the
 * codebase as the pill taxonomy; a rename would only break that thread.
 */

const TONE_SOLID: Record<Tone | 'brand', string> = {
  positive: 'bg-[var(--tone-positive-bg)] text-[var(--tone-positive-fg)] ring-[var(--tone-positive-ring)]',
  caution:  'bg-[var(--tone-caution-bg)] text-[var(--tone-caution-fg)] ring-[var(--tone-caution-ring)]',
  critical: 'bg-[var(--tone-critical-bg)] text-[var(--tone-critical-fg)] ring-[var(--tone-critical-ring)]',
  info:     'bg-[var(--tone-info-bg)] text-[var(--tone-info-fg)] ring-[var(--tone-info-ring)]',
  neutral:  'bg-[var(--tone-neutral-bg)] text-[var(--tone-neutral-fg)] ring-[var(--tone-neutral-ring)]',
  brand:    'bg-brand-soft text-brand ring-transparent',
}

const TONE_GHOST: Record<Tone | 'brand', string> = {
  positive: 'bg-surface text-[var(--tone-positive-fg)] ring-[var(--tone-positive-ring)]',
  caution:  'bg-surface text-[var(--tone-caution-fg)] ring-[var(--tone-caution-ring)]',
  critical: 'bg-surface text-[var(--tone-critical-fg)] ring-[var(--tone-critical-ring)]',
  info:     'bg-surface text-[var(--tone-info-fg)] ring-[var(--tone-info-ring)]',
  neutral:  'bg-surface text-ink-muted ring-[var(--tone-neutral-ring)]',
  brand:    'bg-surface text-brand ring-[var(--brand-ring)]',
}

const TONE_DOT: Record<Tone | 'brand', string> = {
  positive: 'bg-[var(--tone-positive-dot)]',
  caution:  'bg-[var(--tone-caution-dot)]',
  critical: 'bg-[var(--tone-critical-dot)]',
  info:     'bg-[var(--tone-info-dot)]',
  neutral:  'bg-[var(--tone-neutral-dot)]',
  brand:    'bg-brand',
}

/**
 * `brand` is not a tone — the tone set is deliberately free of brand colour so
 * that a coloured row NEVER means "interactive". It exists here for chrome
 * only: the count on a filter button, which belongs to a control rather than to
 * a row of data. Nothing that renders inside a table cell may use it.
 */
export type PillTone = Tone | 'brand'

const pillVariants = cva(
  [
    'inline-flex min-w-0 max-w-full shrink-0 items-center rounded-[var(--radius-pill)]',
    'font-medium leading-none ring-1 ring-inset',
    // Icon sizing lives here, so no call site has to remember it and every
    // glyph in every badge is the same size.
    '[&_[data-icon]]:shrink-0',
  ],
  {
    variants: {
      size: {
        /** The table anatomy: 20px tall, 11px label. */
        md: 'h-5 gap-1 text-[11px] [&_[data-icon]]:size-3',
        /** Counts and overflow chips — nav badges, filter counts, "+2". */
        sm: 'h-[18px] gap-0.5 px-1.5 text-[10px] tabular-nums [&_[data-icon]]:size-2.5',
      },
      variant: {
        solid: '',
        ghost: '',
        alert: 'font-semibold',
      },
    },
    defaultVariants: { size: 'md', variant: 'ghost' },
  },
)

interface PillProps
  extends Omit<ComponentProps<'span'>, 'children'>, VariantProps<typeof pillVariants> {
  tone?: PillTone
  /** Status pills carry a dot; attribute pills generally do not. */
  dot?: boolean
  /** Animates the dot — for genuinely in-flight states only. */
  pulse?: boolean
  icon?: ReactNode
  /** Render as a different element, e.g. a link. Same contract as shadcn. */
  asChild?: boolean
  children: ReactNode
}

export function Pill({
  tone = 'neutral',
  variant = 'ghost',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  asChild,
  children,
  className,
  ...props
}: PillProps) {
  const Component = asChild ? Slot : 'span'

  return (
    <Component
      data-slot="badge"
      className={cn(
        pillVariants({ size, variant }),
        variant === 'ghost' ? TONE_GHOST[tone] : TONE_SOLID[tone],
        // A leading glyph optically fills the left inset, so the padding is
        // asymmetric — equal padding makes an icon pill look left-heavy.
        size === 'md' && (icon || dot ? 'pl-1.5 pr-2' : 'px-2'),
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          data-icon="inline-start"
          aria-hidden
          className={cn('size-1.5 rounded-full', TONE_DOT[tone], pulse && 'animate-pulse-dot')}
        />
      )}
      {icon && <span data-icon="inline-start" className="contents">{icon}</span>}
      {/* Truncate INSIDE the chip. Without this the pill overflows a narrow
          column and the cell clips it, so the rounded right edge disappears and
          the label trails off into the next column's whitespace — the pill
          stops looking like a pill. */}
      <span className="min-w-0 truncate">{children}</span>
    </Component>
  )
}
