import type { ReactNode } from 'react'
import type { ToneDescriptor } from '@/lib/tone-map'
import { TONE_TEXT } from '@/lib/tone-classes'
import { cn } from '@/lib/cn'

/**
 * Detail-view building blocks, shared by both drawers so a labelled value looks
 * the same whether it describes a payment or a customer.
 */

export function Section({ title, action, children, className }: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('px-5 py-4', className)}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-faint">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

/** A label/value pair on one line. Value is right-aligned to form a column. */
export function Row({ label, value, mono = false }: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-4 border-b border-border py-1.5 last:border-0">
      <span className="shrink-0 text-[13px] text-ink-muted">{label}</span>
      <span className={cn('min-w-0 truncate text-right text-[13px] text-ink', mono && 'font-mono text-[12px]')}>
        {value}
      </span>
    </div>
  )
}

/** Boxed label/value used in the two-column facts grid. */
export function Fact({ label, value, hint, badge }: {
  label: string
  value: ReactNode
  hint?: string
  badge?: ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-control)] border border-border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
        {badge}
      </div>
      <p className="mt-1 break-words text-[13px] font-medium text-ink">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-ink-faint">{hint}</p>}
    </div>
  )
}

/**
 * A control's value as glyph + text, for use as a `Fact` value.
 *
 * Not a Pill: the surrounding Fact already supplies the label and the box, so a
 * pill here would put a chip inside a chip. And not `AttributeCell` either —
 * that renders an em-dash for default values, which is right in a dense table
 * column but wrong in a labelled field, where "Chargeback protection: —" tells
 * the reader nothing.
 *
 * A default posture stays in plain ink with a muted glyph. Colour is spent only
 * on values that deviate, so a healthy customer's grid has no colour in it at
 * all and the one bad field is the only thing that catches the eye.
 */
export function ControlValue({ descriptor }: { descriptor: ToneDescriptor }) {
  const Icon = descriptor.icon
  return (
    <span className="flex items-center gap-1.5">
      {Icon && (
        <Icon
          className={cn('size-3.5 shrink-0', descriptor.isDefault ? 'text-ink-faint' : TONE_TEXT[descriptor.tone])}
        />
      )}
      <span className={cn(!descriptor.isDefault && TONE_TEXT[descriptor.tone])}>{descriptor.label}</span>
    </span>
  )
}

export function FactGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}

/** Full-width callout for a single notable fact. */
export function Callout({ icon, title, description, tone = 'neutral' }: {
  icon: ReactNode
  title: string
  description: string
  tone?: 'positive' | 'caution' | 'critical' | 'info' | 'neutral'
}) {
  const toneClass = {
    positive: 'text-[var(--tone-positive-fg)] bg-[var(--tone-positive-bg)]',
    caution: 'text-[var(--tone-caution-fg)] bg-[var(--tone-caution-bg)]',
    critical: 'text-[var(--tone-critical-fg)] bg-[var(--tone-critical-bg)]',
    info: 'text-[var(--tone-info-fg)] bg-[var(--tone-info-bg)]',
    neutral: 'text-ink-muted bg-surface-sunk',
  }[tone]

  return (
    <div className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-border p-2.5">
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-[6px] [&_svg]:size-3.5', toneClass)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">{description}</p>
      </div>
    </div>
  )
}
