import type { ReactNode } from 'react'
import { Sheet } from './sheet'
import { RecordUnavailable } from './record-unavailable'
import { useAsync } from '@/hooks/use-async'
import { useDrawerStore } from '@/stores/drawer-store'

/**
 * RECORD SHEET
 * =============================================================================
 * The shell every detail drawer opens inside: fetch the record named by the
 * store, then show exactly one of three things — a skeleton, an unavailable
 * state, or the record.
 *
 * Extracted because the payment and customer drawers had spelled out that same
 * triage independently, which is the kind of duplication that does not stay
 * duplicated: a fix to one drawer's loading or error handling silently leaves
 * the other behind. The drawers now differ only in what they RENDER, which is
 * the only thing about them that is genuinely different.
 *
 * `children` is a render prop rather than a slot on purpose. Composition by
 * children is the better default, but only when the parent has nothing to hand
 * down; here the whole point is to pass back a record that is guaranteed
 * non-null, which a static child cannot receive.
 */
export function RecordSheet<T>({
  recordId, entity, label, size, fetchRecord, skeleton, children,
}: {
  /** Null when this drawer is closed. */
  recordId: string | null
  /** Singular noun for the record — "payment", "customer". */
  entity: string
  /** Accessible name for the drawer. */
  label: string
  size?: 'md' | 'lg'
  fetchRecord: (id: string) => Promise<T | null>
  skeleton: ReactNode
  children: (record: T) => ReactNode
}) {
  const closeAll = useDrawerStore((state) => state.closeAll)

  const { data, loading, error, reload } = useAsync(
    () => (recordId ? fetchRecord(recordId) : Promise.resolve(null)),
    [recordId],
  )

  return (
    <Sheet open={recordId != null} onOpenChange={(open) => !open && closeAll()} size={size} label={label}>
      {loading ? (
        skeleton
      ) : !data ? (
        <RecordUnavailable entity={entity} error={error} onRetry={reload} />
      ) : (
        children(data)
      )}
    </Sheet>
  )
}
