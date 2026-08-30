import '@tanstack/react-table'

/**
 * Column-level display hints. Declared as a module augmentation so `meta` is
 * type-checked at every column definition rather than cast at each read site.
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right'
    /** Renders the cell in the mono face — for IDs and hashes. */
    mono?: boolean
    /** Human label for the column-visibility menu. */
    label?: string
  }
}
