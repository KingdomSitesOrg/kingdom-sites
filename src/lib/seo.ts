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
  alt: 'Kingdom Sites will build it. What do you want?',
}

export const SITE_TITLE = 'Kingdom Sites will build it. What do you want?'

/* The home page's description. The root layout uses it too, as the fallback
   for any page without its own, so the business reads the same everywhere. */
export const SITE_DESCRIPTION =
  'Websites, iPhone and Android apps and AI consultation for businesses, churches and anyone who needs software, designed and built by Kingdom Sites.'

const ORG_ID = `${SITE_URL}/#organization`
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

/* The projects with a case study on this site (T-389), as each page and the
   product itself describe them. Farzana Classroom and KCUPG are software
   (SoftwareApplication, a web app); the Delta Development Project's site is a
   website made for the project (WebSite, a CreativeWork). No prices, ratings
   or user counts: none are published on these pages. */
const MAKER = [
  { '@id': ORG_ID, '@type': 'ProfessionalService', name: SITE_NAME },
  { '@id': PERSON_ID, '@type': 'Person', name: 'Thomas Klein' },
]

export const FARZANA_CLASSROOM_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Farzana Classroom',
  url: 'https://farzana.app',
  mainEntityOfPage: `${SITE_URL}/portfolio/farzana-classroom`,
  description:
    'Education software for schools, training organizations, education businesses or anyone who teaches classes: class sign-ups, families and online payments in one place.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  creator: MAKER,
  author: { '@id': PERSON_ID, '@type': 'Person', name: 'Thomas Klein' },
}

export const KCUPG_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'KCUPG',
  url: 'https://kcupgs.com',
  mainEntityOfPage: `${SITE_URL}/portfolio/kcupg`,
  description:
    'A dashboard and map of Kansas City’s communities from North Africa to East Asia, for local ministry: people, languages and faiths, and the places to meet them.',
  applicationCategory: 'ReferenceApplication',
  operatingSystem: 'Web',
  isAccessibleForFree: true,
  spatialCoverage: { '@type': 'Place', name: 'Kansas City metropolitan area' },
  creator: MAKER,
  author: { '@id': PERSON_ID, '@type': 'Person', name: 'Thomas Klein' },
}

export const DELTA_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Delta Development Project',
  url: 'https://deltadevelopmentproject.com',
  mainEntityOfPage: `${SITE_URL}/portfolio/delta`,
  description:
    'The website of the Delta Development Project, a project of SIM Bangladesh: village schools, vocational training and disaster response in northern Bangladesh and Dhaka.',
  about: { '@type': 'Organization', name: 'Delta Development Project', parentOrganization: { '@type': 'Organization', name: 'SIM Bangladesh' } },
  creator: MAKER,
  author: { '@id': PERSON_ID, '@type': 'Person', name: 'Thomas Klein' },
}

/* Home › Portfolio › the page, so search results show where a case study sits. */
export function breadcrumbLd(name: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Portfolio', item: `${SITE_URL}/portfolio` },
      { '@type': 'ListItem', position: 3, name, item: `${SITE_URL}${path}` },
    ],
  }
}

/* A page's share card (Facebook, LinkedIn, iMessage, X). Without one, a page
   inherits the root layout's card: the home page's title and no address of its
   own, so a shared link to it looks like a link to the home page. */
export function shareCard(
  title: string,
  description: string,
  path: string,
  image: { url: string; width: number; height: number; alt: string } = SITE_OG_IMAGE,
) {
  return {
    openGraph: {
      title,
      description,
      url: `${SHARE_URL}${path}`,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'website' as const,
      images: [image],
    },
    twitter: { card: 'summary_large_image' as const, title, description, images: [image.url] },
  }
}

/* For a <script type="application/ld+json">. Escapes "<" so no text inside the
   data can close the script tag early. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
