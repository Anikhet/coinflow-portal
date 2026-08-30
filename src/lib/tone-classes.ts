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

