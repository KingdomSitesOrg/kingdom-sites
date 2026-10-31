import { ARTICLES } from '@/content/articles'
import { PROJECTS, SHOTS } from '@/lib/work'

/**
 * The site's two article sections (T-388, T-399), each with its own page and
 * menu item: the Journal, /journal (missions, faith, the persecuted church,
 * prayer and the stories behind the projects), and Guides, /guides (software
 * questions in plain words). Every article is one file in src/content/articles/,
 * listed in its index.ts; docs/adding-an-article.md says how to add one.
 *
 * Scheduled publishing: an article dated in the future does not exist yet
 * anywhere on the site (index, sitemap, its own address, the chat) until its
 * date begins in Rochester, Minnesota. The pages refresh every hour, so it
 * appears on the day without a deploy.
 */

export type SectionId = 'journal' | 'guides'

export type Article = {
  section: SectionId
  /** The address: /journal/<slug> or /guides/<slug>. Lowercase words and hyphens. */
  slug: string
  /** The page's one heading. A guide's is its question. */
  title: string
  /** The search title, if different from the heading (" | Kingdom Sites" is added). */
  seoTitle?: string
  /** One or two sentences for search results, share cards and the index. */
  description: string
  /** The opening: for a guide, the answer in two sentences. */
  lede: string
  /** YYYY-MM-DD. Hidden everywhere until this date in Rochester, Minnesota. */
  published: string
  /** YYYY-MM-DD, when the text last changed in a way a reader would care about. */
  updated?: string
  keywords?: string[]
  /** A real photo already in public/ (the path from public, e.g. "/Photos/mission-field.jpg"); without one, a cover is drawn. */
  cover?: { photo: string; alt: string; width: number; height: number }
  /** Instead of a cover: real app screenshots side by side, by their name in SHOTS (src/lib/work.ts), with a share picture (T-403). */
  phones?: { shots: (keyof typeof SHOTS)[]; share: { photo: string; alt: string; width: number; height: number } }
  /** Portfolio projects to link (slugs from src/lib/work.ts). */
  related?: string[]
  /** Where public figures come from. */
  sources?: { label: string; href: string }[]
  /** The text, in plain Markdown: see docs/adding-an-article.md. */
  body: string
}

export type Section = {
  id: SectionId
  path: string
  name: string
  /** Search title for the index. */
  title: string
  description: string
  heading: [plain: string, quiet: string]
  intro: string
  /** The card on an empty index. */
  empty: string
  /** The closing box on its articles. */
  cta: { heading: string }
}

/** In menu order: Journal, then Guides. */
export const SECTIONS: Record<SectionId, Section> = {
  journal: {
    id: 'journal',
    path: '/journal',
    name: 'Journal',
    title: 'Journal: missions, faith and the stories behind the work',
    description:
      'The Journal of Thomas Klein. Tech, Faith, missions, news and anything in between. My thoughts.',
    heading: ['The ', 'Journal.'],
    intro: 'Tech, Faith, missions, news and anything in between. My thoughts.',
    empty: 'The first stories are on their way.',
    cta: { heading: 'Want to talk about it?' },
  },
  guides: {
    id: 'guides',
    path: '/guides',
    name: 'Guides',
    title: 'Guides: websites and apps in plain words',
    description:
      'Common questions in the software development world, made easy to understand: websites and apps, how a quote works, and what software costs to keep running.',
    heading: ['Common questions in the software development world, ', 'made easy to understand.'],
    intro: 'Short guides to choosing, pricing and keeping a website or app, the way I would explain them to you in a conversation.',
    empty: 'The first guides are on their way.',
    cta: { heading: 'Have something in mind?' },
  },
}

/** Today's date in Rochester, Minnesota, as YYYY-MM-DD. */
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/* A Vercel preview deployment shows scheduled articles too, so they can be
   read on a preview link before their day (T-392). So does a review dev server
   started with SHOW_SCHEDULED_ARTICLES=1 (T-403). Production and ordinary local
   builds keep them hidden until their date. */
