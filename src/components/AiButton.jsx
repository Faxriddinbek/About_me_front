import { FALLBACK_IMAGE, HERO_PHOTOS } from '../config'

/**
 * Floating "Ask my AI" button with a spinning conic-gradient ring.
 *
 * The AI chat itself is not built yet. Rather than render a button that does
 * nothing when clicked, it currently jumps to the contact section — a real
 * action that matches the intent. Swap `href` for an onClick that opens the
 * chat modal once that exists.
 */
export function AiButton({ isMobile }) {
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 45,
        right: isMobile ? 16 : 28,
        bottom: isMobile ? 18 : 28,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 9,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#d3dbe6',
          background: 'rgba(13,17,23,0.72)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '4px 11px',
          borderRadius: 99,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          whiteSpace: 'nowrap',
        }}
      >
        Ask my AI
      </span>

      <a
        href="#contact"
        className="ai-btn"
        aria-label="Ask my AI"
        style={{
          position: 'relative',
          display: 'block',
          width: 66,
          height: 66,
          borderRadius: '50%',
          background: 'transparent',
          cursor: 'pointer',
          animation: 'aiglow 2.6s ease-in-out infinite',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            background:
              'conic-gradient(from 0deg, #22d3ee, #4ade80, #22d3ee, #4ade80, #22d3ee)',
            animation: 'spin 3.4s linear infinite',
            zIndex: 0,
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(10,14,23,0.92)',
          }}
        >
          <img
            src={HERO_PHOTOS[0]?.url ?? FALLBACK_IMAGE}
            alt=""
            draggable="false"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </span>
      </a>
    </div>
  )
}
