import { Pill } from './pill'
import type { ToneDescriptor } from '@/lib/tone-map'
import { cn } from '@/lib/cn'

/**
 * CANONICAL PILL RENDERERS
 * =============================================================================
 * Every status and every attribute in the app renders through one of these two
 * functions — tables, drawers, timelines, dashboard lists.
 *
 * They exist because the same concept was previously drawn differently
 * depending on where it appeared: a "Settled" status was a solid pill with a
 * glyph in the payments table, and a ghost pill with a dot in the dashboard's
 * "Needs attention" list. Two appearances for one meaning forces the reader to
 * re-learn the language on every screen, which is the exact failure the tone
 * registry was built to prevent.
 *
 * Both take a ToneDescriptor straight from the registry, so the tone, the
 * label and the glyph always agree and no call site re-decides any of them.
 */

/**
 * A status: the row's primary outcome. Always solid — it is the one tinted
 * anchor the eye lands on.
 *
 * Carries a glyph rather than a dot when the descriptor supplies one: a dot
 * encodes severity in colour ALONE, which is the accessibility failure the
 * icon set exists to fix. The dot survives only as the fallback.
 */
export function StatusPill({ descriptor }: { descriptor: ToneDescriptor }) {
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
            className={cn(descriptor.pulse && 'animate-spin [animation-duration:2s]')}
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
 * An attribute: a secondary fact about the record.
 *
 * Emphasis follows severity, not column. A refusal (critical) takes the tone
 * tint so it reads as an alarm; everything else stays a quiet ghost chip.
 * Otherwise "None" — the benign fact that a merchant never bought cover —
 * would shout exactly as loud as "Declined", a claim the network actively
 * refused, and nothing in the column would tell the operator which needed them.
 *
 * Callers are responsible for the default case: a descriptor marked `isDefault`
 * should render an em-dash, not a pill. `AttributeCell` does that for tables.
 */
export function AttributePill({ descriptor }: { descriptor: ToneDescriptor }) {
  const Icon = descriptor.icon
  const isRefusal = descriptor.tone === 'critical'

  return (
    <Pill
      tone={descriptor.tone}
      variant={isRefusal ? 'alert' : 'ghost'}
      icon={Icon ? <Icon aria-hidden /> : undefined}
    >
      {descriptor.label}
    </Pill>
  )
}
