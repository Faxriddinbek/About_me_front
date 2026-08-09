import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The dev server proxies /api and /health to the backend instead of the browser
 * calling it directly. That makes development byte-for-byte identical to
 * production, where vercel.json performs the same rewrite: in both environments
 * the page only ever issues same-origin requests, so CORS, preflight and cookie
 * behaviour can never differ between "works locally" and "works deployed".
 *
 * Port 8001, not 8000: the Yarrow gateway already owns 8000 on this machine.
 * Override with VITE_DEV_API_TARGET in .env.development.
 */
const DEFAULT_API_TARGET = 'http://localhost:8001'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_DEV_API_TARGET || DEFAULT_API_TARGET

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/health': { target, changeOrigin: true },
      },
    },
    build: {
      // Source maps make a production stack trace readable without shipping
      // the original source to visitors.
      sourcemap: true,
    },
  }
})
