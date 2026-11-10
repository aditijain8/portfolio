import { Link, useParams } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { ProjectContent } from '../../components/projects/ProjectContent'
import { Button, ButtonLink } from '../../components/ui/Button'
import { ErrorState, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync } from '../../hooks/useAsync'

/** Renders the exact public project layout using admin data, including drafts. */
export default function ProjectPreviewPage() {
  const { id } = useParams()
  const toast = useToast()
  const { data, loading, error, reload, setData } = useAsync((s) => adminApi.project(Number(id), s), [id])

  if (loading) return <Skeleton className="h-96" />
  if (error || !data) return <ErrorState message={error ?? 'Project not found'} onRetry={reload} />

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-5 mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-accent/30 bg-bg/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <p className="text-sm">
          <strong className="text-accent">Preview</strong>{' '}
          <span className="text-muted">{data.published ? '— this project is live.' : '— draft: not visible to visitors yet.'}</span>
        </p>
        <div className="flex gap-2">
          <ButtonLink size="sm" variant="secondary" to={`/admin/projects/${data.id}`}>Back to editor</ButtonLink>
          <Button
            size="sm"
            variant={data.published ? 'secondary' : 'primary'}
            onClick={async () => {
              try {
                setData(await adminApi.setPublished(data.id, !data.published))
                toast.success(data.published ? 'Project unpublished' : 'Project published')
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Action failed')
              }
            }}
          >
            {data.published ? 'Unpublish' : 'Publish now'}
          </Button>
        </div>
      </div>
      <div className="mx-auto max-w-4xl">
        <Link to="/admin/projects" className="mb-8 inline-block text-sm text-muted hover:text-ink">← Projects</Link>
        <ProjectContent project={data} />
      </div>
    </div>
  )
}
