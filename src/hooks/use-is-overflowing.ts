import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Reports whether an element's content is clipped by `text-overflow: ellipsis`.
 *
 * The check is `scrollWidth > clientWidth` — the only reliable signal, since CSS
 * truncation leaves no trace in the DOM. It is re-run through a ResizeObserver
 * so the answer stays correct as the column is resized, the density toggle
 * changes the row height, or the sidebar collapses. A 1px tolerance absorbs the
 * sub-pixel rounding that otherwise reports a flush-fitting string as clipped.
 *
 * Returns a callback ref so it can attach to a node rendered conditionally,
 * plus the element's rendered text for use as tooltip content.
 */
export function useIsOverflowing<T extends HTMLElement>() {
  const [state, setState] = useState({ isOverflowing: false, text: '' })
  const observer = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect()
    if (!node) return

    // textContent is read alongside the measurement so a caller can offer the
    // full string as tooltip content even when the children are JSX fragments
    // rather than a single string literal.
    const measure = () =>
      setState({
        isOverflowing: node.scrollWidth - node.clientWidth > 1,
        text: node.textContent ?? '',
      })
    measure()

    observer.current = new ResizeObserver(measure)
    observer.current.observe(node)
  }, [])

  useEffect(() => () => observer.current?.disconnect(), [])

  return { ref, ...state }
}
