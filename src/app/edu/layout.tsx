import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './edu.css'

/* Edu's own typeface, the same self-hosted file as the Edu landing page. */
const fredoka = localFont({
  src: './fonts/fredoka-latin.woff2',
  weight: '300 700',
  display: 'swap',
  variable: '--font-fredoka',
})

const TITLE = 'Edu — your whole classroom, in one place'
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
    url: 'https://kingdom-sites.com/edu',
    siteName: 'Edu',
    locale: 'en_US',
    type: 'video.other',
    images: [{ url: '/edu/edu-45s-poster.jpg', width: 1920, height: 1080, alt: 'Edu. Teaching is the easy part. Edu does the rest.' }],
    videos: [{ url: '/edu/edu-45s.mp4', type: 'video/mp4', width: 1920, height: 1080 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/edu/edu-45s-poster.jpg'],
  },
}

export default function EduLayout({ children }: { children: React.ReactNode }) {
  // Edu's warm studio look, so no Kingdom Sites header or footer here.
  return <div className={`edu ${fredoka.variable}`}>{children}</div>
}
