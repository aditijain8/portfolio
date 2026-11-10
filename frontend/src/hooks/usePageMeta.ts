import { useEffect } from 'react'

const SITE = 'Aditi Jain'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Sets the document title, description and Open Graph tags for the current page. */
export function usePageMeta(title: string | null, description?: string | null) {
  useEffect(() => {
    if (!title) return
    const full = title === SITE ? `${SITE} — Software Engineer` : `${title} · ${SITE}`
    document.title = full
    const desc = (description ?? '').slice(0, 160)
    if (desc) setMeta('meta[name="description"]', 'name', 'description', desc)
    setMeta('meta[property="og:title"]', 'property', 'og:title', full)
    if (desc) setMeta('meta[property="og:description"]', 'property', 'og:description', desc)
    setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href)
  }, [title, description])
}
