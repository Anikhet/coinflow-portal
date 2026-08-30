import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

/**
 * Skeletons must occupy the exact box of the content they stand in for,
 * otherwise the swap causes layout shift. Callers pass explicit dimensions;
 * this component deliberately has no intrinsic size.
 */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn('animate-pulse rounded-[var(--radius-pill)] bg-surface-sunk', className)}
    />
  )
}
