import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { sans } from './fonts'
import './cinematic.css'

/** Direction 2's own header and footer around a page. */
export default function CinematicChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={`cn ${sans.variable}`}>
      <header className="cn-head">
        <div className="cn-wrap cn-head-in">
          <Link href="/" className="cn-display text-[22px] tracking-tight" style={{ lineHeight: 1 }}>
            Kingdom Sites
          </Link>
          <nav aria-label="Main" className="cn-nav">
            <Link href="/work/farzana">Work</Link>
            <Link href="/about" className="cn-hide-sm">Studio</Link>
            <Link href="/mission" className="cn-hide-sm">Ministries</Link>
            <Link href={INQUIRE_PATH} className="cn-btn cn-btn-sm">
              Talk to us
            </Link>
          </nav>
        </div>
      </header>

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
