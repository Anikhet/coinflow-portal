import { cn } from '@/lib/cn'

export function Separator({ className, vertical = false }: { className?: string; vertical?: boolean }) {
  return (
    <div
      role="separator"
      className={cn(vertical ? 'h-full w-px' : 'h-px w-full', 'shrink-0 bg-border', className)}
    />
  )
}
