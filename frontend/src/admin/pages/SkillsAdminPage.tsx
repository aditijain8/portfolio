import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import type { SkillCategory } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { ErrorState, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync } from '../../hooks/useAsync'
import { PageHeader, Panel, TagInput } from '../components/parts'

export default function SkillsAdminPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync((s) => adminApi.skills(s), [])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setCategories(data)
  }, [data])

  const update = (i: number, patch: Partial<SkillCategory>) =>
    setCategories((list) => list.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  const move = (i: number, delta: number) =>
    setCategories((list) => {
      const next = [...list]
      const t = i + delta
      if (t < 0 || t >= next.length) return list
      ;[next[i], next[t]] = [next[t], next[i]]
      return next
    })

  async function save() {
    setSaving(true)
    try {
      const cleaned = categories.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), skills: c.skills }))
      setCategories(await adminApi.saveSkills(cleaned))
      toast.success('Skills saved')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not save skills')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Skills" actions={<Button onClick={() => void save()} disabled={saving || loading}>{saving ? 'Saving…' : 'Save skills'}</Button>}>
        Group the technologies you want to list. These are shown as plain badges — no proficiency ratings.
      </PageHeader>
      {loading && !data && <Skeleton className="h-60" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      <div className="space-y-5">
        {categories.map((c, i) => (
          <Panel key={i}>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <label htmlFor={`cat-${i}`} className="mb-1.5 block text-sm font-medium">Category name</label>
                <input id={`cat-${i}`} className="field" value={c.name} maxLength={80} onChange={(e) => update(i, { name: e.target.value })} />
              </div>
              <Button size="sm" variant="ghost" aria-label="Move category up" disabled={i === 0} onClick={() => move(i, -1)}>▲</Button>
              <Button size="sm" variant="ghost" aria-label="Move category down" disabled={i === categories.length - 1} onClick={() => move(i, 1)}>▼</Button>
              <Button size="sm" variant="danger" onClick={() => setCategories((l) => l.filter((_, idx) => idx !== i))}>Remove</Button>
            </div>
            <TagInput label="Skills" values={c.skills} onChange={(skills) => update(i, { skills })} max={60} />
          </Panel>
        ))}
      </div>
      <Button className="mt-5" variant="secondary" onClick={() => setCategories((l) => [...l, { name: '', skills: [] }])}>
        Add category
      </Button>
    </>
  )
}
