import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface AsyncResult<T> extends AsyncState<T> {
  /** Re-runs the factory with the same deps — the retry affordance for error states. */
  reload: () => void
}

/**
 * Minimal data-fetching hook for the mock API.
 *
 * Tracks a cancellation flag so a response from a superseded request (the user
 * typed another character, or navigated away) can never overwrite fresher
 * state. Without it, fast-then-slow responses arriving out of order produce
 * stale results — the classic race in search-as-you-type.
 *
 * `reload` bumps an internal nonce that participates in the effect deps, so a
 * failed request can be retried without the caller having to perturb its own
 * inputs. An error state with no way to retry is a dead end.
 *
 * `deps` is the caller's responsibility and should list primitive values, not
 * object identities, to avoid refetching on every render.
 */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((value) => value + 1), [])

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
  }, [...deps, nonce])

  return { ...state, reload }
}
