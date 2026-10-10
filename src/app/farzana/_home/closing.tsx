"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FileCsvIcon,
  FilePdfIcon,
} from "@phosphor-icons/react";

import { Diamond } from "../_ui/diamond";
import { Wordmark } from "../_ui/wordmark";
import { cn } from "../_ui/cn";

import { useInView, useReducedMotion } from "./motion";
import {
  Actions,
  Bar,
  Eyebrow,
  Reveal,
  SectionIntro,
} from "./shared";

/**
 * The last movements of the page: switching from another provider, what the
 * name means and where the look comes from, the film, and the call to book one
 * more time on the lapis band.
 */

/* ---- Switching ---------------------------------------------------------- */

export function Switching() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -25% 0px" });
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced || !inView) return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return Math.min(100, current + 4);
      });
    }, 60);
    return () => window.clearInterval(timer);
  }, [inView, reduced]);

  // Under reduced motion it is simply done.
  const shown = reduced ? 100 : progress;
  const done = shown >= 100;
  const moving = shown > 0 && !done;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
      <div className="surface-card grid items-center gap-12 overflow-hidden rounded-lg p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
        <SectionIntro
          align="start"
          id="switching"
          eyebrow="Switching is easy"
          title="Already using something else? Move over in about ten minutes."
        >
          Bring your students with you in one import. You don’t have to start
          over.
        </SectionIntro>

        <div ref={ref} aria-hidden className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <FileChip
                icon={<FileCsvIcon className="size-5 text-accent" />}
                name="students.csv"
                gone={shown > 30}
              />
              <FileChip
                icon={<FilePdfIcon className="size-5 text-accent" />}
                name="class-notes.pdf"
                gone={shown > 60}
              />
            </div>
            <ArrowRightIcon
              weight="bold"
              className={cn(
                "size-6 shrink-0 text-muted transition-colors rtl:-scale-x-100",
                moving && "text-accent",
              )}
            />
            <div
              className={cn(
                "flex min-h-28 min-w-36 flex-col items-center justify-center gap-2 rounded-lg border bg-background px-5 py-4 transition-colors duration-500",
                done && "border-transparent bg-accent-wash",
              )}
            >
              <Wordmark className="text-[26px]" />
              {done ? (
                <CheckCircleIcon className="fz-motion size-6 text-primary [animation:fz-pop_.45s_ease_both]" />
              ) : (
                <span className="text-caption">{shown}%</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Bar value={shown} />
            <div className="flex justify-between text-caption">
              <span>{done ? "48 students and 6 classes moved" : "Moving your school"}</span>
              <span>About 10 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FileChip({
  icon,
  name,
  gone,
}: {
  icon: ReactNode;
  name: string;
  gone: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border bg-surface px-3 py-2 text-sm text-ink transition-all duration-500",
        gone && "translate-x-6 opacity-0 rtl:-translate-x-6",
      )}
    >
      {icon}
      {name}
    </span>
  );
}

/* ---- The name ----------------------------------------------------------- */

/**
 * The brand's own story, from the guidelines: what the word means, and the
 * tilework the colours come from. The tiles are the palette itself; saffron
 * appears only as the diamond, as it does everywhere else.
 */
const TILES = [
  { name: "Lapis", fill: "bg-lapis" },
  { name: "Turquoise", fill: "bg-turquoise" },
  { name: "Mist", fill: "bg-mist border" },
];

export function Meaning() {
  return (
    <section className="border-y bg-surface">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-4 py-24 text-center sm:px-6 sm:py-32">
        <Reveal className="flex flex-col items-center gap-6">
          <Eyebrow>The name</Eyebrow>
          <Wordmark className="text-[64px] sm:text-[96px]" />
          <p className="text-muted">
            far-<span className="font-semibold text-heading">ZAA</span>-na ·
            intelligent, or learned, in Persian
          </p>
        </Reveal>
        <Reveal delay={100} className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-balance sm:text-[36px] sm:leading-[43px]">
            Intelligent software, learned students.
          </h2>
          <p className="text-pretty text-lg text-muted">
            The name is the promise. The software should be intelligent and
            never hard to understand, and the classes on it are there to help
            students become learned.
          </p>
        </Reveal>
        <Reveal delay={200} className="flex flex-col items-center gap-5">
          <div className="flex items-end gap-3">
            {TILES.map((tile) => (
              <div key={tile.name} className="flex flex-col items-center gap-2">
                <span className={cn("size-14 rounded-md sm:size-16", tile.fill)} />
                <span className="text-caption">{tile.name}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <span className="flex size-14 items-center justify-center sm:size-16">
                <Diamond size={28} />
              </span>
              <span className="text-caption">Saffron</span>
            </div>
          </div>
          <p className="max-w-md text-pretty text-sm text-muted">
            The colors come from Persian tilework: the blue mosques of
            Mazar-i-Sharif and Isfahan.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---- The film ----------------------------------------------------------- */

/**
 * The Farzana film, near the end of the page: a teacher's messy week pulling
 * itself together into one place, in 76 seconds. It never plays on its own;
 * the visitor presses play.
 */
export function Film() {
  return (
    <section
      id="film"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6 sm:pb-32"
    >
      <SectionIntro eyebrow="The film" title="Farzana in 76 seconds.">
        From a week of scattered tools to one calm place.
      </SectionIntro>
      <Reveal delay={100} className="mt-12">
        <div className="overflow-hidden rounded-lg border bg-surface">
          <video
            src="/farzana/farzana-film.mp4"
            poster="/farzana/farzana-film-poster.jpg"
            controls
            playsInline
            preload="metadata"
            width={1920}
            height={1080}
            aria-label="Farzana, a 76-second film"
            className="block aspect-video h-auto w-full bg-mist"
          />
        </div>
      </Reveal>
    </section>
  );
}

/* ---- The doors, once more ---------------------------------------------- */

export function Closing() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <Reveal>
        <div className="flex flex-col items-center gap-7 rounded-lg bg-lapis px-6 py-16 text-center sm:px-12 sm:py-20">
          <Wordmark tone="inverse" className="text-[44px] sm:text-[56px]" />
          <h2 className="max-w-xl text-balance text-white sm:text-[36px] sm:leading-[43px]">
            Ready to open your school?
          </h2>
          <p className="max-w-lg text-pretty text-lg text-white/75">
            A quick call about how you teach, and we set it up to look like
            you. Your week goes back to teaching.
          </p>
          <Actions onLapis className="justify-center" />
        </div>
      </Reveal>
    </section>
  );
}
