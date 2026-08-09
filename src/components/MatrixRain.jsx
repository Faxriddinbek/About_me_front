import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks/useReveal'

const GLYPHS =
  '01<>/{}[]()=+-*&^%$#@!;:.λπΣΩ∑abcdefABCDEF0123456789'.split('')

const FONT_SIZE = 15
const HEAD_RGB = '190,255,220' // bright leading glyph
const TAIL_RGB = '74,222,128' // the terminal green trailing behind it

/**
 * Full-screen "code rain" canvas that sits behind the whole page.
 *
 * Runs entirely outside React: the animation mutates canvas pixels ~60x per
 * second, and routing that through state would re-render the tree on every
 * frame. React owns the element, the effect owns the pixels.
 */
export function MatrixRain() {
  const canvasRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    // Respect the OS setting — a constantly moving background is exactly what
    // "reduce motion" is meant to suppress.
    if (reducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let columns = []
    let width = 0
    let height = 0
    let frame = 0

    const setup = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      const count = Math.ceil(width / FONT_SIZE)
      columns = Array.from({ length: count }, () => ({
        y: Math.floor(Math.random() * -60),
        speed: 0.12 + Math.random() * 0.5,
        accumulator: Math.random(),
        depth: 0.25 + Math.random() * 0.75,
      }))
    }

    const draw = () => {
      // A translucent fill instead of clearRect: previous glyphs fade out
      // gradually, which is what produces the trailing streaks.
      ctx.fillStyle = 'rgba(10,14,23,0.075)'
      ctx.fillRect(0, 0, width, height)
      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`

      for (let i = 0; i < columns.length; i++) {
        const column = columns[i]
        column.accumulator += column.speed
        if (column.accumulator < 1) continue

        column.accumulator -= 1
        const x = i * FONT_SIZE
        const y = column.y * FONT_SIZE

        ctx.fillStyle = `rgba(${HEAD_RGB},${(0.9 * column.depth).toFixed(3)})`
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y)

        ctx.fillStyle = `rgba(${TAIL_RGB},${(0.5 * column.depth).toFixed(3)})`
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y - FONT_SIZE)

        column.y += 1
        // Randomised restart so columns never fall back into lockstep.
        if (y > height && Math.random() > 0.975) column.y = 0
      }

      frame = requestAnimationFrame(draw)
    }

    setup()
    draw()
    window.addEventListener('resize', setup)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', setup)
    }
  }, [reducedMotion])

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Vignette that darkens the rain towards the edges so text stays readable */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'radial-gradient(125% 95% at 68% 42%, rgba(10,14,23,0) 0%, rgba(10,14,23,0.32) 52%, rgba(10,14,23,0.74) 100%)',
        }}
      />
    </>
  )
}
