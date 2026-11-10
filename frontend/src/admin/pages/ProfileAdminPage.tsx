import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import type { Profile } from '../../api/types'
import { useProfile } from '../../components/layout/ProfileContext'
import { Button } from '../../components/ui/Button'
import { TextArea, TextField } from '../../components/ui/Field'
import { ErrorState, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync } from '../../hooks/useAsync'
import { LinesInput, PageHeader, Panel } from '../components/parts'

const v = (x: string | null | undefined) => x ?? ''

export default function ProfileAdminPage() {
  const toast = useToast()
  const publicProfile = useProfile()
  const { data, loading, error, reload } = useAsync((s) => adminApi.profile(s), [])
  const [form, setForm] = useState<Profile | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwBusy, setPwBusy] = useState(false)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  if (loading && !form) return <Skeleton className="h-96" />
  if (error || !form) return <ErrorState message={error ?? 'Could not load the profile'} onRetry={reload} />

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))
  const str = (key: keyof Profile) => (e: { target: { value: string } }) => set(key, e.target.value as never)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setErrors({})
    try {
      await adminApi.saveProfile({ ...form, interests: form.interests.filter(Boolean), highlights: form.highlights.filter(Boolean) })
      toast.success('Profile saved')
      publicProfile.reload()
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors ?? {})
      toast.error(err instanceof ApiError ? err.message : 'Could not save the profile')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setPwBusy(true)
    try {
      await adminApi.changePassword(pw.current, pw.next)
      toast.success('Password changed')
      setPw({ current: '', next: '' })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not change the password')
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <>
      <form onSubmit={(e) => void save(e)} noValidate>
        <PageHeader title="Profile & links" actions={<Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>}>
          Public links only appear on the site once you fill them in — empty fields are simply hidden.
        </PageHeader>
        <div className="space-y-6">
          <Panel title="Identity">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Full name" value={form.fullName} required error={errors.fullName} onChange={str('fullName')} />
              <TextField label="Location" value={v(form.location)} onChange={str('location')} />
              <div className="sm:col-span-2"><TextField label="Headline" value={v(form.headline)} hint="Separate focus areas with “|”." onChange={str('headline')} /></div>
              <div className="sm:col-span-2"><TextArea label="Hero introduction" rows={3} value={v(form.intro)} onChange={str('intro')} /></div>
              <div className="sm:col-span-2"><TextArea label="About" rows={5} value={v(form.about)} onChange={str('about')} /></div>
              <LinesInput label="Areas of interest" values={form.interests} onChange={(x) => set('interests', x)} />
              <LinesInput label="Highlights" values={form.highlights} onChange={(x) => set('highlights', x)} hint="One verified highlight per line." />
            </div>
          </Panel>
          <Panel title="Contact & social links">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Public contact email" type="email" value={v(form.contactEmail)} error={errors.contactEmail} onChange={str('contactEmail')} />
              <TextField label="Site URL" type="url" placeholder="https://your-domain.com" value={v(form.siteUrl)} error={errors.siteUrl} onChange={str('siteUrl')} />
              <TextField label="GitHub URL" type="url" placeholder="https://github.com/…" value={v(form.githubUrl)} error={errors.githubUrl} onChange={str('githubUrl')} />
              <TextField label="LinkedIn URL" type="url" placeholder="https://www.linkedin.com/in/…" value={v(form.linkedinUrl)} error={errors.linkedinUrl} onChange={str('linkedinUrl')} />
              <div className="sm:col-span-2"><TextField label="Contact section blurb" value={v(form.contactBlurb)} onChange={str('contactBlurb')} /></div>
            </div>
          </Panel>
        </div>
      </form>

      <form onSubmit={(e) => void changePassword(e)} className="mt-8">
        <Panel title="Change administrator password">
          <div className="grid max-w-xl gap-5 sm:grid-cols-2">
            <TextField label="Current password" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <TextField label="New password" type="password" autoComplete="new-password" hint="At least 12 characters." value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </div>
          <Button className="mt-5" type="submit" variant="secondary" disabled={pwBusy || !pw.current || pw.next.length < 12}>
            {pwBusy ? 'Changing…' : 'Change password'}
          </Button>
        </Panel>
      </form>
    </>
  )
}
