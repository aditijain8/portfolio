import { publicApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { Badge, ErrorState, SectionHeading, Skeleton } from '../ui/primitives'
import { Reveal } from '../ui/Reveal'

export function Experience() {
  const { data, loading, error, reload } = useAsync((s) => publicApi.experience(s), [])

  return (
    <section id="experience" aria-labelledby="experience-title" className="container-page py-24">
      <Reveal>
        <SectionHeading eyebrow="Experience" title={<span id="experience-title">Where I have worked.</span>} />
      </Reveal>
      {loading && <Skeleton className="h-48" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (
        <ol className="relative space-y-6 border-l border-line pl-8 sm:pl-10">
          {(data ?? []).map((job, i) => {
            const dates = [job.startDate, job.endDate ?? (job.startDate ? 'Present' : null)].filter(Boolean).join(' — ')
            return (
              <li key={job.id} className="relative">
                <span aria-hidden className="absolute -left-[2.45rem] top-8 h-3 w-3 rounded-full border-2 border-accent bg-bg sm:-left-[3.05rem]" />
                <Reveal delay={i * 80}>
                  <div className="card p-7">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-display text-3xl">{job.role}</h3>
                      {dates && <p className="font-mono text-xs text-subtle">{dates}</p>}
                    </div>
                    <p className="mt-1 text-accent">
                      {job.employer}
                      {job.location && <span className="text-subtle"> · {job.location}</span>}
                    </p>
                    {job.description && <p className="mt-4 max-w-3xl text-muted">{job.description}</p>}
                    {job.achievements.length > 0 && (
                      <ul className="mt-4 space-y-2 text-muted">
                        {job.achievements.map((a, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-accent" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    )}
                    {job.technologies.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies">
                        {job.technologies.map((t) => (
                          <li key={t}>
                            <Badge>{t}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
