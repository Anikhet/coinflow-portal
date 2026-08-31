import { ActivityTab } from './tabs/activity-tab'
import { AuditTab } from './tabs/audit-tab'
import { DisputesTab } from './tabs/disputes-tab'
import { MethodsTab } from './tabs/methods-tab'
import { OverviewTab } from './tabs/overview-tab'
import { VerificationTab } from './tabs/verification-tab'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { DRAWER_HEADER_CLASS, DrawerSkeleton } from '@/components/ui/drawer-chrome'
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/dropdown'
import { RecordUnavailable } from '@/components/ui/record-unavailable'
import { Sheet, SheetClose, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { useAsync } from '@/hooks/use-async'
import { truncateId } from '@/lib/format'
import { blockedTone, customerExceptions, kycTone } from '@/lib/tone-map'
import { fetchCustomer } from '@/mocks/api'
import { useDrawerStore } from '@/stores/drawer-store'
import type { Customer } from '@/types'
import { Ban, ChevronDown, ChevronLeft, ChevronRight, Download, Flag, ShieldCheck, X } from 'lucide-react'

/**
 * CUSTOMER DRAWER
 * =============================================================================
 * Shares the shell, header geometry and tab mechanics of the payment drawer so
 * the two records behave identically.
 *
 * The Overview tab is deliberately organised as a fraud-triage surface rather
 * than a profile page, because that is what the data is for. The original
 * signalled this only through a single red parenthesised count next to
 * "IP LOCATIONS (5)" — easy to miss. Here, elevated cardinality is stated
 * explicitly at the top of the tab.
 */

export function CustomerDrawer() {
  const customerId = useDrawerStore((state) => state.customerId)
  const closeAll = useDrawerStore((state) => state.closeAll)

  const { data: customer, loading, error, reload } = useAsync(
    () => (customerId ? fetchCustomer(customerId) : Promise.resolve(null)),
    [customerId],
  )

  return (
    <Sheet
      open={customerId != null}
      onOpenChange={(open) => !open && closeAll()}
      size="lg"
      label="Customer detail"
    >
      {loading ? (
        <CustomerDrawerSkeleton />
      ) : !customer ? (
        <RecordUnavailable entity="customer" error={error} onRetry={reload} />
      ) : (
        <CustomerDrawerContent customer={customer} />
      )}
    </Sheet>
  )
}

function CustomerDrawerSkeleton() {
  return (
    <DrawerSkeleton avatar>
      {/* Two 87px fact cards — the measured height of the Overview tab's
          lifetime grid, not a rounded guess. */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-[87px]" />
        <Skeleton className="h-[87px]" />
      </div>
      <Skeleton className="h-14 w-full" />
    </DrawerSkeleton>
  )
}

function CustomerDrawerContent({ customer }: { customer: Customer }) {
  const recordIds = useDrawerStore((state) => state.recordIds)
  const step = useDrawerStore((state) => state.step)
  const index = recordIds.indexOf(customer.id)
  const hasPrevious = index > 0
  const hasNext = index !== -1 && index < recordIds.length - 1
  const onPrevious = () => step(-1)
  const onNext = () => step(1)

  const kyc = kycTone(customer.kyc)
  const exceptions = customerExceptions(customer)

  return (
    <div className="flex h-full flex-col">
      <header className={DRAWER_HEADER_CLASS}>
        <Avatar name={customer.name} size={40} className="rounded-full" />

        <div className="min-w-0 flex-1">
          {/* Baseline-aligned and proximity-grouped, matching the payment
              drawer header — the two records share a shell precisely so that
              switching between them moves no furniture. */}
          <div className="flex items-baseline gap-2">
            <SheetTitle className="truncate text-xl font-semibold leading-tight tracking-tight text-ink">
              {customer.name}
            </SheetTitle>
            <StatusPill descriptor={kyc} />
            {customer.blocked && <StatusPill descriptor={blockedTone(true)} />}
          </div>
          <div className="group/row mt-1 flex items-center gap-3">
            <span className="truncate text-sm text-ink-muted">{customer.email}</span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="font-mono text-sm text-ink-faint">{truncateId(customer.id, 8, 4)}</span>
              <CopyButton value={customer.id} label="Copy customer ID" />
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* Step through records without returning to the table — production
              has this, and triaging a risk queue is exactly the case it serves.
              Disabled at the ends rather than hidden, so the control does not
              appear and disappear as you page. */}
          <Tooltip content="Previous customer">
            <span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous customer"
                disabled={!hasPrevious}
                onClick={onPrevious}
              >
                <ChevronLeft />
              </Button>
            </span>
          </Tooltip>
          <Tooltip content="Next customer">
            <span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next customer"
                disabled={!hasNext}
                onClick={onNext}
              >
                <ChevronRight />
              </Button>
            </span>
          </Tooltip>

          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="secondary" size="sm" className="ml-1.5">
                Manage
                <ChevronDown className="text-ink-faint" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem>
                <Ban />
                {customer.blocked ? 'Unblock customer' : 'Block customer'}
              </DropdownItem>
              <DropdownItem><ShieldCheck />Request verification</DropdownItem>
              <DropdownItem><Flag />Report as fraud</DropdownItem>
              <DropdownItem><Download />Export customer data</DropdownItem>
            </DropdownContent>
          </Dropdown>

          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close" className="ml-1"><X /></Button>
          </SheetClose>
        </div>
      </header>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">
            Activity<TabCount value={customer.activity.length} />
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Disputes<TabCount value={customer.disputes.length} />
          </TabsTrigger>
          <TabsTrigger value="methods">
            Methods<TabCount value={customer.cards.length} />
          </TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab customer={customer} exceptions={exceptions} /></TabsContent>
        <TabsContent value="activity"><ActivityTab activity={customer.activity} /></TabsContent>
        <TabsContent value="disputes"><DisputesTab customer={customer} /></TabsContent>
        <TabsContent value="methods"><MethodsTab customer={customer} /></TabsContent>
        <TabsContent value="verification"><VerificationTab customer={customer} /></TabsContent>
        <TabsContent value="audit"><AuditTab customer={customer} /></TabsContent>
      </Tabs>
    </div>
  )
}









