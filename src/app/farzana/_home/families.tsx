"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  PlayIcon,
  StudentIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { Diamond } from "../_ui/diamond";
import { cn } from "../_ui/cn";

import { Bar, FauxButton, Initial, Reveal, SectionIntro } from "./shared";

/**
 * The other side of the school: what a student and a parent see, on the
 * phone. The visitor flips between the two with a real toggle; the screen in
 * the phone is a picture.
 */

const POINTS = [
  "Every student and parent gets their own sign-in",
  "Lessons and progress in one place, nothing to ask you for",
  "Works just as well on the phone",
];

type Side = "student" | "parent";

export function Families() {
  const [side, setSide] = useState<Side>("student");

  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:gap-20">
      <div className="flex flex-col gap-8">
        <SectionIntro
          align="start"
          eyebrow="For students and families"
          title="Progress families can see, without asking you."
        >
          A calm place to learn, on any screen. Students pick up where they
          left off; parents see how it is going.
        </SectionIntro>
        <Reveal delay={100}>
          <ul className="flex flex-col gap-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-ink">
                <Diamond size={10} />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <Reveal delay={150} className="flex flex-col items-center gap-6">
        <div
          role="group"
          aria-label="Whose screen to show"
          className="flex rounded-sm border bg-surface"
        >
          {(
            [
              { value: "student", label: "Student", icon: StudentIcon },
              { value: "parent", label: "Parent", icon: UsersThreeIcon },
            ] as const
          ).map(({ value, label, icon: SideIcon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={side === value}
              onClick={() => setSide(value)}
              className={cn(
                "inline-flex h-11 cursor-pointer items-center gap-2 px-4 text-sm font-medium first:rounded-s-sm last:rounded-e-sm",
                side === value
                  ? "bg-accent-wash text-primary"
                  : "text-heading hover:bg-wash",
              )}
            >
              <SideIcon weight="bold" className="size-5" />
              {label}
            </button>
          ))}
        </div>
        <Phone side={side} />
      </Reveal>
    </section>
  );
}

/** A phone, drawn: the device's round corners, a hairline, the screen. */
function Phone({ side }: { side: Side }) {
  return (
    <div
      aria-hidden
      className="w-[300px] rounded-[2.75rem] border bg-surface p-2.5 sm:w-[320px]"
    >
      <div className="relative h-[560px] overflow-hidden rounded-[2.25rem] bg-background">
        <div className="mx-auto mt-2.5 h-6 w-24 rounded-full bg-wash-strong" />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 top-12 transition-all duration-500",
            side === "student" ? "opacity-100" : "pointer-events-none translate-x-4 opacity-0",
          )}
        >
          <StudentScreen />
        </div>
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 top-12 transition-all duration-500",
            side === "parent" ? "opacity-100" : "pointer-events-none -translate-x-4 opacity-0",
          )}
        >
          <ParentScreen />
        </div>
      </div>
    </div>
  );
}

function StudentScreen() {
  return (
    <div className="flex h-full flex-col gap-4 px-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-caption">Welcome back</p>
          <p className="font-display text-xl font-semibold text-heading">Amira</p>
        </div>
        <Initial className="size-9">AM</Initial>
      </div>
      <div className="surface-card flex flex-col gap-3 rounded-md p-4">
        <div className="flex aspect-video items-center justify-center rounded-sm bg-wash-strong">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface text-primary">
            <PlayIcon weight="bold" className="size-4" />
          </span>
        </div>
        <div>
          <p className="text-caption">Nature Study · Week 3</p>
          <p className="font-medium text-heading">Leaves and seeds</p>
        </div>
        <div className="flex items-center gap-3">
          <Bar value={60} className="flex-1" />
          <span className="text-caption">6 of 10</span>
        </div>
        <FauxButton className="h-10 w-full">Continue lesson</FauxButton>
      </div>
      <div className="surface-card flex items-center gap-3 rounded-md px-4 py-3">
        <Diamond size={14} />
        <span className="text-sm font-medium text-heading">Five days in a row</span>
      </div>
      <div className="surface-card flex items-center justify-between rounded-md px-4 py-3">
        <span className="text-sm text-heading">Latin I</span>
        <Bar value={35} className="w-24" />
      </div>
    </div>
  );
}

const CHILDREN = [
  { face: "AM", name: "Amira", course: "Nature Study", progress: 60 },
  { face: "SM", name: "Sami", course: "Latin I", progress: 35 },
];

function ParentScreen() {
  return (
    <div className="flex h-full flex-col gap-4 px-4 pb-6">
      <div>
        <p className="text-caption">Your students</p>
        <p className="font-display text-xl font-semibold text-heading">Two learners</p>
      </div>
      {CHILDREN.map((child) => (
        <div key={child.name} className="surface-card flex flex-col gap-3 rounded-md p-4">
          <div className="flex items-center gap-3">
            <Initial className="size-9">{child.face}</Initial>
            <div className="min-w-0">
              <p className="font-medium text-heading">{child.name}</p>
              <p className="text-caption">{child.course}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bar value={child.progress} className="flex-1" />
            <span className="text-caption">{child.progress}%</span>
          </div>
        </div>
      ))}
      <div className="surface-card flex items-center gap-3 rounded-md px-4 py-3">
        <CheckCircleIcon className="size-5 text-accent" />
        <span className="text-sm text-heading">Receipt sent · Nature Study</span>
      </div>
    </div>
  );
}
