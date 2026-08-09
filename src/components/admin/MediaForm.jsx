import { useRef, useState } from 'react'
import {
  MAX_UPLOAD_BYTES,
  isCloudinaryConfigured,
  uploadToCloudinary,
} from '../../api/cloudinary'
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

const formatMb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

/**
 * Create or edit one media item.
 *
 * A URL can arrive two ways: uploaded to Cloudinary, or pasted. Both are kept
 * because Cloudinary's free plan rejects files over 100 MB, and a long video
 * has to live on YouTube instead. The stored row is identical either way — only
 * the URL differs — so nothing downstream needs to know which path was used.
 */
export function MediaForm({ initial, onSubmit, onCancel, busy }) {
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
      const result = await uploadToCloudinary(file, { onProgress: setProgress })
      setForm((previous) => ({
        ...previous,
        url: result.url,
        thumbnail_url: result.thumbnailUrl ?? '',
        // Trust what Cloudinary detected over whatever the dropdown said.
        media_type: result.resourceType === 'video' ? 'video' : 'photo',
      }))
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setProgress(null)
      // Clear the input so re-picking the same file fires change again.
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.url.trim()) {
      setError('Avval fayl yuklang yoki havola qo‘ying.')
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
          label="1) Fayl yuklash"
          hint={
            isCloudinaryConfigured
              ? `Rasm yoki video, maksimum ${formatMb(MAX_UPLOAD_BYTES)}`
              : 'Cloudinary sozlanmagan — pastdagi havola maydonidan foydalaning'
          }
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/*"
            disabled={!isCloudinaryConfigured || uploading || busy}
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
          hint="Katta videolar uchun YouTube havolasi (youtube.com/watch?v=… yoki youtu.be/…)"
        >
          <input
            type="url"
            value={form.url}
            onChange={set('url')}
            placeholder="https://…"
            style={inputStyle}
          />
        </Field>

        {isYoutube && (
          <Banner tone="info">
            YouTube havolasi aniqlandi — galereyada pleyer sifatida ko‘rsatiladi.
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

        <Field
          label="Muqova rasmi (ixtiyoriy)"
          hint="Video uchun oldindan ko‘rsatiladigan rasm. Bo‘sh qoldirsangiz avtomatik olinadi."
        >
          <input
            type="url"
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
