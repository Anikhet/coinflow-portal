import { ActivityTab } from './tabs/activity-tab'
import { AuditTab } from './tabs/audit-tab'
import { DisputesTab } from './tabs/disputes-tab'
import { MethodsTab } from './tabs/methods-tab'
import { OverviewTab } from './tabs/overview-tab'
import { VerificationTab } from './tabs/verification-tab'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { DRAWER_HEADER_CLASS, DrawerSkeleton, DrawerSkeletonHeading, HeaderField, HeaderFields } from '@/components/ui/drawer-chrome'
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/dropdown'
import { RecordSheet } from '@/components/ui/record-sheet'
import { RecordStepper } from '@/components/ui/record-stepper'
import { SheetClose, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { truncateId } from '@/lib/format'
import { Truncated } from '@/components/ui/truncated'
import { blockedTone, kycTone } from '@/lib/tone-map'
import { fetchCustomer } from '@/mocks/api'
import { useDrawerStore } from '@/stores/drawer-store'
import type { Customer } from '@/types'
import { ChevronDown, Download, X } from 'lucide-react'
import { BanFilled, FlagFilled, LockOpenFilled, ShieldCheckFilled } from '@/components/icons/filled-glyphs'

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

  return (
    <RecordSheet
      recordId={customerId}
      entity="customer"
      label="Customer detail"
      size="lg"
      fetchRecord={fetchCustomer}
      skeleton={<CustomerDrawerSkeleton />}
    >
      {(customer) => <CustomerDrawerContent customer={customer} />}
    </RecordSheet>
  )
}

function CustomerDrawerSkeleton() {
  return (
    <DrawerSkeleton
      header={
        <>
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <DrawerSkeletonHeading titleClassName="h-5 w-40" />
        </>
      }
    >
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
  const kyc = kycTone(customer.kyc)

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
          <HeaderFields>
            <HeaderField label="Email">
              <Truncated className="text-ink-muted">{customer.email}</Truncated>
              <CopyButton value={customer.email} label="Copy email" />
            </HeaderField>
            <HeaderField label="Customer ID">
              <Truncated always title={customer.id} className="font-mono text-ink-faint">
                {truncateId(customer.id, 8, 4)}
              </Truncated>
              <CopyButton value={customer.id} label="Copy customer ID" />
            </HeaderField>
          </HeaderFields>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* Step through records without returning to the table —
              production has this, and triaging a risk queue is exactly the
              case it serves. */}
          <RecordStepper recordId={customer.id} entity="customer" />

          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="secondary" size="sm" className="ml-1.5">
                Manage
                <ChevronDown className="text-ink-faint" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              {/* Each mark is the one the registry already gives that state, so
                  the row that blocks a customer wears the same ban glyph in the
                  same critical red as the "Blocked" pill it will produce. The
                  toned rows are the two with a consequence; verification is
                  caution because it puts the record into review, not because it
                  is dangerous. Export stays neutral — it changes nothing. */}
              <DropdownItem tone={customer.blocked ? 'positive' : 'critical'}>
                {customer.blocked ? <LockOpenFilled /> : <BanFilled />}
                {customer.blocked ? 'Unblock customer' : 'Block customer'}
              </DropdownItem>
              <DropdownItem tone="caution"><ShieldCheckFilled />Request verification</DropdownItem>
              <DropdownItem tone="critical"><FlagFilled />Report as fraud</DropdownItem>
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

        <TabsContent value="overview"><OverviewTab customer={customer} /></TabsContent>
        <TabsContent value="activity"><ActivityTab activity={customer.activity} /></TabsContent>
        <TabsContent value="disputes"><DisputesTab customer={customer} /></TabsContent>
        <TabsContent value="methods"><MethodsTab customer={customer} /></TabsContent>
        <TabsContent value="verification"><VerificationTab customer={customer} /></TabsContent>
        <TabsContent value="audit"><AuditTab customer={customer} /></TabsContent>
      </Tabs>
    </div>
  )
}









