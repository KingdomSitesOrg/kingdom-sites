import Link from 'next/link'
import type { Metadata } from 'next'
import { GUIDES } from '@/lib/guides'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { SITE_URL, jsonLd, shareCard } from '@/lib/seo'

const DESCRIPTION =
  'Plain answers to the questions people ask before a website or app: what a church needs, online sign-ups and payments for a school, website or app, how a quote works, and what an app costs to keep running.'

export const metadata: Metadata = {
  title: 'Guides: websites and apps, answered plainly',
  description: DESCRIPTION,
  alternates: { canonical: '/guides' },
  ...shareCard('Guides — Kingdom Sites', DESCRIPTION, '/guides'),
}

const LIST_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Guides',
  itemListElement: GUIDES.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: g.question,
    url: `${SITE_URL}/guides/${g.slug}`,
  })),
}

export default function GuidesIndex() {
  return (
    <div className="w-full overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(LIST_LD) }} />

      <section className="cn-wrap pb-14 pt-16 sm:pb-20 sm:pt-24">
        <div className="max-w-5xl">
          <p className="cn-kicker cn-rise">Guides</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
            {'The questions people ask me, '}
            <span className="text-accent">answered plainly.</span>
          </h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[52ch] text-pretty">
            Before a website or an app, the same few questions come up. Here are my answers, the way I would give
            them to you in a conversation.
          </p>
        </div>
      </section>

      <section className="cn-wrap pb-24 sm:pb-32">
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {GUIDES.map((g) => (
            <article key={g.slug} className="cn-card">
              <h2 className="cn-display text-balance text-[1.7rem] leading-[1.02] text-ink sm:text-[2.1rem]">
                <Link href={`/guides/${g.slug}`} className="transition-colors hover:text-accent">
                  {g.question}
                </Link>
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-body">{g.description}</p>
              <Link href={`/guides/${g.slug}`} className="mt-5 inline-flex text-sm font-medium text-accent hover:underline">
                Read the answer
              </Link>
            </article>
          ))}
          <article className="cn-card">
            <h2 className="cn-display text-balance text-[1.7rem] leading-[1.02] text-ink sm:text-[2.1rem]">
              Have a question that is not here?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body">
              Ask me. Every enquiry comes to me, and I reply personally.
            </p>
            <Link href={INQUIRE_PATH} className="mt-5 inline-flex text-sm font-medium text-accent hover:underline">
              {INQUIRE_CTA}
            </Link>
          </article>
        </div>
      </section>
    </div>
  )
}
