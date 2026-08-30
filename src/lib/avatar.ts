/**
 * Identity chips for scopes and merchants.
 *
 * Two things were wrong with "first two characters, always grey": "Coinflow
 * Admin" and "courtside" both collapse to CO, and a column of identical grey
 * squares carries no information — the eye has to READ every row to tell the
 * entries apart, which is the one job an avatar exists to do.
 *
 * So initials follow word boundaries, and the colour is derived from the name
 * itself. Derived, not assigned by index: inserting a merchant must not
 * recolour its neighbours, and the same account must look the same on every
 * page and across sessions.
 *
 * Only the HUE comes from here. Lightness and chroma live in CSS
 * (`--avatar-bg-l` and friends in index.css) so the identical hue renders as a
 * soft tint in light mode and a deep tint in dark mode, with no theme
 * detection in JS.
 */

/**
 * First letter of each of the first two words, falling back to the first two
 * letters of a single-word name. "Coinflow Admin" → CA, "courtside" → CO,
 * "Triumph_TCG" → TT.
 */
export function initialsFor(name: string): string {
  const words = name.split(/[\s_\-.]+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * FNV-1a. Any stable hash would serve; this one is four lines, has no
 * dependencies, and avalanches well enough on short ASCII that names sharing a
 * prefix ("coinflow" / "courtside") land far apart on the hue wheel.
 */
function hash(value: string): number {
  let result = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 0x01000193)
  }
  return result >>> 0
}

/**
 * Twelve stops rather than a continuous 0–360: adjacent hues a few degrees
 * apart are indistinguishable at 20px, so a coarse wheel makes collisions
 * honest (two chips share a colour) instead of misleading (two chips look the
 * same but aren't).
 */
const HUE_STOPS = 12

export function hueFor(name: string): number {
  return (hash(name) % HUE_STOPS) * (360 / HUE_STOPS)
}
