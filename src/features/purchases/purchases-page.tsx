import { useMemo } from 'react'
import { CreditCard, Globe } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { DataTable } from '@/components/table/data-table'
import { TableToolbar, type FilterGroup } from '@/components/table/table-toolbar'
import { toColumnOptions } from '@/components/table/column-options'
import { Pagination } from '@/components/table/pagination'
import { TableEmpty } from '@/components/table/table-empty'
import { fetchPayments, listFilterOptions, PAYMENT_TOTAL } from '@/mocks/api'
import { useAsync } from '@/hooks/use-async'
import { useDebounced } from '@/hooks/use-debounced'
import { useUiStore } from '@/stores/ui-store'
import { useDrawerStore } from '@/stores/drawer-store'
import { TableViewProvider, useTableView } from '@/stores/table-view-context'
import { buildPaymentColumns, DEFAULT_HIDDEN_PAYMENT_COLUMNS } from './columns'
import { PaymentDrawer } from './payment-drawer'
import { MethodGlyph } from '@/components/icons/method-icon'
import { methodLabel, processorLabel } from '@/lib/method-labels'
import { paymentStatusTone } from '@/lib/tone-map'
import type { PaymentMethod, Processor, PaymentStatus } from '@/types/payment'
import { cn } from '@/lib/cn'

const PAGE_SIZE = 25

export function PurchasesPage() {
  return (
    <TableViewProvider
      init={{ sortBy: 'createdAt', sortDir: 'desc', columnVisibility: DEFAULT_HIDDEN_PAYMENT_COLUMNS }}
    >
      <PurchasesView />
    </TableViewProvider>
  )
}

/**
 * Split from PurchasesPage so it sits INSIDE the provider and can subscribe to
 * the view store. The page component's only job is to establish scope.
 */
function PurchasesView() {
  const timezone = useUiStore((state) => state.timezone)
  const setTimezone = useUiStore((state) => state.setTimezone)
  const openPayment = useDrawerStore((state) => state.openPayment)
  const activePaymentId = useDrawerStore((state) => state.paymentId)

  const search = useTableView((state) => state.search)
  const filters = useTableView((state) => state.filters)
  const sortBy = useTableView((state) => state.sortBy)
  const sortDir = useTableView((state) => state.sortDir)
  const page = useTableView((state) => state.page)

  const debouncedSearch = useDebounced(search)

  const statuses = filters.status ?? []
  const methods = filters.method ?? []
  const processors = filters.processor ?? []

  // Effect dependencies must be primitives: comparing the arrays by identity
  // would refetch on every render, since a fresh array is produced each time.
  const statusKey = statuses.join(',')
  const methodKey = methods.join(',')
  const processorKey = processors.join(',')

  const { data, loading, error, reload } = useAsync(
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
  const columnOptions = useMemo(() => toColumnOptions(columns), [columns])

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        options: options.statuses.map((status) => ({
          value: status,
          label: paymentStatusTone(status as PaymentStatus).label,
        })),
      },
      {
        id: 'method',
        label: 'Method',
        options: options.methods.map((method) => ({
          value: method,
          label: methodLabel(method as PaymentMethod),
          icon: <MethodGlyph method={method as PaymentMethod} cardBrand="visa" />,
        })),
      },
      {
        id: 'processor',
        label: 'Processor',
        options: options.processors.map((processor) => ({
          value: processor,
          label: processorLabel(processor as Processor),
        })),
      },
    ],
    [options],
  )

  return (
    <AppShell>
      <PageHeader
        title="Purchases"
        description="Every payment across all merchants"
        actions={<TimezoneToggle value={timezone} onChange={setTimezone} />}
      />

      <TableToolbar
        searchPlaceholder="Search customer, email, ID, last 4…"
        filters={filterGroups}
        columns={columnOptions}
        resultCount={data?.total}
        totalCount={PAYMENT_TOTAL}
      />

      <DataTable
        data={data?.rows ?? []}
        columns={columns}
        loading={loading}
        skeletonRows={12}
        getRowId={(payment) => payment.id}
        onRowClick={(payment) => openPayment(payment.id)}
        activeRowId={activePaymentId}
        empty={
          <TableEmpty
            entity="payments"
            icon={CreditCard}
            totalCount={PAYMENT_TOTAL}
            error={error}
            onRetry={reload}
          />
        }
      />

      <Pagination pageSize={PAGE_SIZE} total={data?.total ?? 0} />

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
