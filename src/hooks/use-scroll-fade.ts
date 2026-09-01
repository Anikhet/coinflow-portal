import { useCallback, useEffect, useRef } from 'react'

/** How long the scrollbar stays visible after the last scroll event. */
const IDLE_MS = 700

/**
 * Fades a scroll container's scrollbar out once scrolling stops.
 *
 * The scrollbar is styled transparent by default (`.scroll-fade` in index.css)
 * and painted while `data-scrolling="true"` is set, so the bar only appears
 * where it carries information — during the scroll itself.
 *
 * The flag is written straight to the DOM node rather than held in state: a
 * table can render hundreds of rows, and re-rendering all of them twice per
 * scroll gesture just to toggle a scrollbar colour is wasted work. Because the
 * scrollbar occupies a fixed gutter in both states, fading it changes no
 * layout — nothing shifts when it appears or disappears.
 */
export function useScrollFade<T extends HTMLElement>() {
  const node = useRef<T | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onScroll = useCallback(() => {
    const element = node.current
    if (!element) return

    // onScroll fires at frame rate. Writing the attribute unconditionally
    // would invalidate the container's style on every frame of every gesture,
    // so the write is guarded and only the (cheap) timer is reset.
    if (element.dataset.scrolling !== 'true') element.dataset.scrolling = 'true'
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      element.dataset.scrolling = 'false'
    }, IDLE_MS)
  }, [])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return { ref: node, onScroll }
}
