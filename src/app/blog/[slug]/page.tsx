import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts, getPost, formatPostDate, type BlogBlock } from '@/lib/blog'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import SummarizeButton from '@/components/intelligence/SummarizeButton'
import { SHARE_URL } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

/* The picture shown when a post is shared, and the one search engines read as
  the article's image. A page that sets its own share card replaces the site
  default wholesale, so posts have to name it themselves or they go out bare. */
const SHARE_IMAGE = `${SHARE_URL}/share/kingdom-sites.jpg`

export function generateStaticParams() {
 return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { slug } = await params
 const post = getPost(slug)
 if (!post) return { title: 'Post not found' }

 const url = `https://kingdom-sites.com/blog/${post.slug}`
 return {
  title: post.title,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
   title: post.title,
   description: post.description,
   url,
   type: 'article',
   publishedTime: post.date,
   locale: 'en_US',
   images: [{ url: SHARE_IMAGE, width: 1200, height: 630, alt: post.title }],
  },
  twitter: {
   card: 'summary_large_image',
   title: post.title,
   description: post.description,
   images: [SHARE_IMAGE],
  },
 }
}

function Block({ block }: { block: BlogBlock }) {
 if (block.type === 'p') {
  return <p className="text-[16.5px] leading-[1.7] text-body">{block.text}</p>
 }
 if (block.type === 'h2') {
  return (
   <h2 className="mt-10 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-[1.65rem]">
    {block.text}
   </h2>
  )
 }
 if (block.type === 'ul') {
  return (
   <ul className="my-2 space-y-2.5 pl-1">
    {block.items.map((item) => (
     <li key={item} className="flex gap-3 text-[16px] leading-relaxed text-body">
      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
      <span>{item}</span>
     </li>
    ))}
   </ul>
  )
 }
 return (
  <blockquote className="border-l-[3px] border-accent/40 pl-5 text-[16.5px] font-medium leading-relaxed text-ink">
   {block.text}
  </blockquote>
 )
}

export default async function BlogPostPage({ params }: Props) {
 const { slug } = await params
 const post = getPost(slug)
 if (!post) notFound()

 const others = getAllPosts().filter((p) => p.slug !== post.slug).slice(0, 3)

 const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  dateModified: post.date,
  author: {
   '@type': 'Person',
   name: 'Thomas Klein',
   url: 'https://kingdom-sites.com/about',
  },
  /* Google will not consider an article for a rich result without an image,
    so every post carries the site share picture at the least. */
  image: [SHARE_IMAGE],
  publisher: {
   '@type': 'Organization',
   name: 'Kingdom Sites',
   url: 'https://kingdom-sites.com',
   logo: {
    '@type': 'ImageObject',
    url: 'https://kingdom-sites.com/marketing/logo-lockup.png',
    width: 2400,
    height: 600,
   },
  },
  mainEntityOfPage: {
   '@type': 'WebPage',
   '@id': `https://kingdom-sites.com/blog/${post.slug}`,
  },
  keywords: post.keywords.join(', '),
  about: {
   '@type': 'Place',
   name: 'Rochester',
   address: {
    '@type': 'PostalAddress',
    addressLocality: 'Rochester',
    addressRegion: 'MN',
    addressCountry: 'US',
   },
  },
 }

 return (
  <div className="w-full overflow-x-hidden">
   <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
   />

   <article className="cn-wrap pb-14 pt-14 sm:pb-20 sm:pt-20">
    <div className="cn-rise mx-auto max-w-2xl">
     <p className="text-[13px] text-muted">
      <Link href="/blog" className="hover:text-accent">
       Blog
      </Link>
      <span className="mx-2" aria-hidden="true">
       /
      </span>
      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
     </p>
     <h1 className="cn-display cn-h3 mt-5 text-balance">
      {post.title}
     </h1>
     <div className="mt-5">
      <SummarizeButton path={`blog/${post.slug}`} title={post.title} />
     </div>
     <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">{post.excerpt}</p>
     <div className="mt-5 flex flex-wrap gap-2">
      {post.tags.map((tag) => (
       <span
        key={tag}
        className="rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] font-medium text-body"
       >
        {tag}
       </span>
      ))}
     </div>
    </div>
   </article>

   <div className="cn-wrap pb-24 sm:pb-32">
    <div className="mx-auto max-w-2xl space-y-6 border-t border-line pt-12 sm:pt-16">
     {post.body.map((block, i) => (
      <Block key={i} block={block} />
     ))}
    </div>

    <div className="tile-elevated mx-auto mt-16 max-w-2xl px-6 py-10 text-center sm:px-10">
     <h2 className="cn-display text-balance text-[1.9rem] leading-none text-ink">
      Need a website or app in Rochester?
     </h2>
     <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-body">
      Kingdom Sites is based in Rochester. I build websites and apps for Rochester businesses, and you talk to me, the
      person who builds it.
     </p>
     <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <Link href="/rochester-mn" className="btn-ghost">Websites and apps for Rochester businesses</Link>
      <Link href={INQUIRE_PATH} className="btn-primary">{INQUIRE_CTA}</Link>
     </div>
    </div>

    {others.length > 0 && (
     <div className="mx-auto mt-16 max-w-2xl">
      <h2 className="cn-kicker">More from the blog</h2>
      <ul className="mt-5 space-y-4">
       {others.map((p) => (
        <li key={p.slug}>
         <Link
          href={`/blog/${p.slug}`}
          className="text-[15px] font-medium text-ink transition-colors hover:text-accent"
         >
          {p.title}
         </Link>
        </li>
       ))}
      </ul>
     </div>
    )}
   </div>
  </div>
 )
}
