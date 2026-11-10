import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useReveal } from '../../hooks/useReveal'

interface Props {
  children: ReactNode
  /** Stagger delay in ms. */
  delay?: number
  as?: ElementType
  className?: string
}

export function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }: Props) {
  const ref = useReveal<HTMLElement>()
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ '--delay': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}
