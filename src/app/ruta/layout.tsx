import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ruta — service management from prospect to payment',
  description:
    'Ruta is service-management software for landscaping and maintenance businesses: rate requests, crew routing, an offline-first field app, a customer portal, and automatic invoicing. A production platform I helped build, across the web app, the AWS backend, and the iOS crew app.',
  alternates: { canonical: '/ruta' },
  openGraph: {
    title: 'Ruta — One platform. Prospect to payment.',
    description:
      'Scheduling, crews, billing, and customers in one place for landscaping and maintenance businesses.',
    url: 'https://kingdom-sites.com/ruta',
    siteName: 'Ruta',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RutaLayout({ children }: { children: React.ReactNode }) {
  // Ruta has its own dark-green identity, so this page renders without the
  // Kingdom Sites header and footer, the same as the other product pages.
  return <div className="min-h-screen bg-[#0a1f0a] text-white">{children}</div>
}
