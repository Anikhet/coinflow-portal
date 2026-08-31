import type { ColumnDef } from '@tanstack/react-table'
import type { Customer } from '@/types'
import { AmountCell, AttributeCell } from '@/components/table/cells'
import { Avatar } from '@/components/ui/avatar'
import { CopyButton } from '@/components/ui/copy-button'
import { Tooltip } from '@/components/ui/tooltip'
import { Pill } from '@/components/ui/pill'
import {
  customerProtectionTone, blockedTone, threeDSProcessingTone,
  attemptLimitTone, verificationTone, fraudOverrideTone,
  kycTone, signalCountTone,
} from '@/lib/tone-map'
import { formatCount, formatDateTime } from '@/lib/format'
import type { Timezone } from '@/stores/ui-store'

/**
 * CUSTOMERS COLUMNS
 * =============================================================================
 * The ten production columns, in the original order with the original labels,
 * all visible by default. Customer and Email stay SEPARATE columns as they are
 * today rather than being merged into one identity cell.
 *
 * What changes is the encoding, not the column set. The original rendered six
 * adjacent attribute columns — Protection, Blocked, 3DS Processing, Attempt
 * Limit, Verification, Fraud Override — as green pills reading "Enabled",
 * "Functional", "Standard" on virtually every row. Six columns of screen width
 * spent confirming that nothing is wrong.
 *
 * Here each of those mappers marks its MAJORITY value as the default, which
 * renders a muted em-dash instead of a pill. A normal customer is a row of
 * dashes; a customer with a real problem is the only thing carrying colour on
 * screen. Same columns, same data, same place — the eye just has somewhere to
 * land now.
 *
 * The extra columns this redesign adds (lifetime volume, payment count,
 * distinct IPs, KYC) are defined but hidden by default, available from the
 * column menu. They are genuinely useful for triage, but they are additions —
 * so they should be opt-in rather than silently changing the default view.
 */

export function buildCustomerColumns(timezone: Timezone): ColumnDef<Customer, unknown>[] {
  return [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created at',
      size: 150,
      meta: { label: 'Created at' },
      cell: ({ row }) => (
        <span className="truncate tabular-nums text-ink-muted">
          {formatDateTime(row.original.createdAt, timezone)}
        </span>
      ),
    },
    {
      id: 'merchant',
      accessorKey: 'merchant',
      header: 'Merchant',
      size: 150,
      meta: { label: 'Merchant' },
      cell: ({ row }) => (
        <span className="flex items-center gap-1">
          <span className="truncate text-ink">{row.original.merchant}</span>
          <CopyButton value={row.original.merchant} label="Copy merchant" />
        </span>
      ),
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Customer',
      size: 180,
      meta: { label: 'Customer' },
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={row.original.name} size={24} className="rounded-full" />
          <span className="truncate font-medium text-ink">{row.original.name}</span>
        </span>
      ),
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      size: 220,
      meta: { label: 'Email' },
      cell: ({ row }) => (
        <span className="flex items-center gap-1">
          <Tooltip content={row.original.email}>
            <span className="truncate text-ink-muted">{row.original.email}</span>
          </Tooltip>
          <CopyButton value={row.original.email} label="Copy email" />
        </span>
      ),
    },
    {
      id: 'protection',
      accessorKey: 'protectionEnabled',
      header: 'Protection',
      size: 115,
      enableSorting: false,
      meta: { label: 'Protection' },
      cell: ({ row }) => <AttributeCell descriptor={customerProtectionTone(row.original.protectionEnabled)} />,
    },
    {
      id: 'blocked',
      accessorKey: 'blocked',
      header: 'Blocked',
      size: 105,
      enableSorting: false,
      meta: { label: 'Blocked' },
      cell: ({ row }) => <AttributeCell descriptor={blockedTone(row.original.blocked)} />,
    },
    {
      id: 'threeDSProcessing',
      accessorKey: 'threeDSProcessing',
      header: '3DS Processing',
      size: 140,
      enableSorting: false,
      meta: { label: '3DS Processing' },
      cell: ({ row }) => <AttributeCell descriptor={threeDSProcessingTone(row.original.threeDSProcessing)} />,
    },
    {
      id: 'attemptLimit',
      accessorKey: 'attemptLimit',
      header: 'Attempt Limit',
      size: 130,
      enableSorting: false,
      meta: { label: 'Attempt Limit' },
      cell: ({ row }) => <AttributeCell descriptor={attemptLimitTone(row.original.attemptLimit)} />,
    },
    {
      id: 'verification',
      accessorKey: 'verification',
      header: 'Verification',
      size: 125,
      enableSorting: false,
      meta: { label: 'Verification' },
      cell: ({ row }) => <AttributeCell descriptor={verificationTone(row.original.verification)} />,
    },
    {
      id: 'fraudOverride',
      accessorKey: 'fraudOverride',
      header: 'Fraud Override',
      size: 140,
      enableSorting: false,
      meta: { label: 'Fraud Override' },
      cell: ({ row }) => <AttributeCell descriptor={fraudOverrideTone(row.original.fraudOverride)} />,
    },

    // -- additions, hidden by default -------------------------------------
    {
      id: 'kyc',
      accessorKey: 'kyc',
      header: 'KYC',
      size: 130,
      meta: { label: 'KYC' },
      cell: ({ row }) => <AttributeCell descriptor={kycTone(row.original.kyc)} />,
    },
    {
      id: 'totalVolume',
      accessorKey: 'totalVolume',
      header: 'Volume',
      size: 120,
      meta: { label: 'Lifetime volume' },
      cell: ({ row }) => <AmountCell value={row.original.totalVolume} />,
    },
    {
      id: 'paymentCount',
      accessorKey: 'paymentCount',
      header: 'Payments',
      size: 100,
      meta: { label: 'Payment count' },
      cell: ({ row }) => (
        <span className="tabular-nums text-ink-muted">{formatCount(row.original.paymentCount)}</span>
      ),
    },
    {
      id: 'ipLocations',
      header: 'IPs',
      size: 80,
      enableSorting: false,
      meta: { label: 'Distinct IPs' },
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
  ]
}

/**
 * The redesign's additional columns start hidden, so the default view is the
 * production column set exactly. They remain one click away in the column menu.
 */
export const DEFAULT_HIDDEN_CUSTOMER_COLUMNS = {
  kyc: false,
  totalVolume: false,
  paymentCount: false,
  ipLocations: false,
}
