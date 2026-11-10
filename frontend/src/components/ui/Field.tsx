import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'

interface FieldShell {
  label: string
  error?: string | null
  hint?: string
}

function Shell({ label, error, hint, id, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function describedBy(id: string, error?: string | null, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

export function TextField({ label, error, hint, className = '', ...props }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        className={`field ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </Shell>
  )
}

export function TextArea({ label, error, hint, className = '', ...props }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        className={`field min-h-28 resize-y ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </Shell>
  )
}

export function SelectField({
  label,
  error,
  hint,
  children,
  ...props
}: FieldShell & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <select id={id} className="field" aria-invalid={error ? true : undefined} {...props}>
        {children}
      </select>
    </Shell>
  )
}
