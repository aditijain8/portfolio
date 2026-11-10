import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '../components/layout/ErrorBoundary'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/primitives'
import { ToastProvider } from '../components/ui/Toast'
import { AuthProvider, useAuth } from './AuthContext'

const LINKS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/resume', label: 'Resume' },
  { to: '/admin/experience', label: 'Experience' },
  { to: '/admin/skills', label: 'Skills' },
  { to: '/admin/profile', label: 'Profile' },
  { to: '/admin/messages', label: 'Messages' },
]

export default function AdminShell() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  if (user === undefined) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Checking session" />
      </div>
    )
  }
  // The real protection is server-side; this only decides what the UI shows.
  if (user === null) return <Navigate to="/admin/login" replace state={{ from: pathname }} />

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-surface/80 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <div>
            <p className="font-display text-2xl">
              Admin<span className="text-accent">.</span>
            </p>
            <p className="mt-1 hidden truncate font-mono text-[0.7rem] text-subtle lg:block">{user.email}</p>
          </div>
          <div className="flex gap-2 lg:mt-5">
            <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">
              View site ↗
            </a>
            <Button size="sm" variant="ghost" onClick={() => void logout()}>
              Log out
            </Button>
          </div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-white/[0.05] hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main id="main" className="page-enter min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}

/** Providers for every /admin route (including the login page). */
export function AdminRoot() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </AuthProvider>
  )
}
