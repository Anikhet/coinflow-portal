import { X } from 'lucide-react'

/**
 * FILTER CHIP
 * =============================================================================
 * One applied condition, stated and removable.
 *
 * The chip carries two different kinds of word — the FIELD that was filtered
 * and the VALUE it was set to — plus one action. The previous version set all
 * three in the same 11px register separated by a 4px gap, which produced
 * "searchcourst ✕": three unrelated things read as one string. The fix is not
 * more space, it is the International Typographic Style's basic move —
 * distinguish content by giving each class of information its own typographic
 * register and separate the functional zones with a rule rather than a gap.
 *
 * REGISTER, NOT GAP
 *   The field is set in tracked uppercase at ink-faint; the value in sentence
 *   case at full ink. Case, weight and colour do the separating, so the two
 *   words cannot merge no matter how tight the setting. This is the same
 *   treatment every other field label in the app already uses — the section
 *   heading, the fact label, the column header, the dropdown label — so the
 *   chip stops being the one place a label is set as running text.
 *
 * A RULE SEPARATES STATEMENT FROM ACTION
 *   The hairline before the ✕ divides the chip into "what is applied" and
 *   "remove it". A rule is an organising device, not decoration: it means the
 *   glyph no longer floats in the sentence as if it were punctuation, and it
 *   gives the button a real 24px target instead of the 12px glyph it was.
 *
 * ONE ANATOMY
 *   24px tall, on the same 6px radius as every other chip, and the value
 *   truncates at a fixed measure — a pasted 200-character search must not push
 *   the whole row into a second line. It is deliberately NOT <Pill>: a Pill is
 *   a passive 20px label whose taxonomy reserves colour for status, and this is
 *   an interactive control that lives in chrome. Reusing it would have meant
 *   widening the pill contract to admit a segmented button.
 */
export function FilterChip({ field, value, onRemove }: {
  field: string
  value: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex h-6 max-w-full items-center rounded-[var(--radius-pill)] bg-surface ring-1 ring-inset ring-border">
      <span className="flex min-w-0 items-center gap-1.5 pl-2 pr-1.5">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
          {field}
        </span>
        <span className="min-w-0 max-w-[200px] truncate text-sm text-ink">{value}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${field} filter: ${value}`}
        className="grid size-6 shrink-0 place-items-center rounded-r-[var(--radius-pill)] border-l border-border text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}
