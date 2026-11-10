import { useProfile } from '../layout/ProfileContext'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/primitives'

export function About() {
  const { profile } = useProfile()
  return (
    <section id="about" aria-labelledby="about-title" className="container-page py-24">
      <Reveal>
        <SectionHeading eyebrow="About" title={<span id="about-title">Building things I can explain end to end.</span>} />
      </Reveal>
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <Reveal delay={80}>
          <p className="text-lg leading-relaxed text-muted sm:text-xl">
            {profile.about ??
              'I am a software engineer who enjoys building practical applications, understanding systems deeply, and continuously improving my technical skills.'}
          </p>
          {profile.highlights.length > 0 && (
            <ul className="mt-8 space-y-3">
              {profile.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-ink">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </Reveal>
        {profile.interests.length > 0 && (
          <Reveal delay={160}>
            <div className="card p-7">
              <h3 className="eyebrow mb-5">Areas of interest</h3>
              <ul className="space-y-3.5">
                {profile.interests.map((interest, i) => (
                  <li key={interest} className="flex items-baseline gap-4 border-b border-line/60 pb-3.5 last:border-0 last:pb-0">
                    <span className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-display text-2xl">{interest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}
