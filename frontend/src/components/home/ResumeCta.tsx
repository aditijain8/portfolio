import { publicApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { ButtonAnchor, ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'

export function ResumeCta() {
  const { data: resume, loading } = useAsync((s) => publicApi.resume(s), [])

  return (
    <section aria-labelledby="resume-cta-title" className="container-page py-24">
      <Reveal>
        <div className="card relative overflow-hidden p-8 sm:p-14">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-[90px]" />
          <p className="eyebrow mb-4">Resume</p>
          <h2 id="resume-cta-title" className="max-w-2xl font-display text-4xl leading-[1.05] sm:text-6xl">
            The short version, on one page.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted">
            {resume ? 'View the latest resume online or download it as a PDF.' : loading ? 'Checking for the latest resume…' : 'A resume will be available here soon.'}
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink to="/resume" size="lg">
              View resume
            </ButtonLink>
            {resume && (
              <ButtonAnchor href={resume.downloadUrl} external={false} download variant="secondary" size="lg">
                Download PDF
              </ButtonAnchor>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
