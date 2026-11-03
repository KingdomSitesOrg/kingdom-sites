import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import CinematicHeader from './Header'
import WarmImages from './WarmImages'
import { sans } from './fonts'
import './cinematic.css'

/** Direction 2's own header and footer around a page. A page can name a look
 *  (the home page's warm paper): it sets the ground and accent of the whole
 *  page, header and footer included, and `fontClass` brings that look's font.
 *  Without a look, the page keeps the dark room. */
export default function CinematicChrome({ children, look, fontClass }: { children: React.ReactNode; look?: string; fontClass?: string }) {
  return (
    <div className={`cn ${sans.variable}${fontClass ? ` ${fontClass}` : ''}`} data-look={look}>
      <CinematicHeader />

      <main>{children}</main>
      <WarmImages />

      <footer className="cn-wrap cn-foot flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Kingdom Sites · Rochester, Minnesota</p>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={CONTACT_MAILTO} className="hover:text-[var(--fg)]">{CONTACT_EMAIL}</a>
          <Link href="/ai-tooling" className="hover:text-[var(--fg)]">AI consultation</Link>
          <Link href="/prayer" className="hover:text-[var(--fg)]">Prayer</Link>
          <Link href={INQUIRE_PATH} className="hover:text-[var(--fg)]">{INQUIRE_CTA}</Link>
        </p>
      </footer>
    </div>
  )
}
