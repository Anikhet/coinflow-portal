import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export const Tabs = TabsPrimitive.Root

/**
 * The tab strip scrolls horizontally rather than clipping. The original drawer
 * cut "Audit Log" in half at the panel edge, which reads as a rendering bug and
 * hides a destination entirely.
 */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-4',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative shrink-0 whitespace-nowrap px-2.5 py-2.5 text-base font-medium text-ink-muted',
        'transition-colors hover:text-ink',
        'data-[state=active]:text-ink',
        // Underline is a pseudo-element so activating a tab does not change the
        // trigger's box and shift its neighbours.
        'after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent',
        'data-[state=active]:after:bg-brand',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('flex-1 overflow-y-auto outline-none animate-in-up', className)}
      {...props}
    />
  )
}

/** Count suffix on a tab label — muted so it never competes with the label. */
export function TabCount({ value }: { value: number }) {
  return <span className="ml-1.5 text-xs tabular-nums text-ink-faint">{value}</span>
}
