import { useRef, useState } from 'react'

/** Screenshot grid with an accessible native-dialog lightbox. */
export function Gallery({ urls, title }: { urls: string[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [current, setCurrent] = useState(0)
  if (urls.length === 0) return null

  const open = (i: number) => {
    setCurrent(i)
    dialog.current?.showModal?.()
  }
  const step = (delta: number) => setCurrent((c) => (c + delta + urls.length) % urls.length)

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {urls.map((url, i) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => open(i)}
              className="group block w-full overflow-hidden rounded-2xl border border-line"
              aria-label={`Open screenshot ${i + 1} of ${urls.length}`}
            >
              <img
                src={url}
                alt={`${title} screenshot ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={`${title} screenshots`}
        className="sheet-in m-auto max-h-[92vh] max-w-[min(96vw,64rem)] rounded-2xl border border-line-strong bg-elevated p-3 text-ink backdrop:bg-black/85"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1)
          if (e.key === 'ArrowLeft') step(-1)
        }}
      >
        <img src={urls[current]} alt={`${title} screenshot ${current + 1}`} className="max-h-[78vh] w-full rounded-xl object-contain" />
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">
            {current + 1} / {urls.length}
          </span>
          <div className="flex gap-2">
            {urls.length > 1 && (
              <>
                <button type="button" className="rounded-full border border-line px-3 py-1 text-sm hover:bg-white/10" onClick={() => step(-1)}>
                  Previous
                </button>
                <button type="button" className="rounded-full border border-line px-3 py-1 text-sm hover:bg-white/10" onClick={() => step(1)}>
                  Next
                </button>
              </>
            )}
            <button type="button" className="rounded-full bg-accent px-3 py-1 text-sm text-black" onClick={() => dialog.current?.close()}>
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
