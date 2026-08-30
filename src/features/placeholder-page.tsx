import { Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { EmptyState } from '@/components/table/empty-state'
import { Button } from '@/components/ui/button'

/**
 * Routes present in the navigation but out of scope for this prototype resolve
 * here rather than 404ing. A nav item that leads nowhere reads as a bug; one
 * that says "not built yet" reads as scope.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <AppShell>
      <PageHeader title={title} />
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={Construction}
          title={`${title} is not part of this prototype`}
          description="This redesign covers the dashboard, purchases and customers surfaces, including their detail drawers."
          action={
            /* Never leave a screen without an exit: the user arrived here by
               clicking real navigation and should not have to use the back
               button to get somewhere useful. */
            <Button variant="primary" size="md" asChild>
              <Link to="/">Go to Overview</Link>
            </Button>
          }
          secondaryAction={
            <Button variant="secondary" size="md" asChild>
              <Link to="/purchases">View purchases</Link>
            </Button>
          }
        />
      </div>
    </AppShell>
  )
}
