import type { Metadata } from 'next'

import { Closing } from '../_home/closing'

import { Included, PerStudent, PricingHero, Questions } from './_pricing/sections'
import { PLAN, PLAN_PRICE } from './_pricing/plan'

const TITLE = 'Pricing · Farzana'
const DESCRIPTION = `One plan, ${PLAN_PRICE} a ${PLAN.interval} for your whole school, with everything in it and none of your class fees taken.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://kingdom-sites.com/farzana/pricing',
    siteName: 'Farzana',
    type: 'website',
    images: [{ url: '/farzana/farzana-film-poster.jpg', width: 1920, height: 1080 }],
  },
}

/**
 * Farzana's pricing: one plan at one price, everything that comes in it,
 * what it works out to for each student as a school grows, the questions
 * people ask about money, and the call to book.
 */
export default function PricingPage() {
  return (
    <main className="overflow-x-clip">
      <PricingHero />
      <Included />
      <PerStudent />
      <Questions />
      <Closing />
    </main>
  )
}
