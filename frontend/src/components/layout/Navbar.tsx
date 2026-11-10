import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useProfile } from './ProfileContext'

export const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/#about' },
  { label: 'Skills', to: '/#skills' },
  { label: 'Experience', to: '/#experience' },
  { label: 'Projects', to: '/projects' },
  { label: 'Resume', to: '/resume' },
  { label: 'Contact', to: '/contact' },
] as const

function isActive(to: string, pathname: string, hash: string): boolean {
  if (to === '/') return pathname === '/' && !hash
  if (to.startsWith('/#')) return pathname === '/' && hash === to.slice(1)
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname, hash } = useLocation()
  const { profile } = useProfile()

  useEffect(() => setOpen(false), [pathname, hash])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const linkClass = (active: boolean) =>
    `relative rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
      active ? 'text-ink' : 'text-muted hover:text-ink'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open ? 'border-b border-line bg-bg/80 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-2xl tracking-tight" aria-label={`${profile.fullName} — home`}>
          {profile.fullName.split(' ')[0]}
          <span className="text-accent">.</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to, pathname, hash)
            return (
              <NavLink key={item.label} to={item.to} className={() => linkClass(active)} aria-current={active ? 'page' : undefined}>
                {item.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 -bottom-0.5 h-px origin-left bg-accent transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </NavLink>
            )
          })}
        </nav>

        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden className="relative block h-3 w-5">
            <span className={`absolute left-0 h-px w-5 bg-ink transition-all duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 top-1.5 h-px w-5 bg-ink transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`absolute left-0 h-px w-5 bg-ink transition-all duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
          </span>
        </button>
      </div>

      {/* Animated mobile panel: grid-rows transition avoids measuring heights. */}
      <div
        id="mobile-nav"
        className={`grid transition-[grid-template-rows] duration-400 ease-[var(--ease-out-expo)] lg:hidden ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <nav aria-label="Mobile" className="overflow-hidden" inert={!open}>
          <ul className="container-page flex flex-col pb-5 pt-1">
            {NAV_ITEMS.map((item, i) => {
              const active = isActive(item.to, pathname, hash)
              return (
                <li
                  key={item.label}
                  className="border-b border-line/60 last:border-0"
                  style={{
                    transitionDelay: open ? `${60 + i * 35}ms` : '0ms',
                    opacity: open ? 1 : 0,
                    transform: open ? 'none' : 'translateY(-6px)',
                    transition: 'opacity .35s ease, transform .35s ease',
                  }}
                >
                  <NavLink
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`block py-3.5 font-display text-2xl ${active ? 'text-accent' : 'text-ink'}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
