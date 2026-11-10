/**
 * Thin fetch wrapper. All calls are same-origin (Vite proxy in dev, reverse proxy in production),
 * so the HttpOnly session cookie and the XSRF-TOKEN cookie work without any CORS exposure.
 */
const BASE = import.meta.env.VITE_API_BASE ?? ''

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export const AUTH_EXPIRED_EVENT = 'auth:expired'

function readCookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

async function ensureCsrfToken(): Promise<string | undefined> {
  let token = readCookie('XSRF-TOKEN')
  if (!token) {
    await fetch(`${BASE}/api/public/contact/status`, { credentials: 'include' })
    token = readCookie('XSRF-TOKEN')
  }
  return token
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  form?: FormData
  signal?: AbortSignal
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined

  if (options.form) {
    body = options.form
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }
  if (method !== 'GET') {
    const token = await ensureCsrfToken()
    if (token) headers['X-XSRF-TOKEN'] = token
  }

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, { method, headers, body, credentials: 'include', signal: options.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  if (response.status === 204) return undefined as T

  const isJson = response.headers.get('content-type')?.includes('json')
  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    // /auth/me and /auth/login legitimately return 401 for anonymous visitors; only mid-session 401s mean "expired".
    if (response.status === 401 && path.startsWith('/api/admin/') && !/\/auth\/(login|me)$/.test(path)) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    const message = payload?.message ?? `Request failed (${response.status})`
    throw new ApiError(response.status, message, payload?.fieldErrors)
  }
  return payload as T
}

export const get = <T>(path: string, signal?: AbortSignal) => api<T>(path, { signal })
export const send = <T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown) =>
  api<T>(path, { method, body })

export function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ''
}
