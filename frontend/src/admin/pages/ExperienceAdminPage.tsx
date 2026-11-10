import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import type { Experience, ExperienceInput } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TextArea, TextField } from '../../components/ui/Field'
import { Badge, EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync } from '../../hooks/useAsync'
import { LinesInput, PageHeader, Panel, TagInput } from '../components/parts'

const BLANK: ExperienceInput = {
  role: '', employer: '', location: null, startDate: null, endDate: null, description: null,
  visible: true, achievements: [], technologies: [],
}

export default function ExperienceAdminPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync((s) => adminApi.experience(s), [])
  const [editing, setEditing] = useState<{ id: number | null; form: ExperienceInput } | null>(null)
  const [toDelete, setToDelete] = useState<Experience | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof ExperienceInput>(key: K, value: ExperienceInput[K]) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, [key]: value } } : e))

  async function save(ev: FormEvent) {
    ev.preventDefault()
    if (!editing) return
    setSaving(true)
    setErrors({})
    try {
      const f = editing.form
      editing.id === null ? await adminApi.createExperience(f) : await adminApi.updateExperience(editing.id, f)
      toast.success('Experience saved')
      setEditing(null)
      reload()
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fieldErrors ?? {})
      toast.error(e instanceof ApiError ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!toDelete) return
    try {
      await adminApi.deleteExperience(toDelete.id)
      toast.success('Entry deleted')
      reload()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not delete')
    } finally {
      setToDelete(null)
    }
  }

  if (editing) {
    const f = editing.form
    return (
      <form onSubmit={(e) => void save(e)} noValidate>
        <PageHeader
          title={editing.id === null ? 'Add experience' : 'Edit experience'}
          actions={
            <>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </>
          }
        />
        <Panel>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Role" value={f.role} required error={errors.role} onChange={(e) => set('role', e.target.value)} />
            <TextField label="Employer" value={f.employer} required error={errors.employer} onChange={(e) => set('employer', e.target.value)} />
            <TextField label="Location" value={f.location ?? ''} onChange={(e) => set('location', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Start" placeholder="e.g. Jul 2025" value={f.startDate ?? ''} onChange={(e) => set('startDate', e.target.value)} />
              <TextField label="End" placeholder="blank = present" value={f.endDate ?? ''} onChange={(e) => set('endDate', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Description" hint="Only what you are authorised to share publicly." rows={4} value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="sm:col-span-2"><LinesInput label="Achievements" hint="One per line. Add only verified, shareable achievements." values={f.achievements} onChange={(v) => set('achievements', v)} /></div>
            <div className="sm:col-span-2"><TagInput label="Technologies" values={f.technologies} onChange={(v) => set('technologies', v)} /></div>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" checked={f.visible} onChange={(e) => set('visible', e.target.checked)} />
              Show on the public site
            </label>
          </div>
        </Panel>
      </form>
    )
  }

  return (
    <>
      <PageHeader title="Experience" actions={<Button onClick={() => setEditing({ id: null, form: BLANK })}>Add entry</Button>}>
        Your professional timeline. Entries appear newest-first by display order.
      </PageHeader>
      {loading && !data && <Skeleton className="h-40" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.length === 0 && <EmptyState title="No entries yet" />}
      <ul className="space-y-3">
        {(data ?? []).map((job) => (
          <li key={job.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-display text-2xl">{job.role} <span className="text-muted">· {job.employer}</span></p>
              <p className="mt-1 text-xs text-subtle">{[job.startDate, job.endDate].filter(Boolean).join(' — ') || 'No dates set'} {job.visible ? '' : <Badge tone="warn">Hidden</Badge>}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing({ id: job.id, form: { ...job } })}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => setToDelete(job)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog open={toDelete !== null} title="Delete this entry?" destructive confirmLabel="Delete" onCancel={() => setToDelete(null)} onConfirm={() => void remove()}>
        “{toDelete?.role} at {toDelete?.employer}” will be removed permanently. Use “Show on the public site” to hide it instead.
      </ConfirmDialog>
    </>
  )
}
