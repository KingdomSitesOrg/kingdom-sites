import type { Metadata } from 'next'
import './jam-with-latin.css'

export const metadata: Metadata = {
  title: 'Jam with Latin — learn Latin the Roman way',
  description:
    'A Roman-legion Latin game for homeschool and classical students: march from Rōma to Gaul learning declensions, verb endings, and real Latin sentences. Built with Expo and Supabase by Kingdom Sites.',
  alternates: { canonical: '/jam-with-latin' },
  openGraph: {
    title: 'Jam with Latin',
    description: 'March from Rōma to Gaul and learn real Latin along the way.',
    url: 'https://kingdom-sites.com/jam-with-latin',
    siteName: 'Jam with Latin',
    locale: 'en_US',
    type: 'website',
  },
}

export default function JamWithLatinLayout({ children }: { children: React.ReactNode }) {
  // The app's own Roman identity, so no Kingdom Sites header or footer here.
  return <div className="jwl">{children}</div>
}
