import { publicApi } from '../api/endpoints'
import { ButtonAnchor, ButtonLink } from '../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/primitives'
import { useAsync } from '../hooks/useAsync'
import { usePageMeta } from '../hooks/usePageMeta'
import { formatBytes, formatDate } from '../lib/format'

export default function ResumePage() {
  usePageMeta('Resume', 'View or download the current resume of Aditi Jain, software engineer.')
  const { data: resume, loading, error, reload } = useAsync((s) => publicApi.resume(s), [])

  return (
    <div className="container-page py-16 sm:py-24">
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow mb-4">Resume</p>
        <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">Resume.</h1>
      </header>

      {loading && <Skeleton className="h-[40rem]" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && !resume && (
        <EmptyState
          title="No resume published yet"
          action={<ButtonLink to="/contact" variant="secondary" size="sm">Get in touch</ButtonLink>}
        >
          A resume will appear here once one is published. In the meantime, feel free to reach out directly.
        </EmptyState>
      )}
      {resume && (
        <>
          <div className="card mb-6 flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
            <p className="text-sm text-muted">
              Updated {formatDate(resume.publishedAt)} · PDF · {formatBytes(resume.sizeBytes)}
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonAnchor href={resume.viewUrl} variant="secondary" size="sm">
                Open in new tab ↗
              </ButtonAnchor>
              <ButtonAnchor href={resume.downloadUrl} external={false} download="Aditi_Jain_Resume.pdf" size="sm">
                Download PDF
              </ButtonAnchor>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-white/[0.02]">
            <iframe
              title="Resume PDF viewer"
              src={`${resume.viewUrl}#view=FitH`}
              className="h-[75vh] min-h-[32rem] w-full"
              loading="lazy"
            />
          </div>
          <p className="mt-4 text-sm text-subtle">
            Can’t see the preview (common on mobile)? Use “Open in new tab” or download the PDF above.
          </p>
        </>
      )}
    </div>
  )
}
