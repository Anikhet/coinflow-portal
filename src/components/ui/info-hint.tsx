import { Info } from 'lucide-react'
import { Tooltip } from './tooltip'
import { GLOSSARY, type GlossaryTerm } from '@/lib/glossary'
import { cn } from '@/lib/cn'

/**
 * The small "what does this mean?" affordance beside a jargon term.
 *
 * A real <button>, not a bare icon: the explanation has to be reachable by
 * keyboard and announced to a screen reader, and a hover-only tooltip is
 * invisible to both. `type="button"` because these often sit inside a
 * sortable column header, and a bare <button> in a form would submit it.
 *
 * Deliberately low-contrast and small. These appear beside a great many terms,
 * and an icon that competes with the label it explains costs more attention
 * than the explanation returns. It darkens on hover and focus.
 */
export function InfoHint({ term, label, className, side = 'top' }: {
  /** Key into the shared glossary — copy is never written at the call site. */
  term: GlossaryTerm
  /** Human name of the thing being explained, for the accessible label. */
  label: string
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <Tooltip content={GLOSSARY[term]} side={side}>
      <button
        type="button"
        aria-label={`What is ${label}?`}
        // Stop the click reaching a sortable header or a clickable row.
        onClick={(event) => { event.preventDefault(); event.stopPropagation() }}
        className={cn(
          'inline-grid size-3.5 shrink-0 place-items-center rounded-full align-middle',
          'text-ink-faint/70 transition-colors hover:text-ink-muted focus-visible:text-ink-muted',
          className,
        )}
      >
        <Info className="size-3" aria-hidden />
      </button>
    </Tooltip>
  )
}
