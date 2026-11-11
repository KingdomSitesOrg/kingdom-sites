import type { Metadata, Viewport } from 'next'
import MuralHome from './concepts/mural/_components/Home'
import MuralRoot from './concepts/mural/_components/Root'
import { SHARE_URL, SITE_DESCRIPTION as DESCRIPTION, SITE_OG_IMAGE, SITE_TITLE } from '@/lib/seo'

/* The home page: the mural (Thomas, 2026-11-11). The page itself lives with the
   concept it grew from, in src/app/concepts/mural. The home page it replaced, the
   dark room with the laptop film, is kept beside this file as _classic-home.tsx.txt. */

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_TITLE,
    description: DESCRIPTION,
    url: SHARE_URL,
    siteName: 'Kingdom Sites',
    locale: 'en_US',
    type: 'website',
    images: [{ ...SITE_OG_IMAGE, url: `${SHARE_URL}${SITE_OG_IMAGE.url}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: DESCRIPTION,
    images: [`${SHARE_URL}${SITE_OG_IMAGE.url}`],
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0C12',
  viewportFit: 'cover',
}

export default function Home() {
  return (
    <MuralRoot>
      <MuralHome />
    </MuralRoot>
  )
}
