import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/analytics", "/dashboard", "/login", "/auth", "/billing", "/sign", "/api/sign"],
    },
    sitemap: "https://kingdom-sites.com/sitemap.xml",
  };
}
