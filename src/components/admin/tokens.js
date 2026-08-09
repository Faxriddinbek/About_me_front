/**
 * Colours and shared field styling for the admin screens.
 *
 * Kept apart from ui.jsx because a module that exports both components and
 * plain values breaks React Fast Refresh — editing a colour would force a full
 * reload instead of a hot update.
 */

export const PANEL_BG = '#0d1117'
export const SURFACE = '#161b22'
export const LINE = '#30363d'
export const MUTED = '#8b949e'

export const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: PANEL_BG,
  border: `1px solid ${LINE}`,
  borderRadius: 8,
  color: '#e6edf3',
  fontSize: 14,
  fontFamily: 'var(--font-mono)',
  outline: 'none',
}
