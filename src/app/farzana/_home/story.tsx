"use client";

import { useRef } from "react";
import {
  BookOpenTextIcon,
  CalendarBlankIcon,
  CheckIcon,
  ClipboardTextIcon,
  CreditCardIcon,
  EnvelopeSimpleIcon,
  ExamIcon,
  FilePdfIcon,
  ReceiptIcon,
  TableIcon,
  UsersThreeIcon,
  VideoCameraIcon,
  WalletIcon,
  type Icon,
} from "@phosphor-icons/react";

import { Wordmark } from "../_ui/wordmark";
import { cn } from "../_ui/cn";

import { useReducedMotion, useScrollProgress } from "./motion";
import { Eyebrow, Initial, vars } from "./shared";

/**
 * The story of the film, told by scrolling: a teacher's tools lie scattered
 * across the screen with two parents' questions among them, and as the page
 * moves they pull together and disappear into one Farzana card.
 *
 * The section is tall and its picture is pinned, so the scroll is what plays
 * it. `--p` (0 to 1) is written onto the section by `useScrollProgress`; every
 * movement is plain CSS reading that number (`home.css`). Under reduced motion
 * there is no pinning: the problem, then the answer, one under the other.
 */

type Scrap = {
  icon?: Icon;
  label: string;
  /** Scattered position from the centre, in px at full width. */
  x: number;
  y: number;
  /** Tilt, degrees. */
  r: number;
  /** When it starts moving in, 0 to 1 of the scroll. */
  s: number;
  /** A parent's question, drawn as a message rather than a tool. */
  from?: string;
};

const SCRAPS: Scrap[] = [
  { icon: TableIcon, label: "Spreadsheets", x: -380, y: -110, r: -8, s: 0.22 },
  { icon: FilePdfIcon, label: "PDFs by email", x: 360, y: -140, r: 6, s: 0.26 },
  { icon: VideoCameraIcon, label: "Video calls", x: -440, y: 70, r: 5, s: 0.3 },
  { icon: ClipboardTextIcon, label: "Sign-up forms", x: 420, y: 40, r: -6, s: 0.24 },
  { icon: ExamIcon, label: "A quiz app", x: -260, y: 200, r: -4, s: 0.32 },
  { icon: CreditCardIcon, label: "Payments", x: 270, y: 210, r: 7, s: 0.28 },
  { icon: CalendarBlankIcon, label: "Calendar", x: -60, y: -170, r: 3, s: 0.2 },
  { icon: ReceiptIcon, label: "Receipts", x: 60, y: 250, r: -3, s: 0.34 },
  {
    label: "Where is this week’s lesson?",
    from: "P",
    x: -180,
    y: -40,
    r: -2,
    s: 0.36,
  },
  {
    label: "Did my payment go through?",
    from: "D",
    x: 200,
    y: 120,
    r: 3,
    s: 0.38,
  },
];

const ONE_PLACE: { icon: Icon; label: string }[] = [
  { icon: BookOpenTextIcon, label: "Classes, lessons and quizzes" },
  { icon: UsersThreeIcon, label: "Students and families" },
  { icon: WalletIcon, label: "Payments, straight to you" },
  { icon: EnvelopeSimpleIcon, label: "Email to one class or all" },
];

const PROBLEM = {
  eyebrow: "Sound familiar?",
  title: "Teaching is the easy part. The tools are not.",
  body: "Lessons in one tool, grades in another, sign-ups in a form and payments somewhere else, with parents asking where to look.",
};

const ANSWER = {
  eyebrow: "One place",
  title: "Farzana puts it all in one place.",
  body: "Your classes, your students and families, payments and email, together. So your week goes to teaching, not juggling.",
};

export function Story() {
  const reduced = useReducedMotion();
  return reduced ? <StoryStill /> : <StoryScroll />;
}

