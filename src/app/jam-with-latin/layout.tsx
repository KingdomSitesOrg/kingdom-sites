import type { Metadata } from 'next'
import './jam-with-latin.css'

export const metadata: Metadata = {
  title: 'A Latin practice game — learn Latin the Roman way',
  description:
    'A Roman-legion Latin practice game for homeschool and classical students: march from Rōma to Gaul learning declensions, verb endings, and real Latin sentences. Designed and built by Kingdom Sites.',
  alternates: { canonical: '/jam-with-latin' },
  openGraph: {
    title: 'A Latin practice game',
    description: 'March from Rōma to Gaul and learn real Latin along the way.',
    url: 'https://kingdom-sites.com/jam-with-latin',
    siteName: 'Latin practice game',
    locale: 'en_US',
    type: 'website',
  },
}

export default function JamWithLatinLayout({ children }: { children: React.ReactNode }) {
  // The app's own Roman identity, so no Kingdom Sites header or footer here.
  return <div className="jwl">{children}</div>
}
