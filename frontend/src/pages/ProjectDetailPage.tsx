import { Link, useParams } from 'react-router-dom'
import { publicApi } from '../api/endpoints'
import { ProjectContent } from '../components/projects/ProjectContent'
import { ButtonLink } from '../components/ui/Button'
import { ErrorState, Skeleton } from '../components/ui/primitives'
import { useAsync } from '../hooks/useAsync'
import { usePageMeta } from '../hooks/usePageMeta'
import NotFoundPage from './NotFoundPage'

export default function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const { data, loading, error, reload } = useAsync((s) => publicApi.project(slug, s), [slug])
  usePageMeta(data?.title ?? 'Project', data?.summary ?? undefined)

  if (loading) {
    return (
      <div className="container-page max-w-4xl py-24">
        <Skeleton className="mb-6 h-6 w-40" />
        <Skeleton className="mb-4 h-20 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }
  if (!data && error) {
    const notFound = /not found/i.test(error)
    return notFound ? <NotFoundPage /> : (
      <div className="container-page py-24">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }
  if (!data) return <NotFoundPage />

  return (
    <div className="container-page max-w-4xl py-14 sm:py-20">
      <Link to="/projects" className="mb-10 inline-block text-sm text-muted transition-colors hover:text-ink">
        ← All projects
      </Link>
      <ProjectContent project={data} />
      <div className="mt-12 border-t border-line pt-10">
        <ButtonLink to="/projects" variant="secondary">
          Back to all projects
        </ButtonLink>
      </div>
    </div>
  )
}

