import { useCallback, useState } from 'react'
import { adminApi } from '../../api/client'
import { useApiResource } from '../../hooks/useApiResource'
import { describeMedia } from '../../lib/video'
import { MediaForm } from './MediaForm'
import { LINE, MUTED } from './tokens'
import { Banner, Button, Card } from './ui'

const FILTERS = [
  { key: null, label: 'Barchasi' },
  { key: 'hero', label: 'Home karusel' },
  { key: 'gallery', label: 'Galereya' },
]

function Thumb({ item }) {
  const media = describeMedia(item)
  const poster = media.kind === 'image' ? media.src : media.poster

  return (
    <div
      style={{
        position: 'relative',
        width: 84,
        height: 84,
        flexShrink: 0,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#0d1117',
        border: `1px solid ${LINE}`,
      }}
    >
      {poster ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            height: '100%',
            color: MUTED,
            fontSize: 11,
          }}
        >
          video
        </div>
      )}
      {item.media_type === 'video' && (
        <span
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            padding: '1px 6px',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.7)',
            fontSize: 10,
            color: 'var(--gr)',
          }}
        >
          ▶
        </span>
      )}
    </div>
  )
}

function Row({ item, onEdit, onDelete, busy }) {
  return (
    <Card style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12 }}>
      <Thumb item={item} />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <strong style={{ fontSize: 14 }}>{item.title_uz || '(sarlavhasiz)'}</strong>
          <span style={{ fontSize: 11, color: MUTED }}>#{item.id}</span>
          {!item.is_visible && (
            <span style={{ fontSize: 11, color: '#d29922' }}>• yashirilgan</span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: MUTED,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.url}
        </div>
        <div style={{ fontSize: 11, color: '#5a636d', marginTop: 4 }}>
          {item.placement === 'hero' ? 'Home karusel' : 'Galereya'} · {item.media_type} · tartib{' '}
          {item.display_order}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <Button variant="ghost" onClick={() => onEdit(item)} disabled={busy}>
          Tahrirlash
        </Button>
        <Button variant="danger" onClick={() => onDelete(item)} disabled={busy}>
          O‘chirish
        </Button>
      </div>
    </Card>
  )
}

/**
 * Media CRUD screen.
 *
 * Deletion asks for confirmation inline rather than through window.confirm:
 * a native dialog blocks the whole page, and in an embedded browser session it
 * can freeze the tab entirely.
 */
export function MediaManager({ token }) {
  const [filter, setFilter] = useState(null)
  const [editing, setEditing] = useState(null) // null | {} (new) | item
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const fetcher = useCallback(
    (signal) => adminApi.listMedia(token, { placement: filter, signal }),
    [token, filter],
  )
  const { data, status, error: loadError, reload } = useApiResource(fetcher, [token, filter])

  const items = data?.items ?? []

  const run = async (action, successMessage) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
      setNotice(successMessage)
      setEditing(null)
      setPendingDelete(null)
      reload()
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  const save = (payload) => {
    if (editing?.id) {
      return run(() => adminApi.updateMedia(token, editing.id, payload), 'Yangilandi.')
    }
    return run(() => adminApi.createMedia(token, payload), 'Qo‘shildi.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {FILTERS.map((tab) => (
          <Button
            key={tab.label}
            variant={filter === tab.key ? 'primary' : 'ghost'}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
        <div style={{ flex: 1 }} />
        <Button onClick={() => setEditing({})} disabled={busy}>
          + Yangi qo‘shish
        </Button>
      </div>

      {notice && <Banner tone="success">{notice}</Banner>}
      {error && <Banner>{error}</Banner>}

      {editing && (
        <MediaForm
          key={editing.id ?? 'new'}
          initial={editing}
          onSubmit={save}
          onCancel={() => setEditing(null)}
          busy={busy}
        />
      )}

      {pendingDelete && (
        <Card style={{ borderColor: 'rgba(248,81,73,0.4)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14 }}>
            <strong>#{pendingDelete.id}</strong> — {pendingDelete.title_uz || pendingDelete.url}{' '}
            o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() =>
                run(() => adminApi.deleteMedia(token, pendingDelete.id), 'O‘chirildi.')
              }
            >
              Ha, o‘chirilsin
            </Button>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={busy}>
              Bekor qilish
            </Button>
          </div>
        </Card>
      )}

      {status === 'loading' && <p style={{ color: MUTED, fontSize: 14 }}>Yuklanmoqda…</p>}

      {status === 'error' && (
        <Banner>Ro‘yxatni yuklab bo‘lmadi — {loadError?.message}</Banner>
      )}

      {status === 'success' && items.length === 0 && (
        <p style={{ color: MUTED, fontSize: 14 }}>Hozircha hech narsa yo‘q.</p>
      )}

      {items.map((item) => (
        <Row
          key={item.id}
          item={item}
          busy={busy}
          onEdit={setEditing}
          onDelete={setPendingDelete}
        />
      ))}
    </div>
  )
}
