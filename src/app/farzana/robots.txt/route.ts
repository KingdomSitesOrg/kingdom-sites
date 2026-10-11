/**
 * farzana.app/robots.txt (rewritten here in next.config.ts): everything may be
 * read, and the sitemap is next door. This site's own robots.txt stays for
 * kingdom-sites.com.
 */
export const dynamic = 'force-static'

export function GET() {
  return new Response('User-agent: *\nAllow: /\n\nSitemap: https://farzana.app/sitemap.xml\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
