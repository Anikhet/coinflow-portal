import type { EmptyGlyphName } from '@/components/icons/empty-glyphs'
import { Link, useLocation } from 'react-router-dom'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { EmptyState } from '@/components/table/empty-state'
import { Button } from '@/components/ui/button'
import { resolvePlaceholderExits } from '@/lib/placeholder-actions'
import { resolvePlaceholderSummary } from '@/lib/placeholder-summaries'

/**
 * Routes present in the navigation but out of scope for this prototype resolve
 * here rather than 404ing. A nav item that leads nowhere reads as a bug; one
 * that says "not built yet" reads as scope.
 *
 * The two exits are derived from the current route rather than hardcoded, so a
 * dispute screen offers the payments the dispute is raised against and a
 * compliance screen offers customer records — see `resolvePlaceholderExits`.
 */
export function PlaceholderPage({ title, glyph }: { title: string; glyph: EmptyGlyphName }) {
  const { pathname } = useLocation()
  const { description, primary, secondary } = resolvePlaceholderExits(pathname)
  // The header says what this screen WOULD show; the empty state below says
  // where to go instead. Two different jobs, so two different lines.
  const summary = resolvePlaceholderSummary(pathname)

  return (
    <AppShell>
      <PageHeader title={title} description={summary} />
      {/* The empty state IS this page, so it occupies the whole content
          region inset by a thin gutter, rather than sitting as
          a small card marooned in the middle of an empty canvas. */}
      <div className="flex flex-1 p-4">
        <EmptyState
          layout="page"
          glyph={glyph}
          title={`${title} is not built yet`}
          description={description}
          action={
            /* Never leave a screen without an exit: the user arrived here by
               clicking real navigation and should not have to use the back
               button to get somewhere useful. The `brand` variant matches the
               gradient mark above it — on a page with exactly one thing to do,
               that action should look like the page's subject. */
            <Button variant="brand" size="md" asChild>
              {/* The destination's own nav icon, so the button shows the mark
                  the user would otherwise be hunting for in the sidebar. */}
              <Link to={primary.to}><primary.icon />{primary.label}</Link>
            </Button>
          }
          secondaryAction={
            <Button variant="secondary" size="md" asChild>
              <Link to={secondary.to}><secondary.icon />{secondary.label}</Link>
            </Button>
          }
        />
      </div>
    </AppShell>
  )
}
