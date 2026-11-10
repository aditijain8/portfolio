import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Accessible confirmation built on the native <dialog>: focus trap and Escape handling come from the browser. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  destructive,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal?.()
    if (!open && dialog.open) dialog.close?.()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className="sheet-in m-auto w-[min(92vw,26rem)] rounded-2xl border border-line-strong bg-elevated p-6 text-ink shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <h2 id="confirm-title" className="font-display text-2xl">
        {title}
      </h2>
      <div className="mt-3 text-sm text-muted">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
