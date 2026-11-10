import type { CSSProperties } from 'react'
import { safeUrl } from '../../lib/format'
import { ButtonLink } from '../ui/Button'
import { useProfile } from '../layout/ProfileContext'

const d = (ms: number) => ({ '--delay': `${ms}ms` }) as CSSProperties

export function Hero() {
  const { profile } = useProfile()
  const github = safeUrl(profile.githubUrl)
  const linkedin = safeUrl(profile.linkedinUrl)
  const roles = (profile.headline ?? '').split('|').map((s) => s.trim()).filter(Boolean)
  const [first, ...rest] = profile.fullName.split(' ')

  return (
    <section aria-labelledby="hero-title" className="relative flex min-h-[calc(100svh-4rem)] items-center">
      <div className="container-page py-20">
        <p className="eyebrow anim-fade-up mb-8 flex items-center gap-3" style={d(0)}>
          <span aria-hidden className="h-px w-10 bg-accent" />
          Portfolio · {new Date().getFullYear()}
        </p>

        <h1 id="hero-title" className="font-display text-[clamp(3.6rem,13vw,10rem)] leading-[0.92] tracking-tight">
          <span className="anim-fade-up block" style={d(100)}>
            {first}
          </span>
          <span className="anim-fade-up block italic text-accent" style={d(220)}>
            {rest.join(' ')}
          </span>
        </h1>

        {roles.length > 0 && (
          <ul
            aria-label="Focus areas"
            className="anim-fade-up mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-sm text-muted"
            style={d(340)}
          >
            {roles.map((role, i) => (
              <li key={role} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-accent">/</span>}
                {role}
              </li>
            ))}
          </ul>
        )}

        {profile.intro && (
          <p className="anim-fade-up mt-8 max-w-2xl text-xl leading-relaxed text-muted sm:text-2xl" style={d(440)}>
            {profile.intro}
          </p>
        )}

        <div className="anim-fade-up mt-12 flex flex-wrap items-center gap-4" style={d(540)}>
          <ButtonLink to="/projects" size="lg">
            Explore Projects <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </ButtonLink>
          <ButtonLink to="/resume" variant="secondary" size="lg">
            View Resume
          </ButtonLink>
          {(github || linkedin) && (
            <ul className="ml-1 flex items-center gap-5 text-sm text-muted">
              {github && (
                <li>
                  <a className="underline-offset-4 transition-colors hover:text-ink hover:underline" href={github} target="_blank" rel="noopener noreferrer">
                    GitHub ↗
                  </a>
                </li>
              )}
              {linkedin && (
                <li>
                  <a className="underline-offset-4 transition-colors hover:text-ink hover:underline" href={linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn ↗
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <a
        href="#about"
        aria-label="Scroll to the About section"
        className="anim-fade-up absolute bottom-6 left-1/2 hidden -translate-x-1/2 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-subtle transition-colors hover:text-ink md:block"
        style={d(900)}
      >
        Scroll
      </a>
    </section>
  )
}
