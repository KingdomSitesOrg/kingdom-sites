import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import CinematicHeader from './Header'
import { sans } from './fonts'
import './cinematic.css'

/** Direction 2's own header and footer around a page. */
export default function CinematicChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={`cn ${sans.variable}`}>
      <CinematicHeader />

      <main>{children}</main>

      <footer className="cn-wrap cn-foot flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Kingdom Sites · Rochester, Minnesota</p>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={CONTACT_MAILTO} className="hover:text-[var(--fg)]">{CONTACT_EMAIL}</a>
          <Link href="/prayer" className="hover:text-[var(--fg)]">Prayer</Link>
          <Link href={INQUIRE_PATH} className="hover:text-[var(--fg)]">{INQUIRE_CTA}</Link>
        </p>
      </footer>
    </div>
  )
}
