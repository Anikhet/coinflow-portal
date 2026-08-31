import { CopyButton } from '@/components/ui/copy-button'
import { Pill } from '@/components/ui/pill'
import { Tooltip } from '@/components/ui/tooltip'
import { formatCurrency, truncateId } from '@/lib/format'
import type { ToneDescriptor } from '@/lib/tone-map'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

/**
 * SHARED CELL RENDERERS
 * =============================================================================
 * Cells are defined once and reused by every table so an ID, an amount or a
 * status renders identically no matter which surface it appears on.
 */

/** Monospaced, middle-truncated identifier with a hover-revealed copy action. */
export function IdCell({ value, display }: { value: string; display?: string }) {
  return (
    <span className="flex items-center gap-1">
      <Tooltip content={value}>
        <span className="truncate font-mono text-[12px] text-ink-muted">
          {display ?? truncateId(value)}
        </span>
      </Tooltip>
      <CopyButton value={value} label="Copy ID" />
    </span>
  )
}

/**
 * Currency. Right-aligned and tabular so decimal points form a vertical line —
 * this is what lets an operator spot an order-of-magnitude outlier without
 * reading a single number.
 */
export function AmountCell({ value, muted = false }: { value: number; muted?: boolean }) {
  return (
    <span className={cn('tabular-nums font-medium', muted ? 'text-ink-faint' : 'text-ink')}>
      {formatCurrency(value)}
    </span>
  )
}

/**
 * Identity rendered as glyph + name — method and processor.
 *
 * Taxonomy rule 4 says identity is not a pill, and this now follows it
 * literally: no border, no fill. The chip outline it used to carry was meant to
 * stop the brand mark floating loose against the row, but with one mark per
 * row at a fixed 20px the marks already form their own column, and the outlines
 * added a second rectangle around every logo — a box inside a box, repeated
 * down the whole table. Removing them leaves the status pill as the only
 * enclosed shape in the row, which is what makes it findable.
 */
export function IdentityCell({ glyph, label, sublabel }: {
  glyph: ReactNode
  label: string
  /** Secondary detail — e.g. a card's last four. Muted so it reads as a qualifier. */
  sublabel?: string | null
}) {
  return (
    // h-6 holds the row baseline steady: the 20px mark and the 12px label have
    // different natural heights, and without a fixed box the method column
    // would sit a pixel off the processor column beside it.
    <span className="flex h-6 min-w-0 items-center gap-1.5">
      {glyph}
      <span className="truncate text-[12px] text-ink">{label}</span>
      {sublabel && <span className="shrink-0 font-mono text-[11px] text-ink-faint">{sublabel}</span>}
    </span>
  )
}

/**
 * The single solid pill per row.
 *
 * Carries a glyph rather than a dot when the descriptor supplies one: a dot
 * encodes severity in colour ALONE, which is the accessibility failure the
 * icon set exists to fix. The dot survives only as the fallback.
 */
export function StatusCell({ descriptor }: { descriptor: ToneDescriptor }) {
  const Icon = descriptor.icon
  return (
    <Pill
      tone={descriptor.tone}
      variant="solid"
      dot={!Icon}
      pulse={descriptor.pulse}
      icon={
        Icon && (
          <Icon
            className={cn('size-3 shrink-0', descriptor.pulse && 'animate-spin [animation-duration:2s]')}
            aria-hidden
          />
        )
      }
    >
      {descriptor.label}
    </Pill>
  )
}

/**
 * Attribute cell. Renders nothing but an em-dash when the value is the default
 * — the rule that keeps the table quiet enough for exceptions to register.
 */
export function AttributeCell({ descriptor }: { descriptor: ToneDescriptor }) {
  if (descriptor.isDefault) {
    // The dash is decorative; the accessible name carries the real state, so a
    // screen reader hears "Protected" or "Not enrolled" rather than "dash".
    return (
      <span className="select-none text-ink-faint" title={descriptor.label} aria-label={descriptor.label}>
        <span aria-hidden>—</span>
      </span>
    )
  }

  // Emphasis follows severity, not column. Previously every non-default
  // attribute rendered identically, so "None" — the benign fact that a merchant
  // never bought cover — shouted exactly as loud as "Declined", a claim the
  // network actively refused. Nothing in the column told the operator which of
  // the two needed them. Now a refusal is tinted and the facts stay quiet.
  const Icon = descriptor.icon
  const isRefusal = descriptor.tone === 'critical'

  return (
    <Pill
      tone={descriptor.tone}
      variant={isRefusal ? 'alert' : 'ghost'}
      // Sized to the 11px cap height beside it, so the glyph reads as part of
      // the word rather than as a second element competing with it.
      icon={Icon ? <Icon className="size-3 shrink-0" aria-hidden /> : undefined}
    >
      {descriptor.label}
    </Pill>
  )
}

/** Most severe first, so the one surfaced pill is always the worst one. */
const SEVERITY_RANK = { critical: 0, caution: 1, info: 2, positive: 3, neutral: 4 } as const

/**
 * Collapses many exception pills into a bounded display.
 *
 * A row can carry up to ten exceptions; rendering all of them would make the
 * row taller than its neighbours and break the fixed-height rule. Showing the
 * two most severe plus an overflow count keeps every row identical in height
 * while preserving the signal, with the full list on hover.
 */
export function ExceptionsCell({ items }: { items: ToneDescriptor[] }) {
  if (items.length === 0) {
    return (
      <span className="select-none text-ink-faint" title="No exceptions" aria-label="No exceptions">
        <span aria-hidden>—</span>
      </span>
    )
  }

  // toSorted leaves the caller's array untouched; the ranking is module scope
  // (SEVERITY_RANK) so it is not rebuilt for every rendered row.
  const sorted = items.toSorted((a, b) => SEVERITY_RANK[a.tone] - SEVERITY_RANK[b.tone])
  const [first, ...rest] = sorted

  return (
    <span className="flex items-center gap-1">
      <Pill
        tone={first.tone}
        // Same severity rule as AttributeCell: the surfaced exception is
        // already the worst one on the row, so when it is critical it should
        // look it.
        variant={first.tone === 'critical' ? 'alert' : 'ghost'}
        icon={first.icon ? <first.icon className="size-3 shrink-0" aria-hidden /> : undefined}
      >
        {first.label}
      </Pill>
      {rest.length > 0 && (
        <Tooltip content={rest.map((item) => item.label).join(' · ')}>
          <Pill tone="neutral" size="sm" className="cursor-default text-ink-faint">
            +{rest.length}
          </Pill>
        </Tooltip>
      )}
    </span>
  )
}
