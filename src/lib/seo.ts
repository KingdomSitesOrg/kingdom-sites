/**
 * Structured data (schema.org JSON-LD) that tells search engines who Kingdom
 * Sites is, who Thomas is, and what the apps are. Facts only, each one taken
 * from the page it describes: no street address, phone number, opening hours
 * or star ratings, because none of those are published anywhere on the site.
 */
import { AREA_SERVED, SERVICE_CITY, SERVICE_COUNTRY, SERVICE_REGION_CODE } from '@/lib/local'
import { LATIN_STORES } from '@/lib/work'

export const SITE_URL = 'https://kingdom-sites.com'
export const SITE_NAME = 'Kingdom Sites'
/* The address a share card is built on. A preview build is shared under the
   preview address, so its title and picture come from the address people share.
   Production and everything else keep SITE_URL. */
export const SHARE_URL = process.env.VERCEL_ENV === 'preview' ? 'https://preview.kingdom-sites.com' : SITE_URL

/* The share picture every page falls back to (src/app/opengraph-image.jpg).
   A page that declares its own `openGraph` replaces the inherited one, picture
   included, so those pages list this one again. */
export const SITE_OG_IMAGE = {
  url: '/opengraph-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Kingdom Sites — Made to be used. Made to be yours.',
}

/* The home page's title in search results: what the business does and where,
   in the words people search for (T-387). The visible headline stays "Made to
   be used. Made to be yours." */
export const SITE_TITLE = 'Kingdom Sites — Websites and apps for businesses, Rochester MN'

/* The home page's description. The root layout uses it too, as the fallback
   for any page without its own, so the business reads the same everywhere. */
export const SITE_DESCRIPTION =
  'Websites, iPhone and Android apps and AI consultation for businesses, churches and anyone who needs software, built by Thomas Klein in Rochester, MN.'

/* The studio's own profiles, as the footer links them. */
export const SAME_AS = ['https://www.facebook.com/share/1EzdtfSCs3/?mibextid=wwXIfr', 'https://www.youtube.com/@tkklein']

const ORG_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`
const PERSON_ID = `${SITE_URL}/about#thomas`

export const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': ORG_ID,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  email: 'thomas@kingdom-sites.com',
  image: `${SITE_URL}${SITE_OG_IMAGE.url}`,
  logo: `${SITE_URL}/marketing/logo-mark.png`,
  sameAs: SAME_AS,
  /* City and state only: the base is Rochester, Minnesota (T-376); there is no
     public street address. */
  address: {
    '@type': 'PostalAddress',
    addressLocality: SERVICE_CITY,
    addressRegion: SERVICE_REGION_CODE,
    addressCountry: SERVICE_COUNTRY,
  },
  founder: { '@type': 'Person', '@id': PERSON_ID, name: 'Thomas Klein' },
  serviceType: [
    'Website design and development',
    'iPhone and Android app development',
    'Custom software development',
    'AI consultation',
  ],
  areaServed: AREA_SERVED,
}

/* The site itself, on the home page, so Google shows "Kingdom Sites" as the
   site's name in results instead of the address (T-387). */
export const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  alternateName: ['kingdom-sites.com'],
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  inLanguage: 'en-US',
  publisher: { '@id': ORG_ID },
}

/* Thomas, as the About page describes him. */
export const PERSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Thomas Klein',
  jobTitle: 'Software engineer',
  url: `${SITE_URL}/about`,
  worksFor: { '@id': ORG_ID, '@type': 'ProfessionalService', name: SITE_NAME },
}

/* Tap to Tick, as its page and App Store listing describe it. No rating: the
   site publishes none, so this cannot earn star snippets yet. */
export const TAP_TO_TICK_LD = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'Tap to Tick',
  url: `${SITE_URL}/tap-to-tick`,
  description:
    'An iPhone expense tracker: log any transaction in two taps, including the cash in your pocket. Free, with a shared ledger for two people over iCloud.',
  operatingSystem: 'iOS 17 or later',
  applicationCategory: 'FinanceApplication',
  installUrl: 'https://apps.apple.com/us/app/tap-to-tick/id6791948663',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@id': PERSON_ID, '@type': 'Person', name: 'Thomas Klein' },
}

/* JAM Legio, on /latin-game: Thomas (Kingdom Sites) designed and built it;
   JAM with Latin LLC publishes it (its App Store seller). The price is the
   App Store's (Thomas, 2026-10-30). The publisher may be named here because
   this is the one page that carries the partnership credit. */
export const JAM_LEGIO_LD = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'JAM Legio',
  url: `${SITE_URL}/latin-game`,
  description:
    'A Latin vocabulary game for iPhone and Android, for homeschool and classical students: march a Roman legion from Rōma to Gallia learning declensions, verb endings and real Latin sentences.',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'EducationalApplication',
  downloadUrl: [LATIN_STORES.appStore, LATIN_STORES.googlePlay],
  sameAs: [LATIN_STORES.appStore, LATIN_STORES.googlePlay],
  offers: { '@type': 'Offer', price: '19.99', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: 'JAM with Latin LLC' },
  creator: [
    { '@id': ORG_ID, '@type': 'ProfessionalService', name: SITE_NAME },
    { '@id': PERSON_ID, '@type': 'Person', name: 'Thomas Klein' },
  ],
  author: { '@id': PERSON_ID, '@type': 'Person', name: 'Thomas Klein' },
}

/* A service page (Rochester, churches, schools): what is offered, by whom and
   for whom, in the page's own words. Facts only, as everywhere in this file. */
export function serviceLd({
  name,
  description,
  path,
  audience,
  areaServed,
}: {
  name: string
  description: string
  path: string
  audience?: string
  areaServed?: object[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${SITE_URL}${path}`,
    provider: { '@id': ORG_ID, '@type': 'ProfessionalService', name: SITE_NAME },
    ...(audience ? { audience: { '@type': 'Audience', audienceType: audience } } : {}),
    ...(areaServed ? { areaServed } : {}),
  }
}

/* Questions and answers a page shows word for word. Only for real Q&A on the
   page: Google treats FAQ data that the visitor cannot read as spam. */
export type Faq = { q: string; a: string }
export function faqLd(items: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
}

/* A page's share card (Facebook, LinkedIn, iMessage, X). Without one, a page
   inherits the root layout's card: the home page's title and no address of its
   own, so a shared link to it looks like a link to the home page. */
export function shareCard(title: string, description: string, path: string) {
  return {
    openGraph: {
      title,
      description,
      url: `${SHARE_URL}${path}`,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'website' as const,
      images: [SITE_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image' as const, title, description, images: [SITE_OG_IMAGE.url] },
  }
}

/* For a <script type="application/ld+json">. Escapes "<" so no text inside the
   data can close the script tag early. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
