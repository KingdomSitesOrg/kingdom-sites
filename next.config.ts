import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === 'development'

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://assets.calendly.com https://calendly.com${isDev ? " 'unsafe-eval'" : ''}`,
  // Sentry Session Replay compresses recordings on a background thread that it
  // starts from an in-memory blob: script. Without this it falls back to
  // script-src and gets blocked.
  "worker-src 'self' blob: https://unpkg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.calendly.com https://unpkg.com https://calendly.com",
  "font-src 'self' https://assets.calendly.com",
  // Sentry reports errors.
  `connect-src 'self' https://unpkg.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://calendly.com https://*.calendly.com`,
  "form-action 'none'",
  // Mission page embeds YouTube; /sign embeds same-origin PDF previews (and blob:).
  `frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com https://calendly.com https://*.calendly.com`,
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/**
 * The Farzana pages, at their clean address on farzana.app and where they
 * live in this project. farzana.localhost is the same, for trying it on this
 * Mac (http://farzana.localhost:3148).
 */
const FARZANA_HOST = { type: 'host' as const, value: '(farzana\\.app|farzana\\.localhost)' }
const FARZANA_PAGES: [clean: string, here: string][] = [
  ['/', '/farzana'],
  ['/about', '/farzana/about'],
  ['/pricing', '/farzana/pricing'],
  ['/book', '/farzana/book'],
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.102'],
  // Intelligence reads what it knows from this file at run time (T-375).
  outputFileTracingIncludes: { '/api/intelligence': ['./content/intelligence.md'] },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 95],
  },
  async headers() {
    return [
      {
        // Not /analytics: that is the private dashboard (its own project), with its own headers.
        source: '/((?!analytics(?:/|$)).*)',
        headers: securityHeaders,
      },
      // /farzana is unlisted: shareable by link, kept out of search (the page and the film).
      { source: '/farzana', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/farzana/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      // Preview builds (the share link, preview.kingdom-sites.com) are copies of the site:
      // every response says noindex, so search engines keep them out. Production is unchanged.
      ...(process.env.VERCEL_ENV === 'preview'
        ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
        : []),
    ]
  },
  // Links people already have in hand, typed or shared without the hyphens.
  // These used to 404; they now land on the right page.
  async redirects() {
    return [
      { source: '/jam-with-latin', destination: '/latin-game', permanent: true },
      { source: '/jamwithlatin', destination: '/latin-game', permanent: true },
      { source: '/latin', destination: '/latin-game', permanent: true },
      { source: '/latingame', destination: '/latin-game', permanent: true },
      { source: '/why-us', destination: '/mission', permanent: true },
      // The local business pitch used to live at /grow; it is the home page now.
      { source: '/grow', destination: '/', permanent: true },
      { source: '/taptotick', destination: '/tap-to-tick', permanent: true },
      { source: '/aitooling', destination: '/ai-tooling', permanent: true },
      { source: '/pricing', destination: '/get-started', permanent: true, missing: [FARZANA_HOST] },
      { source: '/seo', destination: '/', permanent: true },
      { source: '/software', destination: '/', permanent: true },
      // The old local SEO page; its own redirect() answered 307 (temporary),
      // which keeps the old address in Google's index. Rochester businesses
      // have their own page again (T-387), so it goes there.
      { source: '/local-business', destination: '/rochester-mn', permanent: true },
      // The work pages are one Portfolio page now; the Farzana Classroom case
      // study is its first section.
      { source: '/my-work', destination: '/portfolio', permanent: true },
      { source: '/work', destination: '/portfolio', permanent: true },
      { source: '/work/farzana', destination: '/portfolio#farzana', permanent: true },
      // Edu is now Farzana, at farzana.app. The film's end card and links
      // already shared say /edu or /farzana; temporary, since the pages move
      // from this project to the Farzana app itself at launch.
      // The old Blog is off the site for now (T-401); the pages stay in the
      // project, but its addresses land on the home page. Temporary (307).
      { source: '/blog', destination: '/', permanent: false },
      { source: '/blog/:slug*', destination: '/', permanent: false },
      { source: '/edu', destination: 'https://farzana.app', permanent: false },
      { source: '/edu/:path*', destination: 'https://farzana.app', permanent: false },
      ...FARZANA_PAGES.flatMap(([clean, here]) => [
        // On farzana.app, the /farzana/... links the pages use go to the clean address.
        { source: here, destination: clean, permanent: false, has: [FARZANA_HOST] },
        // Anywhere else, the pages live at farzana.app now — except on a dev
        // server, where localhost:3148/farzana and the phone's link keep working.
        ...(isDev
          ? []
          : [{ source: here, destination: `https://farzana.app${clean}`, permanent: false, missing: [FARZANA_HOST] }]),
      ]),
      // www.farzana.app is farzana.app.
      {
        source: '/:path*',
        destination: 'https://farzana.app/:path*',
        permanent: true,
        has: [{ type: 'host' as const, value: 'www.farzana.app' }],
      },
    ]
  },
  // farzana.app is served from this project until the Farzana app has its own
  // production: its clean addresses show the Farzana pages, before this site's
  // own pages of the same name (/about, /pricing).
  async rewrites() {
    return {
      beforeFiles: [
        ...FARZANA_PAGES,
        // farzana.app's own robots.txt and sitemap, in place of this site's.
        ['/robots.txt', '/farzana/robots.txt'],
        ['/sitemap.xml', '/farzana/sitemap.xml'],
      ].map(([clean, here]) => ({
        source: clean,
        destination: here,
        has: [FARZANA_HOST],
      })),
      // kingdom-sites.com/analytics is Thomas's private dashboard, a separate Vercel
      // project (kingdom-analytics, basePath /analytics) behind its own sign-in.
      afterFiles: [
        { source: '/analytics', destination: 'https://kingdom-analytics.vercel.app/analytics' },
        { source: '/analytics/:path*', destination: 'https://kingdom-analytics.vercel.app/analytics/:path*' },
      ],
      fallback: [],
    }
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
})
