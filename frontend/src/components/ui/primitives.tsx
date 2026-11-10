import type { ReactNode } from 'react'
import { Button } from './Button'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warn' }) {
  const tones = {
    neutral: 'border-line text-muted bg-white/[0.03]',
    accent: 'border-accent/30 text-accent bg-accent/10',
    success: 'border-success/30 text-success bg-success/10',
    warn: 'border-amber-300/30 text-amber-300 bg-amber-300/10',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[0.7rem] ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-3 text-muted">
      <span className="h-5 w-5 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-line-strong border-t-accent" />
      <span className="text-sm">{label}…</span>
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div aria-hidden className="mb-1 h-10 w-10 rounded-full border border-line-strong bg-white/[0.03]" />
      <h3 className="font-display text-2xl">{title}</h3>
      {children && <p className="max-w-md text-sm text-muted">{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 border-danger/30 px-6 py-12 text-center">
      <h3 className="font-display text-2xl">Something went wrong</h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-12 max-w-2xl">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 className="font-display text-4xl leading-[1.05] sm:text-5xl">{title}</h2>
      {children && <p className="mt-5 text-lg text-muted">{children}</p>}
    </header>
  )
}
