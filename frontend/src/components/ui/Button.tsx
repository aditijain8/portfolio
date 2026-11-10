import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none ' +
  'transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-[var(--ease-out-expo)] ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-black hover:bg-accent-strong hover:shadow-[0_8px_30px_-8px_rgb(242_166_90/0.6)] hover:-translate-y-0.5',
  secondary:
    'border border-line-strong bg-white/[0.03] text-ink hover:border-white/30 hover:bg-white/[0.07] hover:-translate-y-0.5',
  ghost: 'text-muted hover:text-ink hover:bg-white/[0.06]',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
}

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

function classes(variant: Variant, size: Size, extra?: string) {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra ?? ''}`
}

interface Shared {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={classes(variant, size, className)} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: Shared & LinkProps) {
  return <Link className={classes(variant, size, className)} {...props} />
}

/** External link styled as a button. Opens in a new tab with safe rel attributes. */
export function ButtonAnchor({
  variant = 'primary',
  size = 'md',
  className,
  external = true,
  ...props
}: Shared & AnchorHTMLAttributes<HTMLAnchorElement> & { external?: boolean }) {
  return (
    <a
      className={classes(variant, size, className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    />
  )
}
