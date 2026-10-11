"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRightIcon,
  ArrowsHorizontalIcon,
  PaperPlaneTiltIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { useInView, useReducedMotion } from "./motion";
import { FauxButton, Reveal, SectionIntro } from "./shared";
import { buttonClass } from "../_ui/button";
import { cn } from "../_ui/cn";
import { RUTA_URL } from "../_ui/contact";

/**
 * The clarity guarantee, and where it comes from: Thomas's work on Ruta,
 * software for landscaping owners who are not technical. Beside it, the same
 * job — emailing families — on a typical screen and on Farzana, with a line
 * to drag between the two.
 */
export function Clarity() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <SectionIntro
            align="start"
            eyebrow="Clear, guaranteed"
            title="We guarantee it’s clear. You’ll never have to think about it."
          >
            I’ve built this kind of software before. I work on the team behind
            Ruta, software for landscaping businesses whose owners aren’t
            technical and need every screen to be clear. Farzana is built the
            same way.
          </SectionIntro>
          <Reveal delay={100}>
            <Link
              href={RUTA_URL}
              className={buttonClass({ variant: "outline", className: "bg-surface" })}
            >
              <ArrowUpRightIcon weight="bold" />
              See my work on Ruta
            </Link>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <Compare />
        </Reveal>
      </div>
    </section>
  );
}

/** Where the line sweeps the first time it comes into view, in turn. */
const SWEEP = [80, 20, 50];
const SWEEP_MS = 900;
/** The line stops short of the edges, so the arrow is always whole. */
const MIN = 5;
const MAX = 95;

function clamp(value: number) {
  return Math.min(MAX, Math.max(MIN, value));
}

/**
 * Two screens in one frame: the mess on the left, Farzana on the right, read
 * the way the eye reads. The typical screen is laid over Farzana's and cut off
 * at the line. The arrow in the middle is the control: grab it and drag, or
 * focus it and use the arrow keys. Only the arrow takes a touch, so a phone
 * still scrolls past the frame. The first time the frame comes into view the
 * line sweeps across once on its own, so it reads as something to drag.
 */
function Compare() {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const inView = useInView(ref, { margin: "0px 0px -20% 0px" });
  const reduced = useReducedMotion();
  const [split, setSplit] = useState(50);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!inView || reduced || touched) return;
    const timers = SWEEP.map((value, index) =>
      window.setTimeout(() => setSplit(value), 300 + index * (SWEEP_MS + 250)),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, reduced, touched]);

  const moveTo = (clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    setSplit(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  const sweeping = !touched && !reduced;
  const ease = "cubic-bezier(0.65, 0, 0.35, 1)";
  const value = Math.round(split);

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div
        ref={frameRef}
        dir="ltr"
        className="relative h-[360px] overflow-hidden rounded-lg border bg-surface select-none"
      >
        <div aria-hidden className="absolute inset-0">
          <FarzanaScreen />
        </div>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 ${100 - split}% 0 0)`,
            transition: sweeping ? `clip-path ${SWEEP_MS}ms ${ease}` : undefined,
          }}
        >
          <TypicalScreen />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-primary"
          style={{
            left: `${split}%`,
            transition: sweeping ? `left ${SWEEP_MS}ms ${ease}` : undefined,
          }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Compare a typical screen with Farzana"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={value}
          aria-valuetext={`${value}% typical software, ${100 - value}% Farzana`}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            dragging.current = true;
            setTouched(true);
          }}
          onPointerMove={(event) => {
            if (dragging.current) moveTo(event.clientX);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 5;
            const next: Record<string, number> = {
              ArrowLeft: split - step,
              ArrowDown: split - step,
              ArrowRight: split + step,
              ArrowUp: split + step,
              Home: MIN,
              End: MAX,
            };
            if (!(event.key in next)) return;
            event.preventDefault();
            setTouched(true);
            setSplit(clamp(next[event.key]));
          }}
          className="absolute top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-overlay hover:bg-primary-hover focus-visible:outline-gold active:cursor-grabbing"
          style={{
            left: `${split}%`,
            transition: sweeping ? `left ${SWEEP_MS}ms ${ease}` : undefined,
          }}
        >
          <ArrowsHorizontalIcon weight="bold" className="size-5" />
        </div>
      </div>
      <p className="text-caption">Drag the arrow to compare</p>
    </div>
  );
}

/* ---- The two screens ------------------------------------------------- */

const SETTINGS: [string, string][] = [
  ["SMTP host", "smtp.mail-relay.net"],
  ["Port", "587"],
  ["API key", "key_••••••••••"],
  ["Webhook secret", "whsec_••••••"],
  ["From domain", "Verify DNS (TXT)"],
  ["Enrollment rule", "^class_(\\d+)$"],
  ["Retry policy", "Exponential"],
  ["Time zone", "UTC−00:00"],
];

/** The typical screen: a settings page standing between you and one email. */
function TypicalScreen() {
  return (
    <div className="absolute inset-0 flex flex-col bg-background pt-11 text-[11px] leading-4 text-muted">
      <span className="absolute top-3 left-3 rounded-full border bg-surface px-2.5 py-1 text-xs font-medium text-muted">
        Typical software
      </span>
      <div className="flex gap-3 overflow-hidden border-b px-3 pb-2 whitespace-nowrap">
        {["Dashboard", "Modules", "Integrations", "SMTP", "Webhooks", "Roles", "Billing"].map(
          (tab) => (
            <span key={tab} className={cn(tab === "SMTP" && "font-semibold text-ink")}>
              {tab}
            </span>
          ),
        )}
      </div>
      <div className="mx-3 mt-2 rounded-[3px] border border-dashed px-2 py-1 text-destructive">
        3 settings need attention before mail can send
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3">
        {SETTINGS.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[9px] tracking-wide uppercase">{label}</span>
            <span className="h-6 truncate rounded-[3px] border bg-surface px-1.5 font-mono text-[10px] leading-6 text-ink">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex justify-end gap-1.5 border-t p-2">
        {["Test", "Validate", "Save draft", "Publish"].map((label) => (
          <span key={label} className="rounded-[3px] border px-2 py-1">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Farzana's screen for the same job: who it goes to, what it says, Send. It
 * sits in the frame's right half, so the whole of it shows beside the mess.
 */
function FarzanaScreen() {
  return (
    <div className="absolute inset-0 flex justify-end bg-surface p-4 pt-14 sm:p-6 sm:pt-14">
      <span className="absolute top-3 right-3 rounded-full bg-accent-wash px-2.5 py-1 text-xs font-medium text-primary">
        Farzana
      </span>
      <div className="flex h-full w-[44%] min-w-0 flex-col gap-3">
        <p className="font-display text-xl leading-7 font-semibold text-balance text-heading">
          Email your families
        </p>
        <div className="flex min-w-0 items-center gap-2 rounded-md bg-wash px-3 py-2.5 text-sm text-ink">
          <UsersThreeIcon className="size-5 shrink-0 text-accent" />
          <span className="truncate">Nature Study · 14</span>
        </div>
        <div className="rounded-md border bg-background px-3 py-2.5 text-sm leading-6 text-ink">
          Class is at 10 on Thursday. Bring your nature journals!
        </div>
        <FauxButton className="mt-auto h-11 self-start px-5 text-base">
          <PaperPlaneTiltIcon weight="bold" className="size-5" />
          Send
        </FauxButton>
      </div>
    </div>
  );
}
