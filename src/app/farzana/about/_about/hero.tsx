"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  CalendarCheckIcon,
  CheckCircleIcon,
  CircleIcon,
  TagIcon,
} from "@phosphor-icons/react";

import { useBeat, useInView, useReducedMotion } from "../../_home/motion";
import { vars } from "../../_home/shared";
import { Badge } from "../../_ui/badge";
import { buttonClass } from "../../_ui/button";
import { cn } from "../../_ui/cn";
import { BOOK_PATH, PRICING_PATH } from "../../_ui/contact";
import { Diamond } from "../../_ui/diamond";

/**
 * The About page's first screen: who Farzana is for, in one line, and a
 * teacher's list of things to think about emptying itself, one chore at a
 * time, until there is nothing left but the teaching.
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

export function AboutHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pb-28">
      <div className="flex flex-col items-start gap-6">
        <Badge className="fz-rise" style={vars({ "--d": "0ms" })}>
          <Diamond size={8} />
          About Farzana
        </Badge>
        <h1
          className="fz-rise text-display text-balance"
          style={vars({ "--d": "80ms" })}
        >
          Built for teachers who just want their{" "}
          <span className="text-primary">classes done.</span>
        </h1>
        <p
          className="fz-rise max-w-xl text-pretty text-lg text-muted"
          style={vars({ "--d": "200ms" })}
        >
          Farzana was built from the ground up to be affordable and easy to
          use. You teach. Farzana takes care of everything around it, and you
          never have to think about the software.
        </p>
        <div
          className="fz-rise flex flex-wrap gap-3"
          style={vars({ "--d": "300ms" })}
        >
          <Link href={BOOK_PATH} className={buttonClass({ size: "lg" })}>
            <CalendarCheckIcon weight="bold" />
            Book a 15-minute call
          </Link>
          <Link
            href={PRICING_PATH}
            className={buttonClass({
              size: "lg",
              variant: "outline",
              className: "bg-surface",
            })}
          >
            <TagIcon weight="bold" />
            See pricing
          </Link>
        </div>
      </div>

      <div className="fz-rise" style={vars({ "--d": "240ms" })}>
        <ThinkList />
      </div>
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
