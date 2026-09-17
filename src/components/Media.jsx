import { useCallback, useState } from 'react'
import { api } from '../api/client'
import { usePagedResource } from '../hooks/usePagedResource'
import { describeMedia } from '../lib/video'
import { EmptyState, LoadMore, SectionHeader } from './SectionHeader'

// `null` means "no filter" — the backend's ?type= is simply omitted.
const FILTERS = [
  { key: null, labelKey: 'medAll' },
  { key: 'photo', labelKey: 'medPhotos' },
  { key: 'video', labelKey: 'medVideos' },
]

// 24 divides evenly into both the 2-column (phone) and the 3-column grid,
// so a freshly loaded page never lands as a ragged half-row.
const PAGE_SIZE = 24

function PlayBadge() {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'rgba(74,222,128,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
      }}
    >
      <span
        style={{
          marginLeft: 4,
          borderLeft: '16px solid #04130b',
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
        }}
      />
    </div>
  )
}

function MediaTile({ item }) {
  const [playing, setPlaying] = useState(false)
  const media = describeMedia(item)
  const isVideo = media.kind !== 'image'
  // Videos keep their native 16/9; photos use 4/3 so the grid stays even.
  const ratio = isVideo ? '16 / 9' : '4 / 3'

  const frameStyle = {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#161b22',
    border: '1px solid #30363d',
    aspectRatio: ratio,
    transition: 'border-color 260ms ease, box-shadow 260ms ease',
  }

  // Players are mounted only after a click. Embedding every iframe up front
  // would pull in a YouTube player per tile — slow, and it phones home before
  // the visitor has asked to watch anything.
  if (playing && media.kind === 'youtube') {
    return (
      <div className="media-tile" style={frameStyle}>
        <iframe
          src={`${media.embedUrl}&autoplay=1`}
          title={item.title ?? 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    )
  }

  if (playing && media.kind === 'file') {
    return (
      <div className="media-tile" style={frameStyle}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={media.src}
          poster={media.poster ?? undefined}
          controls
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
        />
      </div>
    )
  }

  const poster = media.kind === 'image' ? media.src : media.poster

  const content = (
    <>
      {poster ? (
        <img
          src={poster}
          alt={item.title ?? ''}
          loading="lazy"
          draggable="false"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <span style={{ fontSize: 32, color: 'var(--gr)', opacity: 0.3 }}>{'{ }'}</span>
        </div>
      )}

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
          <PlayBadge />
        </div>
      )}

      {item.title && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '24px 12px 10px',
            fontSize: 13,
            color: '#e6edf3',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
          }}
        >
          {item.title}
        </div>
      )}
    </>
  )

  if (!isVideo) {
    return (
      <div className="media-tile" style={frameStyle}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="media-tile"
      onClick={() => setPlaying(true)}
      aria-label={item.title ? `${item.title} — ijro etish` : 'Videoni ijro etish'}
      style={{ ...frameStyle, padding: 0, cursor: 'pointer', display: 'block', width: '100%' }}
    >
      {content}
    </button>
  )
}

/**
 * Media gallery — content comes from GET /api/v1/media.
 *
 * Filtering happens server-side via ?type=, so switching tabs re-fetches rather
 * than filtering a partial page that pagination may have truncated.
 *
 * The grid loads a page at a time and grows on demand. Requesting everything
 * up front would mean a slower and slower page as the gallery fills up — and
 * the backend caps a request at 100 items regardless, so beyond that the tail
 * was simply unreachable.
 */
export function Media({ t, lang, isMobile, revealed }) {
  const [filter, setFilter] = useState(null)

  // placement=gallery keeps the home-page carousel's photos out of the grid;
  // they are managed in the same table but belong to a different surface.
  const fetcher = useCallback(
    ({ limit, offset, signal }) =>
      api.listMedia({ lang, type: filter, placement: 'gallery', limit, offset, signal }),
    [lang, filter],
  )
  const { items, total, status, error, moreStatus, moreError, hasMore, loadMore, reload } =
    usePagedResource(fetcher, [lang, filter], { pageSize: PAGE_SIZE })
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

      {hasMore && (
        <LoadMore
          loaded={items.length}
          total={total}
          status={moreStatus}
          error={moreError}
          label={t('loadMore')}
          loadingLabel={t('loadingMore')}
          onLoadMore={loadMore}
        />
      )}
    </section>
  )
}
