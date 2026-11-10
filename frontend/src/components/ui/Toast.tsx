import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Tone = 'success' | 'error'
interface ToastItem {
  id: number
  tone: Tone
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)
let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((tone: Tone, message: string) => {
    const id = nextId++
    setItems((current) => [...current, { id, tone, message }])
    window.setTimeout(() => setItems((current) => current.filter((t) => t.id !== id)), tone === 'error' ? 7000 : 4000)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m) }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`sheet-in pointer-events-auto max-w-md rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
              t.tone === 'error'
                ? 'border-danger/40 bg-[#2a1517]/95 text-red-100'
                : 'border-success/30 bg-[#12251b]/95 text-green-100'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
