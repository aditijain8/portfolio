import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useAuth } from '../AuthContext'

export default function LoginPage() {
  usePageMeta('Admin sign in')
  const { user, login, expired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/admin" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    try {
      await login(email.trim(), password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setError('Too many failed attempts. Please wait a while before trying again.')
      else if (err instanceof ApiError && err.status === 401) setError('Invalid email or password.')
      else setError(err instanceof ApiError ? err.message : 'Sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center font-display text-3xl">
          Aditi<span className="text-accent">.</span>
        </Link>
        <form onSubmit={submit} noValidate className="card space-y-5 p-7" aria-labelledby="login-title">
          <h1 id="login-title" className="font-display text-3xl">
            Administrator sign in
          </h1>
          {expired && (
            <p role="status" className="rounded-xl border border-line-strong bg-white/5 px-4 py-3 text-sm text-muted">
              Your session expired. Please sign in again.
            </p>
          )}
          <TextField label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-subtle">This area is restricted to the site owner.</p>
      </div>
    </div>
  )
}
