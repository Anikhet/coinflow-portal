export type PageItem = number | 'ellipsis'

/**
 * Default number of page slots. Exported so the loading state can reserve the
 * same count the loaded paginator will render.
 */
export const PAGE_SLOT_COUNT = 7

/**
 * Rows-per-page choices offered in the paginator.
 *
 * Four steps, each roughly doubling: 10 for a glanceable slice, 25 as the
 * default (about one screenful on a laptop, so the first page needs no
 * scrolling), then 50 and 100 for scanning or exporting. Fewer, well-spaced
 * options beat a fine-grained list nobody reads — the choice is "small screen /
 * normal / scanning", not an exact row count.
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

/** The option the tables start on. */
export const DEFAULT_PAGE_SIZE = 25

/**
 * Builds the page-number slots for a paginator.
 *
 * Guarantees a CONSTANT number of items — exactly `slots`, or `pageCount` when
 * there are fewer pages than slots. That constancy is the point: a paginator
 * that renders "1 2 3" on page 2 and "1 … 64 65 66 … 128" on page 65 changes
 * width as you page, so the Next button slides out from under the cursor mid-
 * click. Fixed slot count means the control never moves.
 *
 * First and last pages are always reachable, and the current page always sits
 * inside the rendered window.
 *
 * @param page       current 1-indexed page
 * @param pageCount  total pages
 * @param slots      how many items to render; must be odd and >= 5 so the
 *                   window sits symmetrically around the current page
 */
export function buildPageItems(page: number, pageCount: number, slots = PAGE_SLOT_COUNT): PageItem[] {
  if (pageCount <= 0) return []

  const clampedPage = Math.min(Math.max(page, 1), pageCount)

  // Fewer pages than slots — no elision needed, show them all.
  if (pageCount <= slots) {
    return range(1, pageCount)
  }

  // Slots available once the two boundary pages are accounted for.
  const inner = slots - 2

  // Near the start: run 1..(slots-2), then one gap, then the last page.
  if (clampedPage <= inner - 1) {
    return [...range(1, slots - 2), 'ellipsis', pageCount]
  }

  // Near the end: mirror image of the above.
  if (clampedPage >= pageCount - (inner - 2)) {
    return [1, 'ellipsis', ...range(pageCount - (slots - 3), pageCount)]
  }

  // Middle: first, gap, a symmetric window, gap, last.
  const windowSize = slots - 4
  const half = Math.floor(windowSize / 2)
  return [1, 'ellipsis', ...range(clampedPage - half, clampedPage + half), 'ellipsis', pageCount]
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}
