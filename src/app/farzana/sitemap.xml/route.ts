/**
 * farzana.app/sitemap.xml (rewritten here in next.config.ts): the four pages
 * at their farzana.app addresses. This site's own sitemap stays for
 * kingdom-sites.com and does not list them.
 */
export const dynamic = 'force-static'

const PAGES = [
  { path: '/', priority: '1.0' },
  { path: '/pricing', priority: '0.9' },
  { path: '/about', priority: '0.8' },
  { path: '/book', priority: '0.7' },
]

export function GET() {
  const urls = PAGES.map(
    ({ path, priority }) =>
      `  <url><loc>https://farzana.app${path === '/' ? '' : path}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`,
  ).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
