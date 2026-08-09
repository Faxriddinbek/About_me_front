import { useEffect, useState } from 'react'
import { adminApi } from '../api/client'
import { isCloudinaryConfigured } from '../api/cloudinary'
import { ContactsList } from '../components/admin/ContactsList'
import { MediaManager } from '../components/admin/MediaManager'
import { inputStyle, LINE, MUTED } from '../components/admin/tokens'
import { Banner, Button, Card, Field } from '../components/admin/ui'

// sessionStorage, not localStorage: the token is a password-equivalent, and
// this way it dies with the tab instead of sitting on disk indefinitely.
const TOKEN_KEY = 'portfolio:adminToken'

const TABS = [
  { key: 'media', label: 'Media' },
  { key: 'contacts', label: 'Xabarlar' },
]

function LoginScreen({ onAuthenticated }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!token.trim()) return

    setBusy(true)
    setError(null)
    try {
      // There is no dedicated login endpoint — a token is valid exactly when
      // an admin call succeeds with it, so the cheapest admin GET is the check.
      await adminApi.listMedia(token.trim(), { limit: 1 })
      onAuthenticated(token.trim())
    } catch (loginError) {
      setError(
        loginError.status === 401
          ? 'Token noto‘g‘ri.'
          : `Ulanib bo‘lmadi — ${loginError.message}`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 20 }}>Admin panel</h1>
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
              Kirish uchun admin tokeningizni kiriting.
            </p>
          </div>

          <Field label="Admin token">
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="off"
              autoFocus
              style={inputStyle}
            />
          </Field>

          {error && <Banner>{error}</Banner>}

          <Button type="submit" disabled={busy || !token.trim()}>
            {busy ? 'Tekshirilmoqda…' : 'Kirish'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

/**
 * Private admin screen at /admin.
 *
 * Authentication is the backend's single shared X-Admin-Token — there are no
 * user accounts. That is proportionate for a one-person portfolio, but it means
 * the token must only ever be entered over HTTPS, and anyone holding it has
 * full write access.
 */
export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))
  const [tab, setTab] = useState('media')

  useEffect(() => {
    document.title = 'Admin — Faxriddinbek'
  }, [])

  const signIn = (value) => {
    sessionStorage.setItem(TOKEN_KEY, value)
    setToken(value)
  }

  const signOut = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  if (!token) return <LoginScreen onAuthenticated={signIn} />

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingBottom: 16,
            borderBottom: `1px solid ${LINE}`,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 18 }}>Admin panel</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/" style={{ alignSelf: 'center', fontSize: 13 }}>
              ← Saytga
            </a>
            <Button variant="ghost" onClick={signOut}>
              Chiqish
            </Button>
          </div>
        </header>

        {!isCloudinaryConfigured && (
          <div style={{ marginBottom: 16 }}>
            <Banner tone="info">
              Cloudinary sozlanmagan — fayl yuklash o‘chirilgan. Hozircha havolalarni qo‘lda
              qo‘yishingiz mumkin. Sozlash uchun <code>VITE_CLOUDINARY_CLOUD_NAME</code> va{' '}
              <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> kerak.
            </Banner>
          </div>
        )}

        <nav style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {TABS.map((item) => (
            <Button
              key={item.key}
              variant={tab === item.key ? 'primary' : 'ghost'}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        {tab === 'media' ? <MediaManager token={token} /> : <ContactsList token={token} />}
      </div>
    </div>
  )
}
