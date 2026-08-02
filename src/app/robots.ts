import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Product + privacy pages exist for App Store Connect only.
      disallow: ["/dashboard", "/login", "/auth", "/tap-to-tick"],
    },
    sitemap: "https://kingdom-sites.com/sitemap.xml",
  };
}
