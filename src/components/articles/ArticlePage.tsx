import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ArticleText from '@/components/articles/ArticleText'
import AuthorBox from '@/components/articles/AuthorBox'
import Cover from '@/components/articles/Cover'
import SummarizeButton from '@/components/intelligence/SummarizeButton'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { SERVICE_CITY, SERVICE_COUNTRY, SERVICE_REGION_CODE } from '@/lib/local'
import { PERSON_LD, SHARE_URL, SITE_NAME, SITE_URL, jsonLd } from '@/lib/seo'
import {
  SECTIONS,
  articlePath,
  blocks,
  formatDate,
  getArticle,
  publishedIn,
  relatedProjects,
  wordCount,
  type Article,
  type Block,
  type SectionId,
} from '@/lib/articles'

/* The share picture: the article's photo, or its drawn cover as a PNG. */
function shareImage(a: Article) {
  return a.cover
    ? { url: a.cover.photo, width: a.cover.width, height: a.cover.height, alt: a.cover.alt }
    : { url: `/covers/${a.section}/${a.slug}`, width: 1200, height: 630, alt: a.title }
}

export function articleMetadata(section: SectionId, slug: string): Metadata {
  const a = getArticle(section, slug)
  if (!a) return {}
  const path = articlePath(a)
  const image = shareImage(a)
  return {
    title: a.seoTitle ?? a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: path },
    authors: [{ name: 'Thomas Klein', url: `${SITE_URL}/about` }],
    openGraph: {
      title: a.title,
      description: a.description,
      url: `${SHARE_URL}${path}`,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'article',
      publishedTime: a.published,
      modifiedTime: a.updated ?? a.published,
      authors: [`${SITE_URL}/about`],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: a.title, description: a.description, images: [image.url] },
  }
}

