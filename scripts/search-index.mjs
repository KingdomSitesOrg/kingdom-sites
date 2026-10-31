#!/usr/bin/env node
/* Builds the site search's index (T-391) from the pages a build has rendered:
   each page's title, description, headings and main text, read the way a
   visitor sees them (no header, menu, footer or chat). Run after `next build`
   (the build script does):

     node scripts/search-index.mjs            (reads .next, writes public/search-index.json)

   Every prerendered page is in, so pages added later are picked up on their
   next build. Left out: pages that say noindex, pages that redirect elsewhere,
   the Farzana pages (farzana.app's own) and private tools. Legal pages are in
   by title only. The search panel fetches the file only when it is opened. */
import fs from 'fs'
import path from 'path'

const NEXT = path.resolve(process.argv[2] ?? '.next')
const OUT = path.resolve(process.argv[3] ?? 'public/search-index.json')
const APP = path.join(NEXT, 'server/app')

/** The most text kept from any one page; enough for a snippet anywhere in a long guide. */
const MAX_TEXT = 9000

/** Pages that render on demand (no prerendered HTML) but are linked from every page's menu. */
const ON_DEMAND = [
  { u: '/sign', t: 'Sign', s: 'Tools', d: 'Kingdom Sites Sign: send PDF agreements and have them signed online.', h: [], b: '' },
]

/** Never in search, whatever the page says about itself. */
const PRIVATE = [/^\/farzana(\/|$)/, /^\/sign\//, /^\/calc$/, /^\/billing$/, /^\/feedback$/, /^\/refer\/track\//, /^\/r\//]

const LEGAL = [/\/privacy$/, /^\/terms$/]

/** The label shown under each result: the part of the site it belongs to. */
function sectionOf(route) {
  if (route === '/') return 'Home'
  if (LEGAL.some((re) => re.test(route))) return 'Legal'
  if (/^\/(portfolio|ruta|jam-legio|tap-to-tick)(\/|$)/.test(route)) return 'Portfolio'
  if (/^\/guides(\/|$)/.test(route)) return 'Guides'
  if (/^\/blog(\/|$)/.test(route)) return 'Blog'
  if (/^\/(ministry|prayer)(\/|$)/.test(route)) return 'Ministries'
  if (/^\/(rochester-mn|churches|schools|local-business)(\/|$)/.test(route)) return 'Who I work with'
  if (route === '/get-started') return 'Get started'
  return 'Studio'
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…', middot: '·', copy: '©' }
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m),
  )

const VOID = new Set(['area', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

/** Cuts out every element whose start tag matches `start`, with everything inside it. */
function cut(html, start) {
  const re = new RegExp(start.source, 'gi')
  let out = ''
  let from = 0
  for (;;) {
    re.lastIndex = from
    const m = re.exec(html)
    if (!m) break
    const tag = m[0].match(/^<([a-z0-9-]+)/i)[1].toLowerCase()
    out += html.slice(from, m.index)
    let at = m.index + m[0].length
    if (VOID.has(tag) || m[0].endsWith('/>')) {
      from = at
      continue
    }
    // Walk to the matching close tag, counting nested ones of the same name.
    const tags = new RegExp(`<(/?)${tag}(?=[\\s>/])[^>]*>`, 'gi')
    tags.lastIndex = at
    let depth = 1
    let t
    while (depth > 0 && (t = tags.exec(html))) depth += t[1] ? -1 : t[0].endsWith('/>') ? 0 : 1
    from = t ? tags.lastIndex : html.length
  }
  return out + html.slice(from)
}

const BLOCK = /<\/?(p|div|h[1-6]|li|ul|ol|br|section|article|header|main|tr|td|th|dt|dd|figcaption|blockquote|button|a)\b[^>]*>/gi
// Lines set as separate spans (a two-line headline) are separate words.
const textOf = (html) =>
  decode(html.replace(BLOCK, ' ').replace(/(<\/[a-z0-9]+>)(?=<[a-z])/gi, '$1 ').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()

function pageOf(html, route) {
  const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? ''
  if (/noindex/i.test(robots)) return null
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').replace(/\s*\|\s*Kingdom Sites$/, '').trim()
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '').trim()
  if (!title) return null
  const section = sectionOf(route)
  if (section === 'Legal') return { u: route, t: title, s: section, d: description, h: [], b: '', l: 1 }

  const first = html.indexOf('<main')
  const last = html.lastIndexOf('</main>')
  let main = first >= 0 && last > first ? html.slice(first, last) : ''
  for (const start of [
    /<(script|style|noscript|template|svg|nav|footer)\b[^>]*>/,
    /<header class="cn-head"[^>]*>/,
    // The chat built into the Get started page: its greeting is not the page's text.
    /<div class="ki ki--inline[^"]*"[^>]*>/,
    /<[a-z0-9-]+\b[^>]*\baria-hidden="true"[^>]*>/,
  ])
    main = cut(main, start)

  // A heading that only repeats the title (a post's h1) adds nothing.
  const headings = [...main.matchAll(/<h([1-3])\b[^>]*>([^]*?)<\/h\1>/gi)]
    .map((m) => textOf(m[2]))
    .filter((h) => h && h.toLowerCase() !== title.toLowerCase())
  const body = textOf(main).slice(0, MAX_TEXT)
  return { u: route, t: title, s: section, d: description, h: [...new Set(headings)].slice(0, 40), b: body }
}

function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* htmlFiles(file)
    else if (entry.name.endsWith('.html')) yield file
  }
}

if (!fs.existsSync(APP)) {
  console.error(`search-index: no build at ${path.relative(process.cwd(), APP)}; run next build first`)
  process.exit(1)
}

// Addresses that send the visitor elsewhere (next.config.ts redirects) are not pages to find.
const manifest = JSON.parse(fs.readFileSync(path.join(NEXT, 'routes-manifest.json'), 'utf8'))
const redirected = (manifest.redirects ?? []).filter((r) => !r.internal && !r.has).map((r) => new RegExp(r.regex))

const pages = []
for (const file of htmlFiles(APP)) {
  const rel = path.relative(APP, file).split(path.sep).join('/').replace(/\.html$/, '')
  if (rel.split('/').some((part) => part.startsWith('_'))) continue
  const route = rel === 'index' ? '/' : `/${rel}`
  if (PRIVATE.some((re) => re.test(route)) || redirected.some((re) => re.test(route))) continue
  const page = pageOf(fs.readFileSync(file, 'utf8'), route)
  if (page) pages.push(page)
}

// Home first, then the order a visitor meets the site: sections, then top-level pages before their children.
const ORDER = ['Home', 'Portfolio', 'Studio', 'Who I work with', 'Guides', 'Get started', 'Blog', 'Ministries', 'Tools', 'Legal']
pages.push(...ON_DEMAND.filter((p) => !pages.some((q) => q.u === p.u)))
pages.sort((a, b) => ORDER.indexOf(a.s) - ORDER.indexOf(b.s) || a.u.split('/').length - b.u.split('/').length || a.u.localeCompare(b.u))

if (pages.length < 5) {
  console.error(`search-index: only ${pages.length} pages found in ${APP}; refusing to write a near-empty index`)
  process.exit(1)
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify({ v: 1, pages }))
console.log(`search-index: ${pages.length} pages, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB -> ${path.relative(process.cwd(), OUT)}`)
console.log(`  ${pages.map((p) => p.u).join(' ')}`)
