import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/auth", "/billing"],
    },
    sitemap: "https://kingdom-sites.com/sitemap.xml",
  };
}
