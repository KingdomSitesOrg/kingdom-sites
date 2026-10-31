import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import nextConfig from '../../next.config'
import {
  DELTA_LD,
  FARZANA_CLASSROOM_LD,
  JAM_LEGIO_LD,
  KCUPG_LD,
  ORGANIZATION_LD,
  PERSON_LD,
  SITE_TITLE,
  TAP_TO_TICK_LD,
  WEBSITE_LD,
  faqLd,
  jsonLd,
  serviceLd,
  shareCard,
} from '@/lib/seo'
import { CASE_STUDIES } from '@/lib/case-studies'
import { LATIN_STORES, PROJECTS } from '@/lib/work'
import { systemPrompt } from '@/lib/intelligence'

/* The SEO fixes from the T-382 audit, held in place. The rendered pages are
   checked after a build by scripts/seo-check.mjs. */

const APP = path.resolve(__dirname, '../app')

describe('sitemap and robots', () => {
  const urls = sitemap().map((e) => new URL(e.url).pathname)

  it('lists the pages the menu links to', () => {
    for (const p of ['/', '/portfolio', '/about', '/get-started', '/ai-tooling', '/mission', '/refer', '/guides', '/guides/how-a-quote-works', '/rochester-mn', '/churches', '/schools']) {
      expect(urls).toContain(p === '/' ? '/' : p)
    }
  })

  it('leaves out pages that ask not to be indexed or only redirect', () => {
    for (const p of ['/full-potential', '/calc', '/feedback', '/farzana', '/my-work', '/local-business']) {
      expect(urls).not.toContain(p)
    }
  })

  it('does not block /full-potential, so crawlers can read its noindex', () => {
    const rules = [robots().rules].flat()
    const disallowed = rules.flatMap((r) => [r?.disallow ?? []].flat())
    expect(disallowed.some((d) => '/full-potential'.startsWith(d))).toBe(false)
  })
})

describe('redirects', () => {
  it('moves old addresses permanently, so Google carries them over', async () => {
    const list = await nextConfig.redirects!()
    for (const source of ['/local-business', '/my-work', '/work']) {
      const r = list.find((x) => x.source === source)
      expect(r, source).toBeDefined()
      expect(r!.permanent, source).toBe(true)
    }
  })
})

describe('pages for each kind of client (T-387)', () => {
  it('serves /rochester-mn as a page, and sends the old local page there', async () => {
    const list = await nextConfig.redirects!()
    expect(list.find((x) => x.source === '/rochester-mn')).toBeUndefined()
    expect(list.find((x) => x.source === '/local-business')).toMatchObject({ destination: '/rochester-mn', permanent: true })
    for (const page of ['rochester-mn', 'churches', 'schools']) {
      expect(fs.existsSync(path.join(APP, page, 'page.tsx')), page).toBe(true)
    }
  })
})

describe('page titles', () => {
  /* The title template adds " | Kingdom Sites"; a page title that already says
     it shows the brand twice in Google. The home page sets its own full title. */
  it('do not repeat the brand the template adds', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name)
        if (fs.statSync(full).isDirectory()) walk(full)
        else if (/^(page|layout)\.tsx$/.test(name) && full !== path.join(APP, 'page.tsx') && full !== path.join(APP, 'layout.tsx')) {
          const m = fs.readFileSync(full, 'utf8').match(/export const metadata[^]*?\n\}/)
          // The page's own title comes first in its metadata; share-card titles follow.
          const title = m?.[0].match(/^\s*title: '([^']*)'/m)?.[1]
          if (title && /Kingdom Sites/.test(title)) offenders.push(`${path.relative(APP, full)}: ${title}`)
        }
      }
    }
    walk(APP)
    expect(offenders).toEqual([])
  })
})

