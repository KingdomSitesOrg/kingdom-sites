import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts, formatPostDate } from '@/lib/blog'
import {
  LOCAL_KEYWORDS,
  SERVICE_AREA_LABEL,
  SERVICE_CITY,
  SERVICE_LAT,
  SERVICE_LNG,
  SERVICE_REGION,
  SERVICE_REGION_CODE,
} from '@/lib/local'
import { ENTRY_PRICE_LABEL, FIRST_MONTH_FREE_SHORT } from '@/lib/partnership'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

export const metadata: Metadata = {
  title: `Local business growth in ${SERVICE_CITY}, ${SERVICE_REGION_CODE}`,
  description:
    `Websites, Google listings and local SEO for small businesses in ${SERVICE_CITY}, Minnesota — get more clients, get found on Google, and grow without a big up-front bill. From ${ENTRY_PRICE_LABEL}/month.`,
  alternates: { canonical: '/rochester-mn' },
  keywords: LOCAL_KEYWORDS,
  openGraph: {
    title: `Grow your local business in ${SERVICE_CITY}, MN | Kingdom Sites`,
    description:
      'One monthly partnership for website, Google listing, search work, photos and reviews — built for Rochester and Southeast Minnesota.',
    url: 'https://kingdom-sites.com/rochester-mn',
    type: 'website',
    locale: 'en_US',
  },
  other: {
    'geo.region': `${SERVICE_REGION_CODE === 'MN' ? 'US-MN' : 'US'}`,
    'geo.placename': SERVICE_CITY,
    'geo.position': `${SERVICE_LAT};${SERVICE_LNG}`,
    ICBM: `${SERVICE_LAT}, ${SERVICE_LNG}`,
  },
}

const WHO = [
  'Landscaping, lawn care and snow',
  'Painting, roofing and trades',
  'Coffee shops, cafés and restaurants',
  'Bike shops and local retail',
  'Auto repair and home services',
  'Any Rochester business found by search',
]

export default function RochesterPage() {
  const posts = getAllPosts().slice(0, 4)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Local business growth in ${SERVICE_CITY}, ${SERVICE_REGION_CODE}`,
    description: `Kingdom Sites helps small businesses in ${SERVICE_CITY}, ${SERVICE_REGION} get found on Google and get more clients.`,
    url: 'https://kingdom-sites.com/rochester-mn',
    about: {
      '@type': 'City',
      name: SERVICE_CITY,
      containedInPlace: { '@type': 'State', name: SERVICE_REGION },
    },
    provider: {
      '@type': 'ProfessionalService',
      name: 'Kingdom Sites',
      url: 'https://kingdom-sites.com',
      areaServed: {
        '@type': 'City',
        name: SERVICE_CITY,
        containedInPlace: { '@type': 'State', name: SERVICE_REGION },
      },
    },
  }

  return (
    <div className="w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="hero-wash px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">{SERVICE_AREA_LABEL}</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            {'Grow your business in '}
            <span className="text-accent">Rochester, Minnesota.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            Get more clients by being findable where people already look — Google, Maps, and a site
            that works on a phone. Website, listing, search work, photos and reviews. One monthly
            fee. Built for local owners here, not a national agency template.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className="btn-primary">
              Free look at your Rochester listing
            </Link>
            <Link href="/local-business#pricing" className="btn-ghost">
              {'Plans from ' + ENTRY_PRICE_LABEL + '/month'}
            </Link>
          </div>
          <p className="mt-6 text-[13.5px] leading-relaxed text-muted">
            {FIRST_MONTH_FREE_SHORT} · No contract · Domain is yours
          </p>
        </div>
      </section>

      <section className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Who this is for in Rochester
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
            {WHO.map((w) => (
              <span
                key={w}
                className="rounded-full border border-line bg-surface px-4 py-2 text-[13.5px] font-medium text-body"
              >
                {w}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-[15px] leading-relaxed text-body">
            Whether you are near downtown, Northwest, South Broadway, or serving Byron, Stewartville,
            and the rest of Olmsted County — if customers search before they call, this is built for
            you.
          </p>
        </div>
      </section>

      <section className="band-dark px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">The keywords that matter</p>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Growing, finding clients, getting found
          </h2>
          <p className="mt-5 text-pretty text-[15px] leading-relaxed text-white/65">
            People do not type “synergistic digital transformation.” They type things like grow my
            local business, get more clients, find customers near me, and the service plus Rochester
            MN. That is the language I write for — on your site and on this one.
          </p>
        </div>
      </section>

      <section className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">From the Rochester blog</h2>
            <Link href="/blog" className="shrink-0 text-sm font-medium text-accent hover:underline">
              All posts
            </Link>
          </div>
          <ul className="mt-8 space-y-4">
            {posts.map((post) => (
              <li key={post.slug} className="tile p-6">
                <p className="text-[13px] text-muted">
                  <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-2 block text-[17px] font-semibold tracking-tight text-ink hover:text-accent"
                >
                  {post.title}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-body">{post.excerpt}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="tile-elevated mx-auto max-w-3xl px-6 py-12 text-center sm:px-12">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            See how you show up in Rochester search
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-body">
            Free, honest look — no sales script. Tell me your trade and towns; I will tell you what a
            customer sees today.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link href="/get-started" className="btn-primary">
              Get my free look
            </Link>
            <a href={CONTACT_MAILTO} className="link-accent text-sm">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
