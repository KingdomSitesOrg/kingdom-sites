"use client";

import { type ComponentType, useRef, useState } from "react";
import {
  ChartLineUpIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  UserPlusIcon,
  WalletIcon,
  type Icon,
} from "@phosphor-icons/react";

import { useBeat, useInView, useReducedMotion } from "../../_home/motion";
import { FauxButton, Initial, Reveal, SectionIntro } from "../../_home/shared";
import { cn } from "../../_ui/cn";

/**
 * Mobile first: four everyday jobs, each done on a phone. The phone plays
 * them one after another while it is on screen; choosing a job stops the tour
 * and keeps that one.
 */

type Task = { label: string; icon: Icon; Screen: ComponentType };

const TASKS: Task[] = [
  { label: "Email a class", icon: EnvelopeSimpleIcon, Screen: EmailScreen },
  { label: "See who has paid", icon: WalletIcon, Screen: PaidScreen },
  { label: "Add a student", icon: UserPlusIcon, Screen: AddScreen },
  { label: "Check progress", icon: ChartLineUpIcon, Screen: ProgressScreen },
];

const TOUR_MS = 4200;

export function OnTheGo() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: false, margin: "0px" });
  const reduced = useReducedMotion();
  const [chosen, setChosen] = useState<number | null>(null);
  const beat = useBeat(TASKS.length, TOUR_MS, visible && !reduced && chosen === null);
  const current = chosen ?? beat;
  const { Screen } = TASKS[current];

  return (
    <section className="border-y bg-surface">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-8">
          <SectionIntro
            align="start"
            eyebrow="Mobile first"
            title="Run your school from your phone."
          >
            Farzana is designed for the phone first, so you can do everything
            on the go: from the car line, the co-op hallway or the kitchen
            table.
          </SectionIntro>
          <Reveal delay={100}>
            <div role="group" aria-label="Choose a job to see on the phone" className="grid gap-2 sm:grid-cols-2">
              {TASKS.map(({ label, icon: TaskIcon }, index) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={current === index}
                  onClick={() => setChosen(index)}
                  className={cn(
                    "inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-sm border px-4 text-start text-sm font-medium transition-colors",
                    current === index
                      ? "border-transparent bg-accent-wash text-primary"
                      : "bg-background text-heading hover:bg-wash",
                  )}
                >
                  <TaskIcon weight="bold" className="size-5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={150} className="flex justify-center">
          <div ref={ref} aria-hidden className="w-[290px] rounded-[2.75rem] border bg-background p-2.5 sm:w-[310px]">
            <div className="relative h-[540px] overflow-hidden rounded-[2.25rem] bg-surface">
              <div className="mx-auto mt-2.5 h-6 w-24 rounded-full bg-wash-strong" />
              <div key={current} className="fz-motion absolute inset-x-0 top-12 bottom-0 [animation:fz-row_.45s_ease_both]">
                <Screen />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---- The phone's screens ---------------------------------------------- */

function ScreenTitle({ children, caption }: { children: string; caption: string }) {
  return (
    <div className="px-5 pt-3 pb-4">
      <p className="text-caption">{caption}</p>
      <p className="font-display text-2xl font-semibold text-heading">{children}</p>
    </div>
  );
}

/** A lapis toast arriving at the foot of the phone a moment after the job. */
function PhoneToast({ children, delay = 1400 }: { children: string; delay?: number }) {
  return (
    <div className="absolute inset-x-0 bottom-6 flex justify-center">
      <span
        className="fz-motion inline-flex items-center gap-2 rounded-sm bg-lapis px-4 py-2.5 text-sm font-medium text-white shadow-overlay [animation:fz-row_.4s_ease_both]"
        style={{ animationDelay: `${delay}ms` }}
      >
        <CheckCircleIcon weight="bold" className="size-4" />
        {children}
      </span>
    </div>
  );
}

function EmailScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenTitle caption="Email">Latin I families</ScreenTitle>
      <div className="flex flex-col gap-3 px-5">
        <div className="flex items-center gap-2 rounded-md bg-wash px-3.5 py-3 text-sm text-ink">
          <EnvelopeSimpleIcon className="size-5 text-accent" />
          To 12 families
        </div>
        <div className="rounded-md border bg-background px-3.5 py-3 text-sm leading-6 text-ink">
          <span className="fz-motion inline-block [animation:fz-type_1.1s_steps(18)_.3s_both]">
            No class on Tuesday.
          </span>{" "}
          <span className="fz-motion inline-block [animation:fz-type_1s_steps(16)_1.1s_both]">
            See you Thursday!
          </span>
        </div>
        <FauxButton className="h-11 self-start px-5">Send</FauxButton>
      </div>
      <PhoneToast delay={2300}>Sent to 12 families</PhoneToast>
    </div>
  );
}

const FAMILIES: [string, string, boolean][] = [
  ["AM", "The Martins", true],
  ["JK", "The Kims", true],
  ["SR", "The Reyes", false],
  ["LT", "The Taylors", true],
  ["NB", "The Bakers", true],
];

function PaidScreen() {
  const paid = FAMILIES.filter(([, , hasPaid]) => hasPaid).length;
  return (
    <div className="flex h-full flex-col">
      <ScreenTitle caption="Fall co-op">Who has paid</ScreenTitle>
      <ul className="flex flex-col gap-2 px-5">
        {FAMILIES.map(([initials, name, hasPaid], index) => (
          <li
            key={name}
            className="fz-motion flex items-center gap-3 rounded-md border bg-background px-3 py-2.5 [animation:fz-row_.35s_ease_both]"
            style={{ animationDelay: `${150 + index * 110}ms` }}
          >
            <Initial>{initials}</Initial>
            <span className="flex-1 text-sm text-ink">{name}</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                hasPaid ? "bg-accent-wash text-primary" : "bg-wash-strong text-heading",
              )}
            >
              {hasPaid ? "Paid" : "Not yet"}
            </span>
          </li>
        ))}
      </ul>
      <p className="px-5 pt-4 text-caption">
        {paid} of {FAMILIES.length} families paid
      </p>
    </div>
  );
}

function AddScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenTitle caption="Students">Add a student</ScreenTitle>
      <div className="flex flex-col gap-3 px-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-caption">Name</span>
          <span className="flex h-11 items-center rounded-sm border bg-background px-3 text-sm text-ink">
            <span className="fz-motion inline-block [animation:fz-type_1s_steps(11)_.3s_both]">
              Ruth Miller
            </span>
            <span className="fz-motion ms-0.5 h-5 w-px bg-ink [animation:fz-caret_1s_steps(1)_infinite]" />
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-caption">Class</span>
          <span className="flex h-11 items-center rounded-sm border bg-background px-3 text-sm text-ink">
            Nature Study
          </span>
        </div>
        <FauxButton className="h-11 self-start px-5">
          <UserPlusIcon weight="bold" className="size-4" />
          Add
        </FauxButton>
      </div>
      <PhoneToast delay={1700}>Ruth added to Nature Study</PhoneToast>
    </div>
  );
}

const PROGRESS: [string, string, number][] = [
  ["AM", "Abby", 90],
  ["JK", "Jonah", 75],
  ["SR", "Sofia", 60],
  ["LT", "Levi", 40],
];

function ProgressScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenTitle caption="Latin I">Progress</ScreenTitle>
      <ul className="flex flex-col gap-3 px-5">
        {PROGRESS.map(([initials, name, value], index) => (
          <li key={name} className="flex items-center gap-3 rounded-md border bg-background px-3 py-3">
            <Initial>{initials}</Initial>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-ink">{name}</span>
                <span className="text-caption">{value}%</span>
              </div>
              <span className="block h-2 overflow-hidden rounded-full bg-border">
                <span
                  className="fz-motion block h-full origin-left rounded-full bg-accent [animation:fz-grow_.9s_cubic-bezier(.2,.7,.2,1)_both] rtl:origin-right"
                  style={{ width: `${value}%`, animationDelay: `${200 + index * 120}ms` }}
                />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
