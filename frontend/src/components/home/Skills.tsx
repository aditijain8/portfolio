import { publicApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { Badge, ErrorState, Skeleton, SectionHeading } from '../ui/primitives'
import { Reveal } from '../ui/Reveal'

export function Skills() {
  const { data, loading, error, reload } = useAsync((s) => publicApi.skills(s), [])
  const categories = (data ?? []).filter((c) => c.skills.length > 0)

  return (
    <section id="skills" aria-labelledby="skills-title" className="container-page py-24">
      <Reveal>
        <SectionHeading eyebrow="Skills" title={<span id="skills-title">The toolbox.</span>}>
          Technologies I work with, grouped by area.
        </SectionHeading>
      </Reveal>
      {loading && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => (
            <Reveal key={category.name} delay={(i % 3) * 80}>
              <div className="card card-hover h-full p-7">
                <h3 className="font-display text-2xl">{category.name}</h3>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <li key={skill}>
                      <Badge>{skill}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
