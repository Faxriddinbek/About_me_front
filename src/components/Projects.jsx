import { useCallback } from 'react'
import { api } from '../api/client'
import { useApiResource } from '../hooks/useApiResource'
import { EmptyState, SectionHeader } from './SectionHeader'

/** Placeholder card shown while the request is in flight. */
function SkeletonCard() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        overflow: 'hidden',
        minHeight: 320,
      }}
    >
      <div className="skeleton" style={{ height: 180 }} />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 16, width: '70%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, width: '85%', borderRadius: 4 }} />
      </div>
    </div>
  )
}

function ProjectCard({ project }) {
  const hasLink = Boolean(project.link)
  // Without a link the card must not be an anchor — a focusable element that
  // goes nowhere is a trap for keyboard and screen-reader users.
  const Tag = hasLink ? 'a' : 'div'
  const linkProps = hasLink
    ? { href: project.link, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <Tag
      {...linkProps}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        transition:
          'transform 260ms var(--ease-out), border-color 260ms ease, box-shadow 260ms ease',
      }}
    >
      <div
        style={{
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          overflow: 'hidden',
        }}
      >
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 42, color: 'var(--gr)', opacity: 0.35, fontWeight: 300 }}>
            {'{ }'}
          </span>
        )}
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: '#e6edf3',
            lineHeight: 1.3,
          }}
        >
          {project.title}
        </h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#8b949e', flex: 1 }}>
          {project.description}
        </p>
        {project.tags?.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--gr)', opacity: 0.8 }}>
            {project.tags.join(' · ')}
          </div>
        )}
      </div>
    </Tag>
  )
}

/**
 * Projects section — content comes from GET /api/v1/projects.
 *
 * The backend already resolves title/description into the requested language,
 * so changing `lang` simply re-fetches instead of doing client-side lookups.
 */
export function Projects({ t, lang, isMobile, isTablet, revealed }) {
  const fetcher = useCallback(
    (signal) => api.listProjects({ lang, limit: 50, signal }),
    [lang],
  )
  const { data, status, error, reload } = useApiResource(fetcher, [lang])

  const projects = data?.items ?? []
  const gridColumns = isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'

  return (
    <section
      id="projects"
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
        eyebrow={t('projEyebrow')}
        title={t('projTitle')}
        subtitle={t('projSubtitle')}
        isMobile={isMobile}
      />

      {status === 'loading' && (
        <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 24 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <EmptyState
          message={`${t('projError')} — ${error?.message ?? ''}`}
          actionLabel={t('retry')}
          onAction={reload}
        />
      )}

      {status === 'success' && projects.length === 0 && (
        <EmptyState message={t('projEmpty')} />
      )}

      {status === 'success' && projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 24 }}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  )
}
