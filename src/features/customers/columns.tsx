import type { ColumnDef } from '@tanstack/react-table'
import type { Customer } from '@/types'
import { AmountCell, ExceptionsCell, StatusCell } from '@/components/table/cells'
import { customerExceptions, kycTone, signalCountTone } from '@/lib/tone-map'
import { formatDateOnly, formatCount } from '@/lib/format'
import { Tooltip } from '@/components/ui/tooltip'
import { Pill } from '@/components/ui/pill'
import type { Timezone } from '@/stores/ui-store'

/**
 * CUSTOMERS COLUMNS
 * =============================================================================
 * The original rendered six adjacent columns — Protection, Blocked, 3DS
 * Processing, Attempt Limit, Verification, Fraud Override — each a green pill
 * reading "Enabled" / "Functional" / "Standard" on virtually every row. Six
 * columns of screen width spent restating that nothing is wrong.
 *
 * Those six collapse into ONE "Exceptions" column that is empty for a normal
 * customer and lists only genuine deviations otherwise. The information is not
 * lost — it is in the drawer, and it is filterable — but the table now reads at
 * a glance because ink is spent exclusively on the abnormal.
 *
 * The width freed up buys columns that were missing and matter far more for
 * triage: lifetime volume, payment count, and distinct-IP count.
 */

export function buildCustomerColumns(timezone: Timezone): ColumnDef<Customer, unknown>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Customer',
      size: 230,
      meta: { label: 'Customer' },
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-sunk text-[10px] font-semibold text-ink-muted">
            {row.original.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
          </span>
          <span className="min-w-0 truncate">
            <span className="block truncate text-[13px] font-medium leading-tight text-ink">{row.original.name}</span>
            <span className="block truncate text-[11px] leading-tight text-ink-faint">{row.original.email}</span>
          </span>
        </span>
      ),
    },
    {
      id: 'merchant',
      accessorKey: 'merchant',
      header: 'Merchant',
      size: 130,
      meta: { label: 'Merchant' },
      cell: ({ row }) => <span className="truncate text-ink-muted">{row.original.merchant}</span>,
    },
    {
      id: 'totalVolume',
      accessorKey: 'totalVolume',
      header: 'Volume',
      size: 120,
      meta: { align: 'right', label: 'Lifetime volume' },
      cell: ({ row }) => <AmountCell value={row.original.totalVolume} />,
    },
    {
      id: 'paymentCount',
      accessorKey: 'paymentCount',
      header: 'Payments',
      size: 100,
      meta: { align: 'right', label: 'Payment count' },
      cell: ({ row }) => (
        <span className="tabular-nums text-ink-muted">{formatCount(row.original.paymentCount)}</span>
      ),
    },
    {
      id: 'kyc',
      accessorKey: 'kyc',
      header: 'KYC',
      size: 130,
      meta: { label: 'KYC' },
      cell: ({ row }) => <StatusCell descriptor={kycTone(row.original.kyc)} />,
    },
    {
      id: 'exceptions',
      header: 'Exceptions',
      size: 200,
      enableSorting: false,
      meta: { label: 'Exceptions' },
      cell: ({ row }) => <ExceptionsCell items={customerExceptions(row.original)} />,
    },
    {
      id: 'ipLocations',
      header: 'IPs',
      size: 80,
      enableSorting: false,
      meta: { align: 'right', label: 'Distinct IPs' },
      cell: ({ row }) => {
        const count = row.original.ipLocations.length
        const tone = signalCountTone(count, 3)
        if (tone === 'neutral') {
          return <span className="tabular-nums text-ink-muted">{count}</span>
        }
        return (
          <Tooltip content={`${count} distinct IP locations — unusual for a single customer`}>
            <span className="inline-flex"><Pill tone={tone} variant="ghost">{count}</Pill></span>
          </Tooltip>
        )
      },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      size: 120,
      meta: { label: 'Created' },
      cell: ({ row }) => (
        <span className="truncate text-ink-muted">{formatDateOnly(row.original.createdAt, timezone)}</span>
      ),
    },
  ]
}
