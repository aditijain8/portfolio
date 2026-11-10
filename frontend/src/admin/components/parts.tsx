import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'

export function PageHeader({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        {children && <p className="mt-2 max-w-2xl text-muted">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  )
}

export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 font-display text-2xl">{title}</h2>}
      {children}
    </section>
  )
}

export function StatCard({ label, value, to }: { label: string; value: ReactNode; to?: string }) {
  const inner = (
    <>
      <p className="eyebrow text-[0.65rem]">{label}</p>
      <p className="mt-3 font-display text-5xl">{value}</p>
    </>
  )
  return to ? (
    <Link to={to} className="card card-hover block p-5">
      {inner}
    </Link>
  ) : (
    <div className="card p-5">{inner}</div>
  )
}

/** Tag-style editor for string lists (technologies). Enter or comma adds, Backspace on empty removes. */
export function TagInput({ label, values, onChange, placeholder, max = 40 }: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  max?: number
}) {
  const [draft, setDraft] = useState('')
  const inputId = useRef(`tag-${Math.random().toString(36).slice(2)}`).current

  const add = (raw: string) => {
    const text = raw.trim()
    if (!text || values.length >= max) return
    if (!values.some((v) => v.toLowerCase() === text.toLowerCase())) onChange([...values, text])
    setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1))
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <div className="field flex flex-wrap items-center gap-2 !p-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-white/[0.05] py-0.5 pl-3 pr-1 font-mono text-xs">
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-ink"
              onClick={() => onChange(values.filter((x) => x !== v))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => add(draft)}
          placeholder={values.length ? '' : placeholder}
          className="min-w-32 flex-1 bg-transparent px-2 py-1 outline-none"
          maxLength={60}
        />
      </div>
      <p className="text-xs text-subtle">Press Enter or comma to add.</p>
    </div>
  )
}

/** Multi-line list editor: one entry per line. */
export function LinesInput({ label, values, onChange, hint, rows = 4 }: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  hint?: string
  rows?: number
}) {
  const id = useRef(`lines-${Math.random().toString(36).slice(2)}`).current
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        className="field resize-y"
        rows={rows}
        value={values.join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n'))}
        onBlur={() => onChange(values.map((v) => v.trim()).filter(Boolean))}
      />
      <p className="text-xs text-subtle">{hint ?? 'One item per line.'}</p>
    </div>
  )
}

/** Uploads one or more images through the authenticated media endpoint. */
export function ImageUploader({ label, ids, multiple, onChange }: {
  label: string
  ids: string[]
  multiple?: boolean
  onChange: (ids: string[]) => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const result = await adminApi.uploadImage(file)
        uploaded.push(result.id)
      }
      onChange(multiple ? [...ids, ...uploaded] : uploaded.slice(0, 1))
      toast.success(uploaded.length > 1 ? `${uploaded.length} images uploaded` : 'Image uploaded')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <ul className="flex flex-wrap gap-3">
        {ids.map((id) => (
          <li key={id} className="group relative">
            <img src={`/api/public/media/${id}`} alt="" className="h-24 w-36 rounded-lg border border-line object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange(ids.filter((x) => x !== id))}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-line-strong bg-elevated text-sm hover:text-danger"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Uploading…' : ids.length && !multiple ? 'Replace image' : multiple ? 'Add images' : 'Upload image'}
        </Button>
        <span className="text-xs text-subtle">JPEG, PNG or WebP, up to 3 MB.</span>
      </div>
      <input
        ref={input}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={(e) => void onFiles(e.target.files)}
      />
    </div>
  )
}

export function PublishBadge({ published }: { published: boolean }) {
  return published ? <Badge tone="success">Published</Badge> : <Badge tone="warn">Draft</Badge>
}
