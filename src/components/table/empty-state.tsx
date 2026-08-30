import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Empty states are sized to roughly the height of a populated page so the
 * layout does not collapse when a filter returns nothing and then jump back
 * when it returns rows. The original Customers page rendered one row above
 * ~700px of dead canvas with no explanation.
 */
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-[320px] flex-col items-center text-center">
      <span className="mb-3 grid size-10 place-items-center rounded-full bg-surface-sunk text-ink-faint">
        <Icon className="size-4.5" />
      </span>
      <p className="text-[14px] font-medium text-ink">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
