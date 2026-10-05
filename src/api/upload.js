/**
 * Uploading images and videos to our own backend.
 *
 * The obvious answer would be a hosted service, but Cloudinary and its peers
 * refuse sign-ups from Uzbekistan, so the API stores the files itself and
 * serves them back from /api/v1/files/.
 *
 * Images are re-encoded server-side into two WebP sizes. Videos (mp4, webm,
 * mov) are stored unchanged and served with HTTP Range support, so the
 * browser's <video> player can seek without downloading the whole file.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

/** Kept in step with MAX_UPLOAD_MB in the backend's settings. */
export const MAX_UPLOAD_MB = 15

/** Kept in step with MAX_VIDEO_UPLOAD_MB in the backend's settings. */
export const MAX_VIDEO_UPLOAD_MB = 2048

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov']

/** Whether a picked File is a video, judged the same way the backend does: by extension. */
export function isVideoFile(file) {
  const name = file?.name?.toLowerCase() ?? ''
  return VIDEO_EXTENSIONS.some((extension) => name.endsWith(extension))
}

export class UploadError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UploadError'
  }
}

/**
 * Upload one image or video and resolve with where it now lives.
 *
 * For an image the backend returns two WebP files — a full-size one and a
 * thumbnail — so a gallery tile downloads a few dozen kilobytes instead of the
 * original photo. A video comes back with `thumbnailUrl: null`; give it a cover
 * by uploading an image separately.
 *
 * XMLHttpRequest rather than fetch: it is the only way to observe upload
 * progress, and a multi-megabyte upload with no progress bar looks frozen.
 *
 * @param file       the File from an <input type="file">
 * @param token      admin token, sent as X-Admin-Token
 * @param onProgress called with 0..100 as the upload proceeds
 * @returns {Promise<{url: string, thumbnailUrl: string|null, mediaType: 'photo'|'video'}>}
 */
export function uploadFile(file, token, { onProgress } = {}) {
  // Checked here as well as on the server so a 3 GB mistake fails instantly
  // instead of after twenty minutes of uploading.
  const video = isVideoFile(file)
  const limitMb = video ? MAX_VIDEO_UPLOAD_MB : MAX_UPLOAD_MB
  if (file.size > limitMb * 1024 * 1024) {
    return Promise.reject(new UploadError(`Fayl juda katta — maksimum ${limitMb} MB.`))
  }

  const body = new FormData()
  body.append('file', file)

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${BASE}/api/v1/admin/media/upload`)
    request.setRequestHeader('X-Admin-Token', token)

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    request.onload = () => {
      let payload = null
      try {
        payload = JSON.parse(request.responseText)
      } catch {
        reject(new UploadError('Server tushunarsiz javob qaytardi.'))
        return
      }

      if (request.status >= 200 && request.status < 300) {
        resolve({
          url: payload.url,
          thumbnailUrl: payload.thumbnail_url ?? null,
          mediaType: payload.media_type ?? (video ? 'video' : 'photo'),
        })
        return
      }

      // The backend wraps failures as { error: { code, message } }; a size or
      // type rejection already carries a message worth showing verbatim.
      reject(new UploadError(payload?.error?.message ?? `Yuklash xatosi (${request.status})`))
    }

    request.onerror = () => reject(new UploadError('Tarmoq xatosi — yuklab bo‘lmadi.'))
    request.onabort = () => reject(new UploadError('Yuklash bekor qilindi.'))

    request.send(body)
  })
}

/** Kept for callers written when only images could be uploaded. */
export const uploadImage = uploadFile
