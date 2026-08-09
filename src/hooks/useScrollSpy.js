import { useEffect, useState } from 'react'

/**
 * Return the id of the section currently occupying the middle of the viewport.
 *
 * The asymmetric rootMargin shrinks the observation band to roughly the middle
 * 5% of the screen, so exactly one section is "active" at a time instead of
 * every section that happens to be partly visible.
 */
export function useScrollSpy(ids) {
  const [activeId, setActiveId] = useState(ids[0] ?? null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )

    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
    // ids is a module-level constant array in practice; join() keeps the
    // dependency stable even if a caller passes a fresh array each render.
  }, [ids.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  return activeId
}
