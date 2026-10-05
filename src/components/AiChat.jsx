import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { streamChat } from '../api/ai'

/** Map a failed request to a message the visitor can act on. */
function errorText(error, t) {
  if (error?.status === 429) return t('aiRateLimited')
  if (error?.code === 'ai_busy') return t('aiBusy')
  if (error?.code === 'ai_unavailable') return t('aiUnavailable')
  return t('aiError')
}

/**
 * The "Ask my AI" chat window.
 *
 * A floating panel on desktop, full screen on a phone. Answers stream in as
 * they are written; the visitor can stop one mid-way. The conversation lives
 * only in this component — closing the panel keeps it, reloading the page
 * clears it, and the server stores nothing.
 */
export function AiChat({ t, lang, isMobile, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      abortRef.current?.abort()
    }
  }, [onClose])

  // On a phone the panel covers the page; keep the page from scrolling under it.
  useEffect(() => {
    if (!isMobile) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isMobile])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const send = useCallback(
    async (question) => {
      const text = question.trim()
      if (!text || streaming) return

      const history = [...messages, { role: 'user', content: text }]
      setMessages([...history, { role: 'assistant', content: '' }])
      setInput('')
      setError(null)
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller
      try {
        await streamChat({
          messages: history,
          lang,
          signal: controller.signal,
          onToken: (piece) =>
            setMessages((current) => {
              const next = [...current]
              const last = next[next.length - 1]
              next[next.length - 1] = { ...last, content: last.content + piece }
              return next
            }),
        })
      } catch (failure) {
        if (failure?.name !== 'AbortError') setError(errorText(failure, t))
      } finally {
        setStreaming(false)
        abortRef.current = null
        // Drop an empty answer bubble (failed or stopped before any text), so
        // the history sent next time never contains an empty message.
        setMessages((current) =>
          current.filter((message, index) => index < current.length - 1 || message.content),
        )
      }
    },
    [lang, messages, streaming, t],
  )

  const onSubmit = (event) => {
    event.preventDefault()
    send(input)
  }

  const onInputKeyDown = (event) => {
    // Enter sends; Shift+Enter makes a new line.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send(input)
    }
  }

  const panelStyle = isMobile
    ? { inset: 0, borderRadius: 0 }
    : {
        right: 28,
        bottom: 28,
        width: 400,
        height: 'min(620px, calc(100vh - 56px))',
        borderRadius: 16,
      }

  const suggestions = t('aiSuggestions')

  return createPortal(
    <div
      role="dialog"
      aria-label={t('aiTitle')}
      style={{
        position: 'fixed',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(13,17,23,0.97)',
        border: isMobile ? 'none' : '1px solid #30363d',
        boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        fontFamily: 'var(--font-mono)',
        color: '#e6edf3',
        animation: 'fadeup 220ms ease both',
        ...panelStyle,
      }}
    >
      {/* --- header --- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          borderBottom: '1px solid #21262d',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: 'var(--gr)',
            boxShadow: '0 0 10px var(--gr)',
          }}
        />
        <strong style={{ fontSize: 14, flex: 1 }}>{t('aiTitle')}</strong>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('aiClose')}
          style={{
            width: 34,
            height: 34,
            border: '1px solid #30363d',
            borderRadius: 8,
            background: 'transparent',
            color: '#c9d1d9',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>

      {/* --- messages --- */}
      <div
        ref={listRef}
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Bubble role="assistant">{t('aiGreeting')}</Bubble>

        {messages.length === 0 && Array.isArray(suggestions) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                style={{
                  padding: '7px 11px',
                  border: '1px solid var(--gr-line)',
                  borderRadius: 99,
                  background: 'var(--gr-soft)',
                  color: 'var(--gr)',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, index) => (
          <Bubble key={index} role={message.role}>
            {message.content || (streaming && index === messages.length - 1 ? '…' : '')}
          </Bubble>
        ))}

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(248,81,73,0.4)',
              background: 'rgba(248,81,73,0.1)',
              color: '#ffa198',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* --- input --- */}
      <form
        onSubmit={onSubmit}
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          borderTop: '1px solid #21262d',
          paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : 12,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={t('aiPlaceholder')}
          rows={1}
          maxLength={2000}
          style={{
            flex: 1,
            resize: 'none',
            maxHeight: 120,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #30363d',
            background: '#0d1117',
            color: '#e6edf3',
            fontSize: isMobile ? 16 : 14, // 16px stops iOS zooming into the field
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        {streaming ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            style={sendButtonStyle(false)}
          >
            {t('aiStop')}
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()} style={sendButtonStyle(!input.trim())}>
            {t('aiSend')}
          </button>
        )}
      </form>

      <div style={{ padding: '0 12px 10px', fontSize: 11, color: '#6e7681', textAlign: 'center' }}>
        {t('aiDisclaimer')}
      </div>
    </div>,
    document.body,
  )
}

function sendButtonStyle(disabled) {
  return {
    padding: '0 16px',
    borderRadius: 10,
    border: '1px solid var(--gr)',
    background: disabled ? 'transparent' : 'var(--gr)',
    color: disabled ? 'var(--gr)' : '#04130b',
    fontWeight: 600,
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }
}

function Bubble({ role, children }) {
  const mine = role === 'user'
  return (
    <div
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '86%',
        padding: '10px 13px',
        borderRadius: 12,
        borderBottomRightRadius: mine ? 4 : 12,
        borderBottomLeftRadius: mine ? 12 : 4,
        background: mine ? 'var(--gr-soft)' : '#161b22',
        border: `1px solid ${mine ? 'var(--gr-line)' : '#30363d'}`,
        fontSize: 13.5,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
      }}
    >
      {children}
    </div>
  )
}
