"use client";

import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  CalendarCheckIcon,
  CheckCircleIcon,
  CheckIcon,
  FileCsvIcon,
  LockSimpleOpenIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";

import { Badge } from "../_ui/badge";
import { buttonClass } from "../_ui/button";
import { BOOK_PATH } from "../_ui/contact";
import { cn } from "../_ui/cn";

import { useInView, useReducedMotion } from "./motion";
import { Bar, FauxButton, Initial, Reveal, SectionIntro } from "./shared";

/**
 * How it works, in three steps, in Thomas's words: a call, then he sets it up,
 * then the students learn. It ends on the booking button. On a wide screen the steps scroll past on the
 * start side while one panel stays pinned beside them and changes with the
 * step in the middle of the screen; each panel plays its small scene when its
 * step arrives. On a phone each step carries its own panel under its words.
 */

type PanelProps = { active: boolean };

const STEPS: {
  title: string;
  body: string;
  Panel: ComponentType<PanelProps>;
}[] = [
  {
    title: "Tell us how you teach",
    body: "A short call about your classes, your families and what is eating your week.",
    Panel: CallPanel,
  },
  {
    title: "We set it up to look like you",
    body: "We build it with your logo and colors, and bring your classes and students over.",
    Panel: ImportPanel,
  },
  {
    title: "Your students log in and learn",
    body: "Families sign up, pay and start. You get your evenings back.",
    Panel: JoinPanel,
  },
];

export function Steps() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  // The step crossing the middle of the screen is the one the panel shows.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.step));
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    stepRefs.current.forEach((step) => step && observer.observe(step));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="border-y bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionIntro
          id="how-it-works"
          eyebrow="How it works"
          title="Three steps. We do the heavy lifting."
        >
          Built for educators, not for people who like setting up software.
        </SectionIntro>

        <div className="mt-8 grid gap-10 lg:mt-0 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <ol>
            {STEPS.map(({ title, body, Panel }, index) => (
              <li
                key={title}
                ref={(element) => {
                  stepRefs.current[index] = element;
                }}
                data-step={index}
                className="flex flex-col justify-center gap-4 py-8 lg:min-h-[72vh] lg:py-0"
              >
                <div
                  className={cn(
                    "flex flex-col gap-4 transition-opacity duration-500",
                    index === active ? "lg:opacity-100" : "lg:opacity-35",
                  )}
                >
                  <StepNumber index={index} active={active} />
                  <h3 className="text-balance sm:text-[28px] sm:leading-[34px]">
                    {title}
                  </h3>
                  <p className="max-w-md text-pretty text-lg text-muted">{body}</p>
                </div>
                <InlinePanel Panel={Panel} />
              </li>
            ))}
          </ol>

          {/* The pinned panel, wide screens only. */}
          <div className="relative hidden lg:block" aria-hidden>
            <div className="sticky top-[calc(50vh-13rem)] h-[26rem]">
              {STEPS.map(({ title, Panel }, index) => (
                <div
                  key={title}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-out",
                    index === active
                      ? "translate-y-0 opacity-100"
                      : index < active
                        ? "-translate-y-6 opacity-0"
                        : "translate-y-6 opacity-0",
                  )}
                >
                  <Panel
                    key={index === active ? "on" : "off"}
                    active={index === active}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <Reveal className="mt-10 flex flex-col items-center gap-3 text-center lg:mt-4">
          <Link href={BOOK_PATH} className={buttonClass({ size: "lg" })}>
            <CalendarCheckIcon weight="bold" />
            Book a 15-minute call
          </Link>
          <p className="text-sm text-muted">Step one takes a quarter of an hour.</p>
        </Reveal>
      </div>
    </section>
  );
}

function StepNumber({ index, active }: { index: number; active: number }) {
  const done = index < active;
  return (
    <span
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full font-display text-lg font-semibold transition-colors duration-500",
        index === active
          ? "bg-primary text-primary-foreground"
          : done
            ? "bg-accent-wash text-primary"
            : "bg-wash text-muted",
      )}
    >
      {done ? <CheckIcon weight="bold" className="size-5" /> : index + 1}
    </span>
  );
}

/** On a phone, the step's panel sits under its words and plays on sight. */
function InlinePanel({ Panel }: { Panel: ComponentType<PanelProps> }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -30% 0px" });
  return (
    <Reveal className="lg:hidden">
      <div ref={ref} className="h-[26rem]" aria-hidden>
        <Panel key={inView ? "on" : "off"} active={inView} />
      </div>
    </Reveal>
  );
}

/**
 * Counts from 0 to `last`, `interval` ms apart, while `active`. A panel is
 * drawn afresh each time its step comes round (its `key` changes with
 * `active`), so the count starts from 0 again and the scene replays. Under
 * reduced motion it sits at the end.
 */
