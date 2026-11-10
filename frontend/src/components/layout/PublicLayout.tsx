import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatedBackground } from './AnimatedBackground'
import { ErrorBoundary } from './ErrorBoundary'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

/** Scrolls to the #hash target (once it exists) or to the top on navigation. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }
    let tries = 0
    const timer = window.setInterval(() => {
      const el = document.getElementById(hash.slice(1))
      if (el || ++tries > 20) {
        window.clearInterval(timer)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [pathname, hash])
  return null
}

export function PublicLayout() {
  const { pathname } = useLocation()
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[70] rounded-full bg-accent px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <AnimatedBackground />
      <Navbar />
      <ScrollManager />
      <main id="main" key={pathname} className="page-enter pt-16 outline-none" tabIndex={-1}>
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  )
}
