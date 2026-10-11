"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  CheckCircleIcon,
  CircleIcon,
  TagIcon,
} from "@phosphor-icons/react";

import { useBeat, useInView, useReducedMotion } from "./motion";
import { Reveal, SectionIntro } from "./shared";
import { buttonClass } from "../_ui/button";
import { cn } from "../_ui/cn";
import { PRICING_PATH } from "../_ui/contact";
import { Diamond } from "../_ui/diamond";

/**
 * Who Farzana is for, on the front page: teachers who just want their classes
 * done. Beside the words, a teacher's list of things to think about empties
 * itself, one chore at a time, until there is nothing left but the teaching.
 */

const CHORES = [
  "Take payments for fall classes",
  "Email families about Thursday",
  "Build a sign-up page",
  "Keep track of who has paid",
  "Move students off the old system",
];

/** Beats the empty list holds for before it fills again. */
const HOLD = 4;
const BEAT_MS = 900;

export function Simple() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-24 sm:px-6 sm:pb-32 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col items-start gap-6">
        <SectionIntro
          align="start"
          eyebrow="Built from the ground up"
          title="For teachers who just want their classes done."
        >
          Farzana was built from the ground up to be affordable and easy to
          use. You teach. Farzana takes care of everything around it, and you
          never have to think about the software.
        </SectionIntro>
        <Reveal delay={100}>
          <Link
            href={PRICING_PATH}
            className={buttonClass({ variant: "outline", className: "bg-surface" })}
          >
            <TagIcon weight="bold" />
            See pricing
          </Link>
        </Reveal>
      </div>
      <Reveal delay={120}>
        <ThinkList />
      </Reveal>
    </section>
  );
}

/**
 * The list empties a beat at a time while it is on screen, holds empty, and
 * starts over. Under reduced motion it is simply empty.
 */
function ThinkList() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: false, margin: "0px" });
  const reduced = useReducedMotion();
  const beat = useBeat(CHORES.length + 1 + HOLD, BEAT_MS, visible && !reduced);
  const done = reduced ? CHORES.length : Math.min(beat, CHORES.length);
  const left = CHORES.length - done;

  return (
    <div ref={ref} aria-hidden className="relative mx-auto w-full max-w-[480px]">
      <div className="surface-card overflow-hidden rounded-lg">
        <div className="flex items-end justify-between gap-4 border-b px-5 py-4">
          <div>
            <p className="text-caption">Your week</p>
            <p className="font-display text-xl font-semibold text-heading">
              Things to think about
            </p>
          </div>
          <span
            key={left}
            className="fz-motion font-display text-[44px] leading-none font-semibold text-heading [animation:fz-pop_.45s_ease_both]"
          >
            {left}
          </span>
        </div>
        <ul className="flex flex-col gap-2 p-4">
          {CHORES.map((chore, index) => {
            const isDone = index < done;
            return (
              <li
                key={chore}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3.5 py-3 transition-colors duration-500",
                  isDone ? "border-transparent bg-accent-wash" : "bg-background",
                )}
              >
                {isDone ? (
                  <CheckCircleIcon
                    key="done"
                    className="fz-motion size-5 text-primary [animation:fz-pop_.4s_ease_both]"
                  />
                ) : (
                  <CircleIcon className="size-5 text-muted" />
                )}
                <span
                  className={cn(
                    "flex-1 text-sm transition-colors duration-500",
                    isDone ? "text-muted line-through" : "text-ink",
                  )}
                >
                  {chore}
                </span>
                {isDone ? (
                  <span className="text-caption font-medium text-primary">
                    Done
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="flex h-12 items-center justify-center border-t text-sm font-medium">
          {left === 0 ? (
            <span
              key="clear"
              className="fz-motion inline-flex items-center gap-2 text-heading [animation:fz-row_.4s_ease_both]"
            >
              <Diamond size={10} />
              Nothing left. Go teach.
            </span>
          ) : (
            <span className="text-muted">Farzana is taking care of it</span>
          )}
        </div>
      </div>
    </div>
  );
}
