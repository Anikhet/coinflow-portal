import { NavLink } from 'react-router-dom'
import { PanelLeft, Search, LogOut, Moon, Sun } from 'lucide-react'
import { NAV_GROUPS, type NavItem } from '@/lib/nav'
import { useUiStore } from '@/stores/ui-store'
import { CoinflowLogo } from './logo'
import { MerchantSwitcher } from './merchant-switcher'
import { Tooltip } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/input'
import { cn } from '@/lib/cn'

/**
 * Primary navigation.
 *
 * Collapsed mode keeps a fixed 60px rail rather than unmounting — the content
 * area's margin animates, but nav item boxes never change size, so collapsing
 * cannot cause the icons to reflow or the page to shift.
 */

function NavRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon

  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'group relative flex h-8 items-center gap-2.5 rounded-[var(--radius-control)] px-2',
          'text-[13px] font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-brand-soft text-brand'
            : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
          item.placeholder && 'cursor-default',
        )
      }
    >
      {({ isActive }) => (
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
          <Icon className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge != null && (
                <span className="shrink-0 rounded-full bg-[var(--tone-critical-bg)] px-1.5 text-[10px] font-semibold tabular-nums text-[var(--tone-critical-fg)]">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  )

  return collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link
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
        <CoinflowLogo compact={collapsed} />
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
        {NAV_GROUPS.map((group, index) => (
          <div key={group.label ?? `group-${index}`} className="space-y-0.5">
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
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
            BM
          </span>
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
        {collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            className="mt-2 grid h-7 w-full place-items-center rounded-[6px] text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <PanelLeft className="size-4 rotate-180" />
          </button>
        )}
      </div>
    </aside>
  )
}
