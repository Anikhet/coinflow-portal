import { hueFor, initialsFor } from '@/lib/avatar'
import { cn } from '@/lib/cn'

/**
 * Initial-based identity chip. Colour and letters are both derived from `name`
 * (see lib/avatar.ts), so the same account looks identical everywhere it
 * appears and no caller has to pick a colour.
 */
export function Avatar({ name, size = 20, className }: {
  name: string
  /** Box size in px. Fixed, never content-derived, so a chip cannot shift a row. */
  size?: number
  className?: string
}) {
  const hue = hueFor(name)

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-[6px] font-semibold leading-none',
        'ring-1 ring-inset ring-black/[0.04]',
        className,
      )}
      style={{
        width: size,
        height: size,
        // Font scales with the box so one component serves the 24px trigger and
        // the 20px menu rows without a second set of size classes.
        fontSize: Math.round(size * 0.44),
        background: `oklch(var(--avatar-bg-l) var(--avatar-bg-c) ${hue})`,
        color: `oklch(var(--avatar-fg-l) var(--avatar-fg-c) ${hue})`,
      }}
    >
      {initialsFor(name)}
    </span>
  )
}
