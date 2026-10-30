import Image from 'next/image'
import type { Shot } from '@/lib/work'

/* Real screenshots in drawn frames. The files are already sized for the page.
   Every browser window is the same window: three dots, the product's name in
   the address bar, and at most one note (for example "Demo school") at the
   right end of that same bar. */
export function Browser({ shot, product, note, priority }: { shot: Shot; product: string; note?: string; priority?: boolean }) {
  return (
    <div className="cn-browser">
      <div className="cn-browser-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span className="cn-browser-url">{product}</span>
        {note ? <span className="cn-browser-note">{note}</span> : null}
      </div>
      <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} priority={priority} unoptimized />
    </div>
  )
}

/* Phones are never preloaded; `eager` only skips lazy loading (the hero's). */
export function Phone({ shot, eager }: { shot: Shot; eager?: boolean }) {
  return (
    <div className="cn-phone">
      <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading={eager ? 'eager' : 'lazy'} unoptimized />
    </div>
  )
}
