import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === 'development'

const csp = [
  "default-src 'self'",
  // Google Analytics 4 loads its tag from googletagmanager.com. Without it
  // listed here the browser blocks the script and no visits are ever recorded.
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://assets.calendly.com https://calendly.com${isDev ? " 'unsafe-eval'" : ''}`,
  // Sentry Session Replay compresses recordings on a background thread that it
  // starts from an in-memory blob: script. Without this it falls back to
  // script-src and gets blocked.
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  // Analytics still falls back to a tracking pixel in some browsers.
  "img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://*.calendly.com https://calendly.com",
  "font-src 'self' https://assets.calendly.com",
  // Sentry reports errors; the Google hosts are where Analytics sends pageviews.
  "connect-src 'self' https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://calendly.com https://*.calendly.com",
  "form-action 'none'",
  // Mission page embeds a YouTube player; links-only would not need this.
  // In development the site may also frame itself, which is how phone-width
  // layouts get checked in a desktop browser. Never allowed in production.
  `frame-src https://www.youtube.com https://www.youtube-nocookie.com https://calendly.com https://*.calendly.com${isDev ? " 'self'" : ''}`,
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

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.102'],
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 95],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
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
      { source: '/pricing', destination: '/get-started', permanent: true },
      { source: '/seo', destination: '/', permanent: true },
      { source: '/software', destination: '/', permanent: true },
      { source: '/rochester-mn', destination: '/', permanent: true },
    ]
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
