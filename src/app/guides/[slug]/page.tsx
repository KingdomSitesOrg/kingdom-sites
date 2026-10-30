import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AuthorBox from '@/components/guides/AuthorBox'
import GuideText from '@/components/guides/GuideText'
import { GUIDES, formatGuideDate, getGuide, relatedProjects, type GuideBlock } from '@/lib/guides'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PERSON_LD, SHARE_URL, SITE_NAME, SITE_OG_IMAGE, SITE_URL, jsonLd } from '@/lib/seo'
import { SERVICE_CITY, SERVICE_COUNTRY, SERVICE_REGION_CODE } from '@/lib/local'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}
  const path = `/guides/${guide.slug}`
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: path },
    authors: [{ name: 'Thomas Klein', url: `${SITE_URL}/about` }],
    openGraph: {
      title: guide.question,
      description: guide.description,
      url: `${SHARE_URL}${path}`,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'article',
      publishedTime: guide.published,
      modifiedTime: guide.updated,
      authors: [`${SITE_URL}/about`],
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.question,
      description: guide.description,
      images: [SITE_OG_IMAGE.url],
    },
  }
}

function Block({ block }: { block: GuideBlock }) {
  if (block.type === 'p') {
    return (
      <p className="text-[16.5px] leading-[1.7] text-body">
        <GuideText text={block.text} />
      </p>
    )
  }
  if (block.type === 'h2') {
    return (
      <h2 className="mt-10 text-balance text-2xl first:mt-0 font-semibold tracking-tight text-ink sm:text-[1.65rem]">
        {block.text}
      </h2>
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
              <GuideText text={item} />
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
            <GuideText text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const url = `${SITE_URL}/guides/${guide.slug}`
  const projects = relatedProjects(guide)
  const others = GUIDES.filter((g) => g.slug !== guide.slug)

  /* The guide as an Article, Thomas as its author (a Person, placed where the
     business is based), and where it sits on the site. */
  const author = {
    ...PERSON_LD,
    '@context': undefined,
    workLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: SERVICE_CITY,
        addressRegion: SERVICE_REGION_CODE,
        addressCountry: SERVICE_COUNTRY,
      },
    },
  }
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: guide.question,
        description: guide.description,
        datePublished: guide.published,
        dateModified: guide.updated,
        author: { '@id': PERSON_LD['@id'], '@type': 'Person', name: 'Thomas Klein' },
        publisher: { '@id': `${SITE_URL}/#organization`, '@type': 'ProfessionalService', name: SITE_NAME },
        image: [`${SITE_URL}${SITE_OG_IMAGE.url}`],
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        keywords: guide.keywords.join(', '),
        inLanguage: 'en-US',
      },
      author,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Guides', item: `${SITE_URL}/guides` },
          { '@type': 'ListItem', position: 2, name: guide.question, item: url },
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
              <Link href="/guides" className="hover:text-accent">
                Guides
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              By <Link href="/about" className="hover:text-accent">Thomas Klein</Link>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              <time dateTime={guide.updated}>{formatGuideDate(guide.updated)}</time>
            </p>
            <h1 className="cn-display cn-h3 mt-5 text-balance">{guide.question}</h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-ink sm:text-xl">{guide.answer}</p>
          </div>
        </header>

        <div className="cn-wrap">
          <div className="mx-auto max-w-2xl space-y-6 border-t border-line pt-12 sm:pt-16">
            {guide.body.map((block, i) => (
              <Block key={i} block={block} />
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

          {guide.sources && (
            <section aria-labelledby="sources" className="mx-auto mt-12 max-w-2xl">
              <h2 id="sources" className="cn-kicker">
                Sources
              </h2>
              <p className="mt-2 text-sm text-muted">Checked {formatGuideDate(guide.updated)}. Fees change; each link has the current figure.</p>
              <ul className="mt-4 space-y-2 text-sm">
                {guide.sources.map((s) => (
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
          <h2 className="cn-display text-balance text-[1.9rem] leading-none text-ink">Have something in mind?</h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-body">
            Tell me about it in a few lines. You and I talk first; you get a quote once I understand the project.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
          </div>
        </div>

        <nav aria-labelledby="more-guides" className="mx-auto mt-16 max-w-2xl">
          <h2 id="more-guides" className="cn-kicker">
            More questions people ask
          </h2>
          <ul className="mt-5 space-y-4">
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="text-[15px] font-medium text-ink transition-colors hover:text-accent">
                  {g.question}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
