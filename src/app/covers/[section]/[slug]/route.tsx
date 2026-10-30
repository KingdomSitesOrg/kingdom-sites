import { ImageResponse } from 'next/og'
import { ARTICLES } from '@/content/articles'
import { getArticle, isPublished, type SectionId } from '@/lib/articles'
import { COVER, coverDataUri } from '@/lib/covers'

/**
 * An article's drawn cover as a PNG (T-388): its share card on Facebook,
 * LinkedIn and messages, which do not show SVG. Only for published articles.
 */

export const revalidate = 3600

export function generateStaticParams() {
  return ARTICLES.filter((a) => !a.cover && isPublished(a)).map((a) => ({ section: a.section, slug: a.slug }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params
  const a = getArticle(section as SectionId, slug)
  if (!a || a.cover) return new Response('Not found', { status: 404 })
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverDataUri(a.slug, a.section)} width={COVER.width} height={COVER.height} alt="" />
    ),
    COVER,
  )
}
