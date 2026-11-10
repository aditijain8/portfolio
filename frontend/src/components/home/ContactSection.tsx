import { safeUrl } from '../../lib/format'
import { useProfile } from '../layout/ProfileContext'
import { Reveal } from '../ui/Reveal'
import { ContactForm } from './ContactForm'

export function ContactLinks() {
  const { profile } = useProfile()
  const links = [
    profile.contactEmail && { label: 'Email', text: profile.contactEmail, href: `mailto:${profile.contactEmail}` },
    safeUrl(profile.linkedinUrl) && { label: 'LinkedIn', text: 'Connect on LinkedIn', href: safeUrl(profile.linkedinUrl)! },
    safeUrl(profile.githubUrl) && { label: 'GitHub', text: 'Follow on GitHub', href: safeUrl(profile.githubUrl)! },
  ].filter(Boolean) as { label: string; text: string; href: string }[]

  if (links.length === 0) return null
  return (
    <ul className="space-y-3">
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="card card-hover flex items-center justify-between gap-4 px-5 py-4"
          >
            <span>
              <span className="eyebrow block text-[0.65rem]">{l.label}</span>
              <span className="text-ink">{l.text}</span>
            </span>
            <span aria-hidden className="text-accent">↗</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function ContactSection() {
  const { profile } = useProfile()
  return (
    <section id="contact" aria-labelledby="contact-title" className="container-page py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <p className="eyebrow mb-4">Contact</p>
          <h2 id="contact-title" className="font-display text-4xl leading-[1.05] sm:text-6xl">
            Let’s talk.
          </h2>
          <p className="mt-5 max-w-md text-lg text-muted">
            {profile.contactBlurb ?? 'Interested in working together or just saying hello? Send a message.'}
          </p>
          <div className="mt-8">
            <ContactLinks />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  )
}
