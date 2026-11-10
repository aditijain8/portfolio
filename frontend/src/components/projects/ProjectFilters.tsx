import { useEffect, useState } from 'react'
import type { ProjectFilters as Filters } from '../../api/types'

export interface FilterState {
  q: string
  technology: string
  category: string
}

interface Props {
  options: Filters | null
  value: FilterState
  onChange: (value: FilterState) => void
}

export function ProjectFilters({ options, value, onChange }: Props) {
  const [text, setText] = useState(value.q)

  // Debounce typing so we do not hit the API on every keystroke.
  useEffect(() => {
    if (text === value.q) return
    const timer = window.setTimeout(() => onChange({ ...value, q: text }), 300)
    return () => window.clearTimeout(timer)
  }, [text, value, onChange])

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${
      active
        ? 'border-accent bg-accent/15 text-accent'
        : 'border-line text-muted hover:border-line-strong hover:text-ink'
    }`

  const hasFilters = value.q || value.technology || value.category

  return (
    <section aria-label="Filter projects" className="mb-10 space-y-5">
      <div className="relative max-w-xl">
        <label htmlFor="project-search" className="sr-only">
          Search projects by title or description
        </label>
        <input
          id="project-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search projects…"
          className="field pl-11"
          autoComplete="off"
        />
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </div>

      {options && options.categories.length > 0 && (
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          <button type="button" className={chip(!value.category)} aria-pressed={!value.category} onClick={() => onChange({ ...value, category: '' })}>
            All categories
          </button>
          {options.categories.map((c) => (
            <button key={c} type="button" className={chip(value.category === c)} aria-pressed={value.category === c} onClick={() => onChange({ ...value, category: value.category === c ? '' : c })}>
              {c}
            </button>
          ))}
        </div>
      )}

      {options && options.technologies.length > 0 && (
        <div role="group" aria-label="Technology" className="flex flex-wrap gap-2">
          {options.technologies.map((t) => (
            <button
              key={t}
              type="button"
              className={`${chip(value.technology === t)} font-mono text-xs`}
              aria-pressed={value.technology === t}
              onClick={() => onChange({ ...value, technology: value.technology === t ? '' : t })}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          className="text-sm text-accent underline-offset-4 hover:underline"
          onClick={() => {
            setText('')
            onChange({ q: '', technology: '', category: '' })
          }}
        >
          Clear all filters
        </button>
      )}
    </section>
  )
}
