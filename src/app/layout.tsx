import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

const DESCRIPTION =
  "Websites, Google listings and local search for pressure washing, window cleaning, landscaping and other small service businesses — one monthly fee, no setup cost, cancel any time.";

export const metadata: Metadata = {
  title: {
    default: "Kingdom Sites — get your local business found and called",
    template: "%s | Kingdom Sites",
  },
  description: DESCRIPTION,
  metadataBase: new URL("https://kingdom-sites.com"),
  alternates: {
    canonical: "/",
  },
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
    "monthly website service",
  ],
  openGraph: {
    title: "Kingdom Sites — get your local business found and called",
    description: DESCRIPTION,
    url: "https://kingdom-sites.com",
    siteName: "Kingdom Sites",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kingdom Sites — get your local business found and called",
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
};

/* Tells search engines in their own language what this business is and who it
   serves. Facts only — no address, no ratings, nothing that is not true. */
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
  ],
  audience: {
    "@type": "BusinessAudience",
    name: "Local home service businesses",
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
      </body>
    </html>
  );
}
