import { ButtonLink } from '../components/ui/Button'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFoundPage() {
  usePageMeta('Page not found')
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow mb-6">Error 404</p>
        <h1 className="font-display text-[clamp(5rem,20vw,12rem)] italic leading-none text-accent">404</h1>
        <p className="mx-auto mt-6 max-w-md text-xl text-muted">This page wandered off. The link may be broken, or the project is not published.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <ButtonLink to="/">Back home</ButtonLink>
          <ButtonLink to="/projects" variant="secondary">
            Browse projects
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
