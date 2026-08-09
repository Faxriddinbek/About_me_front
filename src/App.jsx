import { useEffect, useState } from 'react'
import { AiButton } from './components/AiButton'
import { Contact } from './components/Contact'
import { Hero } from './components/Hero'
import { MatrixRain } from './components/MatrixRain'
import { Media } from './components/Media'
import { Nav } from './components/Nav'
import { Projects } from './components/Projects'
import { useBreakpoint } from './hooks/useBreakpoint'
import { useReveal } from './hooks/useReveal'
import { useScrollSpy } from './hooks/useScrollSpy'
import { LANGS, makeTranslator } from './i18n/translations'

const SECTION_IDS = ['home', 'projects', 'contact', 'media']
const LANG_STORAGE_KEY = 'portfolio:lang'

/** Restore the previous choice, otherwise default to Uzbek. */
function initialLang() {
  if (typeof window === 'undefined') return 'uz'
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY)
  return LANGS.includes(stored) ? stored : 'uz'
}

export default function App() {
  const [lang, setLang] = useState(initialLang)
  const { isMobile, isTablet } = useBreakpoint()
  const activeSection = useScrollSpy(SECTION_IDS)
  const revealed = useReveal(SECTION_IDS)

  const t = makeTranslator(lang)

  useEffect(() => {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang)
    // Keeps screen readers and search engines in step with the visible copy.
    document.documentElement.lang = lang
  }, [lang])

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        background: '#0a0e17',
        color: '#e6edf3',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <MatrixRain />

      <Nav
        lang={lang}
        onLangChange={setLang}
        activeSection={activeSection}
        isMobile={isMobile}
      />

      <Hero t={t} isMobile={isMobile} />

      <Projects
        t={t}
        lang={lang}
        isMobile={isMobile}
        isTablet={isTablet}
        revealed={revealed.has('projects')}
      />

      <Contact t={t} isMobile={isMobile} revealed={revealed.has('contact')} />

      <Media t={t} lang={lang} isMobile={isMobile} revealed={revealed.has('media')} />

      <AiButton isMobile={isMobile} />
    </div>
  )
}
