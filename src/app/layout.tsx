import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GA_MEASUREMENT_ID, isGaEnabled } from "@/lib/analytics";
import {
  AREA_SERVED,
  LOCAL_KEYWORDS,
  SERVICE_CITY,
  SERVICE_LAT,
  SERVICE_LNG,
  SERVICE_REGION,
  SERVICE_REGION_CODE,
} from "@/lib/local";

const inter = Inter({ subsets: ["latin"] });

const DESCRIPTION =
  "Websites, Google listings and local search for small businesses — get more clients, get found on Google, one monthly fee, first month free, cancel any time.";

export const metadata: Metadata = {
  title: {
    default: "Kingdom Sites — grow your local business",
    template: "%s | Kingdom Sites",
  },
  description: DESCRIPTION,
  metadataBase: new URL("https://kingdom-sites.com"),
  /* Deliberately no site-wide `alternates.canonical`. A canonical set here is
     inherited by every page that does not set its own, which told search
     engines that pages like /about and /my-work were the home page and had
     them dropped as duplicates. Each page declares its own instead. */
  keywords: [
    "local business website",
    "small business website",
    "pressure washing website",
    "window cleaning website",
    "landscaping website",
    "home services marketing",
    "local SEO",
    "Google Business Profile",
    "get more leads",
    "get more clients",
    "grow local business",
    "find customers",
    "monthly website service",
    ...LOCAL_KEYWORDS,
  ],
  openGraph: {
    title: "Kingdom Sites — grow your local business",
    description: DESCRIPTION,
    url: "https://kingdom-sites.com",
    siteName: "Kingdom Sites",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kingdom Sites — grow your local business",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  /* Geo meta so crawlers and tools associate the site with Rochester, MN. */
  other: {
    "geo.region": `US-${SERVICE_REGION_CODE}`,
    "geo.placename": SERVICE_CITY,
    "geo.position": `${SERVICE_LAT};${SERVICE_LNG}`,
    ICBM: `${SERVICE_LAT}, ${SERVICE_LNG}`,
  },
};

/* Tells search engines what this business is and where it serves.
   Facts only — no fake street address or star ratings. */
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Kingdom Sites",
  url: "https://kingdom-sites.com",
  description: DESCRIPTION,
  email: "thomas@kingdom-sites.com",
  founder: { "@type": "Person", name: "Thomas Klein" },
  serviceType: [
    "Website design and hosting",
    "Local SEO",
    "Google Business Profile management",
    "Small business marketing",
  ],
  areaServed: AREA_SERVED,
  knowsAbout: [
    "Local SEO",
    "Google Business Profile",
    "Getting more clients",
    "Growing a local business",
    `${SERVICE_CITY} ${SERVICE_REGION} small business marketing`,
  ],
  audience: {
    "@type": "BusinessAudience",
    name: "Local home service and small businesses",
    geographicArea: {
      "@type": "City",
      name: SERVICE_CITY,
      containedInPlace: { "@type": "State", name: SERVICE_REGION },
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <AppShell>{children}</AppShell>
        <Analytics />
        <SpeedInsights />
        {/* Google Analytics 4 — only loads when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */}
        {isGaEnabled() ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null}
      </body>
    </html>
  );
}
