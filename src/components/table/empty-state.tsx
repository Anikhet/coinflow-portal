import type { ReactNode } from 'react'
import type { EmptyGlyphName } from '@/components/icons/empty-glyphs'
import { cn } from '@/lib/cn'
import { EmptyStateMark } from './empty-state-mark'

export type EmptyStateTone = 'neutral' | 'critical'

/**
 * EMPTY STATE
 * =============================================================================
 * The presentational half of the empty-state system. It knows how an empty
 * surface LOOKS; `TableEmpty` decides WHICH one to show.
 *
 * Design rules encoded here:
 *
 * ANNOUNCED, NOT JUST DRAWN
 *   A table going from 25 rows to nothing is a state change a sighted user
 *   perceives instantly and a screen-reader user does not. The container is a
 *   polite live region so the title and description are read out when the
 *   result set empties, without stealing focus mid-typing.
 *
 * ALWAYS A WAY OUT
 *   Every empty state offers at least one next action. A dead end that only
 *   says "nothing here" makes the user suspect the app is broken. The primary
 *   action undoes whatever caused the emptiness (clear filters, retry); the
 *   secondary offers the adjacent path.
 *
 * NO LAYOUT SHIFT
 *   The block is centred inside a caller-sized box (see `DataTable`), which
 *   reserves the height of a populated page. Nothing above it moves when rows
 *   disappear and reappear, and the icon has fixed dimensions.
 *
 * TWO WIDTHS, ONE MEASURE
 *   `layout="page"` stretches the card across its whole region (used when the
 *   empty state IS the page); the default keeps it to a 420px card nested in a
 *   populated surface. In both cases the COPY stays capped at 420px and
 *   centred — a description stretched to 1000px is unreadable, so the card
 *   grows but the text column never does.
 *
 * A CONTAINED CARD, NOT LOOSE TEXT
 *   The block renders as a bordered surface panel — the same white card, radius
 *   and hairline border every other content region uses — rather than as text
 *   floating on the canvas. Loose centred text in a large void reads as a
 *   rendering failure; a deliberate, padded card reads as a designed state and
 *   gives the copy and its actions a clear boundary. Generous internal padding
 *   keeps it from looking like an error toast.
 *
 * BRAND GRADIENT MARK
 *   The mark is a solid glyph filled with the Coinflow violet gradient
 *   (`--brand` → `--brand-hover`) and lit by a radial highlight — see
 *   `EmptyStateMark` for why it is drawn that way and how it scales between
 *   the two layouts. Violet is
 *   this system's identity colour and is deliberately excluded from the status
 *   tone set (see index.css), so using it here cannot be mistaken for a
 *   severity signal the way a green or amber mark would be — an empty table is
 *   not "good" or "warning", it is simply the product speaking. Both stops are
 *   tokens, so the mark re-derives itself in dark mode instead of burning in a
 *   hex pair that only works on white.
 *
 *   The `critical` tone swaps in the red ramp, because a failed request IS a
 *   severity signal and must not wear the brand. Both gradients are defined as
 *   `--gradient-*` tokens in index.css, not inlined here — a component is the
 *   wrong place to author a colour.
 */
export interface EmptyStateProps {
  /** Which mark to draw — a STATE name, not a picture. See empty-glyphs.tsx. */
  glyph: EmptyGlyphName
  title: string
  /**
   * Optional: some empty states say everything in the title. The
   * filtered-to-nothing state, for instance, follows its title with the actual
   * criteria chips — a sentence restating the corpus size in between just
   * pushes the useful part further from the heading.
   */
  description?: string
  /** Optional short summary of what produced this state (active filters, etc). */
  detail?: ReactNode
  action?: ReactNode
  secondaryAction?: ReactNode
  tone?: EmptyStateTone
  /**
   * `contained` (default) — a 420px card inside a populated region.
   * `page` — fills the region it is given, for whole-page empty states.
   */
  layout?: 'contained' | 'page'
}

export function EmptyState({
  glyph, title, description, detail, action, secondaryAction,
  tone = 'neutral', layout = 'contained',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex w-full flex-col items-center justify-center text-center',
        'rounded-[var(--radius-surface)] border border-border bg-surface px-6 py-8',
        'shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        // `flex-1 self-stretch` rather than `h-full`: the page wrapper is a
        // flex box whose own height comes from flex growth, so a percentage
        // height has no definite parent to resolve against and collapses to
        // the content. Stretching as a flex item works regardless.
        layout === 'page' ? 'flex-1 self-stretch' : 'mx-auto max-w-[420px]',
      )}
    >
      {/* Inner measure: the card may be 1200px wide, the prose never is. The
          page layout gets a wider measure (680px) because its descriptions are
          one sentence written to sit on ONE line — at 420px they broke into a
          two-line ragged block that reads as a paragraph of bad news rather
          than a caption. The nested card keeps the tighter 420px. */}
      <div className={cn('flex w-full flex-col items-center', layout === 'page' ? 'max-w-[680px]' : 'max-w-[420px]')}>
        <EmptyStateMark glyph={glyph} tone={tone} size={layout === 'page' ? 'page' : 'contained'} />

        <p className="text-lg font-medium text-ink">{title}</p>
        {description && (
          <p className="mt-1 text-base leading-relaxed text-balance text-ink-muted">{description}</p>
        )}

        {detail && <div className="mt-3">{detail}</div>}

        {(action || secondaryAction) && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  )
}
