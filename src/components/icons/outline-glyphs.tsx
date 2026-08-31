import { createLucideIcon } from 'lucide-react'

/**
 * OUTLINE GLYPHS
 * =============================================================================
 * Lucide-compatible outline icons drawn on Tabler's grid, for the cases where
 * the sidebar rail and the empty-state mark it leads to must be the SAME
 * silhouette. Lucide's shield is a flat-topped heater shield; Tabler's — the
 * one `empty-glyphs.authentication` is drawn from — has a scalloped top edge.
 * Pairing the two read as two different ideas, so 3DS gets the Tabler outline
 * here and the Tabler fill on its page.
 *
 * Built through `createLucideIcon` so these are typed and styled as LucideIcon:
 * same 24x24 viewBox, same 2px currentColor stroke, same props (including the
 * `fill`/`fillOpacity` the sidebar paints active rows with).
 *
 * Source: https://github.com/tabler/tabler-icons — MIT.
 */

export const ShieldCheckOutline = createLucideIcon('ShieldCheckOutline', [
  ['path', { d: 'M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3', key: 'shield' }],
  ['path', { d: 'M9 12l2 2l4 -4', key: 'check' }],
])
