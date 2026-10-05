/**
 * Deciding how a media item's video is played.
 *
 * Videos are normally uploaded to our own backend and played with a native
 * <video> element. A YouTube link is still accepted as an alternative. Which of
 * the two a media item is gets decided from its URL rather than a database
 * column, so nothing has to be migrated when the hosting choice changes.
 */

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
]

/** Return the 11-character video id, or null when the URL is not YouTube. */
export function youtubeId(url) {
  if (!url) return null
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/** Player URL for an <iframe>. `rel=0` keeps suggestions to the same channel. */
export function youtubeEmbedUrl(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`
}

/** Poster image for a YouTube video, served straight from YouTube's CDN. */
export function youtubeThumbnail(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/**
 * Describe how a media item should be rendered.
 *
 * Returns one of:
 *   { kind: 'image',   src }
 *   { kind: 'youtube', embedUrl, poster }
 *   { kind: 'file',    src, poster }   — a directly playable video file
 */
export function describeMedia(item) {
  const id = youtubeId(item.url)
  if (id) {
    return {
      kind: 'youtube',
      embedUrl: youtubeEmbedUrl(id),
      poster: item.thumbnail_url || youtubeThumbnail(id),
    }
  }

  if (item.media_type === 'video') {
    return { kind: 'file', src: item.url, poster: item.thumbnail_url || null }
  }

  return { kind: 'image', src: item.thumbnail_url || item.url }
}
