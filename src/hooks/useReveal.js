import { useEffect, useMemo, useState } from 'react'

/** Whether the visitor asked the OS to minimise animation. */
export function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])
}

/**
 * Track which sections have scrolled into view at least once.
 *
 * Reveals are one-way: a section that has appeared stays revealed, so
 * scrolling back up never re-plays the fade. When the visitor prefers reduced
 * motion everything starts revealed and no observer is created at all.
 */
export function useReveal(ids) {
  const reducedMotion = usePrefersReducedMotion()

  const [revealed, setRevealed] = useState(() =>
    reducedMotion ? new Set(ids) : new Set(),
  )

  useEffect(() => {
    if (reducedMotion) return

    const observer = new IntersectionObserver(
      (entries) => {
        const appeared = entries.filter((e) => e.isIntersecting).map((e) => e.target.id)
        if (appeared.length === 0) return
        setRevealed((previous) => new Set([...previous, ...appeared]))
      },
      { threshold: 0.08 },
    )

    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [ids.join(','), reducedMotion]) // eslint-disable-line react-hooks/exhaustive-deps

  return revealed
}
