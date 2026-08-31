import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommandPalette } from '@/components/layout/command-palette'
import { HomePage } from '@/features/home/home-page'
import { PurchasesPage } from '@/features/purchases/purchases-page'
import { CustomersPage } from '@/features/customers/customers-page'
import { PlaceholderPage } from '@/features/placeholder-page'
import { NAV_GROUPS } from '@/lib/nav'
import { useThemeEffect } from '@/hooks/use-theme-effect'

const PLACEHOLDER_ROUTES = NAV_GROUPS.flatMap((group) =>
  group.items.filter((item) => item.placeholder),
)

export default function App() {
  useThemeEffect()

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={200}>
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          {PLACEHOLDER_ROUTES.map((item) => (
            <Route
              key={item.to}
              path={item.to}
              /* The nav names each route's mark alongside its icon, so the
                 placeholder shows the solid counterpart of the glyph the user
                 just clicked rather than a generic roadworks sign that makes
                 all eleven routes look identical. */
              element={<PlaceholderPage title={item.label} glyph={item.glyph} />}
            />
          ))}
          <Route path="*" element={<PlaceholderPage title="Page not found" glyph="notFound" />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
