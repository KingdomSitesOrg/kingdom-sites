'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

/* The individual projects, shown in the menu that opens under My Work. */
const WORK_LINKS = [
  { to: '/my-work',       label: 'All my work',   desc: 'Everything I’ve designed and shipped' },
  { to: '/ruta',          label: 'Ruta',          desc: 'Service management platform · case study' },
  { to: '/tap-to-tick',   label: 'Tap to Tick',   desc: 'A frictionless expense tracker for iPhone' },
  { to: '/jam-with-latin',label: 'Latin practice game',desc: 'Classical Latin as a Roman quest' },
  { to: '/ai-tooling',    label: 'AI tooling',    desc: 'Setting up teams new to AI' },
]

const NAV_LINKS = [
  { to: '/my-work',  label: 'My Work', children: WORK_LINKS },
  { to: '/ministry', label: 'Ministry' },
  { to: '/about',    label: 'About' },
  { to: '/why-us',   label: 'Why Kingdom Sites' },
  { to: '/mission',  label: 'Mission' },
]

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
  const [workOpen, setWorkOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [pathname])

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  const openWork = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setWorkOpen(true)
  }

  // A short delay so crossing the small gap between the link and the panel
  // doesn't dismiss it mid-movement.
  const closeWork = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setWorkOpen(false), 140)
  }

  const isActive = (path: string) => pathname === path

  // My Work stays highlighted while the visitor is on one of its projects.
  const workActive = WORK_LINKS.some(({ to }) => pathname === to)

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
            <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
              Kingdom Sites
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              {NAV_LINKS.map(({ to, label, children }) =>
                children ? (
                  <div
                    key={to}
                    className="relative"
                    onMouseEnter={openWork}
                    onMouseLeave={closeWork}
                    onFocus={openWork}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setWorkOpen(false)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Escape') setWorkOpen(false) }}
                  >
                    <Link
                      href={to}
                      aria-expanded={workOpen}
                      className={`flex items-center gap-1.5 text-[13.5px] transition-colors duration-200 ${
                        workActive || workOpen ? 'font-medium text-ink' : 'text-body hover:text-ink'
                      }`}
                    >
                      {label}
                      <ChevronIcon open={workOpen} />
                    </Link>

                    {/* The padding is the hover bridge between the link and the panel. */}
                    <div
                      className={`absolute left-1/2 top-full w-[286px] -translate-x-1/2 pt-3 transition-all duration-150 ${
                        workOpen
                          ? 'visible translate-y-0 opacity-100'
                          : 'invisible -translate-y-1 opacity-0'
                      }`}
                    >
                      <div
                        className="overflow-hidden rounded-2xl p-1.5"
                        style={{
                          background: 'rgba(255, 255, 255, 0.97)',
                          backdropFilter: 'saturate(180%) blur(20px)',
                          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                          border: '1px solid rgba(21,24,29,0.09)',
                          boxShadow: '0 16px 40px rgba(16,23,37,0.14)',
                        }}
                      >
                        {WORK_LINKS.map((item) => (
                          <Link
                            key={item.to}
                            href={item.to}
                            tabIndex={workOpen ? 0 : -1}
                            onClick={() => setWorkOpen(false)}
                            className={`block rounded-xl px-3 py-2.5 transition-colors ${
                              isActive(item.to) ? 'bg-surface-2' : 'hover:bg-surface-2'
                            }`}
                          >
                            <span className="block text-[13.5px] font-medium text-ink">{item.label}</span>
                            <span className="mt-0.5 block text-[12px] leading-snug text-muted">{item.desc}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={to} href={to}
                    className={`text-[13.5px] transition-colors duration-200 ${
                      isActive(to) ? 'font-medium text-ink' : 'text-body hover:text-ink'
                    }`}
                  >
                    {label}
                  </Link>
                )
              )}
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
              {NAV_LINKS.map(({ to, label, children }) => (
                <div key={to}>
                  <Link
                    href={to}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-[15px] transition ${
                      isActive(to)
                        ? 'bg-surface-2 font-medium text-ink'
                        : 'text-body hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    {label}
                  </Link>

                  {/* No hover on a phone, so the projects sit under My Work openly. */}
                  {children && (
                    <div className="mb-1 ml-4 flex flex-col gap-0.5 border-l border-line pl-3">
                      {children
                        .filter((item) => item.to !== to)
                        .map((item) => (
                          <Link
                            key={item.to}
                            href={item.to}
                            onClick={() => setMenuOpen(false)}
                            className={`rounded-lg px-3 py-2 text-[14px] transition ${
                              isActive(item.to)
                                ? 'bg-surface-2 font-medium text-ink'
                                : 'text-body hover:bg-surface-2 hover:text-ink'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
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
