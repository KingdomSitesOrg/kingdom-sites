import Link from 'next/link'
import { INQUIRE_CTA, INQUIRE_PATH, SALES_NAME } from '@/lib/contact'

const FACEBOOK_URL = 'https://www.facebook.com/share/1EzdtfSCs3/?mibextid=wwXIfr'
const YOUTUBE_URL = 'https://www.youtube.com/@tkklein/videos'

const PAGE_LINKS = [
  { href: '/#pricing', label: 'Pricing' },
  { href: '/software', label: 'Custom Software' },
  { href: INQUIRE_PATH, label: 'Enquiry' },
  { href: '/my-work', label: 'My Work' },
  { href: '/ai-tooling', label: 'AI tooling' },
  { href: '/seo', label: 'Websites & SEO' },
  { href: '/about', label: 'Team' },
  { href: '/mission', label: 'Mission' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
]

export default function Footer() {
  return (
    <footer className="band-dark">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 sm:items-start">
          <div>
            <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Building a product that needs an owner?
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">
              Product ownership retainers for custom software — send an enquiry about what you are
              shipping. Sales is {SALES_NAME}; engineering is Thomas.
            </p>
            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Link href={INQUIRE_PATH} className="btn-primary">
                {INQUIRE_CTA}
              </Link>
            </div>

            <div className="mt-5 flex flex-col items-start gap-3">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 21v-8h2.8l.4-3.2h-3.2V7.7c0-.9.3-1.6 1.6-1.6h1.7V3.2C16.4 3.1 15.5 3 14.4 3c-2.3 0-3.9 1.4-3.9 4.1v2.7H7.7V13h2.8v8h3z" />
                </svg>
                Follow on Facebook
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.75 15.5v-7l6.5 3.5-6.5 3.5Z" />
                </svg>
                YouTube channel
              </a>
            </div>
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
              {/* Open in their own tabs, like they do in the header. */}
              <a
                href="/ministry"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1.5 text-sm text-white/65 transition-colors hover:text-white"
              >
                Ministry
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M4 8 8 4M8 4H4.8M8 4v3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="/prayer"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1.5 text-sm text-white/65 transition-colors hover:text-white"
              >
                Prayer
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M4 8 8 4M8 4H4.8M8 4v3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/12 pt-6">
          <p className="text-xs leading-relaxed text-white/45">
            Kingdom Sites — product ownership for custom software. Copyright ©{' '}
            {new Date().getFullYear()} Kingdom Sites. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
