import Link from 'next/link'
import Cover from '@/components/articles/Cover'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { SITE_URL, jsonLd } from '@/lib/seo'
import { SECTIONS, articlePath, formatDate, publishedIn, type Article, type SectionId } from '@/lib/articles'

/* Complete rows where the count allows: three across for 3 or 9, two for an even count. */
function columns(n: number) {
  if (n % 3 === 0 && n % 2 !== 0) return 'md:grid-cols-3'
  if (n % 2 === 0) return n % 6 === 0 ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'
  return 'md:grid-cols-2 xl:grid-cols-3'
}

/** The newest article, big, with its cover. */
function Featured({ article: latest }: { article: Article }) {
  return (
    <article className="cn-rise cn-rise-3 grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      <Link href={articlePath(latest)} className="group block" tabIndex={-1} aria-hidden="true">
        <Cover article={latest} priority sizes="(min-width: 1024px) 60vw, 100vw" />
      </Link>
      <div>
        <p className="text-[13px] text-muted">
          Latest · <time dateTime={latest.published}>{formatDate(latest.published)}</time>
        </p>
        <h2 className="cn-display cn-h3 mt-3 text-balance">
          <Link href={articlePath(latest)} className="transition-colors hover:text-accent">
            {latest.title}
          </Link>
        </h2>
        <p className="mt-4 text-pretty text-[16px] leading-relaxed text-body">{latest.description}</p>
        <Link href={articlePath(latest)} className="mt-6 inline-flex text-sm font-medium text-accent hover:underline">
          Read it <span aria-hidden="true">&nbsp;›</span>
        </Link>
      </div>
    </article>
  )
}

/** Articles as a grid of cards with covers, in complete rows where the count allows. */
function Shelf({ articles, className = '' }: { articles: Article[]; className?: string }) {
  return (
    <div className={`grid gap-x-10 gap-y-14 ${columns(articles.length)} ${className}`}>
      {articles.map((a) => (
        <article key={a.slug}>
          <Link href={articlePath(a)} className="block" tabIndex={-1} aria-hidden="true">
            <Cover article={a} sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw" />
          </Link>
          <p className="mt-5 text-[13px] text-muted">
            <time dateTime={a.published}>{formatDate(a.published)}</time>
          </p>
          <h2 className="cn-display mt-2 text-balance text-[1.6rem] leading-[1.02] text-ink sm:text-[1.9rem]">
            <Link href={articlePath(a)} className="transition-colors hover:text-accent">
              {a.title}
            </Link>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-body">{a.description}</p>
        </article>
      ))}
    </div>
  )
}

/**
 * A section's index, the Journal or Guides (T-388, T-399): the newest article big at the top with its
 * cover, then the rest as a grid, newest first. Only published articles.
 */
export default function ArticleIndex({ section: id }: { section: SectionId }) {
  const section = SECTIONS[id]
  const [latest, ...older] = publishedIn(id)

  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: section.name,
    itemListElement: [latest, ...older].filter(Boolean).map((a, i) => ({
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
          <p className="cn-kicker cn-rise">{section.name}</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
            {section.heading[0]}
            <span className="text-accent">{section.heading[1]}</span>
          </h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[52ch] text-pretty">{section.intro}</p>
        </div>
      </section>

      <section className="cn-wrap pb-24 sm:pb-32">
        {latest ? (
          <Featured article={latest} />
        ) : (
          <p className="cn-card text-[15px] text-body">{section.empty}</p>
        )}

        {older.length > 0 && <Shelf articles={older} className="mt-20 border-t border-line pt-14" />}

        <div className="mx-auto mt-24 max-w-3xl text-center sm:mt-32">
          <h2 className="cn-display cn-h3 text-balance">{section.cta.heading}</h2>
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
