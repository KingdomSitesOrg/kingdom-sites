import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts, formatPostDate } from '@/lib/blog'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'

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
   <section className="cn-wrap pb-14 pt-16 sm:pb-20 sm:pt-24">
    <div className="max-w-5xl">
     <p className="cn-kicker cn-rise">Blog</p>
     <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
      {'Notes on getting found, '}
      <span className="text-accent">getting clients,</span>
      {' and growing locally.'}
     </h1>
     <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[52ch] text-pretty">
      Written for owners in Rochester and Southeast Minnesota — trades, cafés, shops, and
      anyone whose next customer starts with a search. Local events when they matter; plain
      advice when they do not.
     </p>
    </div>
   </section>

   <section className="cn-wrap pb-24 sm:pb-32">
    <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
     {posts.map((post) => (
      <article key={post.slug} className="cn-card">
       <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.tags[0]}</span>
       </div>
       <h2 className="cn-display mt-3 text-balance text-[1.7rem] leading-[1.02] text-ink sm:text-[2.1rem]">
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

    <div className="mx-auto mt-28 max-w-3xl text-center sm:mt-36">
     <h2 className="cn-display cn-h3 text-balance">
      Building a product that needs an owner?
     </h2>
     <p className="mx-auto mt-3 max-w-lg text-pretty text-[15px] leading-relaxed text-body">
      I build mobile apps and keep them going. If you have an idea, start a conversation.
     </p>
     <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <Link href={INQUIRE_PATH} className="btn-primary">
       {INQUIRE_CTA}
      </Link>
     </div>
    </div>
   </section>
  </div>
 )
}
