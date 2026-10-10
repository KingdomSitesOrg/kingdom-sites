"use client";

import { useRef, useState } from "react";

import { useBeat, useInView, useReducedMotion } from "../../_home/motion";
import { Reveal, SectionIntro } from "../../_home/shared";
import { cn } from "../../_ui/cn";

/**
 * Why the name: Farzana is Persian for intelligent, or learned, and a common
 * name among Afghans and across South Asia — the people Thomas has a heart to
 * reach. Beside the words, the name is written the way they write it, one
 * script after another while it is on screen; choosing one keeps it.
 *
 * Dari and Urdu are drawn in IBM Plex Sans Arabic (`--font-plex-arabic`,
 * loaded only when this text is on the page); Bengali and Hindi use the
 * device's own font for their scripts.
 */

const NAMES = [
  { text: "Farzana", language: "English", place: "", lang: "en", dir: "ltr", arabic: false },
  { text: "فرزانه", language: "Dari", place: "Afghanistan", lang: "fa-AF", dir: "rtl", arabic: true },
  { text: "فرزانہ", language: "Urdu", place: "Pakistan", lang: "ur", dir: "rtl", arabic: true },
  { text: "ফারজানা", language: "Bengali", place: "Bangladesh", lang: "bn", dir: "ltr", arabic: false },
  { text: "फ़रज़ाना", language: "Hindi", place: "India", lang: "hi", dir: "ltr", arabic: false },
] as const;

const BEAT_MS = 2600;

export function Reaching() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: false, margin: "0px" });
  const reduced = useReducedMotion();
  const [chosen, setChosen] = useState<number | null>(null);
  const beat = useBeat(NAMES.length, BEAT_MS, visible && !reduced && chosen === null);
  const current = chosen ?? beat;
  const name = NAMES[current];

  return (
    <section className="border-y bg-surface">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:gap-20">
        <SectionIntro
          align="start"
          eyebrow="Why Farzana"
          title="A name Afghans and South Asians know."
        >
          Farzana is Persian for intelligent, or learned. It’s also a common
          name among Afghans and across South Asia, the people I have a heart
          to reach.
        </SectionIntro>

        <Reveal delay={120}>
          <div
            ref={ref}
            className="flex flex-col items-center gap-6 rounded-lg border bg-background px-6 py-10"
          >
            <div className="flex h-32 items-center justify-center sm:h-36">
              <p
                key={current}
                lang={name.lang}
                dir={name.dir}
                className={cn(
                  "fz-motion text-[64px] leading-none font-semibold text-heading sm:text-[80px] [animation:fz-rise_.7s_cubic-bezier(.2,.7,.2,1)_both]",
                  name.lang === "en"
                    ? "font-display"
                    : name.arabic
                      ? "font-[family-name:var(--font-plex-arabic)] font-medium"
                      : "font-medium",
                )}
              >
                {name.text}
              </p>
            </div>
            <p className="text-caption">
              {name.language}
              {name.place ? ` · ${name.place}` : ""}
            </p>
            <div
              role="group"
              aria-label="Show the name in"
              className="flex flex-wrap justify-center gap-2"
            >
              {NAMES.map((entry, index) => (
                <button
                  key={entry.language}
                  type="button"
                  aria-pressed={current === index}
                  onClick={() => setChosen(index)}
                  className={cn(
                    "inline-flex h-11 cursor-pointer items-center rounded-sm border px-4 text-sm font-medium transition-colors",
                    current === index
                      ? "border-transparent bg-accent-wash text-primary"
                      : "bg-surface text-heading hover:bg-wash",
                  )}
                >
                  {entry.language}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
