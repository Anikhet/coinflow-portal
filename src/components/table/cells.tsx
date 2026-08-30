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

/** Glyph + plain text. Identity is never a pill (taxonomy rule 4). */
export function IdentityCell({ glyph, label, sublabel }: {
  glyph: ReactNode
  label: string
  sublabel?: string | null
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {glyph}
      <span className="min-w-0 truncate">
        <span className="truncate text-ink">{label}</span>
        {sublabel && <span className="ml-1.5 font-mono text-[11px] text-ink-faint">{sublabel}</span>}
      </span>
    </span>
  )
}

/** The single solid pill per row. */
export function StatusCell({ descriptor }: { descriptor: ToneDescriptor }) {
  return (
    <Pill tone={descriptor.tone} variant="solid" dot pulse={descriptor.pulse}>
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
    return <span className="select-none text-ink-faint" title={descriptor.label}>—</span>
  }
  return <Pill tone={descriptor.tone} variant="ghost">{descriptor.label}</Pill>
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
    return <span className="select-none text-ink-faint" title="No exceptions">—</span>
  }

  // toSorted leaves the caller's array untouched; the ranking is module scope
  // (SEVERITY_RANK) so it is not rebuilt for every rendered row.
  const sorted = items.toSorted((a, b) => SEVERITY_RANK[a.tone] - SEVERITY_RANK[b.tone])
  const [first, ...rest] = sorted

  return (
    <span className="flex items-center gap-1">
      <Pill tone={first.tone} variant="ghost">{first.label}</Pill>
      {rest.length > 0 && (
        <Tooltip content={rest.map((item) => item.label).join(' · ')}>
          <span className="shrink-0 cursor-default rounded-[var(--radius-pill)] px-1 text-[11px] font-medium text-ink-faint ring-1 ring-inset ring-border">
            +{rest.length}
          </span>
        </Tooltip>
      )}
    </span>
  )
}
