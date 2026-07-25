'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

const NAV_LINKS = [
  { to: '/my-work', label: 'My Work' },
  { to: '/about',   label: 'About' },
  { to: '/why-us',  label: 'Why Kingdom Sites' },
  { to: '/mission', label: 'Mission' },
]

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function Header() {
  const pathname  = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [pathname])

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50">
      <div
        className="transition-all duration-300"
        style={{
          background: scrolled || menuOpen ? 'rgba(255, 255, 255, 0.82)' : 'transparent',
          backdropFilter: scrolled || menuOpen ? 'saturate(180%) blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled || menuOpen ? 'saturate(180%) blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(21,24,29,0.09)' : '1px solid transparent',
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-ink">
              <span
                className="grid h-6 w-6 place-items-center rounded-[7px] text-[13px] font-bold text-white"
                style={{ background: 'var(--color-accent)' }}
                aria-hidden="true"
              >
                K
              </span>
              Kingdom Sites
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to} href={to}
                  className={`text-[13.5px] transition-colors duration-200 ${
                    isActive(to) ? 'font-medium text-ink' : 'text-body hover:text-ink'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center">
            <a href={CONTACT_MAILTO} className="btn-sm">Email me</a>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center text-ink md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            boxShadow: '0 12px 28px rgba(16,23,37,0.10)',
          }}
        >
          <div className="mx-auto max-w-6xl px-5 pb-5 pt-2 sm:px-8">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to} href={to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-[15px] transition ${
                    isActive(to)
                      ? 'bg-surface-2 font-medium text-ink'
                      : 'text-body hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-3 border-t border-line pt-4">
              <a
                href={CONTACT_MAILTO}
                onClick={() => setMenuOpen(false)}
                className="btn-primary w-full"
              >
                Email me
              </a>
              <p className="mt-3 text-center text-xs text-muted">{CONTACT_EMAIL}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
