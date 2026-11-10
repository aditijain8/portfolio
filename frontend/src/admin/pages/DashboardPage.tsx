import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { ButtonLink } from '../../components/ui/Button'
import { ErrorState, Skeleton } from '../../components/ui/primitives'
import { useAsync } from '../../hooks/useAsync'
import { formatDate } from '../../lib/format'
import { PageHeader, Panel, StatCard } from '../components/parts'

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsync((s) => adminApi.dashboard(s), [])

  return (
    <>
      <PageHeader title="Overview" actions={<ButtonLink to="/admin/projects/new">New project</ButtonLink>}>
        A quick look at what visitors can see.
      </PageHeader>
      {loading && <Skeleton className="h-40" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total projects" value={data.totalProjects} to="/admin/projects" />
            <StatCard label="Published" value={data.publishedProjects} to="/admin/projects" />
            <StatCard label="Drafts" value={data.draftProjects} to="/admin/projects" />
            <StatCard label="Featured" value={data.featuredProjects} to="/admin/projects" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Published resume">
              {data.currentResume ? (
                <p className="text-muted">
                  Version <span className="text-ink">{data.currentResume.versionNumber}</span>
                  {data.currentResume.label ? ` (${data.currentResume.label})` : ''}, published {formatDate(data.currentResume.publishedAt)}.
                </p>
              ) : (
                <p className="text-muted">No resume is published. Visitors see an empty state.</p>
              )}
              <Link to="/admin/resume" className="mt-4 inline-block text-sm text-accent hover:underline">
                Manage resume →
              </Link>
            </Panel>
            <Panel title="Quick actions">
              <ul className="space-y-2 text-sm">
                <li><Link className="text-accent hover:underline" to="/admin/projects/new">Add a project</Link></li>
                <li><Link className="text-accent hover:underline" to="/admin/resume">Upload a resume version</Link></li>
                <li><Link className="text-accent hover:underline" to="/admin/profile">Update profile and social links</Link></li>
                <li>
                  <Link className="text-accent hover:underline" to="/admin/messages">
                    Read messages{data.unreadMessages > 0 ? ` (${data.unreadMessages} unread)` : ''}
                  </Link>
                </li>
              </ul>
            </Panel>
          </div>
        </>
      )}
    </>
  )
}