const SHOW_SCHEDULED = process.env.VERCEL_ENV === 'preview' || process.env.SHOW_SCHEDULED_ARTICLES === '1'

export function isPublished(a: Article, now = new Date()): boolean {
  return SHOW_SCHEDULED || a.published <= today(now)
}

/** A section's published articles, newest first (same day: the order in the index file). */
export function publishedIn(section: SectionId, now = new Date()): Article[] {
  return ARTICLES.map((a, i) => ({ a, i }))
    .filter(({ a }) => a.section === section && isPublished(a, now))
    .sort((x, y) => y.a.published.localeCompare(x.a.published) || x.i - y.i)
    .map(({ a }) => a)
}

/** Every published article, both sections, newest first (same day: the order in the index file). */
export function publishedAll(now = new Date()): Article[] {
  return ARTICLES.map((a, i) => ({ a, i }))
    .filter(({ a }) => isPublished(a, now))
    .sort((x, y) => y.a.published.localeCompare(x.a.published) || x.i - y.i)
    .map(({ a }) => a)
}

export function getArticle(section: SectionId, slug: string, now = new Date()): Article | undefined {
  const a = ARTICLES.find((x) => x.section === section && x.slug === slug)
  return a && isPublished(a, now) ? a : undefined
}

export const articlePath = (a: Pick<Article, 'section' | 'slug'>) => `${SECTIONS[a.section].path}/${a.slug}`

/* ---------- The text ---------- */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string; cite?: string }

/**
 * The plain Markdown an article is written in: paragraphs separated by a
 * blank line, "## " sub-headings, "- " lists, "1. " numbered lists, "> "
 * quotes, [words](/path) links and **bold** words. Nothing else is needed or read.
 */
export function blocks(body: string): Block[] {
  return body
    .trim()
    .split(/\n\s*\n/)
    .map((chunk) => {
      const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length === 1 && lines[0].startsWith('## ')) return { type: 'h2' as const, text: lines[0].slice(3).trim() }
      if (lines.every((l) => /^[-*] /.test(l))) return { type: 'ul' as const, items: lines.map((l) => l.slice(2).trim()) }
      if (lines.every((l) => /^\d+\. /.test(l))) return { type: 'ol' as const, items: lines.map((l) => l.replace(/^\d+\.\s+/, '')) }
      if (lines.every((l) => l.startsWith('>'))) {
        /* A last line starting with "— " is who said it, shown under the quote. */
        const said = lines.map((l) => l.replace(/^>\s?/, ''))
        const cite = said.length > 1 && said[said.length - 1].startsWith('— ') ? said.pop()!.slice(2).trim() : undefined
        return { type: 'quote' as const, text: said.join(' '), ...(cite ? { cite } : {}) }
      }
      return { type: 'p' as const, text: lines.join(' ') }
    })
}

/** The words alone (for the reading time), links read as their words, bold as plain words. */
export function plainText(a: Article): string {
  return `${a.lede}\n${blocks(a.body)
    .map((b) => ('items' in b ? b.items.map((i) => `- ${i}`).join('\n') : b.type === 'h2' ? `\n${b.text}` : b.type === 'quote' && b.cite ? `${b.text} (${b.cite})` : b.text))
    .join('\n')}`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
}

/** Words, for the "about N minutes" line. */
export function wordCount(a: Article): number {
  return plainText(a).split(/\s+/).filter(Boolean).length
}

export function relatedProjects(a: Article) {
  /* A related project's link stays on this site: its Portfolio page for the
     projects that live elsewhere (farzana.app, kcupgs.com, the Delta site; T-389). */
  const anchor: Record<string, string> = { farzana: '/portfolio/farzana-classroom', kcupg: '/portfolio/kcupg', delta: '/portfolio/delta' }
  return (a.related ?? []).flatMap((slug) => {
    const p = PROJECTS.find((x) => x.slug === slug)
    return p ? [{ name: p.name, line: p.line, href: anchor[slug] ?? p.href ?? '/portfolio' }] : []
  })
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}
