// Cloudflare Pages Functions helper: forwards a request to the Spring Boot API so the browser only ever
// talks to one origin (first-party cookies, no CORS). Set BACKEND_ORIGIN (e.g. https://my-api.onrender.com).
export interface Env {
  BACKEND_ORIGIN: string
}

export async function proxy(request: Request, env: Env): Promise<Response> {
  if (!env.BACKEND_ORIGIN) {
    return new Response('BACKEND_ORIGIN is not configured', { status: 500 })
  }
  const incoming = new URL(request.url)
  const target = new URL(incoming.pathname + incoming.search, env.BACKEND_ORIGIN)

  const headers = new Headers(request.headers)
  headers.set('X-Forwarded-Host', incoming.host)
  headers.set('X-Forwarded-Proto', 'https')
  headers.delete('Host')

  const response = await fetch(new Request(target.toString(), { method: request.method, headers, body: request.body, redirect: 'manual' }))
  const out = new Response(response.body, response)
  out.headers.set('X-Content-Type-Options', 'nosniff')
  return out
}
