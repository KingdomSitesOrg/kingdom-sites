import type { Metadata } from 'next'
import './tap-to-tick.css'
import { TAP_TO_TICK_LD, jsonLd, SHARE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Tap to Tick — an easy way to log and track transactions',
  description:
    'Tap to Tick is a frictionless iPhone expense tracker: log any transaction in two taps — including the cash in your pocket. Everything is free, including a shared ledger for two people over iCloud.',
  alternates: { canonical: '/tap-to-tick' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Tap to Tick',
    description: 'An easy way to log and track transactions — including cash.',
    url: `${SHARE_URL}/tap-to-tick`,
    siteName: 'Tap to Tick',
    locale: 'en_US',
    type: 'website',
    images: [{ url: `${SHARE_URL}/tap-to-tick/opengraph-image`, width: 1200, height: 630 }],
  },
}

export default function TapToTickLayout({ children }: { children: React.ReactNode }) {
  // The app's site uses the system font stack, so there is no web font to load.
  return (
    <div className="ttt">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(TAP_TO_TICK_LD) }} />
      {children}
    </div>
  )
}
