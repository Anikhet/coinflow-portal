import { useMemo, useState } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import { CreditCard, Globe } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { DataTable } from '@/components/table/data-table'
import { TableToolbar, type FilterGroup } from '@/components/table/table-toolbar'
import { Pagination } from '@/components/table/pagination'
import { EmptyState } from '@/components/table/empty-state'
import { Button } from '@/components/ui/button'
import { fetchPayments, listFilterOptions } from '@/mocks/api'
import { useAsync } from '@/hooks/use-async'
import { useDebounced } from '@/hooks/use-debounced'
import { useUiStore } from '@/stores/ui-store'
import { useDrawerStore } from '@/stores/drawer-store'
import { buildPaymentColumns, DEFAULT_HIDDEN_PAYMENT_COLUMNS } from './columns'
import { PaymentDrawer } from './payment-drawer'
import { methodLabel, processorLabel, MethodGlyph } from '@/components/icons/method-icon'
import { paymentStatusTone } from '@/lib/tone-map'
import type { PaymentMethod, Processor, PaymentStatus } from '@/types/payment'
import { cn } from '@/lib/cn'

const PAGE_SIZE = 25

export function PurchasesPage() {
  const timezone = useUiStore((state) => state.timezone)
  const setTimezone = useUiStore((state) => state.setTimezone)
  const openPayment = useDrawerStore((state) => state.openPayment)
  const activePaymentId = useDrawerStore((state) => state.paymentId)

  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [methods, setMethods] = useState<string[]>([])
  const [processors, setProcessors] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_HIDDEN_PAYMENT_COLUMNS)

  const debouncedSearch = useDebounced(search)

  // Serialise the array filters so the effect dependency list compares by value
  // rather than by array identity — otherwise every render refetches.
  const statusKey = statuses.join(',')
  const methodKey = methods.join(',')
  const processorKey = processors.join(',')

  const { data, loading } = useAsync(
    () => fetchPayments({
      search: debouncedSearch,
      statuses, methods, processors,
      sortBy: sortBy as never, sortDir,
      page, pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, statusKey, methodKey, processorKey, sortBy, sortDir, page],
  )

  const columns = useMemo(() => buildPaymentColumns(timezone), [timezone])
  const options = useMemo(() => listFilterOptions(), [])

  const filters: FilterGroup[] = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        selected: statuses,
        onChange: (next) => { setStatuses(next); setPage(1) },
        options: options.statuses.map((status) => ({
          value: status,
          label: paymentStatusTone(status as PaymentStatus).label,
        })),
      },
      {
        id: 'method',
        label: 'Method',
        selected: methods,
        onChange: (next) => { setMethods(next); setPage(1) },
        options: options.methods.map((method) => ({
          value: method,
          label: methodLabel(method as PaymentMethod),
          icon: <MethodGlyph method={method as PaymentMethod} cardBrand="visa" />,
        })),
      },
      {
        id: 'processor',
        label: 'Processor',
        selected: processors,
        onChange: (next) => { setProcessors(next); setPage(1) },
        options: options.processors.map((processor) => ({
          value: processor,
          label: processorLabel(processor as Processor),
        })),
      },
    ],
    [options, statuses, methods, processors],
  )

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(columnId)
      setSortDir('desc')
    }
    setPage(1)
  }

  const clearFilters = () => {
    setSearch(''); setStatuses([]); setMethods([]); setProcessors([]); setPage(1)
  }

  return (
    <AppShell>
      <PageHeader
        title="Purchases"
        description="Every payment across all merchants"
        actions={<TimezoneToggle value={timezone} onChange={setTimezone} />}
      />

      <TableToolbar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1) }}
        searchPlaceholder="Search customer, email, ID, last 4…"
        filters={filters}
        columns={columns as never}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        resultCount={data?.total}
        totalCount={240}
      />

      <DataTable
        data={data?.rows ?? []}
        columns={columns}
        loading={loading}
        skeletonRows={12}
        getRowId={(payment) => payment.id}
        onRowClick={(payment) => openPayment(payment.id)}
        activeRowId={activePaymentId}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSort}
        empty={
          <EmptyState
            icon={CreditCard}
            title="No payments match"
            description="No records satisfy the current search and filters. Try widening the range."
            action={<Button variant="secondary" size="md" onClick={clearFilters}>Clear filters</Button>}
          />
        }
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />

      <PaymentDrawer />
    </AppShell>
  )
}

/**
 * Local vs UTC. Kept from the original because it solves a real problem: a
 * payments team spanning timezones must be able to agree on when something
 * happened. Rebuilt as a segmented control rather than two loose buttons.
 */
function TimezoneToggle({ value, onChange }: {
  value: 'local' | 'utc'
  onChange: (value: 'local' | 'utc') => void
}) {
  return (
    <div className="flex h-8 items-center gap-0.5 rounded-[var(--radius-control)] bg-surface-sunk p-0.5 ring-1 ring-inset ring-border">
      <Globe className="ml-1.5 size-3.5 shrink-0 text-ink-faint" />
      {(['local', 'utc'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'h-7 rounded-[6px] px-2 text-[12px] font-medium transition-colors',
            value === option ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
          )}
        >
          {option === 'local' ? 'Local' : 'UTC'}
        </button>
      ))}
    </div>
  )
}
