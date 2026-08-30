import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft } from 'lucide-react'
import { NAV_GROUPS, type NavItem } from '@/lib/nav'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

/**
 * Command palette (⌘K).
 *
 * The original sidebar advertised a ⌘K shortcut, so the affordance is kept.
 * Navigation-only here; in production this is where record lookup by payment ID
 * or customer email belongs.
 *
 * EFFECT DISCIPLINE
 * An earlier version used two effects to reset the query and the highlighted
 * index — one on open, one on every keystroke. Both were the "reset state when
 * a prop changes" anti-pattern: they ran a second render pass purely to undo
 * state that should never have persisted.
 *
 * Both are gone. The palette body is a separate component that Radix mounts
 * only while the dialog is open, so its `useState` initialisers reset the query
 * naturally on each open. The highlight is CLAMPED during render rather than
 * corrected in an effect, so it can never point past the end of a filtered
 * list — not even for the one frame an effect would take to fix it.
 *
 * The only remaining effect binds a global keyboard shortcut, which is a
 * genuine external-system subscription and has proper cleanup.
 */

const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen)
  const setOpen = useUiStore((state) => state.setCommandOpen)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-label="Command palette"
          className="fixed left-1/2 top-[18vh] z-[80] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface shadow-2xl animate-in-up"
        >
          <Dialog.Title className="sr-only">Search and navigate</Dialog.Title>
          <PaletteBody onDismiss={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * Mounted only while the palette is open, so all of its state is fresh on every
 * open without an effect to reset it.
 */
function PaletteBody({ onDismiss }: { onDismiss: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return NAV_ITEMS
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(needle))
  }, [query])

  // Derived during render, never synchronised in an effect: if filtering
  // shrinks the list below the stored highlight, the clamp corrects it in the
  // same render rather than one frame later.
  const activeIndex = Math.min(highlight, Math.max(0, results.length - 1))

  const commit = (index: number) => {
    const item = results[index]
    if (!item) return
    navigate(item.to)
    onDismiss()
  }

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setHighlight(Math.min(activeIndex + 1, results.length - 1))
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setHighlight(Math.max(activeIndex - 1, 0))
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          commit(activeIndex)
        }
      }}
    >
      <div className="flex h-12 items-center gap-2.5 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          autoFocus
          aria-label="Search pages"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            // Reset the highlight in the event handler that caused it —
            // the change is known here, so no effect is needed to observe it.
            setHighlight(0)
          }}
          placeholder="Jump to a page…"
          className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      {/* Fixed max height with internal scroll — the dialog box never resizes
          as results filter, so it does not jitter while typing. */}
      <ul className="max-h-[320px] overflow-y-auto p-1.5">
        {results.length === 0 ? (
          <li className="px-3 py-6 text-center text-[13px] text-ink-muted">No matches</li>
        ) : (
          results.map((item, index) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => commit(index)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px]',
                    index === activeIndex ? 'bg-surface-hover text-ink' : 'text-ink-muted',
                  )}
                >
                  <Icon className="size-4 shrink-0 text-ink-faint" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {index === activeIndex && <CornerDownLeft className="size-3.5 shrink-0 text-ink-faint" />}
                </button>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
