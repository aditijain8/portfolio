import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
  setData: (data: T | null) => void
}

/** Runs `loader` on mount and whenever `deps` change, ignoring stale responses. */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
        if (e instanceof ApiError && e.status === 404) setData(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload, setData }
}
