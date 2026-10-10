import type { Metadata } from 'next'

import { Closing } from '../_home/closing'

import { Clarity } from './_about/clarity'
import { Daniel } from './_about/daniel'
import { AboutHero } from './_about/hero'
import { OnTheGo } from './_about/mobile'
import { Missions, Thomas } from './_about/thomas'

const TITLE = 'About · Farzana'
const DESCRIPTION =
  'Farzana is built from the ground up to be affordable and easy to use, for teachers who just want their classes done.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://kingdom-sites.com/farzana/about',
    siteName: 'Farzana',
    type: 'website',
    images: [{ url: '/farzana/farzana-film-poster.jpg', width: 1920, height: 1080 }],
  },
}

/**
 * About Farzana, told with things to touch rather than paragraphs: a week's
 * list of chores emptying itself; the clarity guarantee, with a typical
 * screen and Farzana's to drag between; the phone doing four everyday jobs;
 * the story of Daniel, lighting beat by beat as the page scrolls; Thomas,
 * with three Latin words to try; his heart for missions; and the call to book.
 */
export default function AboutPage() {
  return (
    <main className="overflow-x-clip">
      <AboutHero />
      <Clarity />
      <OnTheGo />
      <Daniel />
      <Thomas />
      <Missions />
      <Closing />
    </main>
  )
}
