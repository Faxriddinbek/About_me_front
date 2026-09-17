import { useCallback, useEffect, useRef, useState } from 'react'

const EMPTY = {
  items: [],
  total: 0,
  status: 'loading', // 'loading' | 'success' | 'error' — the first page
  error: null,
  moreStatus: 'idle', // 'idle' | 'loading' | 'error' — every page after it
  moreError: null,
  exhausted: false,
}

/**
 * Load a paginated list one page at a time and keep every page loaded so far.
 *
 * `useApiResource` replaces its data on every fetch, which is right for a list
 * that is shown whole. A gallery that grows needs the opposite: each page is
 * *appended* to what is already on screen, so the visitor never loses what
 * they were looking at.
 *
 * Two status values rather than one, because the first page and the ones after
 * it fail differently: an empty screen needs the error in its place, while a
 * failed "load more" must leave the loaded items alone and report itself next
 * to the button that triggered it.
 *
 * @param fetcher  receives { limit, offset, signal } and returns a promise of
 *                 the backend's page envelope: { items, total, limit, offset }
 * @param deps     start over whenever these change (language, active filter)
 * @param pageSize how many items one request asks for
 */
export function usePagedResource(fetcher, deps = [], { pageSize = 24 } = {}) {
  const [state, setState] = useState(EMPTY)
  const [reloadToken, setReloadToken] = useState(0)
  // The in-flight "load more" request. Held in a ref so the first-page effect
  // can abort a page that is about to be appended to a list it no longer
  // belongs to — the visitor switched filters while it was on its way.
  const pending = useRef(null)

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setState(EMPTY)

    fetcher({ limit: pageSize, offset: 0, signal: controller.signal })
      .then((page) => {
        if (!active) return
        setState({
          ...EMPTY,
          items: page.items,
          total: page.total,
          status: 'success',
          exhausted: page.items.length < pageSize,
        })
      })
      .catch((error) => {
        // An abort means this component unmounted or the deps changed — the
        // result is simply no longer wanted, which is not a failure.
        if (error?.name === 'AbortError' || !active) return
        setState({ ...EMPTY, status: 'error', error })
      })

    return () => {
      active = false
      controller.abort()
      pending.current?.abort()
      pending.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken, pageSize])

  const loaded = state.items.length

  const loadMore = useCallback(() => {
    // One page at a time: a double tap must not fetch the same offset twice.
    if (pending.current) return

    const controller = new AbortController()
    pending.current = controller
    setState((previous) => ({ ...previous, moreStatus: 'loading', moreError: null }))

    fetcher({ limit: pageSize, offset: loaded, signal: controller.signal })
      .then((page) => {
        // A filter change has taken over — this page belongs to a list that no
        // longer exists, and appending it would mix two different queries.
        if (pending.current !== controller) return
        pending.current = null
        setState((previous) => ({
          ...previous,
          items: [...previous.items, ...page.items],
          // Re-read from the response: rows may have been added or removed
          // server-side since the first page was fetched.
          total: page.total,
          moreStatus: 'idle',
          moreError: null,
          exhausted: page.items.length < pageSize,
        }))
      })
      .catch((error) => {
        if (pending.current !== controller) return
        pending.current = null
        if (error?.name === 'AbortError') return
        setState((previous) => ({ ...previous, moreStatus: 'error', moreError: error }))
      })
  }, [fetcher, pageSize, loaded])

  return {
    ...state,
    loaded,
    // A short page ends the list even when `total` disagrees (rows deleted
    // between two requests), so a stale count can never leave a button that
    // loads nothing.
    hasMore: state.status === 'success' && !state.exhausted && loaded < state.total,
    loadMore,
    reload,
  }
}
