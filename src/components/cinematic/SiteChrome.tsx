import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import CinematicHeader from './Header'
import { sans } from './fonts'
import './cinematic.css'
import './site.css'

const FACEBOOK_URL = 'https://www.facebook.com/share/1EzdtfSCs3/?mibextid=wwXIfr'
const YOUTUBE_URL = 'https://www.youtube.com/@tkklein/videos'

const PAGE_LINKS = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/ai-tooling', label: 'AI consultation' },
  { href: '/rochester-mn', label: 'Rochester businesses' },
  { href: '/churches', label: 'Churches' },
  { href: '/schools', label: 'Schools' },
  { href: '/about', label: 'Studio' },
  { href: '/mission', label: 'Mission' },
  { href: '/refer', label: 'Refer someone' },
  { href: '/blog', label: 'Blog' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
]

/* The studio's own mini-sites open in a new tab, as they always have. */
const SITE_LINKS = [
  { href: '/ministry', label: 'Ministry' },
  { href: '/prayer', label: 'Prayer' },
  { href: '/sign', label: 'Sign' },
]

/**
 * Every studio page but the home page sits in this: the home page's header,
 * the home page's dark room, and its footer line with the rest of the site's
 * pages above it (T-365). The home page keeps its own copy (Chrome.tsx).
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={`cn-site ${sans.variable}`}>
      <CinematicHeader />

      <main>{children}</main>

      <footer className="cn-wrap cn-foot">
        <nav aria-label="All pages" className="cn-site-foot-links pb-10">
          {PAGE_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          {SITE_LINKS.map(({ href, label }) => (
            <a key={href} href={href} target="_blank" rel="noopener">
              {label} <span aria-hidden="true" className="cn-dim">↗</span>
            </a>
          ))}
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
            Facebook <span aria-hidden="true" className="cn-dim">↗</span>
          </a>
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
            YouTube <span aria-hidden="true" className="cn-dim">↗</span>
          </a>
        </nav>
        <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kingdom Sites · Rochester, Minnesota</p>
          <p className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={CONTACT_MAILTO} className="hover:text-[var(--fg)]">{CONTACT_EMAIL}</a>
            <Link href={INQUIRE_PATH} className="hover:text-[var(--fg)]">{INQUIRE_CTA}</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
