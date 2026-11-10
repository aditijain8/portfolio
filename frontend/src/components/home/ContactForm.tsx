import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { publicApi } from '../../api/endpoints'
import type { ContactInput } from '../../api/types'
import { useAsync } from '../../hooks/useAsync'
import { Button } from '../ui/Button'
import { TextArea, TextField } from '../ui/Field'
import { Skeleton } from '../ui/primitives'

type Errors = Partial<Record<keyof ContactInput, string>>

export function validateContact(input: ContactInput): Errors {
  const errors: Errors = {}
  if (!input.name.trim()) errors.name = 'Please enter your name.'
  if (!input.email.trim()) errors.email = 'Please enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Enter a valid email address.'
  if (!input.subject.trim()) errors.subject = 'Please add a subject.'
  if (input.message.trim().length < 10) errors.message = 'Write at least 10 characters.'
  if (input.message.length > 5000) errors.message = 'Keep the message under 5000 characters.'
  return errors
}

const EMPTY: ContactInput = { name: '', email: '', subject: '', message: '', website: '' }

export function ContactForm() {
  const status = useAsync((s) => publicApi.contactStatus(s), [])
  const [values, setValues] = useState<ContactInput>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [formError, setFormError] = useState<string | null>(null)

  const set = (key: keyof ContactInput) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const found = validateContact(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setState('sending')
    try {
      await publicApi.sendContact(values)
      setState('sent') // only after the backend has accepted (and stored) the message
      setValues(EMPTY)
    } catch (error) {
      setState('idle')
      if (error instanceof ApiError) {
        setErrors((error.fieldErrors ?? {}) as Errors)
        setFormError(error.message)
      } else setFormError('Your message could not be sent. Please try again.')
    }
  }

  if (status.loading) return <Skeleton className="h-96" />
  if (status.data && !status.data.enabled) {
    return (
      <p role="status" className="card p-6 text-muted">
        The contact form is not available right now. Please reach out through one of the links on this page instead.
      </p>
    )
  }

  if (state === 'sent') {
    return (
      <div role="status" className="card border-success/30 p-8">
        <h3 className="font-display text-3xl">Message received</h3>
        <p className="mt-3 text-muted">Thank you — your message was delivered and will be read soon.</p>
        <Button className="mt-6" variant="secondary" onClick={() => setState('idle')}>
          Send another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8" aria-describedby={formError ? 'contact-error' : undefined}>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Name" name="name" autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} maxLength={120} required />
        <TextField label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} maxLength={254} required />
      </div>
      <TextField label="Subject" name="subject" value={values.subject} onChange={set('subject')} error={errors.subject} maxLength={200} required />
      <TextArea label="Message" name="message" rows={6} value={values.message} onChange={set('message')} error={errors.message} maxLength={5000} required />
      {/* Honeypot: invisible to people and assistive tech, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" name="website" value={values.website} onChange={set('website')} />
        </label>
      </div>
      {formError && (
        <p id="contact-error" role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}
