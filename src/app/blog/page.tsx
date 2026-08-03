import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts, formatPostDate } from '@/lib/blog'
import { SERVICE_AREA_LABEL } from '@/lib/local'

export const metadata: Metadata = {
  title: 'Blog — growing local businesses in Rochester, MN',
  description:
    'Practical notes on getting more clients, showing up on Google, and what is happening around Rochester, Minnesota for small businesses — coffee shops, bike shops, markets, and Chamber life.',
  alternates: { canonical: '/blog' },
  keywords: [
    'Rochester MN small business blog',
    'grow local business Rochester',
    'get more clients Minnesota',
    'local SEO Rochester MN',
  ],
  openGraph: {
    title: 'Kingdom Sites Blog — Rochester local business growth',
    description:
      'How local businesses in Rochester, MN get found, get clients, and grow without living in a marketing dashboard.',
    url: 'https://kingdom-sites.com/blog',
    type: 'website',
  },
}

export default function BlogIndex() {
  const posts = getAllPosts()

  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-14 pt-16 text-center sm:px-8 sm:pb-16 sm:pt-24">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">From {SERVICE_AREA_LABEL}</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            {'Notes on getting found, '}
            <span className="text-accent">getting clients,</span>
            {' and growing locally.'}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            Written for owners in Rochester and Southeast Minnesota — trades, cafés, shops, and
            anyone whose next customer starts with a search. Local events when they matter; plain
            advice when they do not.
          </p>
        </div>
      </section>

      <section className="border-t border-line px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-3xl space-y-5">
          {posts.map((post) => (
            <article key={post.slug} className="tile p-7 sm:p-8">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                <span aria-hidden="true">·</span>
                <span>{post.tags[0]}</span>
              </div>
              <h2 className="mt-3 text-balance text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-accent">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-body">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-5 inline-flex text-sm font-medium text-accent hover:underline"
              >
                Read the post
              </Link>
            </article>
          ))}
        </div>

        <div className="tile-elevated mx-auto mt-14 max-w-3xl px-6 py-10 text-center sm:px-10">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink">
            Want this done for your business?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-pretty text-[15px] leading-relaxed text-body">
            Free look at how you show up in Rochester search — website, Google listing, and who is
            above you today.
          </p>
          <Link href="/get-started" className="btn-primary mt-6 inline-flex">
            Get my free look
          </Link>
        </div>
      </section>
    </div>
  )
}
