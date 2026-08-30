import { useMemo, useState } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import { Users, TriangleAlert } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { DataTable } from '@/components/table/data-table'
import { TableToolbar, type FilterGroup } from '@/components/table/table-toolbar'
import { Pagination } from '@/components/table/pagination'
import { EmptyState } from '@/components/table/empty-state'
import { Button } from '@/components/ui/button'
import { fetchCustomers, listFilterOptions } from '@/mocks/api'
import { useAsync } from '@/hooks/use-async'
import { useDebounced } from '@/hooks/use-debounced'
import { useUiStore } from '@/stores/ui-store'
import { useDrawerStore } from '@/stores/drawer-store'
import { buildCustomerColumns } from './columns'
import { CustomerDrawer } from './customer-drawer'
import { cn } from '@/lib/cn'

const PAGE_SIZE = 25

export function CustomersPage() {
  const timezone = useUiStore((state) => state.timezone)
  const openCustomer = useDrawerStore((state) => state.openCustomer)
  const activeCustomerId = useDrawerStore((state) => state.customerId)

  const [search, setSearch] = useState('')
  const [merchants, setMerchants] = useState<string[]>([])
  const [riskOnly, setRiskOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const debouncedSearch = useDebounced(search)
  const merchantKey = merchants.join(',')

  const { data, loading } = useAsync(
    () => fetchCustomers({
      search: debouncedSearch,
      merchants,
      riskOnly,
      sortBy: sortBy as never,
      sortDir,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, merchantKey, riskOnly, sortBy, sortDir, page],
  )

  const columns = useMemo(() => buildCustomerColumns(timezone), [timezone])
  const options = useMemo(() => listFilterOptions(), [])

  const filters: FilterGroup[] = useMemo(
    () => [
      {
        id: 'merchant',
        label: 'Merchant',
        selected: merchants,
        onChange: (next) => { setMerchants(next); setPage(1) },
        options: options.merchants.map((merchant) => ({ value: merchant, label: merchant })),
      },
    ],
    [options, merchants],
  )

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(columnId); setSortDir('desc') }
    setPage(1)
  }

  return (
    <AppShell>
      <PageHeader
        title="Customers"
        description="Customers who have purchased. Withdrawals are not included."
      />

      <TableToolbar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1) }}
        searchPlaceholder="Search name, email or customer ID…"
        filters={filters}
        columns={columns as never}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        resultCount={data?.total}
        totalCount={84}
        extra={
          /* A dedicated toggle rather than a filter dropdown entry. Triaging
             risk is the primary job on this page, so it gets a one-click
             affordance instead of being buried two levels deep. */
          <Button
            variant={riskOnly ? 'primary' : 'secondary'}
            size="md"
            onClick={() => { setRiskOnly((value) => !value); setPage(1) }}
            aria-pressed={riskOnly}
          >
            <TriangleAlert className={cn(riskOnly && 'text-brand-contrast')} />
            Exceptions only
          </Button>
        }
      />

      <DataTable
        data={data?.rows ?? []}
        columns={columns}
        loading={loading}
        skeletonRows={12}
        getRowId={(customer) => customer.id}
        onRowClick={(customer) => openCustomer(customer.id)}
        activeRowId={activeCustomerId}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSort}
        empty={
          <EmptyState
            icon={Users}
            title={riskOnly ? 'No customers with exceptions' : 'No customers match'}
            description={
              riskOnly
                ? 'Every customer in this scope is operating within normal parameters.'
                : 'No records satisfy the current search and filters.'
            }
            action={
              <Button
                variant="secondary"
                size="md"
                onClick={() => { setSearch(''); setMerchants([]); setRiskOnly(false); setPage(1) }}
              >
                Clear filters
              </Button>
            }
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <CustomerDrawer />
    </AppShell>
  )
}
