import type { Metadata, Viewport } from "next";
import "./pocket-thought.css";

const DESCRIPTION =
  "A pocket device for general thoughts, ideas, journal entries and reminders — without pulling out your phone.";

// Shared by link with family and friends; kept out of search and the sitemap.
export const metadata: Metadata = {
  title: { absolute: "Pocket Thought — a thought partner for your pocket" },
  description: DESCRIPTION,
  alternates: { canonical: "/pocket-thought" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Pocket Thought",
    description: "Capture the thought. Keep the moment.",
    url: "/pocket-thought",
    siteName: "Pocket Thought",
    type: "website",
    images: [{ url: "/pocket-thought/og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pocket Thought",
    description: "Capture the thought. Keep the moment.",
    images: ["/pocket-thought/og.jpg"],
  },
};

export const viewport: Viewport = { themeColor: "#fbfbfa" };

export default function PocketThoughtLayout({ children }: { children: React.ReactNode }) {
  return <div className="pocket-thought">{children}</div>;
}
