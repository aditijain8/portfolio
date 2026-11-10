import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { ProjectSummary } from '../../api/types'
import { STATUS_LABEL } from '../../lib/format'
import { Badge } from '../ui/primitives'

function CoverFallback({ title }: { title: string }) {
  const initials = title
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  return (
    <div
      aria-hidden
      className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgb(242_166_90/0.18),transparent_60%),linear-gradient(135deg,#17171b,#0d0d10)]"
    >
      <span className="font-display text-6xl text-white/25">{initials || '·'}</span>
    </div>
  )
}

interface Props {
  project: ProjectSummary
  index?: number
  /** Optional href override, e.g. for admin preview. */
  to?: string
}

export function ProjectCard({ project, index = 0, to }: Props) {
  const delay = Math.min(index, 8) * 70
  return (
    <article
      className="anim-fade-up card card-hover group relative flex h-full flex-col overflow-hidden"
      style={{ '--delay': `${delay}ms` } as CSSProperties}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
        {project.coverImageUrl ? (
          <img
            src={project.coverImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
          />
        ) : (
          <CoverFallback title={project.title} />
        )}
        {project.featured && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">Featured</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[0.7rem] uppercase tracking-wider text-subtle">
          {project.category && <span>{project.category}</span>}
          {project.category && project.startYear && <span aria-hidden>·</span>}
          {project.startYear && <span>{project.startYear}</span>}
          <span aria-hidden>·</span>
          <span>{STATUS_LABEL[project.status] ?? project.status}</span>
        </div>
        <h3 className="font-display text-3xl leading-tight">
          <Link
            to={to ?? `/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-[-3px]"
          >
            {project.title}
          </Link>
        </h3>
        {project.summary && <p className="line-clamp-3 text-sm leading-relaxed text-muted">{project.summary}</p>}
        {project.technologies.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-3" aria-label="Technologies">
            {project.technologies.slice(0, 5).map((t) => (
              <li key={t}>
                <Badge>{t}</Badge>
              </li>
            ))}
            {project.technologies.length > 5 && (
              <li>
                <Badge>+{project.technologies.length - 5}</Badge>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  )
}
