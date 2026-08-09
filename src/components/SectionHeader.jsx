/**
 * The eyebrow / title / subtitle block that opens every section.
 *
 * Extracted because the three content sections repeat it verbatim apart from
 * their copy — one place to change the heading rhythm for all of them.
 */
export function SectionHeader({ eyebrow, title, subtitle, isMobile }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 48 }}>
      <div
        style={{
          color: 'var(--gr)',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        <span style={{ color: '#5a636d' }}>{'// '}</span>
        {eyebrow}
      </div>
      <h2
        style={{
          margin: '0 0 16px',
          fontSize: isMobile ? 'clamp(28px, 9vw, 40px)' : 'clamp(40px, 4vw, 52px)',
          lineHeight: 1.1,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#f3f7fc',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: '0 auto',
          fontSize: isMobile ? 14 : 16,
          lineHeight: 1.6,
          color: '#8b949e',
          maxWidth: 520,
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}

/** Centred "nothing here" / "something broke" panel shared by the sections. */
export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 42, color: 'var(--gr)', opacity: 0.3, marginBottom: 12 }}>
        {'{ }'}
      </div>
      <p style={{ color: '#8b949e', fontSize: 15, margin: 0 }}>{message}</p>
      {onAction && (
        <button
          type="button"
          className="btn-ghost"
          onClick={onAction}
          style={{
            marginTop: 20,
            minHeight: 42,
            padding: '0 22px',
            borderRadius: 10,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#e6edf3',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            transition: 'border-color 220ms ease, color 220ms ease, box-shadow 220ms ease',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
