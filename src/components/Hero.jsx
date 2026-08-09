import { useCallback, useEffect, useRef, useState } from 'react'
import { CAROUSEL_INTERVAL_MS, FALLBACK_IMAGE, HERO_PHOTOS } from '../config'
import { usePrefersReducedMotion } from '../hooks/useReveal'

const SWIPE_THRESHOLD_PX = 40

/**
 * Landing section: an auto-advancing photo carousel beside the intro copy.
 *
 * The carousel cross-fades by stacking every photo and animating opacity, so
 * there is never a frame where no image is painted.
 */
export function Hero({ t, isMobile }) {
  const [slide, setSlide] = useState(0)
  const touchStartX = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  const total = HERO_PHOTOS.length

  const go = useCallback(
    (direction) => setSlide((current) => (current + direction + total) % total),
    [total],
  )

  // Auto-advance. `slide` is a dependency on purpose: tapping a dot resets the
  // timer, so the visitor always gets a full interval to look at their choice.
  useEffect(() => {
    if (reducedMotion || total < 2) return
    const timer = setInterval(() => go(1), CAROUSEL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [go, reducedMotion, slide, total])

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX
  }

  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return
    const deltaX = event.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) go(deltaX < 0 ? 1 : -1)
    touchStartX.current = null
  }

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        zIndex: 10,
        scrollMarginTop: 72,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? 24 : 'clamp(32px, 6vw, 80px)',
        maxWidth: 1240,
        margin: '0 auto',
        padding: isMobile ? '100px 20px 40px' : '120px 56px 56px',
        minHeight: '100vh',
      }}
    >
      {/* --- photo carousel --- */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          flex: '0 0 auto',
          width: isMobile ? '100%' : '40%',
          maxWidth: isMobile ? 300 : 440,
          aspectRatio: '3 / 4',
        }}
      >
        {/* Green rim light behind the subject */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            right: '10%',
            bottom: '20%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(74,222,128,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
            zIndex: 0,
            animation: 'glowpulse 4s ease-in-out infinite',
          }}
        />

        {HERO_PHOTOS.map((photo, index) => {
          const isActive = index === slide
          return (
            <img
              key={photo.url}
              src={photo.url}
              alt={photo.alt}
              draggable="false"
              // The first slide is what the visitor sees immediately; the rest
              // can wait until the browser has spare bandwidth.
              loading={index === 0 ? 'eager' : 'lazy'}
              onError={(event) => {
                if (!event.currentTarget.src.endsWith(FALLBACK_IMAGE)) {
                  event.currentTarget.src = FALLBACK_IMAGE
                }
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                opacity: isActive ? 1 : 0,
                transform: `scale(${isActive ? 1 : 1.07})`,
                transition: 'opacity 900ms ease, transform 6000ms ease',
                zIndex: isActive ? 2 : 1,
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)',
                borderRadius: 16,
              }}
            />
          )
        })}

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 14,
            zIndex: 5,
            display: 'flex',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          {HERO_PHOTOS.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              className="dot"
              onClick={() => setSlide(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === slide}
              style={{
                height: 8,
                width: index === slide ? 22 : 8,
                padding: 0,
                border: 'none',
                borderRadius: 99,
                cursor: 'pointer',
                background: index === slide ? 'var(--gr)' : 'rgba(255,255,255,0.28)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                transition: 'width 320ms ease, background 320ms ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* --- intro copy --- */}
      <div
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          maxWidth: 560,
          textAlign: isMobile ? 'center' : 'left',
          animation: 'fadeup 700ms var(--ease-out) both',
        }}
      >
        <div
          style={{
            color: 'var(--gr)',
            fontSize: isMobile ? 13 : 15,
            fontWeight: 500,
            letterSpacing: '0.03em',
            marginBottom: 18,
          }}
        >
          {t('kicker')}
          <span
            style={{
              display: 'inline-block',
              width: 9,
              height: '1.05em',
              marginLeft: 7,
              verticalAlign: -2,
              background: 'var(--gr)',
              boxShadow: '0 0 10px rgba(74,222,128,0.6)',
              animation: 'cursor-blink 1.1s step-end infinite',
            }}
          />
        </div>

        <h1
          style={{
            margin: '0 0 20px',
            fontSize: isMobile ? 'clamp(34px, 11vw, 46px)' : 'clamp(46px, 4.6vw, 68px)',
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#f3f7fc',
            textWrap: 'balance',
          }}
        >
          {t('heading')}
        </h1>

        <p
          style={{
            margin: '0 0 36px',
            fontSize: isMobile ? 15 : 18,
            lineHeight: 1.6,
            color: '#9aa4b1',
            maxWidth: isMobile ? '100%' : 440,
          }}
        >
          {t('subtitle')}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            justifyContent: isMobile ? 'center' : 'flex-start',
          }}
        >
          <a
            href="#projects"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 50,
              padding: '0 28px',
              borderRadius: 10,
              background: 'var(--gr)',
              border: '1px solid var(--gr)',
              color: '#04130b',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 120ms ease, box-shadow 220ms ease, background 220ms ease',
            }}
          >
            {t('viewProjects')}
          </a>
          <a
            href="#contact"
            className="btn-ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 50,
              padding: '0 28px',
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.22)',
              color: '#e6edf3',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition:
                'transform 120ms ease, box-shadow 220ms ease, border-color 220ms ease, color 220ms ease',
            }}
          >
            {t('contact')}
          </a>
        </div>
      </div>
    </section>
  )
}
