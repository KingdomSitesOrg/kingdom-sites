import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './farzana.css'

/* Farzana's display face, Reem Kufi (SIL OFL), self-hosted as a Latin subset. */
const reemKufi = localFont({
  src: './fonts/reem-kufi-latin.woff2',
  weight: '400 700',
  display: 'swap',
  variable: '--font-reem-kufi',
})

const TITLE = 'Farzana — all of your tools in one place'
const DESCRIPTION = 'Sell classes, email your families and keep track of every student and parent, all in one place.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  /* Unlisted: anyone with the link can watch, but it is kept out of search,
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

export default function FarzanaLayout({ children }: { children: React.ReactNode }) {
  // Farzana's own look, so no Kingdom Sites header or footer here.
  return <div className={`farzana ${reemKufi.variable}`}>{children}</div>
}
