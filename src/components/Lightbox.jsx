import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const SWIPE_THRESHOLD_PX = 50

/**
 * Full-screen photo viewer for the gallery.
 *
 * Shows the full-size file (`url`, up to 1600px wide) rather than the grid's
 * thumbnail. Closes on Esc, a backdrop click or the × button; ← / → and a
 * horizontal swipe step through the photos. Page scrolling is locked while it
 * is open so the gallery does not move underneath it.
 *
 * Rendered through a portal into <body>: the gallery section animates with a
 * CSS transform, and a transformed ancestor would turn `position: fixed` into
 * "fixed to that section" instead of to the screen.
 */
export function Lightbox({ photos, index, onIndexChange, onClose }) {
  const touchStartX = useRef(null)
  const closeButton = useRef(null)
  const total = photos.length
  const photo = photos[index]

  const step = useCallback(
    (direction) => onIndexChange((index + direction + total) % total),
    [index, onIndexChange, total],
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight' && total > 1) step(1)
      else if (event.key === 'ArrowLeft' && total > 1) step(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, step, total])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  if (!photo) return null

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX
  }
  const onTouchEnd = (event) => {
    if (touchStartX.current === null || total < 2) return
    const deltaX = event.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) step(deltaX < 0 ? 1 : -1)
    touchStartX.current = null
  }

  const arrowStyle = (side) => ({
    position: 'absolute',
    top: '50%',
    [side]: 'clamp(8px, 2vw, 24px)',
    transform: 'translateY(-50%)',
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(13,17,23,0.7)',
    color: '#e6edf3',
    fontSize: 22,
    cursor: 'pointer',
  })

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.title ?? 'Rasm'}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 'clamp(12px, 4vw, 48px)',
        background: 'rgba(1,4,9,0.94)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeup 220ms ease both',
      }}
    >
      <img
        src={photo.url}
        alt={photo.title ?? ''}
        onClick={(event) => event.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 120px)',
          objectFit: 'contain',
          borderRadius: 8,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      />

      <div style={{ color: '#c9d1d9', fontSize: 14, textAlign: 'center' }}>
        {photo.title && <span>{photo.title}</span>}
        {total > 1 && (
          <span style={{ color: '#8b949e', marginLeft: photo.title ? 10 : 0 }}>
            {index + 1} / {total}
          </span>
        )}
      </div>

      <button
        ref={closeButton}
        type="button"
        aria-label="Yopish"
        onClick={onClose}
        style={{ ...arrowStyle('right'), top: 'clamp(8px, 2vw, 24px)', transform: 'none' }}
      >
        ×
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Oldingi rasm"
            onClick={(event) => {
              event.stopPropagation()
              step(-1)
            }}
            style={arrowStyle('left')}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Keyingi rasm"
            onClick={(event) => {
              event.stopPropagation()
              step(1)
            }}
            style={arrowStyle('right')}
          >
            ›
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}
