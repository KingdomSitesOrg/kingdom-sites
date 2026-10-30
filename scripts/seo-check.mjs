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
  '/ruta', '/tap-to-tick', '/latin-game', '/blog', '/refer', '/privacy', '/terms',
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
