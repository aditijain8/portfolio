import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import type { ProjectInput, ProjectStatus } from '../../api/types'
import { Button, ButtonLink } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SelectField, TextArea, TextField } from '../../components/ui/Field'
import { ErrorState, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync } from '../../hooks/useAsync'
import { slugify, STATUS_LABEL } from '../../lib/format'
import { ImageUploader, LinesInput, PageHeader, Panel, PublishBadge, TagInput } from '../components/parts'

const EMPTY: ProjectInput = {
  title: '', slug: '', summary: '', description: '', problemStatement: '', architecture: '', contributions: '',
  challenges: '', lessonsLearned: '', githubUrl: '', demoUrl: '', coverImageId: null, galleryImageIds: [],
  category: '', startYear: null, status: 'IN_PROGRESS', featured: false, published: false, displayOrder: 0,
  technologies: [], keyFeatures: [],
}

const s = (v: string | null | undefined) => v ?? ''

export default function ProjectEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const toast = useToast()

  const existing = useAsync(
    async (signal) => (isNew ? null : await adminApi.project(Number(id), signal)),
    [id],
  )
  const [form, setForm] = useState<ProjectInput>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const p = existing.data
    if (p) {
      setForm({ ...EMPTY, ...p, galleryImageIds: p.galleryImageIds, technologies: p.technologies, keyFeatures: p.keyFeatures })
      setSlugTouched(true)
    }
  }, [existing.data])

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const text = (key: keyof ProjectInput) => (e: { target: { value: string } }) => set(key, e.target.value as never)

  async function save(publish: boolean | null, e?: FormEvent) {
    e?.preventDefault()
    setErrors({})
    if (!form.title.trim()) {
      setErrors({ title: 'A title is required.' })
      return
    }
    const payload: ProjectInput = {
      ...form,
      slug: form.slug || slugify(form.title),
      published: publish === null ? form.published : publish,
      startYear: form.startYear ? Number(form.startYear) : null,
    }
    setSaving(true)
    try {
      if (isNew) {
        const created = await adminApi.createProject(payload)
        toast.success(publish ? 'Project published' : 'Draft saved')
        navigate(`/admin/projects/${created.id}`, { replace: true })
      } else {
        const updated = await adminApi.updateProject(Number(id), payload)
        setForm({ ...EMPTY, ...updated })
        toast.success(publish === true ? 'Project published' : publish === false ? 'Saved as draft' : 'Changes saved')
        existing.reload()
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors ?? {})
        toast.error(err.message)
      } else toast.error('Could not save the project')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    try {
      await adminApi.deleteProject(Number(id))
      toast.success('Project deleted')
      navigate('/admin/projects', { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the project')
      setConfirmDelete(false)
    }
  }

  if (!isNew && existing.loading && !existing.data) return <Skeleton className="h-96" />
  if (!isNew && existing.error && !existing.data) return <ErrorState message={existing.error} onRetry={existing.reload} />

  return (
    <form onSubmit={(e) => void save(null, e)} noValidate>
      <PageHeader
        title={isNew ? 'New project' : 'Edit project'}
        actions={
          <>
            {!isNew && <ButtonLink to={`/admin/projects/${id}/preview`} variant="secondary">Preview</ButtonLink>}
            <Button type="submit" variant="secondary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            {form.published ? (
              <Button disabled={saving} variant="secondary" onClick={() => void save(false)}>Unpublish</Button>
            ) : (
              <Button disabled={saving} onClick={() => void save(true)}>Publish</Button>
            )}
          </>
        }
      >
        <PublishBadge published={form.published} />{' '}
        <span className="ml-2">Only published projects are visible to visitors. Save as a draft while you work.</span>
      </PageHeader>

      <div className="space-y-6">
        <Panel title="Basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                label="Title"
                value={form.title}
                maxLength={160}
                required
                error={errors.title}
                onChange={(e) => {
                  set('title', e.target.value)
                  if (!slugTouched) set('slug', slugify(e.target.value))
                }}
              />
            </div>
            <TextField
              label="URL slug"
              hint="Used in the page address: /projects/your-slug"
              value={form.slug}
              error={errors.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', e.target.value.toLowerCase())
              }}
            />
            <TextField label="Category" value={s(form.category)} onChange={text('category')} maxLength={80} placeholder="e.g. AI, Full-stack" />
            <div className="sm:col-span-2">
              <TextArea label="Short summary" hint="Shown on project cards (max 500 characters). Required to publish." rows={3} maxLength={500} value={s(form.summary)} onChange={text('summary')} error={errors.summary} />
            </div>
            <SelectField label="Status" value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectField>
            <TextField label="Start year" type="number" min={1990} max={2100} value={form.startYear ?? ''} onChange={(e) => set('startYear', e.target.value ? Number(e.target.value) : null)} error={errors.startYear} />
            <TextField label="GitHub URL" type="url" placeholder="https://github.com/…" value={s(form.githubUrl)} onChange={text('githubUrl')} error={errors.githubUrl} />
            <TextField label="Live demo URL" type="url" placeholder="https://…" value={s(form.demoUrl)} onChange={text('demoUrl')} error={errors.demoUrl} />
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              Feature this project on the homepage
            </label>
          </div>
        </Panel>

        <Panel title="Technologies & features">
          <div className="space-y-6">
            <TagInput label="Technologies" values={form.technologies} onChange={(v) => set('technologies', v)} placeholder="Java, Spring Boot, PostgreSQL…" />
            <LinesInput label="Key features" values={form.keyFeatures} onChange={(v) => set('keyFeatures', v)} rows={5} />
          </div>
        </Panel>

        <Panel title="Story">
          <p className="mb-5 text-sm text-subtle">Plain text. Blank lines start a new paragraph. Only include information you are authorised to publish; never confidential employer or client details.</p>
          <div className="space-y-5">
            <TextArea label="Problem statement" rows={4} value={s(form.problemStatement)} onChange={text('problemStatement')} />
            <TextArea label="Detailed description" rows={6} value={s(form.description)} onChange={text('description')} />
            <TextArea label="Architecture & implementation" rows={6} value={s(form.architecture)} onChange={text('architecture')} />
            <TextArea label="My contributions" rows={4} value={s(form.contributions)} onChange={text('contributions')} />
            <TextArea label="Challenges & solutions" rows={5} value={s(form.challenges)} onChange={text('challenges')} />
            <TextArea label="Lessons learned" rows={4} value={s(form.lessonsLearned)} onChange={text('lessonsLearned')} />
          </div>
        </Panel>

        <Panel title="Images">
          <div className="space-y-6">
            <ImageUploader label="Cover image" ids={form.coverImageId ? [form.coverImageId] : []} onChange={(ids) => set('coverImageId', ids[0] ?? null)} />
            <ImageUploader label="Screenshot gallery" multiple ids={form.galleryImageIds} onChange={(ids) => set('galleryImageIds', ids)} />
          </div>
        </Panel>

        {!isNew && (
          <Panel title="Danger zone">
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete project</Button>
          </Panel>
        )}
      </div>

      <ConfirmDialog open={confirmDelete} title="Delete this project?" confirmLabel="Delete project" destructive onConfirm={() => void remove()} onCancel={() => setConfirmDelete(false)}>
        This permanently removes “{form.title}”. This cannot be undone.
      </ConfirmDialog>
    </form>
  )
}