function useCount(active: boolean, last: number, interval: number) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reduced || !active) return;
    const timer = window.setInterval(() => {
      setCount((current) => {
        if (current >= last) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, interval);
    return () => window.clearInterval(timer);
  }, [active, reduced, last, interval]);
  if (reduced) return last;
  return active ? count : 0;
}

function PanelFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-card flex h-full flex-col gap-5 rounded-lg p-6 sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

const AGENDA = [
  "Your classes",
  "Your families",
  "What is eating your week",
];

/** The call itself: what gets talked through, ticked off as it is. */
function CallPanel({ active }: PanelProps) {
  const step = useCount(active, AGENDA.length + 1, 700);
  const done = step > AGENDA.length;

  return (
    <PanelFrame>
      <div className="flex items-center gap-3">
        <Initial className="size-11 text-sm">TK</Initial>
        <div>
          <p className="font-display text-xl font-semibold text-heading">
            A call with Thomas
          </p>
          <p className="text-caption">15 minutes</p>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {AGENDA.map((item, index) => {
          const ticked = index < step;
          return (
            <li
              key={item}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-3 transition-colors duration-300",
                ticked ? "bg-accent-wash" : "bg-background",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full transition-colors duration-300",
                  ticked
                    ? "bg-primary text-primary-foreground"
                    : "bg-wash text-muted",
                )}
              >
                {ticked ? <CheckIcon weight="bold" className="size-4" /> : null}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  ticked ? "text-heading" : "text-muted",
                )}
              >
                {item}
              </span>
            </li>
          );
        })}
      </ul>
      <p
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-heading transition-opacity duration-500",
          done ? "opacity-100" : "opacity-0",
        )}
      >
        <CheckCircleIcon className="size-5 text-accent" />
        We know what to build for you
      </p>
    </PanelFrame>
  );
}

/** A family joining: sign up, pay, and the class opens. */
function JoinPanel({ active }: PanelProps) {
  const step = useCount(active, 3, 800);

  return (
    <PanelFrame>
      <div>
        <p className="font-display text-2xl font-semibold text-heading">
          Nature Study
        </p>
        <p className="text-caption">Fall co-op · Thursdays</p>
      </div>
      <div className="flex aspect-[16/7] items-center justify-center rounded-md bg-wash-strong" />
      <div className="flex min-h-11 items-center justify-between gap-3">
        {step >= 1 ? (
          <Badge className="fz-motion [animation:fz-pop_.45s_ease_both]">
            <CheckIcon weight="bold" />
            Payment received
          </Badge>
        ) : (
          <FauxButton className="h-10">Sign up</FauxButton>
        )}
        {step >= 2 ? (
          <span className="fz-motion inline-flex items-center gap-1.5 text-sm font-medium text-primary [animation:fz-pop_.45s_ease_both]">
            <LockSimpleOpenIcon className="size-5" />
            Class open
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          "mt-auto flex items-center gap-3 rounded-sm bg-background px-3 py-2.5 transition-opacity duration-500",
          step >= 2 ? "opacity-100" : "opacity-0",
        )}
      >
        <Initial>AM</Initial>
        <span className="text-sm text-heading">Amira, lesson 1</span>
        <Bar value={step >= 3 ? 20 : 0} className="ms-auto w-24" />
      </div>
    </PanelFrame>
  );
}

const ROSTER = [
  ["AM", "Student"],
  ["DM", "Parent"],
  ["JK", "Student"],
  ["SR", "Student"],
  ["LT", "Parent"],
] as const;

function ImportPanel({ active }: PanelProps) {
  const step = useCount(active, ROSTER.length + 2, 380);
  const dropped = step >= 1;
  const rows = Math.max(0, Math.min(ROSTER.length, step - 1));
  const done = step >= ROSTER.length + 2;

  return (
    <PanelFrame>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-2xl font-semibold text-heading">
          Students
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-sm transition-all duration-500",
            dropped
              ? "border-transparent bg-accent-wash text-primary"
              : "bg-background text-muted",
          )}
        >
          {dropped ? (
            <FileCsvIcon className="size-5" />
          ) : (
            <UploadSimpleIcon className="size-5" />
          )}
          {dropped ? "students.csv" : "Import"}
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {ROSTER.slice(0, rows).map(([face, role]) => (
          <li
            key={face}
            className="fz-motion flex items-center gap-3 rounded-sm bg-background px-3 py-2 [animation:fz-row_.35s_ease_both]"
          >
            <Initial>{face}</Initial>
            <span className="h-2 w-24 rounded-full bg-wash-strong" />
            <span className="ms-auto text-caption">{role}</span>
          </li>
        ))}
      </ul>
      <p
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-heading transition-opacity duration-500",
          done ? "opacity-100" : "opacity-0",
        )}
      >
        <CheckCircleIcon className="size-5 text-accent" />
        48 people imported
      </p>
    </PanelFrame>
  );
}
