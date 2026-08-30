import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnOption } from './table-toolbar'

/**
 * Projects column definitions into the minimal {id,label} shape the toolbar's
 * visibility menu needs, so the toolbar never depends on table internals.
 *
 * Columns without an id are skipped rather than rendering an unlabelled,
 * untoggleable menu entry.
 */
export function toColumnOptions<T>(columns: ColumnDef<T, unknown>[]): ColumnOption[] {
  return columns.flatMap((column) => {
    const id = column.id
    if (!id) return []
    return [{ id, label: column.meta?.label ?? id }]
  })
}
