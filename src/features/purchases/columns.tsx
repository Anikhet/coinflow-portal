import type { ColumnDef } from '@tanstack/react-table'
import type { Payment } from '@/types'
import {
  AmountCell, AttributeCell, IdCell, IdentityCell, StatusCell,
} from '@/components/table/cells'
import { MethodGlyph, ProcessorGlyph, methodLabel, processorLabel } from '@/components/icons/method-icon'
import { SolanaMark } from '@/components/icons/brand-marks'
import { paymentStatusTone, protectionTone, threeDSTone } from '@/lib/tone-map'
import { formatRelative, formatDateTime } from '@/lib/format'
import { Tooltip } from '@/components/ui/tooltip'
import { Pill } from '@/components/ui/pill'
import type { Timezone } from '@/stores/ui-store'

/**
 * PAYMENTS COLUMNS
 * =============================================================================
 * Column order encodes a reading priority: WHEN it happened, WHO it belongs to,
 * WHAT it was worth, HOW it did. The original led with date then merchant then
 * a raw payment ID — putting an opaque UUID, the least scannable value on the
 * row, in prime third position. Here the ID is available but demoted.
 *
 * Exactly one column (Status) renders a solid pill. Method, processor and
 * merchant are glyph + text. Protection and 3DS are ghost pills that collapse
 * to an em-dash at their default value, so a routine payment shows a single
 * colored element and an unusual one shows two or three.
 */

export function buildPaymentColumns(timezone: Timezone): ColumnDef<Payment, unknown>[] {
  return [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Date',
      size: 140,
      meta: { label: 'Date' },
      cell: ({ row }) => (
        <Tooltip content={formatDateTime(row.original.createdAt, timezone)}>
          <span className="truncate text-ink-muted">{formatRelative(row.original.createdAt)}</span>
        </Tooltip>
      ),
    },
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: 'Customer',
      size: 200,
      meta: { label: 'Customer' },
      cell: ({ row }) => (
        <span className="min-w-0 truncate">
          <span className="truncate font-medium text-ink">{row.original.customerName}</span>
          <span className="ml-1.5 truncate text-[12px] text-ink-faint">{row.original.customerEmail}</span>
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
      id: 'subtotal',
      accessorKey: 'subtotal',
      header: 'Amount',
      size: 110,
      meta: { align: 'right', label: 'Amount' },
      cell: ({ row }) => <AmountCell value={row.original.subtotal} />,
    },
    {
      id: 'method',
      accessorKey: 'method',
      header: 'Method',
      size: 150,
      enableSorting: false,
      meta: { label: 'Method' },
      cell: ({ row }) => (
        <IdentityCell
          glyph={<MethodGlyph method={row.original.method} cardBrand={row.original.cardBrand} />}
          label={methodLabel(row.original.method)}
          sublabel={row.original.cardLast4 ? `••${row.original.cardLast4}` : null}
        />
      ),
    },
    {
      id: 'processor',
      accessorKey: 'processor',
      header: 'Processor',
      size: 140,
      enableSorting: false,
      meta: { label: 'Processor' },
      cell: ({ row }) => (
        <IdentityCell
          glyph={<ProcessorGlyph processor={row.original.processor} />}
          label={processorLabel(row.original.processor)}
        />
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      meta: { label: 'Status' },
      cell: ({ row }) => <StatusCell descriptor={paymentStatusTone(row.original.status)} />,
    },
    {
      id: 'responseCode',
      accessorKey: 'responseCode',
      header: 'Code',
      size: 100,
      enableSorting: false,
      meta: { label: 'Response code' },
      cell: ({ row }) => {
        // An approval code carries no information — every settled payment has
        // the same one. Only surface a code when it explains a failure.
        if (row.original.responseCode === '00') {
          return <span className="select-none text-ink-faint">—</span>
        }
        return (
          <Tooltip content={row.original.responseLabel}>
            <span className="font-mono text-[12px] text-[var(--tone-critical-fg)]">
              {row.original.responseCode}
            </span>
          </Tooltip>
        )
      },
    },
    {
      id: 'protection',
      accessorKey: 'protection',
      header: 'Protection',
      size: 110,
      enableSorting: false,
      meta: { label: 'Protection' },
      cell: ({ row }) => <AttributeCell descriptor={protectionTone(row.original.protection)} />,
    },
    {
      id: 'threeDS',
      accessorKey: 'threeDS',
      header: '3DS',
      size: 120,
      enableSorting: false,
      meta: { label: '3D Secure' },
      cell: ({ row }) => <AttributeCell descriptor={threeDSTone(row.original.threeDS)} />,
    },
    {
      id: 'disbursed',
      accessorKey: 'disbursed',
      header: 'Disbursed',
      size: 100,
      enableSorting: false,
      meta: { label: 'Disbursed' },
      cell: ({ row }) =>
        row.original.disbursed
          ? <Pill tone="neutral" variant="ghost">Sent</Pill>
          : <span className="select-none text-ink-faint">—</span>,
    },
    {
      id: 'chainTx',
      accessorKey: 'chainTx',
      header: 'Chain',
      size: 90,
      enableSorting: false,
      meta: { label: 'Chain' },
      cell: ({ row }) =>
        row.original.chainTx ? (
          <Tooltip content={`Settled on Solana · ${row.original.chainTx.slice(0, 16)}…`}>
            <span className="inline-flex"><SolanaMark className="w-4" /></span>
          </Tooltip>
        ) : (
          <span className="select-none text-ink-faint">—</span>
        ),
    },
    {
      id: 'id',
      accessorKey: 'id',
      header: 'Payment ID',
      size: 150,
      enableSorting: false,
      meta: { label: 'Payment ID' },
      cell: ({ row }) => <IdCell value={row.original.id} />,
    },
  ]
}

/**
 * Columns hidden by default. All thirteen are available, but a first-run view
 * showing every one of them is unreadable — the operator should opt in to
 * detail rather than opt out of noise.
 */
export const DEFAULT_HIDDEN_PAYMENT_COLUMNS = {
  disbursed: false,
  id: false,
}
