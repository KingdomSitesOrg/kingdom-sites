import type { Metadata } from 'next'
import './tap-to-tick.css'

export const metadata: Metadata = {
  title: 'Tap to Tick — an easy way to log and track transactions',
  description:
    'Tap to Tick is a dead-simple iPhone budget: log any transaction in two taps — including the cash in your pocket. Free to use; Advanced adds iCloud sharing and an AI money coach for $4.99 a month.',
  alternates: { canonical: '/tap-to-tick' },
  openGraph: {
    title: 'Tap to Tick',
    description: 'An easy way to log and track transactions — including cash.',
    url: 'https://kingdom-sites.com/tap-to-tick',
    siteName: 'Tap to Tick',
    locale: 'en_US',
    type: 'website',
  },
}

export default function TapToTickLayout({ children }: { children: React.ReactNode }) {
  // The app's site uses the system font stack, so there is no web font to load.
  return <div className="ttt">{children}</div>
}
