import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Inter_Tight } from "next/font/google";
// The production build failed on Google fonts asked for by fixed weights
// ("next/font/google queries have exactly one entry"): Inter and Inter Tight
// load as variable fonts (every weight in one file, as the site's other fonts
// do), and Geist Mono comes from Vercel's own package, as font files on disk.
import { GeistMono } from "geist/font/mono";
import "./strata.css";

/*
 * STRATA: a concept site for a made-up 3D printing company, built by Kingdom Sites to show what a scroll film in
 * WebGL can do. Its code lives in src/strata, its stills and plates in public/strata. Everything here stays on
 * /strata: the fonts and stylesheet load from this layout only, and AppShell leaves the studio's header, footer
 * and Intelligence card off this page.
 */

const display = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const text = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = GeistMono;

const DESCRIPTION =
  "A concept site by Kingdom Sites: a scroll film in WebGL for STRATA, a made-up 3D printing company.";

export const metadata: Metadata = {
  title: { absolute: "STRATA concept site | Kingdom Sites" },
  description: DESCRIPTION,
  // A made-up company: kept out of search.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: "/strata" },
  openGraph: {
    title: "STRATA concept site | Kingdom Sites",
    description: DESCRIPTION,
    url: "/strata",
    siteName: "Kingdom Sites",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#03050A",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function StrataLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div
      className={`strata-root ${display.variable} ${text.variable} ${mono.variable} bg-bg-0 font-text text-text-1 antialiased`}
    >
      {children}
    </div>
  );
}
