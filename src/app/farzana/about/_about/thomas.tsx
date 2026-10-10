"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AppleLogoIcon,
  ArrowClockwiseIcon,
  ArrowRightIcon,
  CheckIcon,
  GlobeHemisphereEastIcon,
  XIcon,
} from "@phosphor-icons/react";

import { Eyebrow, Reveal } from "../../_home/shared";
import { buttonClass } from "../../_ui/button";
import { cn } from "../../_ui/cn";
import { JAM_LEGIO_URL, MISSION_URL } from "../../_ui/contact";
import { Diamond } from "../../_ui/diamond";
import photo from "../../../../../public/farzana/thomas-and-monisha.jpg";

/**
 * Who built it: Thomas, a Classical Conversations graduate who learned Latin
 * the hard way and built Jam Legio because of it — with three Latin words to
 * try — and then the ministry Thomas and his wife Monisha want to do, which
 * Farzana fuels, and the studio behind it.
 */
export function Thomas() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="lg:sticky lg:top-28">
          <figure className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-lg border bg-surface">
              <Image
                src={photo}
                alt="Thomas and his wife Monisha, smiling side by side at a table"
                placeholder="blur"
                sizes="(min-width: 1024px) 560px, 100vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="text-caption">Thomas and his wife, Monisha</figcaption>
          </figure>
        </Reveal>

        <div className="flex flex-col gap-8">
          <Reveal className="flex flex-col items-start gap-4">
            <Eyebrow>Who built it</Eyebrow>
            <h2 className="text-balance sm:text-[36px] sm:leading-[43px]">
              Hi, I’m Thomas.
            </h2>
            <p className="text-pretty text-lg text-muted">
              I’m a Classical Conversations graduate. That’s where I learned
              Latin, and it was hard.
            </p>
            <p className="text-pretty text-lg text-muted">
              So I built Jam Legio, a Roman-legion adventure that teaches
              classical Latin, now on the App Store. Farzana comes from the same
              place: wanting students to become learned, and wanting a
              teacher’s week to be about teaching.
            </p>
            <a
              href={JAM_LEGIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: "outline", className: "bg-surface" })}
            >
              <AppleLogoIcon weight="bold" />
              Get Jam Legio on the App Store
            </a>
          </Reveal>
          <Reveal delay={100}>
            <LatinQuiz />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---- Three Latin words ------------------------------------------------- */

const WORDS = [
  {
    word: "doctus",
    answer: "learned",
    options: ["led", "learned", "said"],
    note: "It shares a root with doctor, which first meant teacher.",
  },
  {
    word: "sapientia",
    answer: "wisdom",
    options: ["wisdom", "strength", "kindness"],
    note: "Homo sapiens: the wise human.",
  },
  {
    word: "scientia",
    answer: "knowledge",
    options: ["courage", "friendship", "knowledge"],
    note: "It gives us the word science.",
  },
];

/**
 * A three-word taste of Latin, on the words this page is about: learned,
 * wisdom and knowledge. Pick a meaning, see whether it was right, go on.
 */
function LatinQuiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const finished = index >= WORDS.length;
  const score = results.filter(Boolean).length;

  const pick = (option: string) => {
    if (picked) return;
    setPicked(option);
    setResults((current) => [...current, option === WORDS[index].answer]);
  };
  const next = () => {
    setPicked(null);
    setIndex((current) => current + 1);
  };
  const again = () => {
    setPicked(null);
    setResults([]);
    setIndex(0);
  };

  return (
    <div className="surface-card flex flex-col gap-5 rounded-lg p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <span className="font-display text-lg font-semibold text-heading">
          Try three words
        </span>
        <span className="flex items-center gap-1.5" aria-hidden>
          {WORDS.map((entry, position) => (
            <Diamond
              key={entry.word}
              size={12}
              className={cn(
                position < results.length
                  ? results[position]
                    ? "bg-gold"
                    : "bg-wash-strong"
                  : "bg-border",
              )}
            />
          ))}
        </span>
      </div>

      {finished ? (
        <div className="fz-motion flex flex-col items-start gap-4 [animation:fz-row_.4s_ease_both]">
          <p className="font-display text-[40px] leading-none font-semibold text-heading">
            {score} of {WORDS.length}
          </p>
          <p className="text-pretty text-muted">
            That’s the idea behind Jam Legio: Latin a day at a time, until it
            sticks.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={JAM_LEGIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ size: "sm" })}
            >
              <AppleLogoIcon weight="bold" />
              Get Jam Legio
            </a>
            <button type="button" onClick={again} className={buttonClass({ size: "sm", variant: "ghost" })}>
              <ArrowClockwiseIcon weight="bold" />
              Try again
            </button>
          </div>
        </div>
      ) : (
        <Question
          key={WORDS[index].word}
          entry={WORDS[index]}
          position={index}
          picked={picked}
          onPick={pick}
          onNext={next}
        />
      )}
    </div>
  );
}