describe('structured data', () => {
  it('states no facts the site does not publish', () => {
    const text = JSON.stringify([ORGANIZATION_LD, PERSON_LD, TAP_TO_TICK_LD, FARZANA_CLASSROOM_LD, KCUPG_LD, DELTA_LD, WEBSITE_LD])
    for (const invented of ['telephone', 'streetAddress', 'postalCode', 'aggregateRating', 'review', 'openingHours']) {
      expect(text).not.toContain(invented)
    }
  })

  it('names the site Kingdom Sites, so Google can show the name', () => {
    expect(WEBSITE_LD).toMatchObject({ '@type': 'WebSite', name: 'Kingdom Sites', url: 'https://kingdom-sites.com/' })
    expect(WEBSITE_LD.publisher['@id']).toBe(ORGANIZATION_LD['@id'])
    expect(SITE_TITLE).toMatch(/Websites and apps/)
    expect(SITE_TITLE).toMatch(/Rochester/)
  })

  it('builds service and FAQ data from the page words', () => {
    const s = serviceLd({ name: 'x', description: 'y', path: '/churches', audience: 'Churches' })
    expect(s).toMatchObject({ '@type': 'Service', url: 'https://kingdom-sites.com/churches', provider: { '@id': ORGANIZATION_LD['@id'] } })
    const f = faqLd([{ q: 'Q?', a: 'A.' }])
    expect(f.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } })
  })

  it('places the business in Rochester, Minnesota', () => {
    expect(ORGANIZATION_LD.address).toMatchObject({ addressLocality: 'Rochester', addressRegion: 'MN', addressCountry: 'US' })
  })

  it('cannot close its script tag early', () => {
    expect(jsonLd({ a: '</script><b>' })).not.toContain('</')
  })
})

describe('share cards', () => {
  it('carry the page address and a picture', () => {
    const card = shareCard('Portfolio — Kingdom Sites', 'x', '/portfolio')
    expect(card.openGraph.url).toBe('https://kingdom-sites.com/portfolio')
    expect(card.openGraph.images[0].url).toBe('/opengraph-image.jpg')
    expect(fs.existsSync(path.join(APP, 'opengraph-image.jpg'))).toBe(true)
  })
})

describe('JAM Legio (T-382)', () => {
  it('describes the app as Thomas gave it', () => {
    expect(JAM_LEGIO_LD).toMatchObject({
      '@type': 'MobileApplication',
      name: 'JAM Legio',
      url: 'https://kingdom-sites.com/latin-game',
      operatingSystem: 'iOS, Android',
      offers: { price: '19.99', priceCurrency: 'USD' },
      publisher: { name: 'JAM with Latin LLC' },
    })
    expect(JAM_LEGIO_LD.creator.map((c) => c.name)).toEqual(['Kingdom Sites', 'Thomas Klein'])
    expect(JAM_LEGIO_LD.downloadUrl).toEqual([LATIN_STORES.appStore, LATIN_STORES.googlePlay])
  })

  it('lets the chat name JAM Legio but never the company behind it', () => {
    const knowledge = fs.readFileSync(path.resolve(__dirname, '../../content/intelligence.md'), 'utf8')
    const said = knowledge.replace(/<!--[^]*?-->/g, '')
    expect(said).toContain('JAM Legio')
    expect(said).not.toMatch(/JAM with Latin/i)
    expect(said).not.toMatch(/A Latin learning game \(designed/)
    const prompt = systemPrompt('')
    expect(prompt).toContain('JAM Legio')
    expect(prompt).toMatch(/Never name any company or person behind it other than Thomas/)
  })
})

describe('case studies (T-389)', () => {
  const studies = Object.values(CASE_STUDIES)
  const urls = sitemap().map((e) => new URL(e.url).pathname)

  it('each have a page, a sitemap entry and their own share picture', () => {
    for (const s of studies) {
      expect(fs.existsSync(path.join(APP, s.path, 'page.tsx')), s.path).toBe(true)
      expect(urls, s.path).toContain(s.path)
      expect(fs.existsSync(path.resolve(__dirname, '../../public', `.${s.shareImage}`)), s.shareImage).toBe(true)
      expect(s.title, s.path).not.toMatch(/Kingdom Sites/)
    }
  })

  it('are where each project card leads, and link only to real projects', () => {
    for (const s of studies) {
      expect(PROJECTS.some((p) => p.href === s.path), s.path).toBe(true)
      for (const slug of s.related) expect(PROJECTS.find((p) => p.slug === slug)?.href, slug).toBeTruthy()
    }
  })

  it('credit Thomas and Kingdom Sites as the makers', () => {
    for (const ld of [FARZANA_CLASSROOM_LD, KCUPG_LD, DELTA_LD]) {
      expect(ld.creator.map((c) => c.name)).toEqual(['Kingdom Sites', 'Thomas Klein'])
    }
  })
})
