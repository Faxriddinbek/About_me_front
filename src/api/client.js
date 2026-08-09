/**
 * Single entry point for every backend call.
 *
 * Components never build URLs or read env vars themselves — they call these
 * functions. That keeps the base URL, the error shape and the response
 * envelope in one place, so changing the backend contract touches one file.
 *
 * Base URL resolution:
 *   - dev  : VITE_API_URL=http://localhost:8000  (.env.development)
 *   - prod : empty string, because vercel.json rewrites /api/* to the backend.
 *            Same-origin requests mean no CORS preflight at all.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

/**
 * A failed API call. `code` mirrors the backend's machine-readable error code
 * ("rate_limited", "validation_error", ...) so callers branch on it instead of
 * matching message strings.
 */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** Serialise params, dropping anything null/undefined so no `?type=undefined`. */
function buildQuery(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function request(path, { signal, ...options } = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch (cause) {
    // fetch only rejects on network-level failures (server down, DNS, CORS).
    // An aborted request is a normal unmount, not an error worth surfacing.
    if (cause?.name === 'AbortError') throw cause
    throw new ApiError(0, 'network_error', 'Serverga ulanib bo‘lmadi.')
  }

  if (!response.ok) {
    // The backend wraps every error as { error: { code, message, detail } }.
    // A proxy or crash can still return non-JSON, so parsing must not throw.
    const body = await response.json().catch(() => null)
    const error = body?.error
    throw new ApiError(
      response.status,
      error?.code ?? 'unknown_error',
      error?.message ?? `HTTP ${response.status}`,
    )
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  /** GET /api/v1/projects — returns a Page<ProjectOut>: { items, total, limit, offset }. */
  listProjects({ lang = 'uz', limit = 50, offset = 0, signal } = {}) {
    return request(`/api/v1/projects${buildQuery({ lang, limit, offset })}`, { signal })
  },

  /**
   * GET /api/v1/media — returns a Page<MediaOut>.
   * `type` filters by "photo" | "video"; the backend exposes it as ?type=.
   */
  listMedia({ lang = 'uz', type = null, limit = 50, offset = 0, signal } = {}) {
    return request(`/api/v1/media${buildQuery({ lang, type, limit, offset })}`, { signal })
  },

  /**
   * POST /api/v1/contact — rate limited to 3 per hour per IP.
   * Throws ApiError with code "rate_limited" (429) when the cap is hit.
   */
  sendContact({ name, email, message }) {
    return request('/api/v1/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, message }),
    })
  },

  /** GET /health — used to verify the backend is reachable. */
  health({ signal } = {}) {
    return request('/health', { signal })
  },
}
