import type { ColumnDef } from '@tanstack/react-table'
import type { Payment } from '@/types'
import { AmountCell, AttributeCell, IdCell, IdentityCell, StatusCell } from '@/components/table/cells'
import { MethodGlyph, ProcessorGlyph } from '@/components/icons/method-icon'
import { methodLabel, processorLabel } from '@/lib/method-labels'
import { SolanaMark } from '@/components/icons/brand-marks'
import { paymentStatusTone, protectionTone, threeDSTone } from '@/lib/tone-map'
import { formatTableTime, formatDateTime, truncateId } from '@/lib/format'
import { Tooltip } from '@/components/ui/tooltip'
import { CopyButton } from '@/components/ui/copy-button'
import { Pill } from '@/components/ui/pill'
import type { Timezone } from '@/stores/ui-store'

/**
 * PAYMENTS COLUMNS
 * =============================================================================
 * Column set, order and labels match the existing production table exactly —
 * all thirteen, same sequence, all visible by default. An operator moving
 * between the two should not have to re-learn where anything lives, and a
 * redesign that quietly drops or reorders columns is changing the product, not
 * restyling it.
 *
 * What changes is the ENCODING inside those columns, not the columns:
 *
 *   - Status is the only solid pill in the row (the anchor for the eye).
 *   - Method and Processor become glyph + plain text rather than pills.
 *     They state what a payment IS, not how it is DOING; pilling them is what
 *     made every cell compete for attention.
 *   - Protection and 3D Secure render an em-dash at their default value instead
 *     of an "N/A" or "Approved" pill on nearly every row, so the column reads
 *     as quiet-with-exceptions rather than a wall of identical badges.
 *   - Code shows nothing for '00'. Every settled payment carries the same
 *     approval code, so printing it costs a column of width and conveys zero.
 *
 * Same data, same place, far less ink.
 */

export function buildPaymentColumns(timezone: Timezone): ColumnDef<Payment, unknown>[] {
  return [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      // The original header states which timezone is in force; it must track
      // the toggle rather than always claiming "local".
      header: timezone === 'utc' ? 'Date (UTC)' : 'Date (local)',
      size: 110,
      meta: { label: 'Date' },
      cell: ({ row }) => (
        <Tooltip content={formatDateTime(row.original.createdAt, timezone)}>
          <span className="truncate tabular-nums text-ink-muted">
            {formatTableTime(row.original.createdAt, timezone)}
          </span>
        </Tooltip>
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
      id: 'id',
      accessorKey: 'id',
      header: 'Payment ID',
      size: 140,
      enableSorting: false,
      meta: { label: 'Payment ID' },
      cell: ({ row }) => <IdCell value={row.original.id} display={truncateId(row.original.id, 4, 4)} />,
    },
    {
      id: 'method',
      accessorKey: 'method',
      header: 'Method',
      size: 165,
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
      id: 'subtotal',
      accessorKey: 'subtotal',
      header: 'Subtotal',
      size: 110,
      meta: { align: 'right', label: 'Subtotal' },
      cell: ({ row }) => <AmountCell value={row.original.subtotal} />,
    },
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: 'Customer',
      size: 220,
      meta: { label: 'Customer' },
      cell: ({ row }) => (
        <span className="min-w-0 truncate">
          <span className="truncate font-medium text-ink">{row.original.customerName}</span>
          <span className="ml-1.5 truncate text-[12px] text-ink-faint">{row.original.customerEmail}</span>
        </span>
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
      size: 90,
      enableSorting: false,
      meta: { label: 'Response code' },
      cell: ({ row }) => {
        // An approval code carries no information — every settled payment has
        // the same one. Only surface a code when it explains a failure.
        if (row.original.responseCode === '00') {
          return <span className="select-none text-ink-faint" aria-label="Approved">—</span>
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
      id: 'disbursed',
      accessorKey: 'disbursed',
      header: 'Disbursed',
      size: 105,
      enableSorting: false,
      meta: { label: 'Disbursed' },
      cell: ({ row }) =>
        row.original.disbursed ? (
          <Pill tone="neutral" variant="ghost">Sent</Pill>
        ) : (
          <span className="select-none text-ink-faint" aria-label="Not disbursed">—</span>
        ),
    },
    {
      id: 'protection',
      accessorKey: 'protection',
      header: 'Protection',
      size: 120,
      enableSorting: false,
      meta: { label: 'Protection' },
      cell: ({ row }) => <AttributeCell descriptor={protectionTone(row.original.protection)} />,
    },
    {
      id: 'threeDS',
      accessorKey: 'threeDS',
      header: '3D Secure',
      size: 135,
      enableSorting: false,
      meta: { label: '3D Secure' },
      cell: ({ row }) => <AttributeCell descriptor={threeDSTone(row.original.threeDS)} />,
    },
    {
      id: 'chainTx',
      accessorKey: 'chainTx',
      header: 'Chain',
      size: 80,
      enableSorting: false,
      meta: { label: 'Chain' },
      cell: ({ row }) =>
        row.original.chainTx ? (
          <Tooltip content={`Settled on Solana · ${row.original.chainTx.slice(0, 16)}…`}>
            <span className="inline-flex"><SolanaMark className="w-4" /></span>
          </Tooltip>
        ) : (
          <span className="select-none text-ink-faint" aria-label="Not settled on chain">—</span>
        ),
    },
  ]
}
