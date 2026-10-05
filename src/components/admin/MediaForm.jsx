import { useRef, useState } from 'react'
import {
  IMAGE_ACCEPT,
  MAX_UPLOAD_MB,
  MAX_VIDEO_UPLOAD_MB,
  uploadFile,
  VIDEO_ACCEPT,
} from '../../api/upload'
import { youtubeId } from '../../lib/video'
import { inputStyle, MUTED } from './tokens'
import { Banner, Button, Card, Field } from './ui'

const EMPTY = {
  url: '',
  thumbnail_url: '',
  title_uz: '',
  title_en: '',
  media_type: 'photo',
  placement: 'gallery',
  display_order: 0,
  is_visible: true,
}

/**
 * Create or edit one media item.
 *
 * A URL can arrive two ways: uploaded to our backend (images and videos), or
 * pasted (an external image or a YouTube link). The stored row is identical
 * either way, so nothing downstream cares which path produced the URL.
 *
 * A video has no generated thumbnail, so the form offers a second upload for
 * its cover image.
 */
export function MediaForm({ token, initial, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...initial,
    thumbnail_url: initial?.thumbnail_url ?? '',
    title_uz: initial?.title_uz ?? '',
    title_en: initial?.title_en ?? '',
  }))
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const fileInput = useRef(null)
  const coverInput = useRef(null)

  const set = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setProgress(0)
    try {
      // For an image two files come back: the small one is what a gallery
      // tile loads, so it goes straight into thumbnail_url. A video has none,
      // so any cover already chosen is kept.
      const { url, thumbnailUrl, mediaType } = await uploadFile(file, token, {
        onProgress: setProgress,
      })
      setForm((previous) => ({
        ...previous,
        url,
        thumbnail_url: mediaType === 'video' ? previous.thumbnail_url : thumbnailUrl ?? '',
        media_type: mediaType,
      }))
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setProgress(null)
      // Clear the input so re-picking the same file fires change again.
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleCover = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setProgress(0)
    try {
      // The thumbnail size is plenty for a poster frame and loads fast.
      const { url, thumbnailUrl } = await uploadFile(file, token, { onProgress: setProgress })
      setForm((previous) => ({ ...previous, thumbnail_url: thumbnailUrl ?? url }))
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setProgress(null)
      if (coverInput.current) coverInput.current.value = ''
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.url.trim()) {
      setError('Avval rasm yoki video yuklang, yoki havola qo‘ying.')
      return
    }
    setError(null)
    onSubmit({
      url: form.url.trim(),
      // Empty strings would be stored as empty strings; null is what "absent"
      // means in the schema.
      thumbnail_url: form.thumbnail_url.trim() || null,
      title_uz: form.title_uz.trim() || null,
      title_en: form.title_en.trim() || null,
      media_type: form.media_type,
      placement: form.placement,
      display_order: Number(form.display_order) || 0,
      is_visible: form.is_visible,
    })
  }

  const isYoutube = Boolean(youtubeId(form.url))
  const uploading = progress !== null

  return (
    <Card>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <strong style={{ fontSize: 15 }}>
          {initial?.id ? `#${initial.id} ni tahrirlash` : 'Yangi media qo‘shish'}
        </strong>

        {/* --- 1. upload --- */}
        <Field
          label="1) Rasm yoki video yuklash"
          hint={
            `Rasm: jpg, png, webp, gif — maksimum ${MAX_UPLOAD_MB} MB (WebP ga o‘giriladi). ` +
            `Video: mp4, webm, mov — maksimum ${MAX_VIDEO_UPLOAD_MB} MB, serverga o‘zgarishsiz saqlanadi. ` +
            'iPhone .mov (HEVC) Chrome’da ochilmasligi mumkin — MP4 ga eksport qiling.'
          }
        >
          <input
            ref={fileInput}
            type="file"
            accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`}
            disabled={uploading || busy}
            onChange={handleFile}
            style={{ ...inputStyle, padding: 8, cursor: 'pointer' }}
          />
        </Field>

        {uploading && (
          <div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
              Yuklanmoqda… {progress}%
            </div>
            <div style={{ height: 6, background: '#21262d', borderRadius: 99 }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'var(--gr)',
                  borderRadius: 99,
                  transition: 'width 200ms ease',
                }}
              />
            </div>
          </div>
        )}

        {/* --- 2. or paste --- */}
        <Field
          label="2) Yoki havola qo‘ying"
          hint="Tashqi rasm havolasi yoki YouTube havolasi (ixtiyoriy)"
        >
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={form.url}
            onChange={set('url')}
            placeholder="https://…"
            style={inputStyle}
          />
        </Field>

        {isYoutube && (
          <Banner tone="info">
            YouTube havolasi aniqlandi — galereyada pleyer sifatida ko‘rsatiladi. “Turi” ni{' '}
            <strong>Video</strong> qilib qo‘ying.
          </Banner>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Sarlavha (uz)">
            <input type="text" value={form.title_uz} onChange={set('title_uz')} style={inputStyle} />
          </Field>
          <Field label="Sarlavha (en)">
            <input type="text" value={form.title_en} onChange={set('title_en')} style={inputStyle} />
          </Field>

          <Field label="Turi">
            <select value={form.media_type} onChange={set('media_type')} style={inputStyle}>
              <option value="photo">Rasm</option>
              <option value="video">Video</option>
            </select>
          </Field>
          <Field label="Joyi">
            <select value={form.placement} onChange={set('placement')} style={inputStyle}>
              <option value="gallery">Galereya (Media bo‘limi)</option>
              <option value="hero">Home page karuseli</option>
            </select>
          </Field>

          <Field label="Tartib raqami" hint="Kichik raqam oldinroq turadi">
            <input
              type="number"
              value={form.display_order}
              onChange={set('display_order')}
              style={inputStyle}
            />
          </Field>
          <Field label="Ko‘rinishi">
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, paddingTop: 10 }}
            >
              <input type="checkbox" checked={form.is_visible} onChange={set('is_visible')} />
              Saytda ko‘rinsin
            </label>
          </Field>
        </div>

        {form.media_type === 'video' && !isYoutube && (
          <Field
            label="Video muqovasi (rasm yuklash)"
            hint="Galereyada video o‘rniga shu rasm ko‘rinadi, bosilganda video ijro etiladi."
          >
            <input
              ref={coverInput}
              type="file"
              accept={IMAGE_ACCEPT}
              disabled={uploading || busy}
              onChange={handleCover}
              style={{ ...inputStyle, padding: 8, cursor: 'pointer' }}
            />
          </Field>
        )}

        <Field
          label="Muqova rasmi (ixtiyoriy)"
          hint="Rasm yuklaganda avtomatik to‘ladi (kichik nusxa). YouTube uchun bo‘sh qoldiring — muqova avtomatik olinadi."
        >
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={form.thumbnail_url}
            onChange={set('thumbnail_url')}
            style={inputStyle}
          />
        </Field>

        {error && <Banner>{error}</Banner>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" disabled={busy || uploading} style={{ minWidth: 120 }}>
            {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Bekor qilish
          </Button>
        </div>
      </form>
    </Card>
  )
}
