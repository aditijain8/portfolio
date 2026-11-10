import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publicApi } from '../api/endpoints'
import { ProjectCard } from '../components/projects/ProjectCard'
import { ProjectFilters, type FilterState } from '../components/projects/ProjectFilters'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/primitives'
import { useAsync } from '../hooks/useAsync'
import { usePageMeta } from '../hooks/usePageMeta'

const PAGE_SIZE = 9

export default function ProjectsPage() {
  usePageMeta('Projects', 'A complete directory of software projects: full-stack applications, backend systems and AI-powered tools.')
  const [params, setParams] = useSearchParams()
  const filters: FilterState = {
    q: params.get('q') ?? '',
    technology: params.get('technology') ?? '',
    category: params.get('category') ?? '',
  }
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0)

  const options = useAsync((s) => publicApi.projectFilters(s), [])
  const result = useAsync(
    (s) => publicApi.projects({ ...filters, page, size: PAGE_SIZE }, s),
    [filters.q, filters.technology, filters.category, page],
  )

  const update = useCallback(
    (next: FilterState, nextPage = 0) => {
      const p = new URLSearchParams()
      Object.entries(next).forEach(([k, v]) => v && p.set(k, v))
      if (nextPage > 0) p.set('page', String(nextPage))
      setParams(p, { replace: true })
    },
    [setParams],
  )

  const items = result.data?.items ?? []
  const filtered = Boolean(filters.q || filters.technology || filters.category)
  // Re-keying the grid replays the staggered entrance, giving a smooth transition between result sets.
  const gridKey = `${filters.q}|${filters.technology}|${filters.category}|${page}`

  return (
    <div className="container-page py-16 sm:py-24">
      <header className="mb-12 max-w-3xl">
        <p className="eyebrow mb-4">Projects</p>
        <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">Everything I have built.</h1>
        <p className="mt-6 text-lg text-muted">Search by keyword, or filter by technology and category.</p>
      </header>

      <ProjectFilters options={options.data} value={filters} onChange={(f) => update(f)} />

      <div aria-live="polite" aria-busy={result.loading} className="min-h-[24rem]">
        {result.loading && !result.data && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80" />)}
          </div>
        )}
        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
        {!result.error && result.data && items.length === 0 && (
          <EmptyState title={filtered ? 'No projects match' : 'No projects published yet'}>
            {filtered ? 'Try a different search term or clear the filters.' : 'Check back soon — projects will appear here as they are published.'}
          </EmptyState>
        )}
        {items.length > 0 && (
          <>
            <p className="mb-5 font-mono text-xs text-subtle">
              {result.data!.totalItems} project{result.data!.totalItems === 1 ? '' : 's'}
            </p>
            <div key={gridKey} className={`grid gap-6 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-3 ${result.loading ? 'opacity-60' : ''}`}>
              {items.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
            <Pagination page={page} totalPages={result.data!.totalPages} onChange={(p) => update(filters, p)} />
          </>
        )}
      </div>
    </div>
  )
}
