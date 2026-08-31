import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Geometry of the sliding underline, in pixels relative to the tab list. */
export type TabIndicator = {
  left: number
  width: number
  /** False until the first measurement lands, so the bar never animates in from x=0. */
  ready: boolean
}

const HIDDEN: TabIndicator = { left: 0, width: 0, ready: false }

/**
 * Tracks the active tab trigger so a single underline can slide between tabs
 * instead of each trigger fading its own underline in and out.
 *
 * The bar is one element positioned against the list, so switching tabs is a
 * transform/width tween on a single node rather than two crossfades that leave
 * a gap in the middle of the transition.
 *
 * Measurement is driven by two observers because neither alone is sufficient:
 * a MutationObserver catches Radix flipping `data-state` on the triggers (the
 * tab actually changing), and a ResizeObserver catches the strip reflowing
 * (panel resize, font swap, a count badge appearing) while the active tab
 * stays put.
 */
export function useTabIndicator<T extends HTMLElement>() {
  const listRef = useRef<T>(null)
  const [indicator, setIndicator] = useState<TabIndicator>(HIDDEN)

  const measure = useCallback(() => {
    const list = listRef.current
    if (!list) return

    const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
    if (!active) {
      setIndicator(HIDDEN)
      return
    }

    // offsetLeft is relative to the list (its own offsetParent), so the bar
    // stays glued to the trigger even while the strip is scrolled sideways.
    const next = { left: active.offsetLeft, width: active.offsetWidth, ready: true }
    setIndicator((prev) =>
      prev.ready && prev.left === next.left && prev.width === next.width ? prev : next,
    )
  }, [])

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    measure()

    const mutations = new MutationObserver(measure)
    mutations.observe(list, { attributes: true, attributeFilter: ['data-state'], subtree: true })

    const resizes = new ResizeObserver(measure)
    resizes.observe(list)
    for (const trigger of list.querySelectorAll('[role="tab"]')) resizes.observe(trigger)

    return () => {
      mutations.disconnect()
      resizes.disconnect()
    }
  }, [measure])

  return { listRef, indicator }
}
