import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

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
 * QUIET BY DEFAULT
 *   An empty result is a normal outcome, not an error: muted icon, no colour.
 *   The `critical` tone is reserved for genuine failures, so when colour does
 *   appear it means something.
 */
export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  /** Optional short summary of what produced this state (active filters, etc). */
  detail?: ReactNode
  action?: ReactNode
  secondaryAction?: ReactNode
  tone?: EmptyStateTone
}

export function EmptyState({
  icon: Icon, title, description, detail, action, secondaryAction, tone = 'neutral',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex max-w-[340px] flex-col items-center px-6 text-center"
    >
      <span
        className={cn(
          'mb-3 grid size-10 shrink-0 place-items-center rounded-full',
          tone === 'critical'
            ? 'bg-[var(--tone-critical-bg)] text-[var(--tone-critical-fg)]'
            : 'bg-surface-sunk text-ink-faint',
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>

      <p className="text-[14px] font-medium text-ink">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{description}</p>

      {detail && <div className="mt-3">{detail}</div>}

      {(action || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
