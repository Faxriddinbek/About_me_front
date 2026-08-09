import { useCallback, useEffect, useState } from 'react'

/**
 * Load data from the API and expose it as { data, status, error, reload }.
 *
 * `status` is a single state machine value ('loading' | 'success' | 'error')
 * rather than separate booleans, so an impossible combination like
 * "loading and errored at once" cannot be represented.
 *
 * @param fetcher  receives an AbortSignal and returns a promise
 * @param deps     re-fetch whenever these change (e.g. the active language)
 */
export function useApiResource(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, status: 'loading', error: null })
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setState((previous) => ({ ...previous, status: 'loading', error: null }))

    fetcher(controller.signal)
      .then((data) => {
        if (active) setState({ data, status: 'success', error: null })
      })
      .catch((error) => {
        // An abort means this component unmounted or the deps changed — the
        // result is simply no longer wanted, which is not a failure.
        if (error?.name === 'AbortError' || !active) return
        setState({ data: null, status: 'error', error })
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken])

  return { ...state, reload }
}
