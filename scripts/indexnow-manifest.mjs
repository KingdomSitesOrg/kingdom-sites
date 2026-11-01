#!/usr/bin/env node
/* Writes public/indexnow.json (T-398): a fingerprint of every searchable
   page's words, from the site search's index, and, on a production build,
   the pages whose words differ from the live site's (new pages included).
   The daily /api/indexnow run sends those to IndexNow. Run after
   scripts/search-index.mjs (the build script does):

     node scripts/indexnow-manifest.mjs

   If the live site has no manifest yet (the first deploy with this file),
   every page counts as changed. Other builds list nothing as changed. */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const SITE = 'https://kingdom-sites.com'
const INDEX = path.resolve('public/search-index.json')
const OUT = path.resolve('public/indexnow.json')

/** Not worth a crawler's visit: on-demand tools and legal pages. */
const SKIP = [/^\/sign$/, /\/privacy$/, /^\/terms$/]

const { pages } = JSON.parse(fs.readFileSync(INDEX, 'utf8'))
const fingerprints = {}
for (const p of pages) {
  if (SKIP.some((re) => re.test(p.u))) continue
  fingerprints[p.u] = crypto.createHash('sha1').update(JSON.stringify([p.t, p.d, p.h, p.b])).digest('hex').slice(0, 16)
}

let changed = []
if (process.env.VERCEL_ENV === 'production') {
  let live = null
  try {
    const res = await fetch(`${SITE}/indexnow.json`, { signal: AbortSignal.timeout(10_000) })
    if (res.ok) live = (await res.json()).pages ?? null
  } catch {
    live = null
  }
  changed = Object.keys(fingerprints).filter((u) => !live || live[u] !== fingerprints[u])
  console.log(`indexnow: ${changed.length} of ${Object.keys(fingerprints).length} pages changed since the live site${live ? '' : ' (no live manifest: all)'}`)
} else {
  console.log(`indexnow: ${Object.keys(fingerprints).length} pages fingerprinted (not production: nothing to send)`)
}

fs.writeFileSync(OUT, JSON.stringify({ builtAt: new Date().toISOString(), pages: fingerprints, changed }))
