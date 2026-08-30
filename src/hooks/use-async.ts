import { useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Minimal data-fetching hook for the mock API.
 *
 * Tracks a cancellation flag so a response from a superseded request (the user
 * typed another character, or navigated away) can never overwrite fresher
 * state. Without it, fast-then-slow responses arriving out of order produce
 * stale results — the classic race in search-as-you-type.
 *
 * `deps` is the caller's responsibility and should list primitive values, not
 * object identities, to avoid refetching on every render.
 */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState((previous) => ({ ...previous, loading: true, error: null }))

    factory()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error('Request failed:', error)
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Request failed'),
        })
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
