'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'

/* The individual projects, shown in the menu that opens under My Work. */
const WORK_LINKS = [
  { to: '/my-work',       label: 'All my work',   desc: 'Everything I’ve designed and shipped' },
  { to: '/ruta',          label: 'Ruta',          desc: 'Software that runs landscaping companies' },
  { to: '/tap-to-tick',   label: 'Tap to Tick',   desc: 'A frictionless expense tracker for iPhone' },
  { to: '/latin-game',    label: 'Latin practice game', desc: 'Classical Latin as a Roman quest' },
  { to: '/ai-tooling',    label: 'AI tooling',    desc: 'AI wired into real products and workflows' },
]

const NAV_LINKS = [
  { to: '/#pricing',    label: 'Pricing' },
  { to: '/ai-tooling',  label: 'AI' },
  { to: '/my-work',     label: 'My Work', children: WORK_LINKS },
  { to: '/about',       label: 'Team' },
  { to: '/mission',     label: 'Mission' },
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

/* Marks a link that opens in its own tab. */
function ArrowOutIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4 8 8 4M8 4H4.8M8 4v3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
  /* Which drop-down is showing, held by the nav item it belongs to — there is
     more than one now, so a plain open/closed flag will not do. */
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [pathname])

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  /* While the phone menu is open the page underneath must not move: it is a
     full screen of its own, not a panel resting on top of a page you can still
     scroll away behind it. */
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [menuOpen])

  const open = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(key)
  }

  // A short delay so crossing the small gap between the link and the panel
  // doesn't dismiss it mid-movement.
  const close = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140)
  }

  const isActive = (path: string) => {
    const base = path.split('#')[0]
    return pathname === base
  }

  // A nav item with a menu stays highlighted while the visitor is on one of its
  // pages — so My Work stays lit on a project page.
  // Hash-only paths under `/` are not used as section roots (would light everything).
  const sectionActive = (children: { to: string }[]) =>
    children.some(({ to }) => {
      const base = to.split('#')[0]
      if (base === '/') return false
      return pathname === base || pathname?.startsWith(base + '/')
    })

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
            <nav className="hidden items-center gap-6 lg:flex">
              {NAV_LINKS.map(({ to, label, children }) =>
                children ? (
                  <div
                    key={to}
                    className="relative"
                    onMouseEnter={() => open(to)}
                    onMouseLeave={close}
                    onFocus={() => open(to)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenMenu(null)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Escape') setOpenMenu(null) }}
                  >
                    <Link
                      href={to}
                      aria-expanded={openMenu === to}
                      className={`flex items-center gap-1.5 text-[13.5px] transition-colors duration-200 ${
                        sectionActive(children) || openMenu === to
                          ? 'font-medium text-ink'
                          : 'text-body hover:text-ink'
                      }`}
                    >
                      {label}
                      <ChevronIcon open={openMenu === to} />
                    </Link>

                    {/* The padding is the hover bridge between the link and the panel. */}
                    <div
                      className={`absolute -left-3 top-full w-[286px] pt-3 transition-all duration-150 ${
                        openMenu === to
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
                        {children.map((item) => (
                          <Link
                            key={item.to}
                            href={item.to}
                            tabIndex={openMenu === to ? 0 : -1}
                            onClick={() => setOpenMenu(null)}
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

          <div className="hidden items-center gap-5 lg:flex">
            {/* Their own tabs — ministry and prayer are their own places. */}
            <a
              href="/ministry"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 text-[13.5px] text-body transition-colors duration-200 hover:text-ink"
            >
              Ministry
              <ArrowOutIcon />
            </a>
            <a
              href="/prayer"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 text-[13.5px] text-body transition-colors duration-200 hover:text-ink"
            >
              Prayer
              <ArrowOutIcon />
            </a>
            <Link href={INQUIRE_PATH} className="btn-sm">{INQUIRE_CTA}</Link>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center text-ink lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="mobile-menu-panel lg:hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            boxShadow: '0 12px 28px rgba(16,23,37,0.10)',
          }}
        >
          <div className="mx-auto max-w-6xl px-5 pb-10 pt-2 sm:px-8">
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

                  {/* No hover on a phone, so child links sit under the parent openly. */}
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

            <a
              href="/ministry"
              target="_blank"
              rel="noopener"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] text-body transition hover:bg-surface-2 hover:text-ink"
            >
              Ministry
              <ArrowOutIcon />
            </a>
            <a
              href="/prayer"
              target="_blank"
              rel="noopener"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] text-body transition hover:bg-surface-2 hover:text-ink"
            >
              Prayer
              <ArrowOutIcon />
            </a>

            <div className="mt-3 border-t border-line pt-4">
              <Link
                href={INQUIRE_PATH}
                onClick={() => setMenuOpen(false)}
                className="btn-primary w-full"
              >
                {INQUIRE_CTA}
              </Link>
              <p className="mt-3 text-center text-xs text-muted">
                <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
