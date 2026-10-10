import type { CSSProperties, ReactNode } from 'react'

import { cn } from './cn'

/** A small rounded label: a soft turquoise tint, or a neutral one. */
export function Badge({
  variant = 'default',
  className,
  style,
  children,
}: {
  variant?: 'default' | 'secondary'
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-4',
        variant === 'default' ? 'bg-accent-wash text-primary' : 'bg-wash-strong text-heading',
        className,
      )}
    >
      {children}
    </span>
  )
}
