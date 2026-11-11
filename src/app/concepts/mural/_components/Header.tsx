import Link from 'next/link'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { CHAT_FONT_CSS } from '../_lib/fonts'
import Drawer from './Drawer'
import Fx from './Fx'

/* The mural's header, on every page that wears the look. On the home page its
   links scroll to that page's own sections; everywhere else they open the
   pages themselves. The words are the live site's own menu words. */
export default function MuralHeader({ home = false }: { home?: boolean }) {
  const portfolio = home ? '#work' : '/portfolio'
  const about = home ? '#maker' : '/about'
  const talk = home ? '#talk' : INQUIRE_PATH
  return (
    <header className="mu-nav">
      <style dangerouslySetInnerHTML={{ __html: CHAT_FONT_CSS }} />
      <Link href={home ? '#top' : '/'} className="mu-brand" data-snap>
        <span className="mu-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        Kingdom Sites
      </Link>
      <nav className="mu-links" aria-label={home ? 'On this page' : 'Pages'}>
        <Link href={portfolio} data-snap>
          Portfolio
        </Link>
        <Link href={about} data-snap>
          About
        </Link>
        {home ? null : (
          <Link href="/ai-tooling" data-snap>
            AI consultation
          </Link>
        )}
      </nav>
      <Fx />
      {/* On a phone the button uses the live site's short words, "Talk to me". */}
      <Link href={talk} className="mu-nav-cta" data-snap>
        <span className="mu-wide">{INQUIRE_CTA}</span>
        <span className="mu-narrow">Talk to me</span>
      </Link>
      {/* The menu on a phone or tablet. */}
      <Drawer
        links={[
          { label: 'Portfolio', href: portfolio },
          { label: 'About', href: about },
          { label: 'AI consultation', href: '/ai-tooling' },
          { label: 'Mission', href: '/mission' },
          { label: INQUIRE_CTA, href: talk },
        ]}
      />
    </header>
  )
}
