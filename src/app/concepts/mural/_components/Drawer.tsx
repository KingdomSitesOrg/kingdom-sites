'use client'

import Link from 'next/link'
import { useEffect, useId, useState, useSyncExternalStore } from 'react'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { play, setSound, soundOn, watchSound } from '../_lib/sound'

/* The header's menu on a phone or tablet, where there is no room for the
   links (Thomas, 2026-11-11). Its button is nine tiles, three by three (four
   read as the Windows logo); pressed, they spread apart, the corners take the
   page's colours, and the menu drops out of the header. It closes on a
   link, on Escape and on a tap outside. The Sound switch is in it on a
   phone, where the header has no room for it.

   It holds every item the site's menu had before the mural look, with the
   same labels, groups and destinations (Thomas, 2026-11-12), on a desktop
   too: the two groups, the call, the email address, the small links, and the
   three sites that open in a new tab. */

const MENU = [
  {
    title: 'Portfolio',
    links: [
      { href: '/portfolio', label: 'Full portfolio' },
      { href: '/portfolio/farzana-classroom', label: 'Farzana Classroom' },
      { href: '/ruta', label: 'Ruta' },
      { href: '/tap-to-tick', label: 'Tap to Tick' },
      { href: '/latin-game', label: 'JAM Legio' },
      { href: '/portfolio/kcupg', label: 'KCUPG' },
      { href: '/portfolio/delta', label: 'Delta' },
    ],
  },
  {
    title: 'Studio',
    links: [
      { href: '/about', label: 'About' },
      { href: '/mission', label: 'Mission' },
      { href: '/ai-tooling', label: 'AI consultation' },
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

export default function Drawer() {
  const [open, setOpen] = useState(false)
  const id = useId()
  const sound = useSyncExternalStore(watchSound, soundOn, () => true)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="mu-drawer-btn"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((v) => !v)
          play('flip')
        }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} />
        ))}
      </button>
      <div className="mu-drawer-shade" hidden={!open} onClick={() => setOpen(false)} aria-hidden="true" />
      <nav id={id} className="mu-drawer" hidden={!open} aria-label="Menu">
        <div className="mu-drawer-groups">
          {MENU.map((group) => (
            <div key={group.title}>
              <p className="mu-drawer-kicker">{group.title}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} data-snap onClick={() => setOpen(false)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href={INQUIRE_PATH} className="mu-btn mu-drawer-cta" data-snap onClick={() => setOpen(false)}>
          {INQUIRE_CTA} <span aria-hidden="true">→</span>
        </Link>
        <p className="mu-drawer-small">
          <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
          {SMALL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {SITE_LINKS.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener">
              {l.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </p>
        <button type="button" className="mu-sound" aria-pressed={sound} data-snap onClick={() => setSound(!sound)}>
          <span className="mu-sound-label">Sound</span>
          <span className="mu-sound-track" aria-hidden="true">
            <i />
          </span>
        </button>
      </nav>
    </>
  )
}
