import fs from 'fs'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ARTICLES } from '@/content/articles'
import { SECTIONS, articlePath } from '@/lib/articles'
import { INDEXNOW_KEY, changedSinceDeploy, dueToday, indexNowBody } from '@/lib/indexnow'
import { GET } from '@/app/api/indexnow/route'

/* IndexNow (T-398): the right addresses on the right day, the key file the
   protocol checks, and nothing sent outside production or without the cron's secret. */

describe('IndexNow', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('serves the key file the protocol checks', () => {
    const file = path.resolve(__dirname, `../../public/${INDEXNOW_KEY}.txt`)
    expect(fs.readFileSync(file, 'utf8').trim()).toBe(INDEXNOW_KEY)
    expect(indexNowBody(['/journal'])).toEqual({
      host: 'kingdom-sites.com',
      key: INDEXNOW_KEY,
      keyLocation: `https://kingdom-sites.com/${INDEXNOW_KEY}.txt`,
      urlList: ['https://kingdom-sites.com/journal'],
    })
  })

  it('sends a scheduled article on its day in Rochester, not the day before', () => {
    const a = ARTICLES.find((x) => x.published > '2026-10-31')!
    const day = new Date(`${a.published}T12:00:00-06:00`)
    const before = new Date(day.getTime() - 24 * 60 * 60 * 1000)
    expect(dueToday(day)).toEqual(expect.arrayContaining([articlePath(a), SECTIONS[a.section].path, '/sitemap.xml']))
    expect(dueToday(before)).not.toContain(articlePath(a))
  })

  it('sends a deploy’s changes once: only in the day after the build', () => {
    const builtAt = '2026-11-06T03:00:00Z'
    const m = { builtAt, pages: {}, changed: ['/schools'] }
    expect(changedSinceDeploy(m, new Date('2026-11-06T07:00:00Z'))).toEqual(['/schools'])
    expect(changedSinceDeploy(m, new Date('2026-11-07T07:00:00Z'))).toEqual([])
    expect(changedSinceDeploy(null)).toEqual([])
  })

  it('sends nothing outside production, or without the cron secret', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('CRON_SECRET', 's3cret')
    expect(await (await GET(new Request('https://x/api/indexnow', { headers: { authorization: 'Bearer s3cret' } }))).json()).toMatchObject({ sent: 0 })

    vi.stubEnv('VERCEL_ENV', 'production')
    expect((await GET(new Request('https://x/api/indexnow'))).status).toBe(401)
    vi.stubEnv('CRON_SECRET', '')
    expect((await GET(new Request('https://x/api/indexnow', { headers: { authorization: 'Bearer ' } }))).status).toBe(401)

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('in production, with the secret, sends the deploy’s changes to IndexNow', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('CRON_SECRET', 's3cret')
    const builtAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const posts: unknown[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.endsWith('/indexnow.json')) return Response.json({ builtAt, pages: {}, changed: ['/schools', '/'] })
        if (init?.method === 'POST') {
          posts.push(JSON.parse(String(init.body)))
          return new Response(null, { status: 202 })
        }
        return new Response('ok')
      }),
    )
    const res = await GET(new Request('https://x/api/indexnow', { headers: { authorization: 'Bearer s3cret' } }))
    expect(res.status).toBe(200)
    expect(posts).toHaveLength(1)
    expect((posts[0] as { urlList: string[] }).urlList).toEqual(
      expect.arrayContaining(['https://kingdom-sites.com/schools', 'https://kingdom-sites.com/']),
    )
  })
})
