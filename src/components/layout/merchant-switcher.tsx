import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger } from '@/components/ui/dropdown'
import { cn } from '@/lib/cn'

const MERCHANTS = [
  { id: 'admin', name: 'Coinflow Admin', scope: 'All merchants' },
  { id: 'triumph', name: 'Triumph_TCG', scope: 'Merchant' },
  { id: 'courtside', name: 'courtside', scope: 'Merchant' },
  { id: 'icybox', name: 'icybox', scope: 'Merchant' },
  { id: 'packz', name: 'packz', scope: 'Merchant' },
]

/**
 * Scope switcher. The active scope changes what every other page means, so it
 * sits at the top of the sidebar above navigation rather than in a page header.
 */
export function MerchantSwitcher({ collapsed }: { collapsed: boolean }) {
  const [activeId, setActiveId] = useState('admin')
  const active = MERCHANTS.find((merchant) => merchant.id === activeId) ?? MERCHANTS[0]

  return (
    <Dropdown>
      <DropdownTrigger
        className={cn(
          'flex w-full items-center gap-2 rounded-[var(--radius-control)] p-1.5 text-left',
          'ring-1 ring-inset ring-border transition-colors hover:bg-surface-hover',
          collapsed && 'justify-center',
        )}
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-[6px] bg-brand-soft text-[11px] font-semibold text-brand">
          {active.name.slice(0, 2).toUpperCase()}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium leading-tight text-ink">{active.name}</span>
              <span className="block truncate text-[11px] leading-tight text-ink-faint">{active.scope}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-ink-faint" />
          </>
        )}
      </DropdownTrigger>

      <DropdownContent align="start" className="w-[232px]">
        <DropdownLabel>Switch scope</DropdownLabel>
        {MERCHANTS.map((merchant) => (
          <DropdownItem key={merchant.id} onSelect={() => setActiveId(merchant.id)}>
            <span className="grid size-5 place-items-center rounded-[5px] bg-surface-sunk text-[10px] font-semibold text-ink-muted">
              {merchant.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="flex-1 truncate">{merchant.name}</span>
            {merchant.id === activeId && <Check className="text-brand" />}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  )
}
