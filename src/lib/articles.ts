import { getPost } from '@/lib/blog'
import { getGuide } from '@/lib/guides'

/**
 * A guide's or blog post's own words, for Intelligence's "Summarize this
 * article" (T-388). The browser names the article by its path ("guides/…" or
 * "blog/…"); the text always comes from here, never from the browser, so the
 * chat only ever reads the site's own articles.
 */

export type Article = { path: string; title: string; text: string }

const PATH = /^(guides|blog)\/([a-z0-9-]{1,100})$/

/** The longest article text sent with a question (the posts run to about 6,000 characters). */
const MAX_CHARS = 12_000

type Block = { type: string; text?: string; items?: string[] }

function plain(blocks: Block[]): string {
  return blocks
    .map((b) => (b.items ? b.items.map((i) => `- ${i}`).join('\n') : b.type === 'h2' ? `\n${b.text}` : b.text ?? ''))
    .join('\n')
    // [words](/path) reads as the words.
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

export function findArticle(path: unknown): Article | null {
  if (typeof path !== 'string') return null
  const m = path.match(PATH)
  if (!m) return null
  const [, section, slug] = m
  if (section === 'guides') {
    const g = getGuide(slug)
    if (!g) return null
    return { path, title: g.question, text: `${g.answer}\n${plain(g.body)}`.slice(0, MAX_CHARS) }
  }
  const p = getPost(slug)
  if (!p) return null
  return { path, title: p.title, text: `${p.excerpt}\n${plain(p.body)}`.slice(0, MAX_CHARS) }
}
