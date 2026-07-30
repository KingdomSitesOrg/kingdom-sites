import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ruta — what I built in a live service-management platform',
  description:
    'A case study: Ruta is service-management software for landscaping and maintenance businesses. Since April 2026 I have merged 350+ pull requests across its office web app, crew app for iPhone and Android, customer portal, and AWS backend.',
  alternates: { canonical: '/ruta' },
  openGraph: {
    title: 'Ruta — a case study',
    description:
      'What I have shipped inside Ruta: billing, the field app, the office web app, the customer portal, and the AWS backend behind them.',
    url: 'https://kingdom-sites.com/ruta',
    siteName: 'Kingdom Sites',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RutaLayout({ children }: { children: React.ReactNode }) {
  // Unlike the Tap to Tick and Jam with Latin pages, this one is a case study
  // rather than a product page, so it keeps the Kingdom Sites look and chrome.
  return <>{children}</>
}
