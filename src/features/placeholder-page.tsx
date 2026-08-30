import { Construction } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { EmptyState } from '@/components/table/empty-state'

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
        />
      </div>
    </AppShell>
  )
}
