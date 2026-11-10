import { publicApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { ProjectCard } from '../projects/ProjectCard'
import { ButtonLink } from '../ui/Button'
import { EmptyState, ErrorState, SectionHeading, Skeleton } from '../ui/primitives'
import { Reveal } from '../ui/Reveal'

export function FeaturedProjects() {
  const { data, loading, error, reload } = useAsync(
    (s) => publicApi.projects({ featured: true, size: 3 }, s),
    [],
  )
  const items = data?.items ?? []

  return (
    <section id="projects" aria-labelledby="featured-title" className="container-page py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Reveal>
          <SectionHeading eyebrow="Selected work" title={<span id="featured-title">Featured projects.</span>} />
        </Reveal>
        <Reveal>
          <ButtonLink to="/projects" variant="secondary" className="mb-12">
            Explore all projects →
          </ButtonLink>
        </Reveal>
      </div>
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="Projects are on the way" action={<ButtonLink to="/projects" variant="secondary" size="sm">Browse the directory</ButtonLink>}>
          Featured projects will appear here once they are published.
        </EmptyState>
      )}
      {items.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
