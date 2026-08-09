import { useEffect, useState } from 'react'

/**
 * True once the page has scrolled past `threshold` pixels.
 *
 * Drives the header's transition from transparent to a blurred, bordered bar.
 * The listener is passive so scrolling is never blocked on React work.
 */
export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll() // sync immediately — the page may load already scrolled
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
