import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { fontVars } from './fonts'
import './editorial.css'

const NAV = [
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'Studio', hide: true },
  { href: '/mission', label: 'Ministries', hide: true },
]

/** Direction 1's own header and footer around a page. */
export default function EditorialChrome({ children, here }: { children: React.ReactNode; here?: string }) {
  return (
    <div className={`ed ${fontVars}`}>
      <div className="ed-wrap">
        <header className="ed-head">
          <Link href="/" className="ed-serif ed-brand">
            Kingdom Sites
          </Link>
          <nav aria-label="Main" className="ed-nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${item.hide ? 'ed-nav-hide' : ''} ed-link ${here === item.href ? 'ed-link-on' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <Link href={INQUIRE_PATH} className="ed-link ed-link-on">
              Contact
            </Link>
          </nav>
        </header>
      </div>

      <main>{children}</main>

      <div className="ed-wrap">
        <footer className="ed-foot ed-grid">
          <div className="ed-c1-4">
            <p className="ed-serif" style={{ fontSize: 22 }}>Kingdom Sites</p>
            <p className="ed-soft mt-1">Websites and apps. Rochester, Minnesota.</p>
          </div>
          <div className="ed-c5-9 mt-6 md:mt-0">
            <p className="ed-mono ed-soft">Write</p>
            <a href={CONTACT_MAILTO} className="ed-link mt-2 inline-block">{CONTACT_EMAIL}</a>
          </div>
          <div className="ed-c9-13 mt-6 md:mt-0">
            <p className="ed-mono ed-soft">Elsewhere</p>
            <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/work" className="ed-link">Work</Link>
              <Link href="/mission" className="ed-link">Mission</Link>
              <Link href="/prayer" className="ed-link">Prayer</Link>
              <Link href={INQUIRE_PATH} className="ed-link">{INQUIRE_CTA}</Link>
            </p>
          </div>
          <p className="ed-mono ed-soft mt-10" style={{ gridColumn: '1 / -1' }}>© 2026 Kingdom Sites</p>
        </footer>
      </div>
    </div>
  )
}
