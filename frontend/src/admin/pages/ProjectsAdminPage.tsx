import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import type { ProjectSummary } from '../../api/types'
import { Button, ButtonLink } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync } from '../../hooks/useAsync'
import { PageHeader, PublishBadge } from '../components/parts'

type StatusFilter = 'all' | 'published' | 'draft'

export default function ProjectsAdminPage() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [toDelete, setToDelete] = useState<ProjectSummary | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 250)
    return () => window.clearTimeout(t)
  }, [q])

  const published = status === 'all' ? undefined : status === 'published'
  const { data, loading, error, reload, setData } = useAsync(
    (s) => adminApi.projects({ q: debounced || undefined, published }, s),
    [debounced, status],
  )
  const items = data?.items ?? []

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      toast.success(success)
      reload()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed')
    }
  }

  async function move(index: number, delta: -1 | 1) {
    const next = [...items]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    if (data) setData({ ...data, items: next }) // optimistic
    try {
      await adminApi.reorderProjects(next.map((p) => p.id))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not save the new order')
      reload()
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setBusy(true)
    try {
      await adminApi.deleteProject(toDelete.id)
      toast.success(`Deleted “${toDelete.title}”`)
      setToDelete(null)
      reload()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not delete the project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Projects" actions={<ButtonLink to="/admin/projects/new">New project</ButtonLink>}>
        Drafts are private. Publish a project to show it on the public site. Use the arrows to change display order.
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="min-w-60 flex-1">
          <label htmlFor="admin-project-search" className="sr-only">
            Search projects
          </label>
          <input id="admin-project-search" type="search" className="field" placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div role="group" aria-label="Status filter" className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-4 py-2 text-sm capitalize ${status === s ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:text-ink'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && <Skeleton className="h-64" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && items.length === 0 && (
        <EmptyState title="No projects found" action={<ButtonLink to="/admin/projects/new" size="sm">Create one</ButtonLink>}>
          Nothing matches the current search or filter.
        </EmptyState>
      )}

      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((p, i) => (
            <li key={p.id} className="card flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
              <div className="flex flex-col">
                <button type="button" aria-label={`Move ${p.title} up`} disabled={i === 0 || Boolean(debounced) || status !== 'all'} onClick={() => void move(i, -1)} className="px-2 text-muted hover:text-ink disabled:opacity-25">▲</button>
                <button type="button" aria-label={`Move ${p.title} down`} disabled={i === items.length - 1 || Boolean(debounced) || status !== 'all'} onClick={() => void move(i, 1)} className="px-2 text-muted hover:text-ink disabled:opacity-25">▼</button>
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/admin/projects/${p.id}`} className="block truncate font-display text-2xl hover:text-accent">
                  {p.title}
                </Link>
                <p className="truncate font-mono text-xs text-subtle">/{p.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <PublishBadge published={p.published} />
                {p.featured && <span className="rounded-full border border-accent/30 px-2 py-0.5 font-mono text-[0.7rem] text-accent">★ Featured</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => void run(() => adminApi.setPublished(p.id, !p.published), p.published ? 'Project unpublished' : 'Project published')}>
                  {p.published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void run(() => adminApi.setFeatured(p.id, !p.featured), p.featured ? 'Removed from featured' : 'Marked as featured')}>
                  {p.featured ? 'Unfeature' : 'Feature'}
                </Button>
                <ButtonLink size="sm" variant="ghost" to={`/admin/projects/${p.id}/preview`}>
                  Preview
                </ButtonLink>
                <ButtonLink size="sm" variant="ghost" to={`/admin/projects/${p.id}`}>
                  Edit
                </ButtonLink>
                <Button size="sm" variant="danger" onClick={() => setToDelete(p)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(debounced || status !== 'all') && items.length > 0 && <p className="mt-4 text-xs text-subtle">Reordering is available when no search or filter is active.</p>}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this project?"
        confirmLabel="Delete project"
        destructive
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      >
        “{toDelete?.title}” will be permanently removed, including its details. This cannot be undone. To hide it instead, unpublish it.
      </ConfirmDialog>
    </>
  )
}
