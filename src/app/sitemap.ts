import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { SECTIONS, articlePath, publishedIn } from '@/lib/articles'

/* Checked again every hour, so an article joins the sitemap on its publish date (T-388). */
export const revalidate = 3600

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://kingdom-sites.com'
  const posts = getAllPosts()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/get-started`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/ai-tooling`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/portfolio`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/mission`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/ministry`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/prayer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/ruta`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tap-to-tick`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/latin-game`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/refer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/guides`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/from-the-field`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/tap-to-tick/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }))

  const articleRoutes: MetadataRoute.Sitemap = (Object.keys(SECTIONS) as (keyof typeof SECTIONS)[])
    .flatMap((id) => publishedIn(id))
    .map((a) => ({
      url: `${base}${articlePath(a)}`,
      lastModified: new Date(a.updated ?? a.published),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  return [...staticRoutes, ...articleRoutes, ...blogRoutes]
}
