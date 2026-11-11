import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

/**
 * kingdom-sites.com/sitemap.xml, built from the real pages (T-533).
 *
 * At build time this walks `src/app`, takes every `page.tsx`, and lists it.
 * A new page appears here with no list to edit. A page is left out when:
 *  - its address has a dynamic part ([slug], [code], [token]) with no resolver below,
 *  - the page, or a layout above it, sets `robots: { index: false }`,
 *  - the page only redirects (`redirect(...)`),
 *  - it is in EXCLUDE below (areas that are not part of this site's public pages).
 *
 * Dates: each page's last-changed date is the last git commit that touched
 * its page file; blog posts use their own date. If git is not available at
 * build time, the page file's modified time is used.
 */

const BASE = 'https://kingdom-sites.com'
const APP_DIR = path.join(process.cwd(), 'src', 'app')

/** Address prefixes that are never listed, with the reason. */
const EXCLUDE: { prefix: string; why: string }[] = [
  { prefix: '/farzana', why: 'served on farzana.app, which has its own sitemap (farzana/sitemap.xml/route.ts); noindex here' },
  { prefix: '/sign', why: 'the e-signature app screens; also disallowed in robots.txt and noindex' },
  { prefix: '/blog', why: 'the blog is off the site for now; next.config.ts redirects /blog and /blog/* to the home page (T-401). Remove this line when the blog returns' },
  { prefix: '/analytics', why: 'private dashboard, a separate project' },
]

/** Dynamic pages whose addresses come from a data source. */
const DYNAMIC: Record<string, () => { path: string; lastModified: Date }[]> = {
  '/blog/[slug]': () =>
    getAllPosts().map((post) => ({ path: `/blog/${post.slug}`, lastModified: new Date(post.date) })),
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name.startsWith('_') ? [] : walk(full)
    return entry.name === 'page.tsx' ? [full] : []
  })
}

/** Route groups like (marketing) are not part of the address. */
function routeOf(file: string): string {
  const parts = path
    .relative(APP_DIR, path.dirname(file))
    .split(path.sep)
    .filter((part) => part && !/^\(.*\)$/.test(part))
  return '/' + parts.join('/')
}

const read = (file: string) => fs.readFileSync(file, 'utf8')

/** The page's own file plus every layout.tsx from the page's folder up to src/app. */
function metadataFiles(pageFile: string): string[] {
  const files = [pageFile]
  let dir = path.dirname(pageFile)
  while (dir.startsWith(APP_DIR)) {
    const layout = path.join(dir, 'layout.tsx')
    if (fs.existsSync(layout)) files.push(layout)
    if (dir === APP_DIR) break
    dir = path.dirname(dir)
  }
  return files
}

const NOINDEX = /index:\s*false/
const REDIRECT_ONLY = /from\s+['"]next\/navigation['"]/

function isIndexable(pageFile: string): boolean {
  const source = read(pageFile)
  if (/\bredirect\(/.test(source) && REDIRECT_ONLY.test(source)) return false
  return !metadataFiles(pageFile).some((file) => NOINDEX.test(read(file)))
}

function lastChanged(file: string): Date {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const date = new Date(out)
    if (out && !Number.isNaN(date.getTime())) return date
  } catch {
    // no git on the build machine: fall through to the file's modified time
  }
  return fs.statSync(file).mtime
}

const excluded = (route: string) =>
  EXCLUDE.some(({ prefix }) => route === prefix || route.startsWith(prefix + '/'))

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const file of walk(APP_DIR).sort()) {
    const route = routeOf(file)
    if (excluded(route) || !isIndexable(file)) continue

    if (route.includes('[')) {
      const expand = DYNAMIC[route]
      if (expand) {
        for (const item of expand()) {
          if (!excluded(item.path)) entries.push({ url: BASE + item.path, lastModified: item.lastModified })
        }
      }
      continue
    }

    entries.push({
      url: route === '/' ? BASE : BASE + route,
      lastModified: lastChanged(file),
      ...(route === '/' ? { priority: 1 } : {}),
    })
  }

  return entries
}