function Part({ block }: { block: Block }) {
  if (block.type === 'p') {
    return (
      <p className="text-[16.5px] leading-[1.7] text-body">
        <ArticleText text={block.text} />
      </p>
    )
  }
  if (block.type === 'h2') {
    return <h2 className="mt-10 text-balance text-2xl font-semibold tracking-tight text-ink first:mt-0 sm:text-[1.65rem]">{block.text}</h2>
  }
  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-[3px] border-accent/40 pl-5 text-[16.5px] font-medium leading-relaxed text-ink">
        <p>
          <ArticleText text={block.text} />
        </p>
        {block.cite ? <footer className="mt-2 text-[15px] font-normal text-muted">— {block.cite}</footer> : null}
      </blockquote>
    )
  }
  if (block.type === 'ol') {
    return (
      <ol className="my-2 space-y-3 pl-1">
        {block.items.map((item, i) => (
          <li key={item} className="flex gap-3 text-[16px] leading-relaxed text-body">
            <span className="w-5 shrink-0 font-semibold text-accent" aria-hidden="true">
              {i + 1}.
            </span>
            <span>
              <ArticleText text={item} />
            </span>
          </li>
        ))}
      </ol>
    )
  }
  return (
    <ul className="my-2 space-y-2.5 pl-1">
      {block.items.map((item) => (
        <li key={item} className="flex gap-3 text-[16px] leading-relaxed text-body">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
          <span>
            <ArticleText text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * One article, in the Journal or Guides (T-388, T-399): the heading, "Summarize this
 * article", the opening, the cover, the text, the related Portfolio projects,
 * the author, sources, and more from the same section. An article not yet
 * published is a 404.
 */
export default function ArticlePage({ section, slug }: { section: SectionId; slug: string }) {
  const a = getArticle(section, slug)
  if (!a) notFound()

  const home = SECTIONS[section]
  const url = `${SITE_URL}${articlePath(a)}`
  const projects = relatedProjects(a)
  const others = publishedIn(section)
    .filter((x) => x.slug !== a.slug)
    .slice(0, 4)
  const minutes = Math.max(1, Math.round(wordCount(a) / 220))

  /* The article, Thomas as its author (a Person, placed where the business is
     based), and where it sits on the site. */
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: a.title,
        description: a.description,
        datePublished: a.published,
        dateModified: a.updated ?? a.published,
        author: { '@id': PERSON_LD['@id'], '@type': 'Person', name: 'Thomas Klein' },
        publisher: { '@id': `${SITE_URL}/#organization`, '@type': 'ProfessionalService', name: SITE_NAME },
        image: [`${SITE_URL}${shareImage(a).url}`],
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        articleSection: home.name,
        ...(a.keywords ? { keywords: a.keywords.join(', ') } : {}),
        inLanguage: 'en-US',
      },
      {
        ...PERSON_LD,
        '@context': undefined,
        workLocation: {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: SERVICE_CITY, addressRegion: SERVICE_REGION_CODE, addressCountry: SERVICE_COUNTRY },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: home.name, item: `${SITE_URL}${home.path}` },
          { '@type': 'ListItem', position: 2, name: a.title, item: url },
        ],
      },
    ],
  }

  return (
    <div className="w-full overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />

      <article>
        <header className="cn-wrap pb-12 pt-14 sm:pb-16 sm:pt-20">
          <div className="cn-rise mx-auto max-w-2xl">
            <p className="text-[13px] text-muted">
              <Link href={home.path} className="hover:text-accent">
                {home.name}
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              By{' '}
              <Link href="/about" className="hover:text-accent">
                Thomas Klein
              </Link>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              <time dateTime={a.published}>{formatDate(a.published)}</time>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              {minutes} min read
            </p>
            <h1 className="cn-display cn-h3 mt-5 text-balance">{a.title}</h1>
            <div className="mt-5">
              <SummarizeButton path={`${section}/${a.slug}`} title={a.title} />
            </div>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-ink sm:text-xl">{a.lede}</p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <Cover article={a} priority sizes="(min-width: 800px) 768px, 100vw" />
          </div>
        </header>

        <div className="cn-wrap">
          <div className="mx-auto max-w-2xl space-y-6 pt-4">
            {blocks(a.body).map((block, i) => (
              <Part key={i} block={block} />
            ))}
          </div>

          {projects.length > 0 && (
            <section aria-labelledby="from-portfolio" className="mx-auto mt-16 max-w-2xl">
              <h2 id="from-portfolio" className="cn-kicker">
                From my portfolio
              </h2>
              <ul className="mt-5 space-y-5">
                {projects.map((p) => (
                  <li key={p.name} className="cn-card">
                    <Link href={p.href} className="text-[17px] font-semibold text-ink transition-colors hover:text-accent">
                      {p.name}
                    </Link>
                    <p className="mt-1 text-[15px] leading-relaxed text-body">{p.line}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <AuthorBox />

          {a.sources && (
            <section aria-labelledby="sources" className="mx-auto mt-12 max-w-2xl">
              <h2 id="sources" className="cn-kicker">
                Sources
              </h2>
              <p className="mt-2 text-sm text-muted">
                Checked {formatDate(a.updated ?? a.published)}.{section === 'guides' ? ' Fees change; each link has the current figure.' : ''}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {a.sources.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} className="link-accent" target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>

      <div className="cn-wrap pb-24 sm:pb-32">
        <div className="tile-elevated mx-auto mt-16 max-w-2xl px-6 py-10 text-center sm:px-10">
          <h2 className="cn-display text-balance text-[1.9rem] leading-none text-ink">{home.cta.heading}</h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-body">{home.cta.text}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
          </div>
        </div>

        {others.length > 0 && (
          <nav aria-labelledby="more-articles" className="mx-auto mt-16 max-w-2xl">
            <h2 id="more-articles" className="cn-kicker">
              More {home.name.toLowerCase()}
            </h2>
            <ul className="mt-5 space-y-4">
              {others.map((x) => (
                <li key={x.slug}>
                  <Link href={articlePath(x)} className="text-[15px] font-medium text-ink transition-colors hover:text-accent">
                    {x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}
