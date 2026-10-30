import Link from 'next/link'
import { Featured, Shelf } from '@/components/articles/ArticleIndex'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { SITE_URL, jsonLd } from '@/lib/seo'
import { JOURNAL, SECTIONS, articlePath, publishedAll, publishedIn } from '@/lib/articles'

/**
 * The Journal (T-397): the newest article from either section big at the top,
 * then the two shelves, Guides and From the field, each with its covers and a
 * link to its own page. Only published articles.
 */
export default function JournalIndex() {
  const [latest] = publishedAll()

  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: JOURNAL.name,
    itemListElement: publishedAll().map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.title,
      url: `${SITE_URL}${articlePath(a)}`,
    })),
  }

  return (
    <div className="w-full overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(list) }} />

      <section className="cn-wrap pb-14 pt-16 sm:pb-20 sm:pt-24">
        <div className="max-w-5xl">
          <p className="cn-kicker cn-rise">{JOURNAL.name}</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
            {JOURNAL.heading[0]}
            <span className="text-accent">{JOURNAL.heading[1]}</span>
          </h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[52ch] text-pretty">{JOURNAL.intro}</p>
        </div>
      </section>

      <section className="cn-wrap pb-24 sm:pb-32">
        {latest && <Featured article={latest} label={SECTIONS[latest.section].name} />}

        {JOURNAL.shelves.map((id) => {
          const section = SECTIONS[id]
          const articles = publishedIn(id).filter((a) => a !== latest)
          return (
            <section key={id} aria-labelledby={`shelf-${id}`} className="mt-20 border-t border-line pt-14">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 id={`shelf-${id}`} className="cn-display cn-h3 text-balance">
                  {section.name}
                </h2>
                <Link href={section.path} className="text-sm font-medium text-accent hover:underline">
                  All {section.name.toLowerCase()} <span aria-hidden="true">&nbsp;›</span>
                </Link>
              </div>
              <p className="mt-3 max-w-[60ch] text-pretty text-[15px] leading-relaxed text-body">{section.intro}</p>
              {articles.length > 0 ? (
                <Shelf articles={articles} level={3} className="mt-10" />
              ) : (
                <p className="cn-card mt-10 text-[15px] text-body">{section.empty}</p>
              )}
            </section>
          )
        })}

        <div className="mx-auto mt-24 max-w-3xl text-center sm:mt-32">
          <h2 className="cn-display cn-h3 text-balance">{SECTIONS.guides.cta.heading}</h2>
          <p className="mx-auto mt-3 max-w-lg text-pretty text-[15px] leading-relaxed text-body">
            Every enquiry comes to me, and I reply personally.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
