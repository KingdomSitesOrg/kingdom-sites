import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ruta — contract work',
  description:
    'Ruta is service-management software for landscaping businesses. I work as a contractor on the team. This page notes the areas I have participated in. The product belongs to Ruta.',
  alternates: { canonical: '/ruta' },
  openGraph: {
    title: 'Ruta — contract work',
    description:
      'A short note on contract work I have participated in at Ruta. I did not start the company, and the product is not mine.',
    url: 'https://kingdom-sites.com/ruta',
    siteName: 'Kingdom Sites',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RutaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
