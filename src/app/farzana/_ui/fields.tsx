import type { ComponentProps } from 'react'

import { cn } from './cn'

/** Form pieces in the Farzana look: hairline fields on the surface, 44px tall, 10px corners. */

export function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex w-full flex-col gap-6', className)} {...props} />
}

export function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div role="group" className={cn('flex w-full flex-col gap-2', className)} {...props} />
}

export function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label
      className={cn('flex w-fit gap-1 text-sm font-medium leading-snug text-heading', className)}
      {...props}
    />
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-11 w-full min-w-0 rounded-sm border border-border bg-surface px-4 py-1 text-base text-ink placeholder:text-muted focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-28 w-full rounded-sm border border-border bg-surface px-4 py-3 text-base leading-relaxed text-ink placeholder:text-muted focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

/** The loading mark is the brand's diamond, pulsing gently. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      viewBox="0 0 16 16"
      className={cn('size-4 animate-pulse fill-gold motion-reduce:animate-none', className)}
    >
      <rect x="3.5" y="3.5" width="9" height="9" transform="rotate(45 8 8)" />
    </svg>
  )
}
