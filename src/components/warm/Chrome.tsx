import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_PATH } from '@/lib/contact'
import { fontVars } from './fonts'
import './warm.css'

/** Direction 3's own header and footer around a page. */
export default function WarmChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={`wm ${fontVars}`}>
      <header className="wm-wrap wm-head">
        <Link href="/" className="wm-serif text-[24px] font-semibold tracking-tight">
          Kingdom Sites
        </Link>
        <nav aria-label="Main" className="wm-nav">
          <Link href="/#stories" className="wm-hide-sm">Our work</Link>
          <Link href="/about" className="wm-hide-sm">Our story</Link>
          <Link href="/#ministries" className="wm-hide-sm">For ministries</Link>
          <Link href={INQUIRE_PATH} className="wm-btn wm-btn-sm">
            Talk with Thomas
          </Link>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="wm-dark">
        <div className="wm-wrap wm-foot grid gap-8 md:grid-cols-3">
          <div>
            <p className="wm-serif text-[22px] font-semibold">Kingdom Sites</p>
            <p className="mt-2">Websites and apps for churches, ministries, schools and small businesses.</p>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-[#bfae98]">Write to Thomas</p>
            <a href={CONTACT_MAILTO} className="mt-2 inline-block underline decoration-white/20 underline-offset-4 hover:decoration-white">
              {CONTACT_EMAIL}
            </a>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-[#bfae98]">More</p>
            <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/mission" className="hover:text-white">Our mission</Link>
              <Link href="/prayer" className="hover:text-white">Prayer</Link>
              <Link href="/latin-game" className="hover:text-white">Jam with Latin</Link>
            </p>
          </div>
          <p className="text-sm text-[#bfae98] md:col-span-3">© 2026 Kingdom Sites · Rochester, Minnesota</p>
        </div>
      </footer>
    </div>
  )
}
