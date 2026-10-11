"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpenTextIcon,
  BrowserIcon,
  CalendarCheckIcon,
  CaretDownIcon,
  CheckIcon,
  DeviceMobileIcon,
  EnvelopeSimpleIcon,
  HandshakeIcon,
  PaletteIcon,
  UsersThreeIcon,
  WalletIcon,
  type Icon,
} from "@phosphor-icons/react";

import { Reveal, SectionIntro, vars } from "../../_home/shared";
import { Badge } from "../../_ui/badge";
import { buttonClass } from "../../_ui/button";
import { cn } from "../../_ui/cn";
import { BOOK_PATH } from "../../_ui/contact";
import { Diamond } from "../../_ui/diamond";

import { INTERVAL, TIERS, tierFor } from "./plan";

/**
 * The pricing page: three sizes by number of students, with every feature
 * and setup at every size; how few class sales a month pay for it;
 * everything that comes in it; and the questions people ask about money.
 */

/* ---- The sizes --------------------------------------------------------- */

export function PricingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pb-28">
      <div className="flex flex-col items-start gap-6">
        <Badge className="fz-rise" style={vars({ "--d": "0ms" })}>
          <Diamond size={8} />
          Pricing
        </Badge>
        <h1 className="fz-rise text-display text-balance" style={vars({ "--d": "80ms" })}>
          Priced by size. <span className="text-primary">Everything in it.</span>
        </h1>
        <p className="fz-rise max-w-xl text-pretty text-lg text-muted" style={vars({ "--d": "200ms" })}>
          Every school gets all of Farzana, set up for you. The price only
          follows how many students you teach. Nothing to add on, and none of
          your class fees go to us.
        </p>
      </div>
      <div className="fz-rise" style={vars({ "--d": "260ms" })}>
        <SizePicker />
      </div>
    </section>
  );
}

/** The slider runs on a log scale, so 10, 100, 1,000 and 10,000 are evenly spaced. */
const LOW = 10;
const HIGH = 10000;
const toStudents = (position: number) =>
  Math.round(LOW * Math.pow(HIGH / LOW, position / 100));
const toPosition = (students: number) =>
  (Math.log(students / LOW) / Math.log(HIGH / LOW)) * 100;

/** A tidy count to show: whole tens under 1,000, whole hundreds above. */
function tidy(students: number) {
  const step = students < 1000 ? 10 : 100;
  return Math.max(LOW, Math.round(students / step) * step);
}

/** Where a size's row puts the slider when it is chosen. */
const SAMPLE = [60, 400, 9000];

/**
 * How many students do you teach? Slide, or pick a size, and the price for
 * that size shows — with a small pop whenever the size changes.
 */
function SizePicker() {
  const [students, setStudents] = useState(400);
  const tier = tierFor(students);

  return (
    <div className="surface-card mx-auto flex w-full max-w-[460px] flex-col gap-6 rounded-lg p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-xl font-semibold text-heading">Farzana</span>
        <Badge>Every feature, every size</Badge>
      </div>

      <label className="flex flex-col gap-2">
        <span className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium text-heading">How many students?</span>
          <span className="font-display text-2xl font-semibold text-heading tabular-nums">
            {students.toLocaleString("en-US")}
            {students >= HIGH ? "+" : ""}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={toPosition(students)}
          onChange={(event) => setStudents(tidy(toStudents(Number(event.target.value))))}
          aria-valuetext={`${students.toLocaleString("en-US")} students, $${tier.dollars} a ${INTERVAL}`}
          className="h-11 w-full cursor-pointer accent-[var(--color-primary)]"
        />
      </label>

      <p className="flex items-end gap-2" aria-live="polite">
        <span
          key={tier.dollars}
          className="fz-motion font-display text-[64px] leading-[0.9] font-semibold text-heading tabular-nums [animation:fz-pop_.4s_ease_both]"
        >
          ${tier.dollars}
        </span>
        <span className="pb-1.5 text-lg text-muted">/ {INTERVAL}</span>
      </p>

      <div role="group" aria-label="Sizes" className="flex flex-col gap-2">
        {TIERS.map((entry, index) => {
          const current = entry === tier;
          return (
            <button
              key={entry.label}
              type="button"
              aria-pressed={current}
              onClick={() => setStudents(SAMPLE[index])}
              className={cn(
                "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm border px-4 text-start text-sm transition-colors",
                current
                  ? "border-transparent bg-accent-wash text-primary"
                  : "bg-background text-heading hover:bg-wash",
              )}
            >
              <span className="flex items-center gap-2.5 font-medium">
                {current ? <CheckIcon weight="bold" className="size-4" /> : <span className="size-4" />}
                {entry.label}
              </span>
              <span className="font-semibold tabular-nums">
                ${entry.dollars}
                <span className="font-normal text-muted"> / mo</span>
              </span>
            </button>
          );
        })}
      </div>

      <Link href={BOOK_PATH} className={buttonClass({ size: "lg", className: "w-full" })}>
        <CalendarCheckIcon weight="bold" />
        Book a 15-minute call
      </Link>
      <p className="text-caption">Card payments carry Stripe’s standard processing fee.</p>
    </div>
  );
}

/* ---- It pays for itself ------------------------------------------------- */

