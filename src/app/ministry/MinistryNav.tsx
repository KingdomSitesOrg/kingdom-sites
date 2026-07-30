'use client'

import { useState } from 'react'
import Link from 'next/link'

/* The ministry pages carry their own header rather than the Kingdom Sites one,
   with the way back to the main site anchored top left. The section links
   collapse into a hamburger on phones, so there is always a menu. */

const SECTIONS = [
  { href: '#ephesians', label: 'Ephesians' },
  { href: '#covers', label: 'What it covers' },
  { href: '#bangla', label: 'Why Bangla' },
]

function MenuGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CloseGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function MinistryNav() {
  const [open, setOpen] = useState(false)

  return (
    <header>
      <nav>
        <div className="brand-row">
          <Link href="/" className="ks-anchor">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M7 2.5 3.5 6 7 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kingdom Sites
          </Link>
          <span className="brand-sep" aria-hidden="true" />
          <div className="brand">Ministry</div>
        </div>

        <div className="nav-right">
          <div className="nav-links">
            {SECTIONS.map(({ href, label }) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </div>
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <CloseGlyph /> : <MenuGlyph />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mobile-menu">
          {SECTIONS.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <span className="mobile-menu-sep" aria-hidden="true" />
          <Link href="/" onClick={() => setOpen(false)}>Kingdom Sites</Link>
          <Link href="/mission" onClick={() => setOpen(false)}>The mission</Link>
        </div>
      )}
    </header>
  )
}
