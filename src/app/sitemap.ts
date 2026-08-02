import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://kingdom-sites.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/my-work`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/ministry`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/prayer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    // /tap-to-tick is intentionally unlisted — App Store marketing URL only.
    { url: `${base}/latin-game`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/ruta`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/ai-tooling`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/mission`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
