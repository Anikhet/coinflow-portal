import { CopyButton } from '@/components/ui/copy-button'
import { Pill } from '@/components/ui/pill'
import { StatusPill, AttributePill } from '@/components/ui/status-pill'
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
        <span className="truncate font-mono text-sm text-ink-muted">
          {display ?? truncateId(value)}
        </span>
      </Tooltip>
      <CopyButton value={value} label="Copy ID" />
    </span>
  )
}

/**
 * Currency. Left-aligned with the rest of the table, so every column starts on
 * the same vertical line and the eye has one edge to track down the page.
 *
 * `tabular-nums` still does the numeric work it can from the left: digits are
 * equal width, so figures of the SAME magnitude stack exactly and a value that
 * is an order of magnitude larger is longer than its neighbours. That is a
 * weaker cue than right-aligned decimal points, which line up regardless of
 * magnitude — the trade accepted here for a single consistent alignment.
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
      <span className="truncate text-sm text-ink">{label}</span>
      {sublabel && <span className="shrink-0 font-mono text-xs text-ink-faint">{sublabel}</span>}
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
  return <StatusPill descriptor={descriptor} />
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
  return <AttributePill descriptor={descriptor} />
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
      {/* The surfaced exception is an attribute like any other, so it renders
          through the shared AttributePill rather than restating the severity
          rule here — the drawer's exception chips use the same call. */}
      <AttributePill descriptor={first} />
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
