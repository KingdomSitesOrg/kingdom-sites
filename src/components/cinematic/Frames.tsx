import Image from 'next/image'
import { PHONE_SHOTS } from '@/lib/phone-shots'
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

/* Phones are never preloaded; `eager` only skips lazy loading (the hero's).
   A phone whose screenshot has sized copies (scripts/phone-shots.mjs) is drawn
   as a <picture>: AVIF, then WebP, then a baseline JPEG every Safari shows,
   each at the width the screen needs. Until it arrives, the screen shows the
   shot's own tone and a blurred copy, so nothing pops in empty. Lazy phones
   are marked for WarmImages, which fetches them a screen or two ahead. */
export function Phone({ shot, eager, sizes = PHONE_SIZES }: { shot: Shot; eager?: boolean; sizes?: string }) {
  const opt = PHONE_SHOTS[shot.src]
  if (!opt) {
    return (
      <div className="cn-phone">
        <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading={eager ? 'eager' : 'lazy'} unoptimized />
      </div>
    )
  }
  const set = (ext: string) => opt.widths.map((w) => `/opt/${opt.name}-${w}.${ext} ${w}w`).join(', ')
  return (
    <div className="cn-phone">
      <picture>
        <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
        <img
          src={`/opt/${opt.name}-${opt.widths[1] ?? opt.widths[0]}.jpg`}
          srcSet={set('jpg')}
          sizes={sizes}
          alt={shot.alt}
          width={shot.w}
          height={shot.h}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          data-warm={eager ? undefined : ''}
          style={{ backgroundColor: opt.tone, backgroundImage: `url(${opt.blur})`, backgroundSize: 'cover' }}
        />
      </picture>
    </div>
  )
}

/* A phone in a row of four, as on the home page: about 270px wide at most. */
const PHONE_SIZES = '(min-width: 1260px) 270px, 22vw'
