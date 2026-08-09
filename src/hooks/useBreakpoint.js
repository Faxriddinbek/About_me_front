import { useEffect, useState } from 'react'

const MOBILE_MAX = 768
const TABLET_MAX = 1024

/**
 * Track the viewport width and expose the two breakpoints the design uses.
 *
 * The design encodes responsiveness as JS values (grid columns, font sizes,
 * flex direction) rather than media queries, so the width has to live in
 * React state instead of CSS.
 */
export function useBreakpoint() {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? TABLET_MAX : window.innerWidth,
  )

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return {
    width,
    isMobile: width < MOBILE_MAX,
    isTablet: width >= MOBILE_MAX && width < TABLET_MAX,
  }
}
