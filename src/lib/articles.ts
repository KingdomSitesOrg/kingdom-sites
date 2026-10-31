import { ARTICLES } from '@/content/articles'
import { getPost } from '@/lib/blog'
import { PROJECTS } from '@/lib/work'

/**
 * The site's article section (T-388): Guides, plain answers to the software
 * questions buyers ask. Every article is one file in src/content/articles/, listed in its
 * index.ts; docs/adding-an-article.md says how to add one.
 *
 * Scheduled publishing: an article dated in the future does not exist yet
 * anywhere on the site (index, sitemap, its own address, the chat) until its
 * date begins in Rochester, Minnesota. The pages refresh every hour, so it
 * appears on the day without a deploy.
 */

export type SectionId = 'guides'

export type Article = {
  section: SectionId
  /** The address: /guides/<slug>. Lowercase words and hyphens. */
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

export const SECTIONS: Record<SectionId, Section> = {
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

export function isPublished(a: Article, now = new Date()): boolean {
  return a.published <= today(now)
}

/** A section's published articles, newest first (same day: the order in the index file). */
export function publishedIn(section: SectionId, now = new Date()): Article[] {
  return ARTICLES.map((a, i) => ({ a, i }))
    .filter(({ a }) => a.section === section && isPublished(a, now))
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
  | { type: 'quote'; text: string }

/**
 * The plain Markdown an article is written in: paragraphs separated by a
 * blank line, "## " sub-headings, "- " lists, "1. " numbered lists, "> "
 * quotes, and [words](/path) links. Nothing else is needed or read.
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
      if (lines.every((l) => l.startsWith('>'))) return { type: 'quote' as const, text: lines.map((l) => l.replace(/^>\s?/, '')).join(' ') }
      return { type: 'p' as const, text: lines.join(' ') }
    })
}

/** The words alone, links read as their words. */
export function plainText(a: Article): string {
  return `${a.lede}\n${blocks(a.body)
    .map((b) => ('items' in b ? b.items.map((i) => `- ${i}`).join('\n') : b.type === 'h2' ? `\n${b.text}` : b.text))
    .join('\n')}`.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
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

/* ---------- For Intelligence's "Summarize this article" ---------- */

export type ArticleText = { path: string; title: string; text: string }

const PATH = /^(guides|blog)\/([a-z0-9-]{1,100})$/
/** The longest article text sent with a question (the blog posts run to about 6,000 characters). */
const MAX_CHARS = 12_000

/**
 * The browser names the article by its path ("guides/…" or "blog/…"); the text always comes from here, never from the browser, and
 * an article not yet published is not found.
 */
export function findArticle(path: unknown, now = new Date()): ArticleText | null {
  if (typeof path !== 'string') return null
  const m = path.match(PATH)
  if (!m) return null
  const [, section, slug] = m
  if (section === 'blog') {
    const p = getPost(slug)
    if (!p) return null
    const text = [p.excerpt, ...p.body.map((b) => ('items' in b ? b.items.map((i) => `- ${i}`).join('\n') : b.text))].join('\n')
    return { path, title: p.title, text: text.slice(0, MAX_CHARS) }
  }
  const a = getArticle(section as SectionId, slug, now)
  return a ? { path, title: a.title, text: plainText(a).slice(0, MAX_CHARS) } : null
}
