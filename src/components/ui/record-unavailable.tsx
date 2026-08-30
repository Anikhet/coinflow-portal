import { FileQuestion, RotateCw, TriangleAlert } from 'lucide-react'
import { EmptyState } from '@/components/table/empty-state'
import { Button } from '@/components/ui/button'
import { useDrawerStore } from '@/stores/drawer-store'

/**
 * Shown inside a detail drawer when the record cannot be displayed.
 *
 * Both drawers previously fell back to their loading skeleton whenever the
 * record was missing or the request failed (`loading || !record`). A skeleton
 * that never resolves is the worst possible empty state: it promises content
 * that is not coming, and the only escape is for the user to guess that
 * pressing Escape is safe. Here the drawer says which of the two happened and
 * offers the matching exit.
 *
 * `onRetry` is omitted for the not-found case on purpose — retrying a deleted
 * record just fails again, so the only honest action is to close.
 */
export function RecordUnavailable({ entity, error, onRetry }: {
  /** Singular noun for the record — "payment", "customer". */
  entity: string
  error: Error | null
  onRetry: () => void
}) {
  const closeAll = useDrawerStore((state) => state.closeAll)

  const close = (
    <Button variant="secondary" size="md" onClick={closeAll}>
      Close
    </Button>
  )

  return (
    <div className="flex h-full items-center justify-center p-6">
      {error ? (
        <EmptyState
          icon={TriangleAlert}
          tone="critical"
          title={`Could not load this ${entity}`}
          description="The request failed, not the record."
          action={
            <Button variant="primary" size="md" onClick={onRetry}>
              <RotateCw />
              Try again
            </Button>
          }
          secondaryAction={close}
        />
      ) : (
        <EmptyState
          icon={FileQuestion}
          title={`${capitalize(entity)} not found`}
          description={`It no longer exists, or is outside your scope.`}
          action={close}
        />
      )}
    </div>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
