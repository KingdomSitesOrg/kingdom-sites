import { Clarity } from './_home/clarity'
import type { Metadata } from 'next'

import { Closing, Film, Meaning, Switching } from './_home/closing'
import { Families } from './_home/families'
import { Features } from './_home/features'
import { Hero } from './_home/hero'
import { LogoIntro } from './_home/intro'
import { MeetThomas } from './_home/meet-thomas'
import { OnTheGo } from './_home/on-the-go'
import { Simple } from './_home/simple'
import { Steps } from './_home/steps'
import { Story } from './_home/story'
import { INTERVAL, TIERS } from './pricing/_pricing/plan'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/**
 * What Farzana is, in the shape search engines read (schema.org): the product,
 * its three prices, and who makes it.
 */
const STRUCTURED = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Farzana',
  url: 'https://farzana.app',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  description:
    'Sell your classes, email your families and keep track of your students in one calm place, set up for you.',
  offers: TIERS.map((tier) => ({
    '@type': 'Offer',
    price: String(tier.dollars),
    priceCurrency: 'USD',
    description: `${tier.label}, per ${INTERVAL}`,
  })),
  publisher: { '@type': 'Organization', name: 'Kingdom Sites', url: 'https://kingdom-sites.com' },
}

/**
 * The Farzana marketing page, hosted here until farzana.app has a home. Built
 * to get a teacher on a call with Thomas.
 *
 * It opens on the logo writing itself in its place at the start of the top
 * bar (once per session) while the page rises in. Then the story, top to
 * bottom: one line on what Farzana is, with the call to book; the scattered
 * tools pulling together into one place as the page scrolls; everything it
 * does; who it is for, with a week's chores emptying themselves; the clarity
 * guarantee, with a typical screen and Farzana's to drag between; the phone
 * doing four everyday jobs; three steps; what students and parents see; switching from another
 * provider; what the name means; the film; Thomas, who you talk to on the
 * call; and the call to book once more.
 *
 * The same page lives in the Farzana app (KingdomSitesOrg/edu, `src/app/(site)`),
 * where it also carries Create account and Sign in.
 */
export default function FarzanaPage() {
  return (
    <main className="overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }}
      />
      <LogoIntro />
      <Hero />
      <Story />
      <Features />
      <Simple />
      <Clarity />
      <OnTheGo />
      <Steps />
      <Families />
      <Switching />
      <Meaning />
      <Film />
      <MeetThomas />
      <Closing />
    </main>
  )
}
