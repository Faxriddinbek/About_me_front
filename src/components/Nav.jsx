import { useEffect, useState } from 'react'
import { useScrolled } from '../hooks/useScrolled'

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'projects', label: 'Project' },
  { id: 'contact', label: 'Contact' },
  { id: 'media', label: 'Media' },
]

function LangSwitch({ lang, onChange, compact = false }) {
  const buttonStyle = (isActive) => ({
    padding: compact ? '6px 8px' : '6px 10px',
    fontSize: compact ? 11 : 12,
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    border: 'none',
    cursor: 'pointer',
    background: isActive ? 'var(--gr-soft)' : 'transparent',
    color: isActive ? 'var(--gr)' : '#8b949e',
    transition: 'all 180ms ease',
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        className="lang-btn"
        onClick={() => onChange('uz')}
        style={buttonStyle(lang === 'uz')}
      >
        UZ
      </button>
      <span
        style={{ width: 1, height: compact ? 14 : 16, background: 'rgba(255,255,255,0.12)' }}
      />
      <button
        type="button"
        className="lang-btn"
        onClick={() => onChange('en')}
        style={buttonStyle(lang === 'en')}
      >
        EN
      </button>
    </div>
  )
}

/**
 * Fixed header: brand, section links with an active underline, language
 * switch, and a hamburger dropdown below the mobile breakpoint.
 */
export function Nav({ lang, onLangChange, activeSection, isMobile }) {
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)

  // Growing past the mobile breakpoint with the dropdown open would leave it
  // stranded on screen, since the desktop layout never renders it.
  useEffect(() => {
    if (!isMobile) setMenuOpen(false)
  }, [isMobile])

  const linkColor = (id) => (activeSection === id ? 'var(--gr)' : '#8b949e')
  const linkWeight = (id) => (activeSection === id ? 500 : 400)

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          background: scrolled ? 'rgba(10,14,23,0.82)' : 'rgba(10,14,23,0)',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0)'}`,
          backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
          transition: 'background 260ms ease, border-color 260ms ease',
        }}
      >
        <a href="#home" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <span
            style={{
              color: 'var(--gr)',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '-0.03em',
            }}
          >
            &lt;/&gt;
          </span>
          <span
            style={{
              color: '#e6edf3',
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: '-0.01em',
            }}
          >
            Faxriddinbek
          </span>
        </a>

        {/* Desktop: inline links + language switch */}
        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 28 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="nav-link"
                style={{
                  position: 'relative',
                  color: linkColor(item.id),
                  fontSize: 14,
                  fontWeight: linkWeight(item.id),
                  padding: '6px 2px',
                  transition: 'color 180ms ease',
                }}
              >
                {item.label}
                {activeSection === item.id && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -5,
                      height: 2,
                      borderRadius: 2,
                      background: 'var(--gr)',
                      boxShadow: '0 0 10px rgba(74,222,128,0.7)',
                    }}
                  />
                )}
              </a>
            ))}
          </nav>
          <LangSwitch lang={lang} onChange={onLangChange} />
        </div>

        {/* Mobile: compact language switch + hamburger */}
        <div style={{ display: isMobile ? 'flex' : 'none', alignItems: 'center', gap: 10 }}>
          <LangSwitch lang={lang} onChange={onLangChange} compact />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              width: 44,
              height: 44,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ width: 19, height: 2, borderRadius: 2, background: '#e6edf3' }}
              />
            ))}
          </button>
        </div>
      </header>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            left: 14,
            right: 14,
            zIndex: 39,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 10,
            background: 'rgba(13,17,23,0.96)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="nav-link"
              onClick={() => setMenuOpen(false)}
              style={{
                color: linkColor(item.id),
                fontSize: 15,
                fontWeight: linkWeight(item.id),
                padding: '12px 12px',
                borderRadius: 9,
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </>
  )
}
