import { Check, Copy } from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/cn'

/**
 * Copy affordance for IDs and hashes.
 *
 * Hidden until the row or field is hovered/focused. The original table rendered
 * a persistent copy icon beside every merchant and payment ID — fourteen static
 * icons per screen of noise competing with the data. Revealing on hover keeps
 * the capability while giving the column back to the content.
 *
 * Remains keyboard reachable at all times via focus-visible.
 */
export function CopyButton({ value, label = 'Copy', className }: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const handleCopy = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      void navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1400)
    },
    [value],
  )

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : `${label}: ${value}`}
      className={cn(
        'inline-grid size-5 shrink-0 place-items-center rounded text-ink-faint',
        'opacity-0 transition-opacity hover:bg-surface-hover hover:text-ink',
        'group-hover/row:opacity-100 focus-visible:opacity-100 [&_svg]:size-3',
        copied && 'opacity-100 text-[var(--tone-positive-fg)]',
        className,
      )}
    >
      {copied ? <Check /> : <Copy />}
    </button>
  )
}
