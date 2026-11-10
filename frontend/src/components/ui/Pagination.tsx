import { Button } from './Button'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
      <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="font-mono text-xs text-muted" aria-live="polite">
        Page {page + 1} of {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  )
}
