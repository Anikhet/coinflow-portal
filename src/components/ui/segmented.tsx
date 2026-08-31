import { cn } from '@/lib/cn'

/**
 * Two-or-three-way segmented control — the Amount/Count switch on each chart
 * and the Local/UTC switch in the page header.
 *
 * Options are laid out in a grid with equal columns rather than by content
 * width, so switching does not resize the control and the thumb never moves
 * under the cursor between clicks.
 */
export function Segmented<T extends string>({ value, onChange, options, ariaLabel }: {
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
  ariaLabel: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid h-7 shrink-0 auto-cols-fr grid-flow-col gap-0.5 rounded-[var(--radius-control)] bg-surface-sunk p-0.5 ring-1 ring-inset ring-border"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[5px] px-2.5 text-sm font-medium transition-colors',
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
