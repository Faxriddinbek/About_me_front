/**
 * Small presentational pieces shared by the admin screens.
 *
 * The admin panel is a private tool, so it deliberately does not reuse the
 * public site's design system — it needs density and clarity, not atmosphere.
 * Colours and field styling live in ./tokens.js.
 */

import { LINE, MUTED, SURFACE } from './tokens'

export function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: '#5a636d' }}>{hint}</span>}
    </label>
  )
}

export function Button({ variant = 'primary', style, ...props }) {
  const variants = {
    primary: { background: 'var(--gr)', border: '1px solid var(--gr)', color: '#04130b' },
    ghost: { background: 'transparent', border: `1px solid ${LINE}`, color: '#e6edf3' },
    danger: {
      background: 'transparent',
      border: '1px solid rgba(248,81,73,0.4)',
      color: '#f85149',
    },
  }

  return (
    <button
      type="button"
      {...props}
      style={{
        padding: '9px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        transition: 'opacity 150ms ease',
        ...variants[variant],
        ...style,
      }}
    />
  )
}

export function Banner({ tone = 'error', children }) {
  const tones = {
    error: { bg: 'rgba(248,81,73,0.08)', line: 'rgba(248,81,73,0.3)', fg: '#f85149' },
    success: { bg: 'rgba(74,222,128,0.08)', line: 'rgba(74,222,128,0.3)', fg: 'var(--gr)' },
    info: { bg: 'rgba(88,166,255,0.08)', line: 'rgba(88,166,255,0.3)', fg: '#58a6ff' },
  }
  const t = tones[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      style={{
        padding: '10px 14px',
        background: t.bg,
        border: `1px solid ${t.line}`,
        borderRadius: 8,
        color: t.fg,
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  )
}

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
