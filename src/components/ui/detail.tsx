import type { ReactNode } from 'react'
import type { ToneDescriptor } from '@/lib/tone-map'
import { TONE_TEXT } from '@/lib/tone-classes'
import { cn } from '@/lib/cn'
import { InfoHint } from './info-hint'
import type { GlossaryTerm } from '@/lib/glossary'

/**
 * Detail-view building blocks, shared by both drawers so a labelled value looks
 * the same whether it describes a payment or a customer.
 */

export function Section({ title, term, action, children, className }: {
  title: string
  /** Glossary key — renders an info hint beside the heading. */
  term?: GlossaryTerm
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('px-5 py-5', className)}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-faint">{title}</h3>
          {term && <InfoHint term={term} label={title} />}
        </span>
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
      <span className="shrink-0 text-base text-ink-muted">{label}</span>
      <span className={cn('min-w-0 truncate text-right text-base text-ink', mono && 'font-mono text-sm')}>
        {value}
      </span>
    </div>
  )
}

/**
 * A label/value pair in the two-column facts grid.
 *
 * NOT a box. Six facts used to mean six rounded, bordered cards stacked two
 * across — twelve borders drawn to present six pieces of information, with the
 * section already sitting inside the drawer's own frame. Structure now comes
 * from the grid and a single hairline between rows, which is the whole premise
 * of the International Typographic Style this app's tables already follow:
 * alignment and type do the work, and a rule appears only at a real boundary.
 *
 * The practical gain is density. The same six facts occupy roughly a third
 * less height, so the Solana block below them is visible without scrolling.
 *
 * `media` is a leading mark for facts that name a THING the product already has
 * a mark for — a customer, a merchant, a payment rail. Those marks exist in the
 * table rows one click away, so a fact card that renders the same customer as
 * bare text makes the reader re-identify by name what they had been picking out
 * by colour and shape a moment earlier. It is optional and deliberately narrow:
 * a fact whose value is a sentence or a number gets no mark, because there is
 * nothing to identify.
 */
export function Fact({ label, term, value, hint, badge, media }: {
  label: string
  /** Glossary key — renders an info hint beside the label. */
  term?: GlossaryTerm
  value: ReactNode
  hint?: string
  badge?: ReactNode
  media?: ReactNode
}) {
  return (
    // The top rule is suppressed on the first ROW (both cells) by FactGrid, so
    // the section heading above is not immediately followed by a second line.
    <div className="border-t border-border py-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
          {term && <InfoHint term={term} label={label} />}
        </span>
        {badge}
      </div>
      <p className="mt-1 flex items-start gap-1.5 break-words text-base font-medium text-ink">
        {/* mt-px optically centres a 20px mark against the 13px cap height
            beside it; items-center would drop it when the value wraps to two
            lines, which the issuer name routinely does. */}
        {media && <span className="mt-px shrink-0">{media}</span>}
        <span className="min-w-0">{value}</span>
      </p>
      {hint && <p className="mt-1 text-xs leading-snug text-ink-faint">{hint}</p>}
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
 * The GLYPH always carries its tone's colour — a tick that means "approved"
 * reads green, the same green the settled pill uses. The LABEL is what stays in
 * plain ink for a default posture. That split keeps both properties: the state
 * of each control is legible from colour at a glance, and a deviating value is
 * still the only thing rendered as coloured TEXT, so it remains the loudest
 * thing in the grid rather than competing with a row of green words.
 */
export function ControlValue({ descriptor }: { descriptor: ToneDescriptor }) {
  const Icon = descriptor.icon
  return (
    <span className="flex items-center gap-1.5">
      {Icon && (
        <Icon
          className={cn('size-3.5 shrink-0', TONE_TEXT[descriptor.tone])}
        />
      )}
      <span className={cn(!descriptor.isDefault && TONE_TEXT[descriptor.tone])}>{descriptor.label}</span>
    </span>
  )
}

export function FactGrid({ children }: { children: ReactNode }) {
  return (
    // gap-x only: the vertical rhythm comes from each Fact's own padding and
    // its hairline, so a gap here would double-space the rules and break the
    // grid into floating pairs again. The nth-child rule drops the rule on the
    // first two cells, i.e. the first row.
    <div className="grid grid-cols-2 gap-x-8 [&>*:nth-child(-n+2)]:border-t-0">
      {children}
    </div>
  )
}

/**
 * Full-width callout for a single notable fact.
 *
 * Takes a ToneDescriptor rather than a loose icon and tone. Every callout used
 * to choose its own: the payment drawer drew an OUTLINE lucide shield in an
 * `info` chip for protection, while the column three feet away drew the FILLED
 * registry shield in `neutral` for the identical state. Same fact, two shapes,
 * two colours — which is precisely what a central registry exists to stop.
 *
 * Prose stays a prop, because a callout explains at more length than a pill's
 * one or two words. Only the glyph and the tone come from the registry.
 */
export function Callout({ descriptor, title, description }: {
  descriptor: ToneDescriptor
  title: string
  description: string
}) {
  const Icon = descriptor.icon
  const toneClass = {
    positive: 'text-[var(--tone-positive-fg)] bg-[var(--tone-positive-bg)]',
    caution: 'text-[var(--tone-caution-fg)] bg-[var(--tone-caution-bg)]',
    critical: 'text-[var(--tone-critical-fg)] bg-[var(--tone-critical-bg)]',
    info: 'text-[var(--tone-info-fg)] bg-[var(--tone-info-bg)]',
    neutral: 'text-ink-muted bg-surface-sunk',
  }[descriptor.tone]

  return (
    // items-stretch, not items-start: the chip is sized by the text block next
    // to it rather than by a fixed height, so it spans the title AND the
    // description as one block instead of hanging off the first line. Width
    // stays fixed so a stack of callouts keeps one left rule for its prose.
    <div className="flex items-stretch gap-2.5 rounded-[var(--radius-control)] border border-border p-2.5">
      <span className={cn('grid w-9 shrink-0 place-items-center rounded-[6px]', toneClass)}>
        {Icon && <Icon className="size-4" aria-hidden />}
      </span>
      <div className="min-w-0">
        <p className="text-base font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-ink-muted">{description}</p>
      </div>
    </div>
  )
}

