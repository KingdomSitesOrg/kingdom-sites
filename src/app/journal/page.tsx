import type { Metadata } from 'next'
import ArticleIndex from '@/components/articles/ArticleIndex'
import { SECTIONS } from '@/lib/articles'
import { shareCard } from '@/lib/seo'

const SECTION = SECTIONS.journal

/* Checked again every hour, so an article appears on its publish date without a deploy (T-388). */
export const revalidate = 3600

export const metadata: Metadata = {
  title: SECTION.title,
  description: SECTION.description,
  alternates: { canonical: SECTION.path },
  ...shareCard(`${SECTION.name} — Kingdom Sites`, SECTION.description, SECTION.path),
}

export default function JournalIndex() {
  return <ArticleIndex section="journal" />
}
