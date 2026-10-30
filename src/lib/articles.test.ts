import fs from 'fs'
import path from 'path'
import { describe, expect, it, vi } from 'vitest'
import type { Article } from '@/lib/articles'

/* The Guides section (T-388): every article file is well formed, and an
   article dated in the future stays hidden everywhere until its day begins in
   Rochester, Minnesota. */

const FUTURE: Article = {
  section: 'guides',
  slug: 'not-yet',
  title: 'Not yet',
  description: 'A story for later.',
  lede: 'Not yet.',
  published: '2026-11-05',
  body: 'Later.',
}

vi.mock('@/content/articles', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/content/articles')>()
  return { ARTICLES: [...real.ARTICLES, FUTURE] }
})

const { ARTICLES } = await import('@/content/articles')
const { SECTIONS, blocks, findArticle, getArticle, isPublished, publishedIn } = await import('@/lib/articles')
const { PROJECTS } = await import('@/lib/work')
const sitemap = (await import('@/app/sitemap')).default

const BEFORE = new Date('2026-11-05T05:59:00Z') // 11:59 pm on 4 November in Rochester
const ON = new Date('2026-11-05T06:00:00Z') // midnight on 5 November in Rochester

describe('scheduled publishing', () => {
  it('starts an article at midnight on its date, Rochester time', () => {
    expect(isPublished(FUTURE, BEFORE)).toBe(false)
    expect(isPublished(FUTURE, ON)).toBe(true)
  })

  it('keeps a future article out of the index, its address and the chat until then', () => {
    expect(publishedIn('guides', BEFORE).map((a) => a.slug)).not.toContain('not-yet')
    expect(getArticle('guides', 'not-yet', BEFORE)).toBeUndefined()
    expect(findArticle('guides/not-yet', BEFORE)).toBeNull()

    expect(publishedIn('guides', ON).map((a) => a.slug)).toContain('not-yet')
    expect(getArticle('guides', 'not-yet', ON)?.title).toBe('Not yet')
    expect(findArticle('guides/not-yet', ON)?.title).toBe('Not yet')
  })

  it('keeps it out of the sitemap', () => {
    vi.useFakeTimers()
    vi.setSystemTime(BEFORE)
    expect(sitemap().map((e) => e.url)).not.toContain('https://kingdom-sites.com/guides/not-yet')
    vi.setSystemTime(ON)
    expect(sitemap().map((e) => e.url)).toContain('https://kingdom-sites.com/guides/not-yet')
    vi.useRealTimers()
  })

  it('lists newest first', () => {
    const dates = publishedIn('guides').map((a) => a.published)
    expect([...dates].sort().reverse()).toEqual(dates)
  })
})

describe('every article file', () => {
  const real = ARTICLES.filter((a) => a !== FUTURE)

  it.each(real.map((a) => [`${a.section}/${a.slug}`, a] as const))('%s is well formed', (_, a) => {
    expect(Object.keys(SECTIONS)).toContain(a.section)
    expect(a.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    for (const d of [a.published, a.updated].filter(Boolean) as string[]) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(new Date(`${d}T12:00:00Z`).toISOString().slice(0, 10)).toBe(d)
    }
    expect(a.title.trim()).not.toBe('')
    expect(a.lede.trim()).not.toBe('')
    expect(a.description.length).toBeGreaterThan(50)
    expect(a.description.length).toBeLessThanOrEqual(200)
    expect(blocks(a.body).length).toBeGreaterThan(2)
    for (const slug of a.related ?? []) expect(PROJECTS.map((p) => p.slug), slug).toContain(slug)
    if (a.cover) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', a.cover.photo))).toBe(true)
      expect(a.cover.alt.trim()).not.toBe('')
    }
  })

  it('has no two articles at the same address', () => {
    const paths = real.map((a) => `${a.section}/${a.slug}`)
    expect(new Set(paths).size).toBe(paths.length)
  })
})
