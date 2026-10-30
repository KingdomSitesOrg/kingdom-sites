import Image from 'next/image'
import type { Shot } from '@/lib/work'

/* Real screenshots in drawn frames. The files are already sized for the page. */
export function Browser({ shot, url, priority }: { shot: Shot; url?: string; priority?: boolean }) {
  return (
    <div className="cn-browser">
      <div className="cn-browser-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        {url ? <span className="cn-browser-url">{url}</span> : null}
      </div>
      <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} priority={priority} unoptimized />
    </div>
  )
}

export function Phone({ shot, priority }: { shot: Shot; priority?: boolean }) {
  return (
    <div className="cn-phone">
      <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} priority={priority} unoptimized />
    </div>
  )
}
