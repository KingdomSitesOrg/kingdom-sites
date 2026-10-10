"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpenTextIcon,
  CheckCircleIcon,
  CheckIcon,
  EnvelopeSimpleIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  UsersThreeIcon,
  WalletIcon,
  type Icon,
} from "@phosphor-icons/react";

import { Diamond } from "../_ui/diamond";
import { Badge } from "../_ui/badge";
import { cn } from "../_ui/cn";

import { useInView, useReducedMotion } from "./motion";
import { Actions, Bar, Initial, vars } from "./shared";

/**
 * The first screen after the logo has flown into the bar: what Farzana is, in
 * one line, the call to book, and a picture of a teacher's week running itself.
 *
 * Every line here is a `.fz-rise`, staggered by `--d`, so behind the intro it
 * waits and then builds as the logo lands; on a later visit it simply rises in.
 */

const HEADLINE = ["Your", "whole", "classroom,"];
const EMPHASIS = ["in", "one", "place."];

const PROMISES = [
  "No cut of your class fees",
  "Import students in one click",
  "Works on the phone",
];

export function Hero() {
  return (
    <section className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-24 lg:pt-6">
      <div className="flex flex-col items-start gap-6">
        <Badge className="fz-rise" style={vars({ "--d": "0ms" })}>
          <Diamond size={8} />
          Intelligent software, learned students
        </Badge>
        <h1 className="text-display text-balance">
          {HEADLINE.map((word, index) => (
            <span
              key={word}
              className="fz-rise inline-block"
              style={vars({ "--d": `${80 + index * 70}ms` })}
            >
              {word}&nbsp;
            </span>
          ))}
          <br />
          {EMPHASIS.map((word, index) => (
            <span
              key={word}
              className="fz-rise inline-block text-primary"
              style={vars({ "--d": `${290 + index * 70}ms` })}
            >
              {word}
              {index < EMPHASIS.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        <p
          className="fz-rise max-w-xl text-pretty text-lg text-muted"
          style={vars({ "--d": "520ms" })}
        >
          Sell your classes, email your families and keep track of your
          students. One calm place for everything around your teaching, with no
          add-ons to buy.
        </p>
        <div
          className="fz-rise flex flex-col gap-3"
          style={vars({ "--d": "620ms" })}
        >
          <Actions />
        </div>
        <ul
          className="fz-rise flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted"
          style={vars({ "--d": "720ms" })}
        >
          {PROMISES.map((promise) => (
            <li key={promise} className="inline-flex items-center gap-1.5">
              <CheckIcon weight="bold" className="size-4 text-accent" />
              {promise}
            </li>
          ))}
        </ul>
      </div>

      <div className="fz-rise" style={vars({ "--d": "380ms" })}>
        <ClassroomWindow />
      </div>
    </section>
  );
}

/* ---- The picture: a teacher's dashboard, quietly busy ------------------ */

type Toast = { icon: Icon; text: string };

const TOASTS: Toast[] = [
  { icon: UserPlusIcon, text: "New student added" },
  { icon: WalletIcon, text: "Payment received" },
  { icon: EnvelopeSimpleIcon, text: "Email sent to families" },
];

const RAIL: { icon: Icon; label: string; current?: boolean }[] = [
  { icon: HouseIcon, label: "Home" },
  { icon: BookOpenTextIcon, label: "Classes", current: true },
  { icon: UsersThreeIcon, label: "Students" },
  { icon: EnvelopeSimpleIcon, label: "Email" },
  { icon: WalletIcon, label: "Payments" },
];

const FACES = ["AM", "JK", "SR", "LT", "NB", "OC"];
const TOAST_MS = 2800;

/**
 * One toast every few seconds, and the enrolled count and the row of faces
 * grow with every new student. It only runs while it is on screen, and stands
 * still under reduced motion.
 */
function ClassroomWindow() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: false, margin: "0px" });
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!visible || reduced) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), TOAST_MS);
    return () => window.clearInterval(timer);
  }, [visible, reduced]);

  const toast = TOASTS[tick % TOASTS.length];
  // Every third toast is a new student; the class fills, then starts over.
  const joined = Math.floor((tick + 2) / 3) % 4;
  const enrolled = 17 + joined;
  const faces = FACES.slice(0, 3 + joined);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[560px]" aria-hidden>
      {/* The window. */}
      <div className="surface-card overflow-hidden rounded-lg">
        <div className="flex h-12 items-center gap-3 border-b px-4">
          <span className="inline-flex size-7 items-center justify-center rounded-sm bg-lapis font-display text-sm font-semibold text-white">
            Y
          </span>
          <span className="text-sm font-medium text-heading">Your school</span>
          <span className="ms-auto hidden h-8 w-40 items-center gap-2 rounded-sm bg-wash px-3 text-xs text-muted sm:inline-flex">
            <MagnifyingGlassIcon className="size-4" />
            Search
          </span>
        </div>
        <div className="flex">
          <div className="flex flex-col gap-1.5 border-e p-2.5">
            {RAIL.map(({ icon: RailIcon, label, current }) => (
              <span
                key={label}
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-sm",
                  current ? "bg-accent-wash text-primary" : "text-muted",
                )}
              >
                <RailIcon weight="bold" className="size-5" />
              </span>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-xl font-semibold text-heading">
                Classes
              </span>
              <Badge>Open for sign-up</Badge>
            </div>

            <div className="flex flex-col gap-3 rounded-md border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-heading">
                    Nature Study
                  </p>
                  <p className="text-caption">Fall co-op · Thursdays</p>
                </div>
                <div className="text-end">
                  <p
                    key={enrolled}
                    className="fz-motion font-display text-2xl font-semibold leading-none text-heading [animation:fz-pop_.45s_ease_both]"
                  >
                    {enrolled}
                  </p>
                  <p className="text-caption">enrolled</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex -space-x-1.5 rtl:space-x-reverse">
                  {faces.map((face, index) => (
                    <Initial
                      key={face}
                      className={cn(
                        "size-7 ring-2 ring-background",
                        index >= 3 && "fz-motion [animation:fz-pop_.45s_ease_both]",
                      )}
                    >
                      {face}
                    </Initial>
                  ))}
                </div>
                <Bar value={(enrolled / 24) * 100} className="w-28" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-heading">Latin I</p>
                <p className="text-caption">Tuesdays · 12 enrolled</p>
              </div>
              <Bar value={50} className="w-28" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ["48", "Students"],
                ["31", "Families"],
                ["6", "Classes"],
              ].map(([count, label]) => (
                <div key={label} className="rounded-md border bg-background px-3 py-2.5">
                  <p className="font-display text-lg font-semibold leading-tight text-heading">
                    {count}
                  </p>
                  <p className="text-caption">{label}</p>
                </div>
              ))}
            </div>

            {/* Room for the toast to land in without covering a row. */}
            <div className="h-10" />
          </div>
        </div>
      </div>

      {/* The toast: lapis, white words, bottom centre — the brand's toast. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div
          key={tick}
          className="fz-motion flex items-center gap-2 rounded-sm bg-lapis px-4 py-2.5 text-sm font-medium text-white shadow-overlay"
          style={
            reduced
              ? undefined
              : { animation: `fz-toast ${TOAST_MS}ms ease both` }
          }
        >
          <toast.icon weight="bold" className="size-4" />
          {toast.text}
        </div>
      </div>

      {/* Two small cards resting on the window's edges. */}
      <div className="fz-motion absolute -top-5 end-3 [animation:fz-float_7s_ease-in-out_infinite] sm:-end-6">
        <div className="surface-card flex items-center gap-2 rounded-md px-3.5 py-2.5">
          <Diamond size={12} />
          <span className="text-sm font-medium text-heading">
            Week 3 complete
          </span>
        </div>
      </div>
      <div className="fz-motion absolute -bottom-6 start-3 [animation:fz-float_8s_ease-in-out_1.5s_infinite] sm:-start-8">
        <div className="surface-card flex items-center gap-2 rounded-md px-3.5 py-2.5">
          <CheckCircleIcon weight="regular" className="size-5 text-accent" />
          <span className="text-sm font-medium text-heading">
            Quiz graded · 9 of 10
          </span>
        </div>
      </div>
    </div>
  );
}
