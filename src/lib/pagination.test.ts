import { describe, expect, it } from 'vitest'
import { buildPageItems, type PageItem } from './pagination'

const numbers = (items: PageItem[]) => items.filter((item): item is number => item !== 'ellipsis')

describe('buildPageItems', () => {
  it('returns nothing when there are no pages', () => {
    expect(buildPageItems(1, 0)).toEqual([])
  })

  it('lists every page without elision when they fit', () => {
    expect(buildPageItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(buildPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  /**
   * The core guarantee. A width that changes as you page makes the Next button
   * move out from under the cursor between clicks.
   */
  it('renders a constant number of slots on every page of a long set', () => {
    const pageCount = 128
    for (let page = 1; page <= pageCount; page += 1) {
      expect(buildPageItems(page, pageCount)).toHaveLength(7)
    }
  })

  it('always keeps the first and last page reachable', () => {
    for (const page of [1, 2, 40, 64, 100, 127, 128]) {
      const items = buildPageItems(page, 128)
      expect(items[0]).toBe(1)
      expect(items.at(-1)).toBe(128)
    }
  })

  it('always includes the current page', () => {
    for (let page = 1; page <= 128; page += 1) {
      expect(numbers(buildPageItems(page, 128))).toContain(page)
    }
  })

  it('elides only on the side that actually has a gap', () => {
    expect(buildPageItems(1, 128)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 128])
    expect(buildPageItems(128, 128)).toEqual([1, 'ellipsis', 124, 125, 126, 127, 128])
    expect(buildPageItems(64, 128)).toEqual([1, 'ellipsis', 63, 64, 65, 'ellipsis', 128])
  })

  it('never emits duplicate or out-of-range page numbers', () => {
    for (const pageCount of [8, 9, 12, 50, 128]) {
      for (let page = 1; page <= pageCount; page += 1) {
        const values = numbers(buildPageItems(page, pageCount))
        expect(new Set(values).size).toBe(values.length)
        expect(Math.min(...values)).toBeGreaterThanOrEqual(1)
        expect(Math.max(...values)).toBeLessThanOrEqual(pageCount)
      }
    }
  })

  it('keeps page numbers ascending', () => {
    for (const page of [1, 5, 64, 120, 128]) {
      const values = numbers(buildPageItems(page, 128))
      expect(values).toEqual([...values].sort((a, b) => a - b))
    }
  })

  it('clamps an out-of-range page rather than producing a broken window', () => {
    expect(buildPageItems(0, 128)).toEqual(buildPageItems(1, 128))
    expect(buildPageItems(999, 128)).toEqual(buildPageItems(128, 128))
  })

  it('honours a wider slot count', () => {
    expect(buildPageItems(64, 128, 9)).toHaveLength(9)
    expect(buildPageItems(1, 128, 5)).toHaveLength(5)
  })
})
