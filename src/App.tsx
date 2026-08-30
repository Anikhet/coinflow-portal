import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
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
              /* The nav already assigns every route a distinct, semantically
                 loaded icon. Reusing it here means the placeholder shows the
                 same mark the user just clicked, instead of a generic
                 roadworks sign that makes all eleven routes look identical. */
              element={<PlaceholderPage title={item.label} icon={item.icon} />}
            />
          ))}
          <Route path="*" element={<PlaceholderPage title="Page not found" icon={FileQuestion} />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
