import type { Tone } from '@/types'

/**
 * Tone → text colour, for the few places a tone must colour a bare glyph rather
 * than a pill (the filter menu's status options). Kept out of pill.tsx so that file
 * exports components only — mixing constants in breaks React Fast Refresh.
 */
export const TONE_TEXT: Record<Tone, string> = {
  positive: 'text-[var(--tone-positive-fg)]',
  caution:  'text-[var(--tone-caution-fg)]',
  critical: 'text-[var(--tone-critical-fg)]',
  info:     'text-[var(--tone-info-fg)]',
  neutral:  'text-ink-muted',
}


/**
 * Tone → glyph colour for a control whose LABEL must stay ink.
 *
 * A menu row is a sentence the user is about to act on, and colouring the words
 * "Block customer" red states the outcome as though it had already happened.
 * The mark carries the tone; the text stays neutral. `TONE_TEXT` remains the
 * right map wherever the label IS the status (a filter option, a Fact value).
 */
export const TONE_GLYPH: Record<Tone, string> = {
  positive: '[&_svg]:text-[var(--tone-positive-fg)]',
  caution:  '[&_svg]:text-[var(--tone-caution-fg)]',
  critical: '[&_svg]:text-[var(--tone-critical-fg)]',
  info:     '[&_svg]:text-[var(--tone-info-fg)]',
  neutral:  '[&_svg]:text-ink-faint',
}
