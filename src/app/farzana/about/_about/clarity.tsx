"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRightIcon,
  ArrowsHorizontalIcon,
  PaperPlaneTiltIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { useInView, useReducedMotion } from "../../_home/motion";
import { FauxButton, Reveal, SectionIntro } from "../../_home/shared";
import { buttonClass } from "../../_ui/button";
import { cn } from "../../_ui/cn";
import { RUTA_URL } from "../../_ui/contact";

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

/**
 * Two screens in one frame, the typical one laid over Farzana's and cut off
 * at the line. The slider under the frame moves the line; it is a real range
 * input, so it works with a keyboard and never fights a phone's scroll. The
 * first time the frame comes into view the line sweeps across once on its
 * own, so it reads as something to drag.
 */
function Compare() {
  const ref = useRef<HTMLDivElement>(null);
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

  const transition = touched || reduced ? "none" : `all ${SWEEP_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div
        aria-hidden
        dir="ltr"
        className="relative h-[360px] overflow-hidden rounded-lg border bg-surface select-none"
      >
        <FarzanaScreen />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)`, transition }}
        >
          <TypicalScreen />
        </div>
        <div
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-primary"
          style={{ left: `${split}%`, transition }}
        >
          <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-overlay">
            <ArrowsHorizontalIcon weight="bold" className="size-5" />
          </span>
        </div>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-caption">Drag to compare</span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(event) => {
            setTouched(true);
            setSplit(Number(event.target.value));
          }}
          aria-label="Compare a typical screen with Farzana"
          className="h-11 w-full cursor-pointer accent-[var(--color-primary)]"
        />
      </label>
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

/** Farzana's screen for the same job: who it goes to, what it says, Send. */
function FarzanaScreen() {
  return (
    <div className="absolute inset-0 flex flex-col gap-4 bg-surface p-6 pt-14">
      <span className="absolute top-3 right-3 rounded-full bg-accent-wash px-2.5 py-1 text-xs font-medium text-primary">
        Farzana
      </span>
      <p className="font-display text-2xl font-semibold text-heading">
        Email your families
      </p>
      <div className="flex items-center gap-2 rounded-md bg-wash px-3.5 py-3 text-sm text-ink">
        <UsersThreeIcon className="size-5 text-accent" />
        Nature Study families · 14
      </div>
      <div className="rounded-md border bg-background px-3.5 py-3 text-sm leading-6 text-ink">
        Class is at 10 on Thursday. Bring your nature journals!
      </div>
      <FauxButton className="mt-auto h-11 self-start px-5 text-base">
        <PaperPlaneTiltIcon weight="bold" className="size-5" />
        Send
      </FauxButton>
    </div>
  );
}
