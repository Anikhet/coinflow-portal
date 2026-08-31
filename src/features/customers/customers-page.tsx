import { useMemo } from 'react'
import { Store, TriangleAlert } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { DataTable } from '@/components/table/data-table'
import { TableToolbar, type FilterGroup } from '@/components/table/table-toolbar'
import { toColumnOptions } from '@/components/table/column-options'
import { Pagination } from '@/components/table/pagination'
import { TableEmpty } from '@/components/table/table-empty'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { fetchCustomers, listFilterOptions } from '@/mocks/api'
import { useAsync } from '@/hooks/use-async'
import { useDebounced } from '@/hooks/use-debounced'
import { usePublishedRecordIds } from '@/hooks/use-published-record-ids'
import { useUiStore } from '@/stores/ui-store'
import { useDrawerStore } from '@/stores/drawer-store'
import { TableViewProvider, useTableView } from '@/stores/table-view-context'
import { buildCustomerColumns, DEFAULT_HIDDEN_CUSTOMER_COLUMNS } from './columns'
import { CustomerDrawer } from './customer-drawer'

/** Store key for the "Exceptions only" switch, shared by the toggle and the query. */
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
  const pageSize = useTableView((state) => state.pageSize)
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
      pageSize,
    }),
    [debouncedSearch, merchantKey, riskOnly, sortBy, sortDir, page, pageSize],
  )

  usePublishedRecordIds(data?.rows.map((customer) => customer.id).join(',') ?? '')

  const columns = useMemo(() => buildCustomerColumns(timezone), [timezone])
  const options = useMemo(() => listFilterOptions(), [])
  const columnOptions = useMemo(() => toColumnOptions(columns), [columns])

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        id: 'merchant',
        label: 'Merchant',
        // The storefront, not a person: this facet picks the business a
        // customer paid, and the rows it returns are merchant chips.
        icon: Store,
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
        skeletonRows={pageSize}
        getRowId={(customer) => customer.id}
        onRowClick={(customer) => openCustomer(customer.id)}
        activeRowId={activeCustomerId}
        empty={
          <TableEmpty
            entity="customers"
            glyph="customers"
            error={error}
            onRetry={reload}
          />
        }
      />

      <Pagination total={data?.total ?? 0} loading={loading} />

      <CustomerDrawer />
    </AppShell>
  )
}
