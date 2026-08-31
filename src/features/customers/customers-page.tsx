import { useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { DataTable } from '@/components/table/data-table'
import { TableToolbar, type FilterGroup } from '@/components/table/table-toolbar'
import { toColumnOptions } from '@/components/table/column-options'
import { Pagination } from '@/components/table/pagination'
import { TableEmpty } from '@/components/table/table-empty'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { fetchCustomers, listFilterOptions, CUSTOMER_TOTAL } from '@/mocks/api'
import { useAsync } from '@/hooks/use-async'
import { useDebounced } from '@/hooks/use-debounced'
import { useUiStore } from '@/stores/ui-store'
import { useDrawerStore } from '@/stores/drawer-store'
import { TableViewProvider, useTableView } from '@/stores/table-view-context'
import { buildCustomerColumns, DEFAULT_HIDDEN_CUSTOMER_COLUMNS } from './columns'
import { CustomerDrawer } from './customer-drawer'

const PAGE_SIZE = 25
const RISK_TOGGLE = 'riskOnly'

export function CustomersPage() {
  return (
    <TableViewProvider
      init={{
        sortBy: 'createdAt',
        sortDir: 'desc',
        columnVisibility: DEFAULT_HIDDEN_CUSTOMER_COLUMNS,
      }}
    >
      <CustomersView />
    </TableViewProvider>
  )
}

function CustomersView() {
  const timezone = useUiStore((state) => state.timezone)
  const openCustomer = useDrawerStore((state) => state.openCustomer)
  const activeCustomerId = useDrawerStore((state) => state.customerId)

  const search = useTableView((state) => state.search)
  const filters = useTableView((state) => state.filters)
  const sortBy = useTableView((state) => state.sortBy)
  const sortDir = useTableView((state) => state.sortDir)
  const page = useTableView((state) => state.page)
  // Subscribe to the derived boolean, not the whole toggles object, so this
  // component does not re-render when an unrelated toggle changes.
  const riskOnly = useTableView((state) => state.toggles[RISK_TOGGLE] === true)
  const setToggle = useTableView((state) => state.setToggle)

  const debouncedSearch = useDebounced(search)
  const merchants = filters.merchant ?? []
  const merchantKey = merchants.join(',')

  const { data, loading, error, reload } = useAsync(
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
  const columnOptions = useMemo(() => toColumnOptions(columns), [columns])

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        id: 'merchant',
        label: 'Merchant',
        // The same name-derived chip the sidebar switcher uses, so a merchant
        // is the same colour and the same two letters in the scope switcher,
        // this menu, and the rows it filters to.
        options: options.merchants.map((merchant) => ({
          value: merchant,
          label: merchant,
          icon: <Avatar name={merchant} size={20} />,
        })),
      },
    ],
    [options],
  )

  return (
    <AppShell>
      <PageHeader
        title="Customers"
        description="Customers who have purchased. Withdrawals are not included."
      />

      <TableToolbar
        searchPlaceholder="Search name, email or customer ID…"
        filters={filterGroups}
        columns={columnOptions}
        resultCount={data?.total}
        totalCount={CUSTOMER_TOTAL}
        extra={
          /* A dedicated toggle rather than a filter dropdown entry. Triaging
             risk is the primary job on this page, so it gets a one-click
             affordance instead of being buried two levels deep. */
          <Button
            variant={riskOnly ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setToggle(RISK_TOGGLE, !riskOnly)}
            aria-pressed={riskOnly}
          >
            <TriangleAlert />
            Exceptions only
          </Button>
        }
      />

      <DataTable
        data={data?.rows ?? []}
        columns={columns}
        loading={loading}
        skeletonRows={PAGE_SIZE}
        getRowId={(customer) => customer.id}
        onRowClick={(customer) => openCustomer(customer.id)}
        activeRowId={activeCustomerId}
        empty={
          <TableEmpty
            entity="customers"
            glyph="customers"
            totalCount={CUSTOMER_TOTAL}
            error={error}
            onRetry={reload}
          />
        }
      />

      <Pagination pageSize={PAGE_SIZE} total={data?.total ?? 0} loading={loading} />

      <CustomerDrawer />
    </AppShell>
  )
}
