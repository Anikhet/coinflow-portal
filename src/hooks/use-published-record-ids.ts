import { useEffect } from 'react'
import { useDrawerStore } from '@/stores/drawer-store'

/**
 * Publishes the ids of the rows currently on screen so the drawer's prev/next
 * steps through exactly what the operator is looking at — the current filter
 * and sort, not the whole corpus.
 *
 * Takes the ids as a joined STRING rather than an array because the effect must
 * depend on a primitive: a fresh array is produced on every render, so an
 * identity comparison would republish (and re-render every stepper) on each
 * pass. Callers join once at the call site, where the row shape is known.
 */
export function usePublishedRecordIds(rowIds: string) {
  const setRecordIds = useDrawerStore((state) => state.setRecordIds)

  useEffect(() => {
    setRecordIds(rowIds ? rowIds.split(',') : [])
  }, [rowIds, setRecordIds])
}
