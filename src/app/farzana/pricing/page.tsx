import type { Metadata } from 'next'

import { Closing } from '../_home/closing'

import { INTERVAL, TIERS } from './_pricing/plan'
import { Included, Lifetime, PaysForItself, PricingHero, Questions } from './_pricing/sections'

const TITLE = 'Pricing · Farzana'
const DESCRIPTION = `Priced by how many students you teach, from $${TIERS[0].dollars} a ${INTERVAL}. Every feature and setup at every size, and none of your class fees taken.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://farzana.app/pricing',
    siteName: 'Farzana',
    type: 'website',
    images: [{ url: '/farzana/farzana-film-poster.jpg', width: 1920, height: 1080 }],
  },
}

/**
 * Farzana's pricing: three sizes by number of students, picked with a
 * slider; paying once for life, for schools that sign up in 2027; how few
 * class sales a month pay for it; everything that comes in
 * it; the questions people ask about money; and the call to book.
 */
export default function PricingPage() {
  return (
    <main className="overflow-x-clip">
      <PricingHero />
      <Lifetime />
      <PaysForItself />
      <Included />
      <Questions />
      <Closing />
    </main>
  )
}
