import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
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
          // No resting border. The switcher sits alone above the nav with
          // nothing to be confused for, so an outline only draws a box the eye
          // has to dismiss — and it made the avatar read as a chip inside a
          // second chip. The hover fill still carries the affordance, and the
          // focus ring is untouched for keyboard users.
          'flex w-full items-center gap-2 rounded-[var(--radius-control)] p-1.5 text-left',
          'transition-colors hover:bg-surface-hover',
          collapsed && 'justify-center',
        )}
      >
        <Avatar name={active.name} size={24} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium leading-tight text-ink">{active.name}</span>
              <span className="block truncate text-xs leading-tight text-ink-faint">{active.scope}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-ink-faint" />
          </>
        )}
      </DropdownTrigger>

      <DropdownContent className="w-[232px]">
        <DropdownLabel>Switch scope</DropdownLabel>
        {MERCHANTS.map((merchant) => (
          <DropdownItem key={merchant.id} onSelect={() => setActiveId(merchant.id)}>
            <Avatar name={merchant.name} />
            <span className="flex-1 truncate">{merchant.name}</span>
            {merchant.id === activeId && <Check className="text-brand" />}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  )
}
