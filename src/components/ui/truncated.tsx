import type { ReactNode } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { useIsOverflowing } from '@/hooks/use-is-overflowing'
import { cn } from '@/lib/cn'

/**
 * Text that truncates to its column and reveals the full value on hover.
 *
 * Truncation is a promise that the data is still there; without a way back to
 * it, a clipped email is just missing data. The tooltip is the way back.
 *
 * It is attached ONLY when the text is actually clipped. A tooltip on every
 * string would fire on names that fit perfectly well, and a hover affordance
 * that usually says nothing new trains people to ignore the one that does.
 *
 * `title` overrides the tooltip's text for cases where the rendered markup is
 * not the value people need — a cell holding a name AND an email under one
 * ellipsis has to reveal both, not just the half that got cut.
 *
 * `always` opts out of the overflow test, for text that is abbreviated in JS
 * rather than by CSS (a middle-truncated ID reads as "3fa8…21b7" at any width,
 * so no measurement will ever call it clipped).
 */
export function Truncated({ children, title, always = false, className, side = 'top' }: {
  children: ReactNode
  title?: string
  always?: boolean
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  const { ref, isOverflowing, text } = useIsOverflowing<HTMLSpanElement>()

  const content = isOverflowing || always ? title ?? text : null

  return (
    <Tooltip content={content || null} side={side}>
      <span ref={ref} className={cn('min-w-0 truncate', className)}>
        {children}
      </span>
    </Tooltip>
  )
}
