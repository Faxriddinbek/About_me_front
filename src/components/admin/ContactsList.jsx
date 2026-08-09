import { useCallback, useState } from 'react'
import { adminApi } from '../../api/client'
import { useApiResource } from '../../hooks/useApiResource'
import { MUTED } from './tokens'
import { Banner, Button, Card } from './ui'

const formatDate = (iso) =>
  new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Messages submitted through the public contact form. */
export function ContactsList({ token }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const fetcher = useCallback((signal) => adminApi.listContacts(token, { signal }), [token])
  const { data, status, error: loadError, reload } = useApiResource(fetcher, [token])

  const messages = data?.items ?? []
  const unread = messages.filter((message) => !message.is_read).length

  const markRead = async (id) => {
    setBusyId(id)
    setError(null)
    try {
      await adminApi.markContactRead(token, id)
      reload()
    } catch (markError) {
      setError(markError.message)
    } finally {
      setBusyId(null)
    }
  }

  if (status === 'loading') return <p style={{ color: MUTED, fontSize: 14 }}>Yuklanmoqda…</p>
  if (status === 'error') return <Banner>Yuklab bo‘lmadi — {loadError?.message}</Banner>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>
        Jami {messages.length} ta xabar{unread > 0 && ` · ${unread} ta o‘qilmagan`}
      </p>

      {error && <Banner>{error}</Banner>}

      {messages.length === 0 && (
        <p style={{ color: MUTED, fontSize: 14 }}>Hozircha xabar yo‘q.</p>
      )}

      {messages.map((message) => (
        <Card
          key={message.id}
          style={{
            // An unread message gets a green edge so the eye finds it without
            // reading every card.
            borderColor: message.is_read ? undefined : 'rgba(74,222,128,0.4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'baseline',
              marginBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong style={{ fontSize: 14 }}>{message.name}</strong>{' '}
              <a href={`mailto:${message.email}`} style={{ fontSize: 13 }}>
                {message.email}
              </a>
            </div>
            <span style={{ fontSize: 12, color: MUTED }}>{formatDate(message.created_at)}</span>
          </div>

          <p
            style={{
              margin: '0 0 12px',
              fontSize: 14,
              lineHeight: 1.6,
              color: '#c9d1d9',
              whiteSpace: 'pre-wrap',
            }}
          >
            {message.message}
          </p>

          {!message.is_read && (
            <Button
              variant="ghost"
              disabled={busyId === message.id}
              onClick={() => markRead(message.id)}
            >
              {busyId === message.id ? '…' : 'O‘qildi deb belgilash'}
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}
