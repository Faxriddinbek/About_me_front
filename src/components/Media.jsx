import { useCallback, useState } from 'react'
import { api } from '../api/client'
import { useApiResource } from '../hooks/useApiResource'
import { EmptyState, SectionHeader } from './SectionHeader'

// `null` means "no filter" — the backend's ?type= is simply omitted.
const FILTERS = [
  { key: null, labelKey: 'medAll' },
  { key: 'photo', labelKey: 'medPhotos' },
  { key: 'video', labelKey: 'medVideos' },
]

function MediaTile({ item }) {
  const isVideo = item.media_type === 'video'
  // Videos keep their native 16/9; photos use 4/3 so the grid stays even.
  const ratio = isVideo ? '16 / 9' : '4 / 3'

  return (
    <div
      className="media-tile"
      style={{
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#161b22',
        border: '1px solid #30363d',
        aspectRatio: ratio,
        transition: 'border-color 260ms ease, box-shadow 260ms ease',
      }}
    >
      <img
        src={item.thumbnail_url || item.url}
        alt={item.title ?? ''}
        loading="lazy"
        draggable="false"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {isVideo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(74,222,128,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                marginLeft: 3,
                borderLeft: '14px solid #04130b',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Media gallery — content comes from GET /api/v1/media.
 *
 * Filtering happens server-side via ?type=, so switching tabs re-fetches rather
 * than filtering a partial page that pagination may have truncated.
 */
export function Media({ t, lang, isMobile, revealed }) {
  const [filter, setFilter] = useState(null)

  const fetcher = useCallback(
    (signal) => api.listMedia({ lang, type: filter, limit: 50, signal }),
    [lang, filter],
  )
  const { data, status, error, reload } = useApiResource(fetcher, [lang, filter])

  const items = data?.items ?? []
  const gridColumns = isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'

  return (
    <section
      id="media"
      style={{
        position: 'relative',
        zIndex: 10,
        scrollMarginTop: 72,
        maxWidth: 1140,
        margin: '0 auto',
        padding: isMobile ? '60px 16px' : '80px 32px',
        paddingBottom: 120,
        opacity: revealed ? 1 : 0,
        transform: `translateY(${revealed ? 0 : 20}px)`,
        transition: 'opacity 700ms ease, transform 700ms ease',
      }}
    >
      <SectionHeader
        eyebrow={t('medEyebrow')}
        title={t('medTitle')}
        subtitle={t('medSubtitle')}
        isMobile={isMobile}
      />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {FILTERS.map((tab) => {
          const active = filter === tab.key
          return (
            <button
              key={tab.labelKey}
              type="button"
              className="tab"
              onClick={() => setFilter(tab.key)}
              aria-pressed={active}
              style={{
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
                border: `1px solid ${active ? 'var(--gr)' : '#30363d'}`,
                borderRadius: 6,
                cursor: 'pointer',
                background: active ? 'var(--gr-soft)' : 'transparent',
                color: active ? 'var(--gr)' : '#8b949e',
                transition: 'all 180ms ease',
              }}
            >
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {status === 'loading' && (
        <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 16 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ aspectRatio: '4 / 3', borderRadius: 10 }}
            />
          ))}
        </div>
      )}

      {status === 'error' && (
        <EmptyState
          message={`${t('medError')} — ${error?.message ?? ''}`}
          actionLabel={t('retry')}
          onAction={reload}
        />
      )}

      {status === 'success' && items.length === 0 && <EmptyState message={t('medEmpty')} />}

      {status === 'success' && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 16 }}>
          {items.map((item) => (
            <MediaTile key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
