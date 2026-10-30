import type { Metadata } from 'next'
import { JAM_LEGIO_LD, SHARE_URL, jsonLd } from '@/lib/seo'
import './latin-game.css'

export const metadata: Metadata = {
  title: 'JAM Legio — a Latin game for homeschool and classical students',
  description:
    'JAM Legio is a Latin vocabulary game for iPhone and Android, for homeschool and classical students: march a Roman legion from Rōma to Gallia learning declensions, verb endings and real Latin sentences. Made in partnership with JAM with Latin, with graphics by JAM with Latin’s own designers.',
  alternates: { canonical: '/latin-game' },
  openGraph: {
    title: 'JAM Legio — a Latin game',
    description: 'March from Rōma to Gallia and learn real Latin along the way.',
    url: `${SHARE_URL}/latin-game`,
    siteName: 'JAM Legio',
    locale: 'en_US',
    type: 'website',
    images: [{ url: `${SHARE_URL}/latin-game/share-card.png`, width: 1200, height: 630, alt: 'JAM Legio — march from Rōma to Gallia and learn real Latin' }],
  },
}

export default function LatinGameLayout({ children }: { children: React.ReactNode }) {
  // The app's own Roman identity, so no Kingdom Sites header or footer here.
  return (
    <div className="lgame">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JAM_LEGIO_LD) }} />
      {children}
    </div>
  )
}
