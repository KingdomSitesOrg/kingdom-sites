import { ARTICLES } from '@/content/articles'
import { SECTIONS, articlePath, today } from '@/lib/articles'
import { SITE_URL } from '@/lib/seo'

/**
 * IndexNow (T-398): tells Bing (and the other engines that share IndexNow)
 * which addresses are new or changed, so they are crawled in hours rather
 * than weeks. Production only. Two moments send a list:
 *
 * - A production deploy: the build (scripts/indexnow-manifest.mjs) compares
 *   every page's words with the live site's and writes the changed addresses
 *   to /indexnow.json; the next daily run sends them.
 * - A scheduled article's day: on its publish (or update) date the article,
 *   its section's page (Journal or Guides) and the sitemap are sent.
 *
 * The daily run is the Vercel cron in vercel.json, calling /api/indexnow.
 * The key is public by design: IndexNow checks it against the file
 * public/<key>.txt, which proves the site is ours.
 */

export const INDEXNOW_KEY = '5bf98b6d65e48a3b510886b8d4cd1988'
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/** What the build writes to public/indexnow.json. */
export type IndexNowManifest = { builtAt: string; pages: Record<string, string>; changed: string[] }

/** The addresses an article's date brings to life today (Rochester time), as paths. */
export function dueToday(now = new Date()): string[] {
  const day = today(now)
  const due = ARTICLES.filter((a) => a.published === day || a.updated === day)
  if (due.length === 0) return []
  return [
    ...new Set([...due.map(articlePath), ...due.map((a) => SECTIONS[a.section].path), '/sitemap.xml']),
  ]
}

/** A deploy's changed pages, if it was built in the last day (one daily run sends them once). */
export function changedSinceDeploy(manifest: IndexNowManifest | null, now = new Date()): string[] {
  if (!manifest) return []
  const age = now.getTime() - new Date(manifest.builtAt).getTime()
  return age >= 0 && age < 24 * 60 * 60 * 1000 ? manifest.changed : []
}

/** The request body IndexNow expects, for paths on this site. */
export function indexNowBody(paths: string[]) {
  return {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: paths.map((p) => `${SITE_URL}${p}`),
  }
}