function Question({
  entry,
  position,
  picked,
  onPick,
  onNext,
}: {
  entry: (typeof WORDS)[number];
  position: number;
  picked: string | null;
  onPick: (option: string) => void;
  onNext: () => void;
}) {
  const right = picked === entry.answer;
  return (
    <div className="fz-motion flex flex-col gap-4 [animation:fz-row_.35s_ease_both]">
      <div>
        <p className="text-caption">
          Word {position + 1} of {WORDS.length} · What does it mean?
        </p>
        <p lang="la" className="font-display text-[40px] leading-[48px] font-semibold text-heading">
          {entry.word}
        </p>
      </div>
      <div role="group" aria-label={`Meanings of ${entry.word}`} className="grid gap-2 sm:grid-cols-3">
        {entry.options.map((option) => {
          const state =
            picked === null
              ? "idle"
              : option === entry.answer
                ? "right"
                : option === picked
                  ? "wrong"
                  : "rest";
          return (
            <button
              key={option}
              type="button"
              disabled={picked !== null}
              onClick={() => onPick(option)}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-sm border px-4 text-sm font-medium transition-colors",
                state === "idle" && "cursor-pointer text-heading hover:bg-wash",
                state === "right" && "border-transparent bg-accent-wash text-primary",
                state === "wrong" && "border-transparent bg-destructive/10 text-destructive",
                state === "rest" && "text-muted",
              )}
            >
              {state === "right" ? <CheckIcon weight="bold" className="size-4" /> : null}
              {state === "wrong" ? <XIcon weight="bold" className="size-4" /> : null}
              {option}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        {picked ? (
          <>
            <p className="text-sm text-ink">
              {right ? "Right. " : `It means “${entry.answer}”. `}
              <span className="text-muted">{entry.note}</span>
            </p>
            <button type="button" onClick={onNext} className={buttonClass({ size: "sm" })}>
              {position + 1 < WORDS.length ? "Next word" : "See how you did"}
              <ArrowRightIcon weight="bold" className="rtl:-scale-x-100" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ---- Missions ---------------------------------------------------------- */

/** Where each diamond sits in the field, in percent, and when it breathes. */
const FIELD = [
  [12, 18, 0], [28, 62, 1.2], [44, 30, 2.1], [60, 74, 0.6], [76, 22, 1.7],
  [88, 54, 2.6], [20, 84, 3.1], [52, 10, 0.9], [68, 44, 2.9], [36, 46, 1.5],
  [84, 86, 0.3], [6, 50, 2.3], [94, 14, 1.1], [58, 92, 3.4],
] as const;

/**
 * A heart for missions: Thomas and Monisha want to do ministry, and Farzana
 * fuels it. Then the studio behind Farzana, and a way to its mission page. The diamonds behind the words breathe slowly, each on its own beat.
 */
export function Missions() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-lg border bg-surface p-8 sm:p-12 lg:p-14">
          <div
            aria-hidden
            className="absolute inset-y-0 end-0 w-full opacity-60 [mask-image:linear-gradient(to_left,black,transparent_75%)] sm:w-2/3 sm:opacity-100 rtl:[mask-image:linear-gradient(to_right,black,transparent_75%)]"
          >
            {FIELD.map(([x, y, delay]) => (
              <Diamond
                key={`${x}-${y}`}
                size={x % 3 === 0 ? 14 : 10}
                className="fz-motion absolute [animation:fz-twinkle_4.5s_ease-in-out_infinite]"
                style={{ insetInlineStart: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }}
              />
            ))}
          </div>
          <div className="relative flex max-w-xl flex-col items-start gap-5">
            <Eyebrow>A heart for missions</Eyebrow>
            <h2 className="text-balance sm:text-[36px] sm:leading-[43px]">
              We want to do ministry. Farzana fuels it.
            </h2>
            <p className="text-pretty text-lg text-muted">
              I have a heart for missions, and my wife Monisha and I want to
              do ministry. Every school on Farzana helps fuel that work.
            </p>
            <p className="text-pretty text-muted">
              Farzana is made by Kingdom Sites, my studio, which stands with and
              gives to organizations doing gospel work in the unreached world.
            </p>
            <Link
              href={MISSION_URL}
              className={buttonClass({ variant: "outline", className: "bg-surface" })}
            >
              <GlobeHemisphereEastIcon weight="bold" />
              Read our mission
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
