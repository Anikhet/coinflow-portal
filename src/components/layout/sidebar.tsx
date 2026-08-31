import { NavLink, useLocation } from 'react-router-dom'
import { PanelLeft, Search, LogOut, Moon, Sun } from 'lucide-react'
import { NAV_GROUPS, type NavItem } from '@/lib/nav'
import { useUiStore } from '@/stores/ui-store'
import { CoinflowLogo } from './logo'
import { MerchantSwitcher } from './merchant-switcher'
import { Tooltip } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Pill } from '@/components/ui/pill'
import { cn } from '@/lib/cn'

/**
 * Primary navigation.
 *
 * Collapsed mode keeps a fixed 60px rail rather than unmounting — the content
 * area's margin animates, but nav item boxes never change size, so collapsing
 * cannot cause the icons to reflow or the page to shift.
 */

/** Collapsed rows render no text, so the name (and any count) must come from aria. */
function accessibleNameFor(item: NavItem) {
  return item.badge != null ? `${item.label}, ${item.badge} pending` : item.label
}

function NavRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon
  const { pathname } = useLocation()

  /**
   * Active state is derived here rather than via NavLink's render-prop.
   *
   * Passing BOTH a function `className` and function `children` to NavLink does
   * not work: the className function is stringified into the class attribute.
   * The resulting string then splits on whitespace, so bare tokens like `flex`
   * and `px-2` accidentally applied while quoted ones like `"justify-center`
   * and `px-0"` did not — which silently left every collapsed icon 14px off
   * centre and killed the active styling. Deriving `isActive` from the location
   * keeps both props plain values and removes the whole failure mode.
   */
  const isActive =
    item.to === '/'
      ? pathname === '/'
      : pathname === item.to || pathname.startsWith(`${item.to}/`)

  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      aria-label={collapsed ? accessibleNameFor(item) : undefined}
      className={cn(
        'group relative flex h-8 items-center gap-2.5 rounded-[var(--radius-control)] px-2',
        'text-[13px] font-medium transition-colors',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-brand-soft text-brand'
          : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
        item.placeholder && 'cursor-default',
      )}
    >
        <>
          {/* Active marker is an absolutely positioned pseudo-bar so activating
              an item adds no width and cannot shift the label. */}
          <span
            aria-hidden
            className={cn(
              'absolute left-0 h-4 w-0.5 rounded-r-full bg-brand transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          {/* Duotone rather than a separate solid icon set: lucide ships
              outline only, and hand-drawing thirteen solid glyphs would have
              cost the distinct silhouettes this nav is built on (see nav.ts).
              Filling the existing paths keeps every outline exactly as chosen
              and just gives it a body.

              The active row fills harder. It already has a tint and a rail, so
              the weight is a third redundant cue for "you are here" rather than
              decoration — and at 4px of icon detail, weight is the cue that
              survives peripheral vision. */}
          <span className="relative shrink-0">
            <Icon className="size-4" fill="currentColor" fillOpacity={isActive ? 0.28 : 0.15} />
            {/* Collapsed, the row has nowhere to put an inline count, so the
                badge rides the icon's corner instead of disappearing. Dropping
                it would mean collapsing the sidebar silently hides every
                work-queue signal — the counts are the reason to look at these
                rows at all. Ring matches the sidebar surface so the bubble
                reads as sitting above the glyph rather than merged into it. */}
            {/* Deliberately NOT a <Pill>: this is an 8px overlay bubble pinned
                to the glyph's corner with an OUTSET ring that masks the icon
                behind it. Forcing it through the badge component would mean
                adding a size and a ring escape hatch that only this one caller
                would ever use — the component would get worse to make one call
                site shorter. */}
            {collapsed && item.badge != null && (
              <span
                aria-hidden
                className="absolute -right-2.5 -top-1.5 z-10 min-w-3 rounded-full bg-[var(--tone-critical-bg)] px-1 text-center text-[8px] font-semibold leading-[12px] tabular-nums text-[var(--tone-critical-fg)] ring-1 ring-surface"
              >
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge != null && (
                <Pill tone="critical" variant="solid" size="sm" className="rounded-full">
                  {item.badge}
                </Pill>
              )}
            </>
          )}
        </>
    </NavLink>
  )

  return collapsed ? (
    <Tooltip content={accessibleNameFor(item)} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  )
}

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const setCommandOpen = useUiStore((state) => state.setCommandOpen)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-surface',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[60px]' : 'w-[232px]',
      )}
    >
      <div className={cn('flex h-14 shrink-0 items-center gap-2 px-3', collapsed && 'justify-center px-0')}>
        {/* Collapsed, the logo IS the expand control — the only one. It is the
            largest, most obvious target in the rail and sits where the eye
            already goes, so reaching for it is the natural first instinct.
            There used to be a second chevron pinned to the bottom of the rail
            as well; two controls for one action just made the reader wonder
            whether they did different things. */}
        {collapsed ? (
          <Tooltip content="Expand sidebar" side="right">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              aria-expanded={false}
              className="grid size-8 place-items-center rounded-[8px] transition-colors hover:bg-surface-hover"
            >
              <CoinflowLogo compact />
            </button>
          </Tooltip>
        ) : (
          <CoinflowLogo compact={false} />
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="ml-auto grid size-7 place-items-center rounded-[6px] text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <PanelLeft className="size-4" />
          </button>
        )}
      </div>

      <div className={cn('shrink-0 px-3 pb-3', collapsed && 'px-2')}>
        <MerchantSwitcher collapsed={collapsed} />
      </div>

      <div className={cn('shrink-0 px-3 pb-3', collapsed && 'px-2')}>
        {collapsed ? (
          <Tooltip content="Search  ⌘K" side="right">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              aria-label="Search"
              className="grid h-8 w-full place-items-center rounded-[var(--radius-control)] text-ink-faint ring-1 ring-inset ring-border transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <Search className="size-4" />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex h-8 w-full items-center gap-2 rounded-[var(--radius-control)] px-2.5 text-left ring-1 ring-inset ring-border transition-colors hover:bg-surface-hover"
          >
            <Search className="size-3.5 shrink-0 text-ink-faint" />
            <span className="flex-1 text-[13px] text-ink-faint">Search</span>
            <Kbd>⌘K</Kbd>
          </button>
        )}
      </div>

      <nav className={cn('flex-1 space-y-4 overflow-y-auto px-3 pb-4', collapsed && 'px-2')}>
        {NAV_GROUPS.map((group) => (
          // The first destination in a group is a stable identity even when the
          // group itself is unlabelled, unlike its array position.
          <div key={group.label ?? group.items[0].to} className="space-y-0.5">
            {group.label && !collapsed && (
              <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
                {group.label}
              </p>
            )}
            {group.label && collapsed && <div className="mx-auto my-2 h-px w-5 bg-border" />}
            {group.items.map((item) => (
              <NavRow key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      <div className={cn('shrink-0 border-t border-border p-3', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-2', collapsed && 'flex-col gap-1')}>
          <Avatar name="Ben Meeder" size={28} className="rounded-full" />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium leading-tight text-ink">Ben Meeder</span>
              <span className="block truncate text-[11px] leading-tight text-ink-faint">Administrator</span>
            </span>
          )}
          <Tooltip content={theme === 'light' ? 'Dark mode' : 'Light mode'} side={collapsed ? 'right' : 'top'}>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="grid size-7 shrink-0 place-items-center rounded-[6px] text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
            >
              {theme === 'light' ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
            </button>
          </Tooltip>
          {!collapsed && (
            <Tooltip content="Sign out">
              <button
                type="button"
                aria-label="Sign out"
                className="grid size-7 shrink-0 place-items-center rounded-[6px] text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
              >
                <LogOut className="size-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </aside>
  )
}
