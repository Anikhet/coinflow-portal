import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui-store'

/**
 * Mirrors the persisted theme onto <html data-theme>, which is what the token
 * layer in index.css keys off. Applied in an effect on the root so the
 * attribute is set once rather than by every consumer of the store.
 */
export function useThemeEffect() {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
}
