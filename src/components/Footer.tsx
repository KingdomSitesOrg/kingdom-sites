import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

const FACEBOOK_URL = 'https://www.facebook.com/share/1EzdtfSCs3/?mibextid=wwXIfr'

const PAGE_LINKS = [
  { href: '/',        label: 'Home' },
  { href: '/my-work', label: 'My Work' },
  { href: '/ministry', label: 'Ministry' },
  { href: '/about',   label: 'About' },
  { href: '/mission', label: 'Mission' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms',   label: 'Terms' },
]

export default function Footer() {
  return (
    <footer className="band-dark">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 sm:items-start">
          <div>
            <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Have a project in mind?
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">
              Send me a note about what you need. I read every message myself and reply with a
              scoped quote.
            </p>
            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
              <a href={CONTACT_MAILTO} className="btn-primary">Email me</a>
              <a href={CONTACT_MAILTO} className="text-sm text-white/75 underline underline-offset-4 hover:text-white">
                {CONTACT_EMAIL}
              </a>
            </div>

            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-8h2.8l.4-3.2h-3.2V7.7c0-.9.3-1.6 1.6-1.6h1.7V3.2C16.4 3.1 15.5 3 14.4 3c-2.3 0-3.9 1.4-3.9 4.1v2.7H7.7V13h2.8v8h3z" />
              </svg>
              Follow on Facebook
            </a>
          </div>

          <div className="sm:justify-self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/45">Pages</p>
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2.5">
              {PAGE_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-white/65 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/12 pt-6">
          <p className="text-xs leading-relaxed text-white/45">
            Kingdom Sites — websites, mobile apps, and custom software, quoted to your project.
            Copyright © {new Date().getFullYear()} Kingdom Sites. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