function StoryScroll() {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref);

  return (
    <section
      ref={ref}
      className="relative h-[300vh] border-y bg-surface"
      aria-label="Why Farzana"
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="relative mx-auto h-full w-full max-w-6xl px-4 sm:px-6">
          {/* The words: the problem, then the answer in the same place. */}
          <div className="absolute inset-x-4 top-[10vh] grid text-center sm:inset-x-6 sm:top-[12vh]">
            <Copy {...PROBLEM} className="fz-problem-copy" />
            <Copy {...ANSWER} className="fz-answer-copy" />
          </div>

          {/* The scattered scraps, pulled in by the scroll. */}
          <div className="absolute inset-x-0 top-[62%] [--k:0.42] sm:top-[60%] sm:[--k:0.7] lg:[--k:0.85] xl:[--k:1]">
            {SCRAPS.map((scrap) => (
              <div
                key={scrap.label}
                className="fz-tool absolute left-1/2 top-0 will-change-transform"
                style={vars({
                  "--x": `calc(var(--k) * ${scrap.x}px)`,
                  "--y": `calc(var(--k) * ${scrap.y}px)`,
                  "--r": `${scrap.r}deg`,
                  "--s": scrap.s,
                })}
              >
                <ScrapCard scrap={scrap} />
              </div>
            ))}

            <div className="fz-answer-card absolute left-1/2 top-0 w-[min(400px,calc(100vw-2rem))]">
              <OnePlaceCard progressive />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Copy({
  eyebrow,
  title,
  body,
  className,
}: {
  eyebrow: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "col-start-1 row-start-1 mx-auto flex max-w-2xl flex-col items-center gap-4",
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-balance sm:text-[36px] sm:leading-[43px]">{title}</h2>
      <p className="hidden max-w-xl text-pretty text-lg text-muted sm:block">
        {body}
      </p>
    </div>
  );
}

function ScrapCard({ scrap }: { scrap: Scrap }) {
  if (scrap.from) {
    return (
      <div className="surface-card flex items-center gap-2.5 whitespace-nowrap rounded-md py-2 pe-4 ps-2">
        <Initial className="size-7">{scrap.from}</Initial>
        <span className="text-sm text-ink">{scrap.label}</span>
      </div>
    );
  }
  const ScrapIcon = scrap.icon!;
  return (
    <div className="flex h-11 items-center gap-2 whitespace-nowrap rounded-md border bg-background px-4 text-sm font-medium text-heading">
      <ScrapIcon className="size-5 text-muted" />
      {scrap.label}
    </div>
  );
}

/**
 * The Farzana card everything ends up in. Scrolled, its rows tick in one by
 * one (`progressive`); still, they are simply there.
 */
function OnePlaceCard({ progressive = false }: { progressive?: boolean }) {
  return (
    <div className="surface-card flex flex-col gap-4 rounded-lg p-6">
      <Wordmark className="self-start text-[28px]" />
      <ul className="flex flex-col gap-2">
        {ONE_PLACE.map(({ icon: RowIcon, label }, index) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-sm bg-background px-3 py-2.5",
              progressive && "fz-answer-row",
            )}
            style={progressive ? vars({ "--s": 0.7 + index * 0.05 }) : undefined}
          >
            <RowIcon className="size-5 text-accent" />
            <span className="flex-1 text-sm font-medium text-heading">
              {label}
            </span>
            <CheckIcon weight="bold" className="size-4 text-primary" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoryStill() {
  return (
    <section className="border-y bg-surface" aria-label="Why Farzana">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-20 sm:px-6">
        <Copy {...PROBLEM} />
        <div className="flex max-w-3xl flex-wrap justify-center gap-2">
          {SCRAPS.filter((scrap) => !scrap.from).map((scrap) => (
            <ScrapCard key={scrap.label} scrap={scrap} />
          ))}
        </div>
        <Copy {...ANSWER} />
        <div className="w-full max-w-[400px]">
          <OnePlaceCard />
        </div>
      </div>
    </section>
  );
}
