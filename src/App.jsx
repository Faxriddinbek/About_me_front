import { useEffect, useState } from 'react'
import { AdminPage } from './pages/AdminPage'
import { SitePage } from './pages/SitePage'

const ADMIN_PATH = '/admin'

/**
 * Minimal path router.
 *
 * Two screens do not justify a routing library — react-router would add a
 * dependency and ~10 KB to serve one comparison. `popstate` keeps the browser's
 * back button working, which is the only navigation case that actually occurs
 * here (the admin link is a plain <a>, so forward navigation is a full load).
 */
export default function App() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Tolerates a trailing slash so /admin and /admin/ both resolve.
  const isAdmin = path.replace(/\/+$/, '') === ADMIN_PATH

  return isAdmin ? <AdminPage /> : <SitePage />
}
