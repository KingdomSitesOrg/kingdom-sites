import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://kingdom-sites.com'

  // The old Blog is off the site for now (T-401): /blog redirects home.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/get-started`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/ai-tooling`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/portfolio`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    // One page per project (T-389).
    { url: `${base}/portfolio/farzana-classroom`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/portfolio/kcupg`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/portfolio/delta`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/mission`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/ministry`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/prayer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/ruta`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tap-to-tick`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/jam-legio`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/refer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/tap-to-tick/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  return staticRoutes
}
