/**
 * Uploading images to our own backend.
 *
 * The obvious answer would be a hosted image service, but Cloudinary and its
 * peers refuse sign-ups from Uzbekistan, so the API stores the files itself and
 * serves them back from /api/v1/files/.
 *
 * Videos deliberately do not go through here: the backend caps uploads at
 * 15 MB, and a real video needs adaptive streaming, not a single file download.
 * Paste a YouTube link for those — the gallery renders it as a player.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

/** Kept in step with MAX_UPLOAD_MB in the backend's settings. */
export const MAX_UPLOAD_MB = 15

export class UploadError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UploadError'
  }
}

/**
 * Upload one image and resolve with its URL path.
 *
 * XMLHttpRequest rather than fetch: it is the only way to observe upload
 * progress, and a multi-megabyte upload with no progress bar looks frozen.
 *
 * @param file       the File from an <input type="file">
 * @param token      admin token, sent as X-Admin-Token
 * @param onProgress called with 0..100 as the upload proceeds
 */
export function uploadImage(file, token, { onProgress } = {}) {
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
        resolve(payload.url)
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
