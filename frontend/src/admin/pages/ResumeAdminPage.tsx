import { useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import type { ResumeVersion } from '../../api/types'
import { Button, ButtonAnchor } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TextField } from '../../components/ui/Field'
import { Badge, EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync } from '../../hooks/useAsync'
import { formatBytes, formatDateTime } from '../../lib/format'
import { PageHeader, Panel } from '../components/parts'

export default function ResumeAdminPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync((s) => adminApi.resumes(s), [])
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<ResumeVersion | null>(null)
  const [toDelete, setToDelete] = useState<ResumeVersion | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const versions = data ?? []
  const current = versions.find((v) => v.published)

  async function upload() {
    if (!file) return
    if (file.type && file.type !== 'application/pdf') {
      toast.error('Please choose a PDF file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('The PDF must be 5 MB or smaller.')
      return
    }
    setUploading(true)
    try {
      const created = await adminApi.uploadResume(file, label.trim())
      toast.success(`Uploaded as version ${created.versionNumber}. It is private until you publish it.`)
      setFile(null)
      setLabel('')
      if (fileInput.current) fileInput.current.value = ''
      setPreview(created)
      reload()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed. Your published resume was not changed.')
    } finally {
      setUploading(false)
    }
  }

  async function act(v: ResumeVersion, action: () => Promise<unknown>, success: string) {
    setBusyId(v.id)
    try {
      await action()
      toast.success(success)
      reload()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader title="Resume">
        Upload new versions privately, preview them, then publish. Publishing a version replaces the live one in a single step, so visitors never see a gap.
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Panel title="Upload a new version">
            <div className="space-y-4">
              <div>
                <label htmlFor="resume-file" className="mb-1.5 block text-sm font-medium">PDF file</label>
                <input
                  id="resume-file"
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="field file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-black"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1.5 text-xs text-subtle">PDF only, up to 5 MB. The file content is verified on the server.</p>
              </div>
              <TextField label="Label (optional)" placeholder="e.g. Backend focus, Oct 2026" value={label} maxLength={120} onChange={(e) => setLabel(e.target.value)} />
              <Button onClick={() => void upload()} disabled={!file || uploading}>
                {uploading ? 'Uploading…' : 'Upload (stays private)'}
              </Button>
            </div>
          </Panel>

          <Panel title="Currently published">
            {current ? (
              <div className="space-y-3 text-sm">
                <p>
                  <Badge tone="success">Live</Badge> <span className="ml-2">Version {current.versionNumber}{current.label ? ` — ${current.label}` : ''}</span>
                </p>
                <p className="text-muted">Published {formatDateTime(current.publishedAt)}</p>
                <div className="flex gap-3">
                  <ButtonAnchor href="/resume" external={false} size="sm" variant="secondary">View public page</ButtonAnchor>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Nothing is published. Visitors see “No resume published yet”.</p>
            )}
          </Panel>
        </div>

        <Panel title="Version history">
          {loading && !data && <Skeleton className="h-40" />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {data && versions.length === 0 && <EmptyState title="No versions yet">Upload your first PDF on the left.</EmptyState>}
          <ul className="space-y-3">
            {versions.map((v) => (
              <li key={v.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      Version {v.versionNumber} {v.published ? <Badge tone="success">Published</Badge> : <Badge>Private</Badge>}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {v.label ? `${v.label} · ` : ''}{v.originalFilename ?? 'resume.pdf'} · {formatBytes(v.sizeBytes)} · uploaded {formatDateTime(v.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setPreview(preview?.id === v.id ? null : v)}>
                      {preview?.id === v.id ? 'Hide preview' : 'Preview'}
                    </Button>
                    {v.published ? (
                      <Button size="sm" variant="secondary" disabled={busyId === v.id} onClick={() => void act(v, () => adminApi.unpublishResume(v.id), 'Resume unpublished')}>
                        Unpublish
                      </Button>
                    ) : (
                      <Button size="sm" disabled={busyId === v.id} onClick={() => void act(v, () => adminApi.publishResume(v.id), current ? `Version ${v.versionNumber} now replaces version ${current.versionNumber}` : 'Resume published')}>
                        {current ? 'Publish & replace' : 'Publish'}
                      </Button>
                    )}
                    <Button size="sm" variant="danger" disabled={v.published} title={v.published ? 'Unpublish before deleting' : undefined} onClick={() => setToDelete(v)}>
                      Delete
                    </Button>
                  </div>
                </div>
                {preview?.id === v.id && (
                  <iframe title={`Preview of version ${v.versionNumber}`} src={adminApi.resumeFileUrl(v.id)} className="mt-4 h-[32rem] w-full rounded-lg border border-line bg-white/5" />
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this version?"
        confirmLabel="Delete version"
        destructive
        busy={busyId === toDelete?.id}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const v = toDelete
          if (!v) return
          void act(v, () => adminApi.deleteResume(v.id), `Version ${v.versionNumber} deleted`).then(() => setToDelete(null))
        }}
      >
        Version {toDelete?.versionNumber} and its PDF file will be permanently deleted. The published resume is not affected.
      </ConfirmDialog>
    </>
  )
}
