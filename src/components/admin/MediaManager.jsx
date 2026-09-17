import { useCallback, useEffect, useState } from 'react'
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

// Rows are tall (84px thumbnail each), so a page is sized to stay scannable
// rather than to fill the screen.
const PAGE_SIZE = 20

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
 * Previous / next controls plus the position of the open page in the table.
 *
 * The count is not decoration: it is the only way to tell "this is everything"
 * apart from "there is more below", now that the list is no longer fetched
 * whole.
 */
function Pager({ page, lastPage, shown, total, busy, onChange }) {
  const first = page * PAGE_SIZE + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Two equal halves of one row: on a phone each stays a full-size target
          instead of collapsing into a pair of narrow pills. */}
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 420 }}>
        <Button
          variant="ghost"
          style={{ flex: 1, minHeight: 42 }}
          onClick={() => onChange(page - 1)}
          disabled={busy || page === 0}
        >
          ← Oldingi
        </Button>
        <Button
          variant="ghost"
          style={{ flex: 1, minHeight: 42 }}
          onClick={() => onChange(page + 1)}
          disabled={busy || page >= lastPage}
        >
          Keyingi →
        </Button>
      </div>
      <span style={{ fontSize: 12, color: MUTED, fontFamily: 'var(--font-mono)' }}>
        {first}–{first + shown - 1} / jami {total} ta · sahifa {page + 1}/{lastPage + 1}
      </span>
    </div>
  )
}

/**
 * Media CRUD screen.
 *
 * Deletion asks for confirmation inline rather than through window.confirm:
 * a native dialog blocks the whole page, and in an embedded browser session it
 * can freeze the tab entirely.
 *
 * The list is paged rather than fetched whole — the endpoint caps a request at
 * 100 items, which used to make everything after the hundredth row invisible
 * to the panel that is supposed to manage it.
 */
export function MediaManager({ token }) {
  const [filter, setFilter] = useState(null)
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null) // null | {} (new) | item
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const fetcher = useCallback(
    (signal) =>
      adminApi.listMedia(token, {
        placement: filter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        signal,
      }),
    [token, filter, page],
  )
  const {
    data,
    status,
    error: loadError,
    reload,
  } = useApiResource(fetcher, [token, filter, page])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  // Deleting the last row of a page would leave the panel on a page that no
  // longer exists. Stepping back to the last real one keeps the open page
  // working instead of showing an empty list.
  useEffect(() => {
    if (status === 'success' && page > lastPage) setPage(lastPage)
  }, [status, page, lastPage])

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
            onClick={() => {
              setFilter(tab.key)
              // A page number from the previous filter means nothing here.
              setPage(0)
            }}
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
          token={token}
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

      {/* Keyed off the rows on screen rather than the total: right after a
          delete the refetch can briefly leave the page number past the end. */}
      {items.length > 0 && (
        <Pager
          page={page}
          lastPage={lastPage}
          shown={items.length}
          total={total}
          busy={status === 'loading'}
          onChange={setPage}
        />
      )}
    </div>
  )
}
