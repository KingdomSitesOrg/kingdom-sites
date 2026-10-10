import { Diamond } from './diamond'
import { cn } from './cn'

/**
 * Daniel 2:21, at the foot of every Farzana page. The name means learned; the
 * verse says where learning comes from.
 */
export const VERSE = {
  text: 'He giveth wisdom unto the wise, and knowledge to them that know understanding.',
  reference: 'Daniel 2:21',
}

export function Verse({ className }: { className?: string }) {
  return (
    <figure className={cn('mx-auto flex max-w-2xl flex-col items-center gap-4 text-center', className)}>
      <span aria-hidden className="flex gap-1.5">
        <Diamond size={8} />
        <Diamond size={8} />
      </span>
      <blockquote className="text-balance font-display text-xl leading-8 font-medium text-heading sm:text-[22px] sm:leading-[32px]">
        “{VERSE.text}”
      </blockquote>
      <figcaption className="text-caption">{VERSE.reference}</figcaption>
    </figure>
  )
}
