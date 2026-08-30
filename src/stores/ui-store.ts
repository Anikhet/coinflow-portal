import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Density = 'compact' | 'cozy'
export type ThemeMode = 'light' | 'dark'
export type Timezone = 'local' | 'utc'

interface UiState {
  theme: ThemeMode
  density: Density
  timezone: Timezone
  sidebarCollapsed: boolean
  commandOpen: boolean
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setDensity: (density: Density) => void
  setTimezone: (timezone: Timezone) => void
  toggleSidebar: () => void
  setCommandOpen: (open: boolean) => void
}

/**
 * Global chrome preferences.
 *
 * These live in a store rather than in App state because they are read by
 * deeply nested leaves — a table cell needs `timezone`, a row needs `density` —
 * while being owned by nobody in between. Threading them as props would mean
 * every layout, page and table component forwarding values it does not itself
 * use, which is exactly the drilling pattern to avoid.
 *
 * Persisted so an operator's density and theme survive a reload; a tool people
 * live in all day should not reset its ergonomics on every visit.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      density: 'compact',
      timezone: 'local',
      sidebarCollapsed: false,
      commandOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setDensity: (density) => set({ density }),
      setTimezone: (timezone) => set({ timezone }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
    }),
    {
      name: 'coinflow-ui',
      /**
       * Persist only durable preferences. `commandOpen` is transient UI state —
       * persisting it means a reload while the palette is open reopens it over
       * the page, which reads as a bug.
       */
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
        timezone: state.timezone,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)

export const ROW_HEIGHT: Record<Density, number> = { compact: 36, cozy: 44 }
