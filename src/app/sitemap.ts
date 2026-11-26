import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://kingdom-sites.com'

  // Omit lastModified rather than stamping every unchanged route with build time.
  // /media stays out while it is noindex (no video samples yet).
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/get-started`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/request`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/ai-tooling`, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/portfolio`, changeFrequency: 'monthly', priority: 0.85 },
    // One page per project (T-389).
    { url: `${base}/portfolio/farzana-classroom`, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/portfolio/kcupg`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/portfolio/delta`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/mission`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/ministry`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/prayer`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/ruta`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tap-to-tick`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/latin-game`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/refer`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/tap-to-tick/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  return staticRoutes
}
