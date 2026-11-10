import { useLayoutEffect, useRef } from 'react'

/**
 * Scroll-triggered reveal. Content is visible by default; only elements that start below the fold are
 * hidden, then revealed once. Without IntersectionObserver (or with reduced motion) nothing is hidden.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return

    el.dataset.reveal = 'pending'
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          // Two frames so the browser registers the hidden state before transitioning.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              el.dataset.reveal = 'shown'
            }),
          )
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
