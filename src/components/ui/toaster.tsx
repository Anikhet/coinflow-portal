import { Toaster as SonnerToaster } from 'sonner'
import { useUiStore } from '@/stores/ui-store'

/**
 * App-wide toast surface, drawn in the International Typographic (Swiss) idiom.
 *
 * The rules that shape it:
 *  - A hairline rule and a flat ground — no glow, no gradient. The radius and
 *    shadow are NOT Swiss; they are the app's, taken from --radius-surface so
 *    the toast matches the dropdown, the palette and the date picker. A style
 *    borrowed for one component does not get to overrule the token layer every
 *    other floating panel already answers to.
 *  - Type carries the hierarchy instead of colour: a small uppercase label with
 *    open tracking over the value set in mono. Success and failure differ only
 *    by a 2px rule on the left edge, so the card itself never changes weight.
 *  - Iconography is dropped entirely (`icons={{}}`); a checkmark would be a
 *    second, redundant signal next to the word "copied".
 *  - Bottom-right, where the eye already goes for confirmation of an action
 *    and where nothing in the shell lives — the left edge belongs to the nav.
 *
 * Theme is read from the same store that drives <html data-theme>, so the toast
 * never lags the rest of the UI.
 */
export function Toaster() {
  const theme = useUiStore((state) => state.theme)

  return (
    <SonnerToaster
      theme={theme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      duration={2400}
      offset={24}
      gap={8}
      icons={{}}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            'flex w-[var(--width)] flex-col gap-1 border border-border bg-surface p-3',
            'rounded-[var(--radius-surface)] border-l-2 border-l-ink shadow-lg',
          ].join(' '),
          title: 'text-xs font-medium uppercase tracking-[0.08em] text-ink',
          description: 'font-mono text-xs text-ink-faint break-all',
          success: 'border-l-[var(--tone-positive-fg)]',
          error: 'border-l-[var(--tone-critical-fg)]',
        },
      }}
    />
  )
}
