import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import nextConfig from '../../next.config'
import { JAM_LEGIO_LD, ORGANIZATION_LD, PERSON_LD, TAP_TO_TICK_LD, jsonLd, shareCard } from '@/lib/seo'
import { LATIN_STORES } from '@/lib/work'
import { systemPrompt } from '@/lib/intelligence'

/* The SEO fixes from the T-382 audit, held in place. The rendered pages are
   checked after a build by scripts/seo-check.mjs. */

const APP = path.resolve(__dirname, '../app')

describe('sitemap and robots', () => {
  const urls = sitemap().map((e) => new URL(e.url).pathname)

  it('lists the pages the menu links to', () => {
    for (const p of ['/', '/portfolio', '/about', '/get-started', '/ai-tooling', '/mission', '/refer', '/guides', '/guides/how-a-quote-works']) {
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
    const text = JSON.stringify([ORGANIZATION_LD, PERSON_LD, TAP_TO_TICK_LD])
    for (const invented of ['telephone', 'streetAddress', 'postalCode', 'aggregateRating', 'review', 'openingHours']) {
      expect(text).not.toContain(invented)
    }
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
