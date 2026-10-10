"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

import { useInView, useReducedMotion } from "../../_home/motion";
import { Reveal, SectionIntro, vars } from "../../_home/shared";
import { Badge } from "../../_ui/badge";
import { buttonClass } from "../../_ui/button";
import { BOOK_PATH } from "../../_ui/contact";
import { Diamond } from "../../_ui/diamond";

import { PLAN, PLAN_PRICE } from "./plan";

/**
 * The pricing page: one plan and everything in it, what it comes to for each
 * student as a school grows, and the questions people ask about money.
 */

/* ---- The plan ---------------------------------------------------------- */

const QUICK = ["Everything on this page", "Set up for you on a call", "0% of your class fees"];

export function PricingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pb-28">
      <div className="flex flex-col items-start gap-6">
        <Badge className="fz-rise" style={vars({ "--d": "0ms" })}>
          <Diamond size={8} />
          Pricing
        </Badge>
        <h1 className="fz-rise text-display text-balance" style={vars({ "--d": "80ms" })}>
          One plan. <span className="text-primary">Everything in it.</span>
        </h1>
        <p className="fz-rise max-w-xl text-pretty text-lg text-muted" style={vars({ "--d": "200ms" })}>
          One price for your whole school. Nothing to add on, and none of your
          class fees go to us.
        </p>
      </div>
      <div className="fz-rise" style={vars({ "--d": "260ms" })}>
        <PriceCard />
      </div>
    </section>
  );
}

function PriceCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduced = useReducedMotion();
  const counted = useCountUp(PLAN.dollars, inView && !reduced);
  const shown = reduced ? PLAN.dollars : counted;

  return (
    <div ref={ref} className="surface-card mx-auto flex w-full max-w-[440px] flex-col gap-6 rounded-lg p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="font-display text-xl font-semibold text-heading">Farzana</span>
        <Badge>One plan</Badge>
      </div>
      <div>
        <p className="flex items-end gap-2">
          <span className="sr-only">
            {PLAN_PRICE} a {PLAN.interval}
          </span>
          <span aria-hidden className="font-display text-[72px] leading-[0.9] font-semibold text-heading tabular-nums">
            ${shown}
          </span>
          <span aria-hidden className="pb-1.5 text-lg text-muted">/ {PLAN.interval}</span>
        </p>
        <p className="mt-2 text-muted">For your whole school</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {QUICK.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-ink">
            <CheckIcon weight="bold" className="size-4 text-accent" />
            {item}
          </li>
        ))}
      </ul>
      <Link href={BOOK_PATH} className={buttonClass({ size: "lg", className: "w-full" })}>
        <CalendarCheckIcon weight="bold" />
        Book a 15-minute call
      </Link>
      <p className="text-caption">Card payments carry Stripe’s standard processing fee.</p>
    </div>
  );
}

/**
 * Counts from 0 to `target` once, when `run` turns true. Until then it holds
 * `target`, so the price is right in the page's first HTML and without script;
 * the hero rises in over the first moment, so the restart from 0 is not seen.
 */
function useCountUp(target: number, run: boolean, duration = 1100) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (!run) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target, run, duration]);
  return value;
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
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
      <SectionIntro eyebrow="Everything in it" title="No add-ons to buy.">
        Every part of Farzana comes in the one plan.
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

/* ---- Per student ------------------------------------------------------- */

const MIN_STUDENTS = 10;
const MAX_STUDENTS = 300;

/**
 * The same price, whatever the size of the school: slide the number of
 * students and watch what it comes to for each one fall. The bar is that
 * per-student amount, against what it is for the smallest school.
 */
export function PerStudent() {
  const [students, setStudents] = useState(80);
  const each = PLAN.dollars / students;
  const most = PLAN.dollars / MIN_STUDENTS;

  return (
    <section className="border-y bg-surface">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:gap-20">
        <SectionIntro
          align="start"
          eyebrow="One price as you grow"
          title="The more students you teach, the less it costs each one."
        >
          The plan is {PLAN_PRICE} a {PLAN.interval} for the whole school. Slide
          to see what that comes to for each student.
        </SectionIntro>
        <Reveal delay={100}>
          <div className="flex flex-col gap-6 rounded-lg border bg-background p-6 sm:p-8">
            <label className="flex flex-col gap-3">
              <span className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium text-heading">Students</span>
                <span className="font-display text-3xl font-semibold text-heading tabular-nums">{students}</span>
              </span>
              <input
                type="range"
                min={MIN_STUDENTS}
                max={MAX_STUDENTS}
                step={5}
                value={students}
                onChange={(event) => setStudents(Number(event.target.value))}
                className="h-11 w-full cursor-pointer accent-[var(--color-primary)]"
              />
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-muted">Each student, per {PLAN.interval}</span>
                <span className="font-display text-[44px] leading-none font-semibold text-primary tabular-nums">
                  ${each.toFixed(2)}
                </span>
              </div>
              <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                  style={{ width: `${(each / most) * 100}%` }}
                />
              </span>
            </div>
            <p className="text-caption">
              {PLAN_PRICE} a {PLAN.interval} ÷ {students} students. The plan’s price doesn’t change.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---- Questions --------------------------------------------------------- */

const QUESTIONS = [
  {
    question: "Do you take a cut of my class fees?",
    answer:
      "No. Payments go straight into your own account, and none of your class fees go to us. Card payments carry Stripe’s standard processing fee.",
  },
  {
    question: "Are there add-ons?",
    answer: "No. Everything on this page is in the one plan.",
  },
  {
    question: "Who sets it up?",
    answer:
      "We do. After a short call about how you teach, we build it with your logo and colors and bring your classes and students over.",
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
    <section className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
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
