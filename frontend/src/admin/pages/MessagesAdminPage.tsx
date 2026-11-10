import { useState } from 'react'
import { ApiError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import type { ContactMessage } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Badge, EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync } from '../../hooks/useAsync'
import { formatDateTime } from '../../lib/format'
import { PageHeader } from '../components/parts'

export default function MessagesAdminPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync((s) => adminApi.messages(s), [])
  const [toDelete, setToDelete] = useState<ContactMessage | null>(null)

  const wrap = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn()
      if (ok) toast.success(ok)
      reload()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed')
    }
  }

  return (
    <>
      <PageHeader title="Messages">Messages sent through the contact form. Only you can see these.</PageHeader>
      {loading && !data && <Skeleton className="h-40" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.items.length === 0 && <EmptyState title="No messages yet" />}
      <ul className="space-y-3">
        {(data?.items ?? []).map((m) => (
          <li key={m.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{m.subject} {!m.read && <Badge tone="accent">New</Badge>}</p>
                <p className="mt-1 text-xs text-muted">
                  {m.name} · <a className="text-accent hover:underline" href={`mailto:${m.email}`}>{m.email}</a> · {formatDateTime(m.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => void wrap(() => adminApi.markMessage(m.id, !m.read))}>{m.read ? 'Mark unread' : 'Mark read'}</Button>
                <Button size="sm" variant="danger" onClick={() => setToDelete(m)}>Delete</Button>
              </div>
            </div>
            {/* Rendered as text; React escapes it, so message content can never execute. */}
            <p className="mt-4 whitespace-pre-wrap break-words text-muted">{m.message}</p>
          </li>
        ))}
      </ul>
      <ConfirmDialog open={toDelete !== null} title="Delete this message?" destructive confirmLabel="Delete" onCancel={() => setToDelete(null)}
        onConfirm={() => { const m = toDelete; setToDelete(null); if (m) void wrap(() => adminApi.deleteMessage(m.id), 'Message deleted') }}>
        This message from {toDelete?.name} will be permanently deleted.
      </ConfirmDialog>
    </>
  )
}
