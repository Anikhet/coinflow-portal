import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { useTabIndicator } from '@/components/ui/use-tab-indicator'

export const Tabs = TabsPrimitive.Root

/** Matches the trigger's `px-2.5`, so the bar underlines the label only. */
const UNDERLINE_INSET = 10

/**
 * The tab strip scrolls horizontally rather than clipping. The original drawer
 * cut "Audit Log" in half at the panel edge, which reads as a rendering bug and
 * hides a destination entirely.
 *
 * The active underline is a single element owned by the list, not a border on
 * each trigger, so changing tabs slides one bar across rather than swapping two
 * separate underlines.
 */
export function TabsList({ className, children, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const { listRef, indicator } = useTabIndicator<HTMLDivElement>()

  return (
    <TabsPrimitive.List
      ref={listRef}
      className={cn(
        'relative flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-4',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          // 3px, not the original hairline. A 2px bar moving is easy to miss
          // entirely — the motion is real, but there is not enough of it on
          // screen to register. Extra weight is what makes the glide legible.
          'pointer-events-none absolute -bottom-px left-0 h-[3px] origin-left rounded-full bg-brand',
          // Translate + scale rather than animating `left`/`width`: those are
          // layout properties and would reflow the strip on every frame.
          //
          // A symmetric ease-in-out, NOT the drawer's (0.16, 1, 0.3, 1). That
          // curve covers ~83% of the travel in its first 70ms and then creeps,
          // which the eye reads as a snap with a lazy tail rather than a glide.
          // This one accelerates and decelerates evenly, so the bar is visibly
          // mid-flight halfway through and actually looks like it is moving.
          // 300ms ease-in-out matches the sliding indicator in the echos
          // `animated-tabs` component, so tab motion feels the same in both.
          'transition-[transform,opacity] duration-300 ease-in-out',
          'motion-reduce:transition-none',
          // The very first placement jumps into position; only later moves slide.
          !indicator.ready && 'opacity-0 transition-none',
        )}
        // Base width is 1px so scaleX() reads directly as the target width in
        // pixels. The inset keeps the bar under the label, not the trigger's
        // horizontal padding — matching the px-2.5 the trigger uses.
        style={{
          width: 1,
          transform: `translateX(${indicator.left + UNDERLINE_INSET}px) scaleX(${Math.max(
            indicator.width - UNDERLINE_INSET * 2,
            0,
          )})`,
        }}
      />
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative shrink-0 whitespace-nowrap px-2.5 py-2.5 text-base font-medium text-ink-muted',
        // Label colour eases on the same curve and duration as the sliding
        // underline, so the two halves of the transition read as one motion.
        'transition-colors duration-300 ease-in-out hover:text-ink',
        'data-[state=active]:text-ink',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('flex-1 overflow-y-auto outline-none animate-tab-panel', className)}
      {...props}
    />
  )
}

/** Count suffix on a tab label — muted so it never competes with the label. */
export function TabCount({ value }: { value: number }) {
  return <span className="ml-1.5 text-xs tabular-nums text-ink-faint">{value}</span>
}
