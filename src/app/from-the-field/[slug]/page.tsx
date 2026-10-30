import type { Metadata } from 'next'
import ArticlePage, { articleMetadata } from '@/components/articles/ArticlePage'
import { publishedIn } from '@/lib/articles'

type Props = { params: Promise<{ slug: string }> }

/* Published articles are built ahead; one whose date arrives later is built on
   its first visit, and pages are checked again every hour (T-388). */
export const revalidate = 3600

export function generateStaticParams() {
  return publishedIn('from-the-field').map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return articleMetadata('from-the-field', (await params).slug)
}

export default async function FromTheFieldArticle({ params }: Props) {
  return <ArticlePage section="from-the-field" slug={(await params).slug} />
}
