import type { Metadata } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import localFont from 'next/font/local'
import Link from 'next/link'

import { INTRO_SCRIPT } from './_home/intro-script'
import { buttonClass } from './_ui/button'
import { BOOK_PATH } from './_ui/contact'
import { HeaderChrome } from './_ui/header-chrome'
import { ThemeToggle } from './_ui/theme'
import { THEME_SCRIPT } from './_ui/theme-script'
import { Wordmark } from './_ui/wordmark'
import './farzana.css'

/* Farzana's display face, Reem Kufi (SIL OFL), self-hosted as a Latin subset. */
const reemKufi = localFont({
  src: './fonts/reem-kufi-latin.woff2',
  weight: '400 700',
  display: 'swap',
  variable: '--font-reem-kufi',
})

/* Everything people read: IBM Plex Sans Arabic, at 400, 500 and 600 only. */
const plex = IBM_Plex_Sans_Arabic({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plex',
})

const TITLE = 'Farzana — your whole classroom, in one place'
const DESCRIPTION =
  'Sell your classes, email your families and keep track of your students, all in one place. Book a 15-minute call.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  /* Unlisted: anyone with the link can visit, but it is kept out of search,
     out of the sitemap and out of the site's navigation. */
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://kingdom-sites.com/farzana',
    siteName: 'Farzana',
    locale: 'en_US',
    type: 'video.other',
    images: [{ url: '/farzana/farzana-film-poster.jpg', width: 1920, height: 1080, alt: 'Farzana. Go to kingdom-sites.com/edu' }],
    // Next resolves og:image against metadataBase but not og:video, which must be absolute.
    videos: [{ url: 'https://kingdom-sites.com/farzana/farzana-film.mp4', type: 'video/mp4', width: 1920, height: 1080 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/farzana/farzana-film-poster.jpg'],
  },
}

/** The bar's way round the page. Wide screens only. */
const SECTIONS = [
  { href: '/farzana#features', label: 'Features' },
  { href: '/farzana#how-it-works', label: 'How it works' },
  { href: '/farzana#film', label: 'The film' },
]

/**
 * The frame around the Farzana pages — the page itself and /farzana/book —
 * in Farzana's own look, so no Kingdom Sites header or footer here. The bar
 * holds the logo, the sun-and-moon switch and the one filled button, Book a
 * call.
 *
 * Farzana's colours, type and corners are set on the `.farzana` wrapper
 * (farzana.css), so they reach this page and nothing else on the site. The
 * two scripts run before the first paint: the saved light or dark choice, and
 * whether the logo writes itself in the bar (`_home/intro.tsx`). The bar's logo
 * carries `#site-logo`, which is the spot the logo writes itself in.
 */
export default function FarzanaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`farzana flex min-h-dvh flex-col ${reemKufi.variable} ${plex.variable}`}
      // The theme script sets data-theme before React arrives.
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <header className="sticky top-0 z-40 isolate">
        <HeaderChrome />
        <nav className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* The logo is the way back to the top; its accessible name is "Farzana". */}
          <Link id="site-logo" href="/farzana" className="flex min-h-11 items-center">
            <Wordmark className="text-[26px]" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="me-2 hidden items-center gap-1 md:flex">
              {SECTIONS.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className={buttonClass({ variant: 'ghost', size: 'sm' })}
                >
                  {section.label}
                </Link>
              ))}
            </div>
            <ThemeToggle />
            <Link href={BOOK_PATH} className={buttonClass({ size: 'sm' })}>
              Book a call
            </Link>
          </div>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Wordmark className="text-[26px]" />
            <p className="text-caption">Intelligent software, learned students.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={BOOK_PATH} className={QUIET}>
              Book a call
            </Link>
            <Link href="/privacy" className={QUIET}>
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** A quiet control: a soft chip that darkens under the pointer, never bare words. */
const QUIET =
  'inline-flex min-h-11 items-center gap-2 rounded-sm bg-wash px-4 py-2 text-sm font-medium text-heading no-underline transition-colors hover:bg-wash-strong'
