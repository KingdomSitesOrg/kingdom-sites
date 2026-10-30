import type { Metadata } from 'next'
import JournalIndex from '@/components/articles/JournalIndex'
import { JOURNAL } from '@/lib/articles'
import { shareCard } from '@/lib/seo'

/* Checked again every hour, so an article appears on its publish date without a deploy (T-388). */
export const revalidate = 3600

export const metadata: Metadata = {
  title: JOURNAL.title,
  description: JOURNAL.description,
  alternates: { canonical: JOURNAL.path },
  ...shareCard(`${JOURNAL.name} — Kingdom Sites`, JOURNAL.description, JOURNAL.path),
}

export default function Journal() {
  return <JournalIndex />
}
