import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { EmptyState } from '@/components/table/empty-state'
import { Button } from '@/components/ui/button'

/**
 * Routes present in the navigation but out of scope for this prototype resolve
 * here rather than 404ing. A nav item that leads nowhere reads as a bug; one
 * that says "not built yet" reads as scope.
 */
export function PlaceholderPage({ title, icon }: { title: string; icon: LucideIcon }) {
  return (
    <AppShell>
      <PageHeader title={title} />
      {/* The empty state IS this page, so it occupies the whole content
          region inset by a thin gutter, rather than sitting as
          a small card marooned in the middle of an empty canvas. */}
      <div className="flex flex-1 p-4">
        <EmptyState
          layout="page"
          icon={icon}
          title={`${title} is not built yet`}
          description="This prototype covers Home, Purchases and Customers."
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
