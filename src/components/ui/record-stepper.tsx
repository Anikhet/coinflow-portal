import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Tooltip } from './tooltip'
import { useDrawerStore } from '@/stores/drawer-store'

/**
 * Previous/next paging through the records the table is currently showing.
 *
 * Reads the published id list and the `step` action straight from the drawer
 * store rather than taking them as props: the drawer that renders this does not
 * itself use either, and forwarding them would make it a message bus for state
 * belonging to the pair of components at each end.
 *
 * Disabled at the ends rather than hidden, so the control does not appear and
 * disappear as you page.
 */
export function RecordStepper({ recordId, entity }: {
  recordId: string
  /** Singular noun for the record — "payment", "customer". */
  entity: string
}) {
  const recordIds = useDrawerStore((state) => state.recordIds)
  const step = useDrawerStore((state) => state.step)

  const index = recordIds.indexOf(recordId)

  return (
    <>
      <StepButton
        label={`Previous ${entity}`}
        disabled={index <= 0}
        onClick={() => step(-1)}
        icon={<ChevronLeft />}
      />
      <StepButton
        label={`Next ${entity}`}
        disabled={index === -1 || index >= recordIds.length - 1}
        onClick={() => step(1)}
        icon={<ChevronRight />}
      />
    </>
  )
}

/**
 * The span wrapper is load-bearing: a disabled button fires no pointer events,
 * so the tooltip would go silent at exactly the ends of the list, where the
 * explanation is most wanted.
 */
function StepButton({ label, disabled, onClick, icon }: {
  label: string
  disabled: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <Tooltip content={label}>
      <span>
        <Button variant="ghost" size="icon" aria-label={label} disabled={disabled} onClick={onClick}>
          {icon}
        </Button>
      </span>
    </Tooltip>
  )
}
