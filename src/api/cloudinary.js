/**
 * Direct browser-to-Cloudinary uploads.
 *
 * The file never passes through our backend. Railway containers have an
 * ephemeral filesystem — anything written there vanishes on the next deploy —
 * and proxying gigabytes through a web worker would tie up a request for
 * minutes. The browser uploads straight to Cloudinary and we store only the
 * resulting URL.
 *
 * This uses an *unsigned* upload preset, so the cloud name and preset name are
 * public by design. Lock the preset down in the Cloudinary dashboard (allowed
 * formats, max file size, a dedicated folder) — that, not secrecy, is what
 * limits what strangers could upload if they found the values in the bundle.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? ''
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? ''

/** Cloudinary's hard ceiling for unsigned uploads on the free plan. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

export class UploadError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UploadError'
  }
}

/**
 * Upload one file and resolve with { url, thumbnailUrl, resourceType }.
 *
 * XMLHttpRequest rather than fetch: it is the only way to report upload
 * progress, and a multi-megabyte upload with no progress bar looks frozen.
 *
 * @param file       the File from an <input type="file">
 * @param onProgress called with 0..100 as the upload proceeds
 */
export function uploadToCloudinary(file, { onProgress } = {}) {
  if (!isCloudinaryConfigured) {
    throw new UploadError(
      'Cloudinary sozlanmagan. VITE_CLOUDINARY_CLOUD_NAME va VITE_CLOUDINARY_UPLOAD_PRESET ni kiriting.',
    )
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const sizeMb = Math.round(file.size / 1024 / 1024)
    throw new UploadError(
      `Fayl juda katta (${sizeMb} MB). Cheklov 100 MB. Kattaroq video uchun YouTube havolasini qo‘ying.`,
    )
  }

  // "auto" lets Cloudinary decide between image and video from the bytes,
  // so one endpoint handles both kinds of upload.
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`

  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', endpoint)

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    request.onload = () => {
      let payload
      try {
        payload = JSON.parse(request.responseText)
      } catch {
        reject(new UploadError('Cloudinary tushunarsiz javob qaytardi.'))
        return
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new UploadError(payload?.error?.message ?? `Yuklash xatosi (${request.status})`))
        return
      }

      resolve({
        url: payload.secure_url,
        resourceType: payload.resource_type, // "image" | "video"
        // Cloudinary can render a still from any video by swapping the
        // extension, which gives the gallery a poster without a second upload.
        thumbnailUrl:
          payload.resource_type === 'video'
            ? payload.secure_url.replace(/\.[^.]+$/, '.jpg')
            : null,
      })
    }

    request.onerror = () => reject(new UploadError('Tarmoq xatosi — yuklab bo‘lmadi.'))
    request.onabort = () => reject(new UploadError('Yuklash bekor qilindi.'))

    request.send(body)
  })
}
