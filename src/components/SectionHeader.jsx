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

/**
 * "Load more" footer for the sections that page through the API.
 *
 * The count sits under the button rather than in a line of its own: how much
 * is left is exactly what tells a visitor whether pressing it is worth it.
 */
export function LoadMore({ loaded, total, status, error, label, loadingLabel, onLoadMore }) {
  const loading = status === 'loading'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        marginTop: 32,
      }}
    >
      {status === 'error' && (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: '#f85149', textAlign: 'center' }}>
          {error?.message}
        </p>
      )}
      <button
        type="button"
        className="btn-ghost"
        onClick={onLoadMore}
        disabled={loading}
        style={{
          // Full width on a phone — a narrow centred pill is an awkward target
          // — but capped so it stays a button on a wide screen.
          width: '100%',
          maxWidth: 320,
          minHeight: 46,
          padding: '0 24px',
          borderRadius: 10,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.22)',
          color: '#e6edf3',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          cursor: loading ? 'progress' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'border-color 220ms ease, color 220ms ease, box-shadow 220ms ease',
        }}
      >
        {loading ? loadingLabel : label}
      </button>
      <span style={{ fontSize: 12, color: '#5a636d', fontFamily: 'var(--font-mono)' }}>
        {loaded} / {total}
      </span>
    </div>
  )
}
