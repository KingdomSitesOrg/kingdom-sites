#!/usr/bin/env node
/* Checks the pages a build has rendered, the way a search engine reads them:
   one h1, a title and description of their own, a canonical that names the
   page itself, a share picture, a share address that is not the home page's,
   and structured data that parses. Run after `next build`:

     node scripts/seo-check.mjs            (reads .next/server/app)

   Exits 1 and names each page and problem when anything fails (T-382). */
import fs from 'fs'
import path from 'path'

const OUT = path.resolve(process.argv[2] ?? '.next/server/app')
const SITE = 'https://kingdom-sites.com'

/* Public pages that should rank. Private tools (/calc, /feedback, sign-in) are
   noindex and left out. */
const ROUTES = [
  '/', '/about', '/portfolio', '/get-started', '/ai-tooling', '/mission', '/ministry', '/prayer',
  '/ruta', '/tap-to-tick', '/latin-game', '/refer', '/privacy', '/terms',
  '/portfolio/farzana-classroom', '/portfolio/kcupg', '/portfolio/delta',
  '/journal', '/guides', '/guides/website-or-app', '/guides/how-a-quote-works', '/guides/cost-to-keep-an-app-running',
]

const attr = (html, re) => html.match(re)?.[1]?.replace(/&amp;/g, '&')
const meta = (html, key) =>
  attr(html, new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]+content="([^"]*)"`))

let failed = 0
const titles = new Map()
for (const route of ROUTES) {
  const file = path.join(OUT, route === '/' ? 'index.html' : `${route}.html`)
  if (!fs.existsSync(file)) {
    console.log(`?  ${route}: no prerendered HTML at ${path.relative(process.cwd(), file)}`)
    continue
  }
  const html = fs.readFileSync(file, 'utf8')
  const problems = []
  const title = attr(html, /<title>([^<]*)<\/title>/)
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/)
  const ogUrl = meta(html, 'og:url')

  if (!title) problems.push('no title')
  else if ((title.match(/Kingdom Sites/g) ?? []).length > 1) problems.push(`brand twice in title: ${title}`)
  if (title) titles.set(title, [...(titles.get(title) ?? []), route])
  if (!meta(html, 'description')) problems.push('no description')
  if (h1s !== 1) problems.push(`${h1s} h1 headings`)
  if (canonical !== (route === '/' ? SITE : SITE + route)) problems.push(`canonical is ${canonical}`)
  if (!meta(html, 'og:image')) problems.push('no share picture (og:image)')
  if (route !== '/' && ogUrl === SITE) problems.push('shares as the home page (og:url)')
  for (const m of html.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1])
    } catch {
      problems.push('structured data does not parse')
    }
  }
  // JAM Legio is named by its name; the old stand-in names are gone (T-382).
  const text = html.replace(/<script[^]*?<\/script>/g, '')
  if (/Latin practice game|A Latin learning game ·/.test(text)) problems.push('still calls JAM Legio by an old name')
  if (['/', '/portfolio', '/latin-game'].includes(route) && !text.includes('JAM Legio')) problems.push('does not name JAM Legio')
  // JAM with Latin appears only in the partnership credit (the partner line, and
  // /latin-game's description and app data), never anywhere else on a page.
  // On /latin-game the credit area also holds Alexis Carrico's words, credited
  // "Alexis Carrico, JAM with Latin" (Thomas, T-389).
  let outsideCredit = text.replace(/<p class="[^"]*partner[^"]*">[^]*?<\/p>/g, '')
  if (route === '/latin-game') {
    outsideCredit = outsideCredit.replace(/<meta[^>]*>/g, '').replace(/<figure class="partner-quote">[^]*?<\/figure>/g, '')
  }
  if (/JAM with Latin/i.test(outsideCredit)) problems.push('names JAM with Latin outside the partnership credit')
  if (route === '/latin-game') {
    if (!/JAM Legio/.test(title ?? '') || !/Latin game/i.test(title ?? '')) problems.push(`title should carry JAM Legio and "Latin game": ${title}`)
    if (!/Latin vocabulary game/i.test(meta(html, 'description') ?? '')) problems.push('description should carry "Latin vocabulary game"')
    const app = [...html.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g)]
      .map((m) => { try { return JSON.parse(m[1]) } catch { return null } })
      .find((d) => d?.['@type'] === 'MobileApplication')
    if (!app) problems.push('no MobileApplication structured data')
    else {
      if (app.name !== 'JAM Legio') problems.push(`app data names ${app.name}`)
      if (app.offers?.price !== '19.99' || app.offers?.priceCurrency !== 'USD') problems.push('app data price is not 19.99 USD')
      if (app.publisher?.name !== 'JAM with Latin LLC') problems.push('app data publisher is not JAM with Latin LLC')
      if (![app.creator].flat().some((c) => c?.name === 'Kingdom Sites')) problems.push('app data does not credit Kingdom Sites')
      if (!(app.downloadUrl ?? []).some((u) => u.includes('apps.apple.com')) || !(app.downloadUrl ?? []).some((u) => u.includes('play.google.com')))
        problems.push('app data lacks a store link')
    }
  }
  if (problems.length) failed++
  console.log(`${problems.length ? 'x ' : 'ok'} ${route}${problems.length ? ': ' + problems.join('; ') : ''}`)
}
for (const [title, routes] of titles) {
  if (routes.length > 1) {
    failed++
    console.log(`x  same title on ${routes.join(', ')}: ${title}`)
  }
}
process.exit(failed ? 1 : 0)
