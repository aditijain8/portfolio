import type { ReactNode } from 'react'
import type { ProjectDetail } from '../../api/types'
import { safeUrl, STATUS_LABEL } from '../../lib/format'
import { ButtonAnchor } from '../ui/Button'
import { Badge } from '../ui/primitives'
import { Gallery } from './Gallery'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-9">
      <h2 className="eyebrow mb-4">{title}</h2>
      {children}
    </section>
  )
}

/** Plain-text paragraphs. Content is rendered as text (never HTML), so stored data cannot inject markup. */
function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-lg leading-relaxed text-muted">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  )
}

/** Shared by the public project page and the admin preview. All essential content renders without animation. */
export function ProjectContent({ project }: { project: ProjectDetail }) {
  const github = safeUrl(project.githubUrl)
  const demo = safeUrl(project.demoUrl)
  const sections: [string, string | null][] = [
    ['The problem', project.problemStatement],
    ['Overview', project.description],
    ['Architecture & implementation', project.architecture],
    ['My contributions', project.contributions],
    ['Challenges & solutions', project.challenges],
    ['Lessons learned', project.lessonsLearned],
  ]

  return (
    <article>
      <header className="pb-10">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {project.category && <Badge tone="accent">{project.category}</Badge>}
          <Badge>{STATUS_LABEL[project.status] ?? project.status}</Badge>
          {project.startYear && <Badge>{project.startYear}</Badge>}
        </div>
        <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">{project.title}</h1>
        {project.summary && <p className="mt-6 max-w-3xl text-xl text-muted">{project.summary}</p>}
        {(github || demo) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {demo && <ButtonAnchor href={demo}>Live demo ↗</ButtonAnchor>}
            {github && (
              <ButtonAnchor href={github} variant="secondary">
                View on GitHub ↗
              </ButtonAnchor>
            )}
          </div>
        )}
      </header>

      {project.coverImageUrl && (
        <img
          src={project.coverImageUrl}
          alt={`${project.title} cover`}
          decoding="async"
          className="mb-6 aspect-[16/9] w-full rounded-3xl border border-line object-cover"
        />
      )}

      {project.technologies.length > 0 && (
        <Block title="Technologies">
          <ul className="flex flex-wrap gap-2">
            {project.technologies.map((t) => (
              <li key={t}>
                <Badge>{t}</Badge>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {project.keyFeatures.length > 0 && (
        <Block title="Key features">
          <ul className="grid gap-3 sm:grid-cols-2">
            {project.keyFeatures.map((f, i) => (
              <li key={i} className="card flex gap-3 p-4 text-muted">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {sections.map(([title, text]) => text && (
        <Block key={title} title={title}>
          <Prose text={text} />
        </Block>
      ))}

      {project.galleryImageUrls.length > 0 && (
        <Block title="Screenshots">
          <Gallery urls={project.galleryImageUrls} title={project.title} />
        </Block>
      )}

      {!github && !demo && !project.description && !project.architecture && (
        <p className="border-t border-line py-9 text-muted">More details about this project are coming soon.</p>
      )}
    </article>
  )
}
