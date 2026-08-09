import { useState } from 'react'
import { api } from '../api/client'
import { CONTACT } from '../config'
import { SectionHeader } from './SectionHeader'

// Mirrors the backend's ContactCreate constraints so the visitor gets feedback
// before a round trip. The server still validates — this is convenience only.
const MIN_NAME = 2
const MIN_MESSAGE = 10
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY_FORM = { name: '', email: '', message: '' }

function contactCards() {
  const handle = CONTACT.telegram.replace('@', '')
  return [
    { icon: '@', label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: '→', label: 'Telegram', value: CONTACT.telegram, href: `https://t.me/${handle}` },
    { icon: '$', label: 'GitHub', value: CONTACT.github, href: `https://github.com/${CONTACT.github}` },
    { icon: 'in', label: 'LinkedIn', value: CONTACT.linkedin, href: `https://linkedin.com/in/${CONTACT.linkedin}` },
  ]
}

function Field({ id, label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, color: '#8b949e' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: '#f85149' }}>{error}</span>}
    </div>
  )
}

const fieldStyle = (hasError) => ({
  padding: '12px 14px',
  background: '#0d1117',
  border: `1px solid ${hasError ? '#f85149' : '#30363d'}`,
  borderRadius: 8,
  color: '#e6edf3',
  fontSize: 15,
  fontFamily: 'var(--font-mono)',
  outline: 'none',
  transition: 'border-color 180ms ease',
})

/**
 * Contact section: a validated form that posts to the backend, next to the
 * static contact links.
 *
 * The endpoint is rate limited to 3 requests per hour per IP, so a 429 gets its
 * own message — telling someone "try again" when they are blocked for an hour
 * would just have them retry into the same wall.
 */
export function Contact({ t, isMobile, revealed }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [submitError, setSubmitError] = useState(null)

  const update = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const validate = () => {
    const found = {}
    if (form.name.trim().length < MIN_NAME) found.name = t('nameErr')
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = t('emailErr')
    if (form.message.trim().length < MIN_MESSAGE) found.message = t('msgErr')
    return found
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const found = validate()
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setErrors({})
    setSubmitError(null)
    setStatus('sending')

    try {
      await api.sendContact({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      })
      setStatus('sent')
      setForm(EMPTY_FORM)
    } catch (error) {
      setStatus('error')
      setSubmitError(error?.code === 'rate_limited' ? t('conRateLimited') : t('conError'))
    }
  }

  const sending = status === 'sending'

  return (
    <section
      id="contact"
      style={{
        position: 'relative',
        zIndex: 10,
        scrollMarginTop: 72,
        maxWidth: 1140,
        margin: '0 auto',
        padding: isMobile ? '60px 16px' : '80px 32px',
        opacity: revealed ? 1 : 0,
        transform: `translateY(${revealed ? 0 : 20}px)`,
        transition: 'opacity 700ms ease, transform 700ms ease',
      }}
    >
      <SectionHeader
        eyebrow={t('conEyebrow')}
        title={t('conTitle')}
        subtitle={t('conSubtitle')}
        isMobile={isMobile}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 40,
          alignItems: 'start',
        }}
      >
        {status === 'sent' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              animation: 'fadeup 500ms ease both',
            }}
          >
            <div style={{ fontSize: 48, color: 'var(--gr)', marginBottom: 16 }}>✓</div>
            <p style={{ color: '#e6edf3', fontSize: 17, fontWeight: 600, margin: '0 0 8px' }}>
              {t('conSuccess')}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field id="c-name" label={t('conName')} error={errors.name}>
              <input
                id="c-name"
                name="name"
                type="text"
                autoComplete="name"
                className="field"
                value={form.name}
                onChange={update('name')}
                style={fieldStyle(Boolean(errors.name))}
              />
            </Field>

            <Field id="c-email" label={t('conEmail')} error={errors.email}>
              <input
                id="c-email"
                name="email"
                type="email"
                autoComplete="email"
                className="field"
                value={form.email}
                onChange={update('email')}
                style={fieldStyle(Boolean(errors.email))}
              />
            </Field>

            <Field id="c-msg" label={t('conMessage')} error={errors.message}>
              <textarea
                id="c-msg"
                name="message"
                rows={5}
                className="field"
                value={form.message}
                onChange={update('message')}
                style={{ ...fieldStyle(Boolean(errors.message)), resize: 'vertical' }}
              />
            </Field>

            <button
              type="submit"
              className="send-btn"
              disabled={sending}
              style={{
                minHeight: 50,
                padding: '0 28px',
                borderRadius: 10,
                background: sending ? '#30363d' : 'var(--gr)',
                border: '1px solid var(--gr)',
                color: sending ? '#8b949e' : '#04130b',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                cursor: sending ? 'wait' : 'pointer',
                opacity: sending ? 0.7 : 1,
                transition: 'all 220ms ease',
              }}
            >
              {sending ? t('conSending') : t('conSend')}
            </button>

            {submitError && (
              <div
                role="alert"
                style={{
                  padding: '12px 16px',
                  background: 'rgba(248,81,73,0.08)',
                  border: '1px solid rgba(248,81,73,0.3)',
                  borderRadius: 8,
                  color: '#f85149',
                  fontSize: 13,
                }}
              >
                {submitError}
              </div>
            )}
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {contactCards().map((card) => (
            <a
              key={card.label}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 18px',
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 260ms ease, box-shadow 260ms ease',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--gr-soft)',
                  borderRadius: 8,
                  color: 'var(--gr)',
                  fontSize: 18,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#5a636d', marginBottom: 2 }}>
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: '#e6edf3',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.value}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
