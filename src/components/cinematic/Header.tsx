'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import './menu.css'

/* Every page of the site, for the menu. The product sites open in a new tab,
   as they always have. */
const MENU: { title: string; links: { href: string; here?: string; label: string }[] }[] = [
  {
    title: 'Portfolio',
    links: [
      { href: '/portfolio', label: 'Full portfolio' },
      // On the Portfolio page this glides to the Farzana section; from anywhere else it opens the page at the top.
      { href: '/portfolio', here: '#farzana', label: 'Farzana Classroom' },
      { href: '/ruta', label: 'Ruta' },
      { href: '/tap-to-tick', label: 'Tap to Tick' },
      { href: '/latin-game', label: 'JAM Legio' },
    ],
  },
  {
    title: 'Studio',
    links: [
      { href: '/about', label: 'About' },
      { href: '/mission', label: 'Mission' },
      { href: '/ai-tooling', label: 'AI consultation' },
      { href: '/guides', label: 'Guides' },
      { href: '/from-the-field', label: 'From the field' },
      { href: '/blog', label: 'Blog' },
      { href: '/refer', label: 'Refer someone' },
    ],
  },
]

const SMALL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
]

const SITE_LINKS = [
  { href: '/ministry', label: 'Ministry' },
  { href: '/prayer', label: 'Prayer' },
  { href: '/sign', label: 'Sign' },
]

/**
 * The header on every studio page, the home page included: the name, a few
 * links, "Talk to me", and a menu button that opens every page of the site.
 * The icon's two lines fold into a cross; the menu drops down like a curtain
 * and its links rise in one after another. With less motion asked for, it
 * simply appears. The menu holds keyboard focus while open, and Escape closes it.
 */
export default function CinematicHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  // A new page closes the menu.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.classList.add('cn-menu-lock')
    panel.current?.querySelector<HTMLElement>('a')?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
        return
      }
      if (e.key !== 'Tab' || !panel.current || !button.current) return
      // Focus goes round the menu and its close button, nowhere else.
      const stops = [button.current, ...panel.current.querySelectorAll<HTMLElement>('a')]
      const at = stops.indexOf(document.activeElement as HTMLElement)
      const next = e.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : at === stops.length - 1 ? 0 : at + 1
      e.preventDefault()
      stops[next].focus()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      root.classList.remove('cn-menu-lock')
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  let n = 0
  const rise = () => ({ style: { '--i': n++ } as React.CSSProperties })

  return (
    <header className="cn-head" data-menu={open ? 'open' : undefined}>
      <div className="cn-wrap cn-head-in">
        <Link href="/" className="cn-display text-[22px] tracking-tight" style={{ lineHeight: 1 }}>
          Kingdom Sites
        </Link>
        <nav aria-label="Main" className="cn-nav">
          <Link href="/portfolio" className="cn-hide-sm">Portfolio</Link>
          <Link href="/about" className="cn-hide-sm">Studio</Link>
          <Link href="/mission" className="cn-hide-sm">Ministries</Link>
          <Link href={INQUIRE_PATH} className="cn-btn cn-btn-sm">
            Talk to me
          </Link>
          <button
            ref={button}
            type="button"
            className="cn-menu-btn"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="cn-menu-icon" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </nav>
      </div>

      <div
        id="site-menu"
        ref={panel}
        className="cn-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setOpen(false)
        }}
      >
        <div className="cn-wrap cn-menu-in">
          <div className="cn-menu-groups">
            {MENU.map((group) => (
              <div key={group.title}>
                <p className="cn-kicker cn-menu-rise" {...rise()}>
                  {group.title}
                </p>
                <ul className="mt-4">
                  {group.links.map((l) => (
                    <li key={l.label} className="cn-menu-rise" {...rise()}>
                      <Link
                        href={pathname === l.href && l.here ? l.here : l.href}
                        className="cn-menu-link cn-display"
                        aria-current={pathname === l.href ? 'page' : undefined}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="cn-menu-foot cn-menu-rise" {...rise()}>
            <Link href={INQUIRE_PATH} className="cn-btn">
              {INQUIRE_CTA} <span aria-hidden="true">→</span>
            </Link>
            <p className="cn-menu-small">
              <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
              {SMALL_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
              {SITE_LINKS.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener">
                  {l.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
