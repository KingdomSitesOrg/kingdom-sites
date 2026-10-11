import type { Metadata } from 'next'

import { Closing } from '../_home/closing'

import { Daniel } from './_about/daniel'
import { AboutHero } from './_about/hero'
import { Reaching } from './_about/name'
import { Missions, Thomas } from './_about/thomas'

const TITLE = 'About · Farzana'
const DESCRIPTION =
  'Thomas and Monisha, the story of Daniel, and the people on their hearts: Afghans and South Asians, among whom Farzana is a common name.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://farzana.app/about',
    siteName: 'Farzana',
    type: 'website',
    images: [{ url: '/farzana/farzana-film-poster.jpg', width: 1920, height: 1080 }],
  },
}

/**
 * About the people behind Farzana, not the product (that is the front page):
 * Thomas and his wife Monisha; Thomas's story, with three Latin words to try;
 * the story of Daniel, lighting beat by beat as the page scrolls; the name in
 * the scripts of the Afghans and South Asians on their hearts; the ministry
 * Farzana fuels; and the call to book.
 */
export default function AboutPage() {
  return (
    <main className="overflow-x-clip">
      <AboutHero />
      <Thomas />
      <Daniel />
      <Reaching />
      <Missions />
      <Closing />
    </main>
  )
}
