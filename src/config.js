/**
 * Site-level configuration.
 *
 * Everything a human might want to change without touching component code
 * lives here. Secrets never do — anything under VITE_ ends up in the built
 * bundle in plain text, so the admin token stays server-side only.
 */

/** Contact details shown in the contact section. */
export const CONTACT = {
  email: 'faxriddinorinboyev12@gmail.com',
  // Personal account, not the @faxriddinbek channel — the link opens a chat.
  telegram: '@XXXacer_004',
  github: 'Faxriddinbek',
  // The public-profile slug from linkedin.com/in/<slug>.
  linkedin: 'faxriddin-orinboyev-418961299',
  instagram: 'faxriddinbek_202',
}

/**
 * Hero carousel photos. Local files under public/ so the page never depends
 * on a third-party CDN staying up.
 */
export const HERO_PHOTOS = [
  { url: '/assets/avatar.webp', alt: 'Faxriddinbek' },
  { url: '/uploads/pasted-1784737187329-0.webp', alt: 'Workspace' },
  { url: '/assets/matrix-bg.webp', alt: 'Code rain' },
]

/** Shown when an <img> fails to load, so a broken URL never leaves a gap. */
export const FALLBACK_IMAGE = '/assets/avatar.webp'

/** How long the hero carousel waits before advancing, in milliseconds. */
export const CAROUSEL_INTERVAL_MS = 5000
