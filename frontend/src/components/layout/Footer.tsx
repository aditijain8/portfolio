import { Link } from 'react-router-dom'
import { safeUrl } from '../../lib/format'
import { NAV_ITEMS } from './Navbar'
import { useProfile } from './ProfileContext'

export function Footer() {
  const { profile } = useProfile()
  const github = safeUrl(profile.githubUrl)
  const linkedin = safeUrl(profile.linkedinUrl)

  return (
    <footer className="mt-32 border-t border-line">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl">{profile.fullName}</p>
          <p className="mt-3 max-w-xs text-sm text-muted">{profile.headline}</p>
        </div>
        <nav aria-label="Footer">
          <p className="eyebrow mb-4">Navigate</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="eyebrow mb-4">Elsewhere</p>
          <ul className="space-y-2 text-sm text-muted">
            {github && (
              <li>
                <a href={github} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
                  GitHub
                </a>
              </li>
            )}
            {linkedin && (
              <li>
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
                  LinkedIn
                </a>
              </li>
            )}
            {profile.contactEmail && (
              <li>
                <a href={`mailto:${profile.contactEmail}`} className="transition-colors hover:text-ink">
                  {profile.contactEmail}
                </a>
              </li>
            )}
            {!github && !linkedin && !profile.contactEmail && (
              <li>
                <Link to="/contact" className="transition-colors hover:text-ink">
                  Contact form
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-6 text-center font-mono text-xs text-subtle">
        © {new Date().getFullYear()} {profile.fullName}. All rights reserved.
      </div>
    </footer>
  )
}