const MIN_FEE = 25;
const MAX_FEE = 600;

/**
 * A few class sales a month cover Farzana. Slide to what one class costs and
 * each size shows how many sales a month pay for it; none of the class fees
 * go to Farzana, so every sale after that is the school's.
 */
export function PaysForItself() {
  const [fee, setFee] = useState(150);

  return (
    <section className="border-y bg-surface">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:gap-20">
        <SectionIntro
          align="start"
          eyebrow="It pays for itself"
          title="A few class sales a month cover it."
        >
          Slide to what you charge for one class and see how many sales a
          month pay for Farzana. None of your class fees go to us, so every
          sale after that is yours.
        </SectionIntro>
        <Reveal delay={100}>
          <div className="flex flex-col gap-6 rounded-lg border bg-background p-6 sm:p-8">
            <label className="flex flex-col gap-2">
              <span className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium text-heading">One class costs</span>
                <span className="font-display text-3xl font-semibold text-heading tabular-nums">${fee}</span>
              </span>
              <input
                type="range"
                min={MIN_FEE}
                max={MAX_FEE}
                step={5}
                value={fee}
                onChange={(event) => setFee(Number(event.target.value))}
                className="h-11 w-full cursor-pointer accent-[var(--color-primary)]"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((tier) => {
                const sales = Math.ceil(tier.dollars / fee);
                return (
                  <div key={tier.label} className="flex flex-col gap-1 rounded-md border bg-surface px-3 py-3">
                    <span
                      key={sales}
                      className="fz-motion font-display text-[32px] leading-none font-semibold text-primary tabular-nums [animation:fz-pop_.35s_ease_both]"
                    >
                      {sales}
                    </span>
                    <span className="text-caption">
                      {sales === 1 ? "sale" : "sales"} a month for the ${tier.dollars} size
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---- Everything in it ------------------------------------------------- */

const INCLUDED: { icon: Icon; title: string; body: string }[] = [
  { icon: BookOpenTextIcon, title: "Lessons, video and quizzes", body: "Quizzes that grade themselves, all inside one class." },
  { icon: WalletIcon, title: "Get paid directly", body: "Payments go straight into your account. None of your class fees go to us." },
  { icon: EnvelopeSimpleIcon, title: "Email your families", body: "One class or everyone, without leaving Farzana." },
  { icon: UsersThreeIcon, title: "Students and parents", body: "Everyone gets their own sign-in." },
  { icon: PaletteIcon, title: "Your logo and colors", body: "Families see you, not another company." },
  { icon: BrowserIcon, title: "A page for your school", body: "Families sign up from it. Change anything you like." },
  { icon: HandshakeIcon, title: "Set up for you", body: "After a short call, we build it and bring your students over." },
  { icon: DeviceMobileIcon, title: "Works on your phone", body: "Run your whole school on the go." },
];

export function Included() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionIntro eyebrow="Everything in it" title="Every size gets everything.">
        Every part of Farzana, and setting it up for you, comes with every
        size. No add-ons to buy.
      </SectionIntro>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INCLUDED.map(({ icon: ItemIcon, title, body }, index) => (
          <Reveal key={title} delay={(index % 4) * 70} className="h-full">
            <div className="surface-card flex h-full flex-col gap-3 rounded-lg p-5">
              <span className="inline-flex size-10 items-center justify-center rounded-sm bg-accent-wash text-primary">
                <ItemIcon weight="regular" className="size-6" />
              </span>
              <h3 className="text-lg leading-6">{title}</h3>
              <p className="text-sm text-muted">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---- Questions --------------------------------------------------------- */

const QUESTIONS = [
  {
    question: "How is the price set?",
    answer: `By how many students you teach: up to 100 students is $${TIERS[0].dollars} a month, 101 to 7,999 is $${TIERS[1].dollars}, and 8,000 or more is $${TIERS[2].dollars}. Every size gets every feature.`,
  },
  {
    question: "Is setup included at every size?",
    answer:
      "Yes. After a short call about how you teach, we build it with your logo and colors and bring your classes and students over, whatever your size.",
  },
  {
    question: "Do you take a cut of my class fees?",
    answer:
      "No. Payments go straight into your own account, and none of your class fees go to us. Card payments carry Stripe’s standard processing fee.",
  },
  {
    question: "Are there add-ons?",
    answer: "No. Everything on this page is in every size.",
  },
  {
    question: "Can I bring my students from another system?",
    answer: "Yes. Bring your students with you in one import. You don’t have to start over.",
  },
  {
    question: "Does it work on a phone?",
    answer: "Yes. Farzana is designed for the phone first, so you can run your school from anywhere.",
  },
];

export function Questions() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6 sm:pb-32">
      <SectionIntro eyebrow="Questions" title="What people ask about price." />
      <div className="mt-12 flex flex-col gap-3">
        {QUESTIONS.map(({ question, answer }, index) => (
          <Reveal key={question} delay={index * 60}>
            <details className="group surface-card rounded-md">
              <summary className="flex min-h-14 list-none items-center justify-between gap-4 rounded-md px-5 py-3 font-medium text-heading hover:bg-wash [&::-webkit-details-marker]:hidden">
                {question}
                <CaretDownIcon weight="bold" className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pt-1 pb-5 text-pretty text-muted">{answer}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
