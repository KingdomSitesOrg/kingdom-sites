import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GA_MEASUREMENT_ID, isGaEnabled } from "@/lib/analytics";
import { ORGANIZATION_LD, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";
import {
  SERVICE_CITY,
  SERVICE_LAT,
  SERVICE_LNG,
  SERVICE_REGION,
  SERVICE_REGION_CODE,
} from "@/lib/local";

const inter = Inter({ subsets: ["latin"] });

const DESCRIPTION = SITE_DESCRIPTION;

// Phones with a keyboard up shrink the page to what is showing (Android Chrome; Safari ignores it).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | Kingdom Sites",
  },
  description: DESCRIPTION,
  metadataBase: new URL("https://kingdom-sites.com"),
  /* Deliberately no site-wide `alternates.canonical`. A canonical set here is
     inherited by every page that does not set its own, which told search
     engines that pages like /about and /my-work were the home page and had
     them dropped as duplicates. Each page declares its own instead. */
  keywords: [
    "mobile app development",
    "custom software development",
    "app developer",
    "fractional CTO",
    "custom product development",
    "software for founders",
    "AI tooling",
    "ongoing product development",
    "custom mobile products",
    SERVICE_CITY,
    SERVICE_REGION,
  ],
  /* No `url` here: every page without its own card would otherwise share as
     the home page's address. Pages that are shared set theirs (shareCard). */
  openGraph: {
    title: SITE_TITLE,
    description: DESCRIPTION,
    siteName: "Kingdom Sites",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* The studio's structured data goes on every page but the Farzana
            ones, which describe their own product (AppShell). */}
        <AppShell structuredData={ORGANIZATION_LD}>{children}</AppShell>
        <Analytics />
        <SpeedInsights />
        {/* Google Analytics 4 — only loads when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */}
        {isGaEnabled() ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null}
      </body>
    </html>
  );
}
