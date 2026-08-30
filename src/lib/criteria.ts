/**
 * Turns raw table-view state (search, multi-select filters, boolean toggles)
 * into human-readable chips for an empty state.
 *
 * Two jobs, deliberately combined: the chips explain WHY a result set is empty,
 * and an empty return value is the signal that the view is unfiltered — which
 * is how the caller distinguishes "your filters excluded everything" from "this
 * scope genuinely has no rows". Those two states need different copy and
 * different actions, so the distinction has to be derivable, not guessed.
 */
export function describeCriteria(
  search: string,
  filters: Record<string, string[]>,
  toggles: Record<string, boolean>,
): string[] {
  const chips: string[] = []

  if (search.trim()) chips.push(`Search: “${search.trim()}”`)

  for (const [groupId, values] of Object.entries(filters)) {
    if (values.length === 0) continue
    // Beyond two values the individual names stop being readable at chip size
    // and the count is the more useful fact.
    const summary = values.length > 2 ? `${values.length} selected` : values.join(', ')
    chips.push(`${humanize(groupId)}: ${summary}`)
  }

  for (const [key, enabled] of Object.entries(toggles)) {
    if (enabled) chips.push(humanize(key))
  }

  return chips
}

/** Converts a camelCase state key into sentence case: "riskOnly" -> "Risk only". */
export function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
