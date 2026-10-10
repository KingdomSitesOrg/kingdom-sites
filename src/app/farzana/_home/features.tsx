"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  BrowserIcon,
  CheckCircleIcon,
  CheckIcon,
  EnvelopeSimpleIcon,
  FilePdfIcon,
  LockSimpleIcon,
  LockSimpleOpenIcon,
  PaletteIcon,
  PaperPlaneTiltIcon,
  PlayIcon,
  StudentIcon,
  UsersThreeIcon,
  WalletIcon,
  BookOpenTextIcon,
  type Icon,
} from "@phosphor-icons/react";

import { Badge } from "../_ui/badge";
import { cn } from "../_ui/cn";

import { useInView, useReducedMotion } from "./motion";
import { FauxButton, Initial, Reveal, SectionIntro } from "./shared";

/**
 * Everything Farzana does, as a bento of six cards that fills every row. Each
 * card carries a small picture that plays once when it scrolls into view: the
 * quiz grades itself, the email goes out, the class unlocks, the page builds.
 *
 * Rows: 4 + 2, then 2 + 2 + 2, then 6 on a wide screen; on a tablet the first
 * and last cards span both columns, so every row is full there too.
 */
export function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionIntro
        id="features"
        eyebrow="Everything in one place"
        title="Everything your classes need. No add-ons to buy."
      >
        Built around how teachers actually teach, so you spend your week
        teaching, not juggling.
      </SectionIntro>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Tile
          className="sm:col-span-2 lg:col-span-4"
          icon={BookOpenTextIcon}
          title="Lessons, video and quizzes"
          body="Video, PDFs and quizzes that grade themselves, all inside one class."
        >
          <LessonPicture />
        </Tile>
        <Tile
          className="lg:col-span-2"
          delay={80}
          icon={WalletIcon}
          title="Get paid directly"
          body="Student payments go straight into your account."
        >
          <PaymentPicture />
        </Tile>
        <Tile
          className="lg:col-span-2"
          icon={EnvelopeSimpleIcon}
          title="Email your families"
          body="Receipts and updates to one class or to everyone, without leaving Farzana."
        >
          <EmailPicture />
        </Tile>
        <Tile
          className="lg:col-span-2"
          delay={80}
          icon={UsersThreeIcon}
          title="Accounts for students and parents"
          body="Everyone gets their own sign-in, and a class opens the moment they pay."
        >
          <AccountsPicture />
        </Tile>
        <Tile
          className="sm:col-span-2 lg:col-span-2"
          delay={160}
          icon={PaletteIcon}
          title="Make it yours"
          body="Your logo and your colors, so families see you, not another company."
        >
          <BrandPicture />
        </Tile>
        <Tile
          className="sm:col-span-2 lg:col-span-6"
          icon={BrowserIcon}
          title="A web page for your school, in one click"
          body="Add your logo, tell us about your classes, and Farzana builds a page families can sign up from. Change anything you like."
          wide
        >
          <PagePicture />
        </Tile>
      </div>
    </section>
  );
}

function Tile({
  icon: TileIcon,
  title,
  body,
  children,
  className,
  delay = 0,
  wide = false,
}: {
  icon: Icon;
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Words beside the picture rather than above it, on a wide screen. */
  wide?: boolean;
}) {
  return (
    <Reveal className={className} delay={delay}>
      <article
        className={cn(
          "surface-card flex h-full flex-col gap-6 overflow-hidden rounded-lg p-6 sm:p-7",
          wide && "lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-10",
        )}
      >
        <div className="flex flex-col gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-md bg-accent-wash text-accent">
            <TileIcon className="size-6" />
          </span>
          <h3 className="text-balance">{title}</h3>
          <p className="max-w-md text-pretty text-muted">{body}</p>
        </div>
        <div className="mt-auto" aria-hidden>
          {children}
        </div>
      </article>
    </Reveal>
  );
}

/** The picture's own inset: Mist, a hairline, the medium corner. */
function Well({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border bg-background p-4", className)}>
      {children}
    </div>
  );
}

/**
 * Steps a picture from 0 to `last`, `interval` ms apart, once it is on
 * screen. Under reduced motion it starts at the end.
 */
function useSequence(last: number, interval: number, startDelay = 500) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -25% 0px" });
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced || !inView) return;
    const timers: number[] = [];
    for (let next = 1; next <= last; next += 1) {
      timers.push(
        window.setTimeout(() => setStep(next), startDelay + (next - 1) * interval),
      );
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, reduced, last, interval, startDelay]);

  // Under reduced motion the picture simply sits at its end.
  return { ref, step: reduced ? last : step };
}

const ANSWERS = ["doctus", "ductus", "dictus"];

function LessonPicture() {
  const { ref, step } = useSequence(2, 700, 700);
  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-2">
      <Well className="flex flex-col gap-3">
        <div className="flex aspect-video items-center justify-center rounded-sm bg-wash-strong">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface text-primary">
            <PlayIcon weight="bold" className="size-5" />
          </span>
        </div>
        <p className="text-sm font-medium text-heading">Week 3 · Leaves and seeds</p>
        <span className="inline-flex w-fit items-center gap-2 rounded-sm border bg-surface px-2.5 py-1.5 text-xs text-ink">
          <FilePdfIcon className="size-4 text-accent" />
          Field notes.pdf
        </span>
      </Well>
      <Well className="flex flex-col gap-2.5">
        <p className="text-caption">Quiz · question 4 of 10</p>
        <p className="font-medium text-heading">Which Latin word means learned?</p>
        {ANSWERS.map((answer, index) => {
          const right = index === 0 && step >= 1;
          return (
            <div
              key={answer}
              className={cn(
                "flex items-center justify-between rounded-sm border px-3 py-2 text-sm transition-colors duration-500",
                right
                  ? "border-transparent bg-accent-wash font-medium text-primary"
                  : "bg-surface text-ink",
              )}
            >
              <span className="italic">{answer}</span>
              {right ? (
                <CheckCircleIcon
                  weight="regular"
                  className="fz-motion size-5 [animation:fz-pop_.45s_ease_both]"
                />
              ) : null}
            </div>
          );
        })}
        <p
          className={cn(
            "inline-flex items-center gap-1.5 text-caption transition-opacity duration-500",
            step >= 2 ? "opacity-100" : "opacity-0",
          )}
        >
          <CheckIcon weight="bold" className="size-3.5 text-accent" />
          Graded for you
        </p>
      </Well>
    </div>
  );
}

function PaymentPicture() {
  const { ref, step } = useSequence(2, 650);
  return (
    <div ref={ref} className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <span className="font-display text-[64px] font-semibold leading-[0.9] text-heading">
          0%
        </span>
        <span className="pb-1 text-sm text-muted">
          of your class fees
          <br />
          goes to us
        </span>
      </div>
      <Well className="flex flex-col gap-2 p-3">
        {["Nature Study", "Latin I"].map((name, index) => (
          <div
            key={name}
            className="flex items-center justify-between gap-2 rounded-sm bg-surface px-3 py-2"
          >
            <span className="truncate text-sm text-heading">{name}</span>
            <Badge
              className={cn(
                "transition-opacity duration-500",
                step > index ? "opacity-100" : "opacity-0",
              )}
            >
              <CheckIcon weight="bold" />
              Paid
            </Badge>
          </div>
        ))}
      </Well>
    </div>
  );
}

function EmailPicture() {
  const { ref, step } = useSequence(2, 900, 800);
  const sent = step >= 1;
  return (
    <div ref={ref}>
      <Well className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">To</span>
          <span className="rounded-full bg-accent-wash px-2.5 py-0.5 text-xs font-medium text-primary">
            Nature Study families
          </span>
        </div>
        <div className="rounded-sm border bg-surface px-3 py-2 text-sm text-heading">
          Thursday’s class moves to 10am
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-caption transition-opacity duration-500",
              step >= 2 ? "opacity-100" : "opacity-0",
            )}
          >
            <CheckCircleIcon className="size-4 text-accent" />
            Sent to 20 families
          </span>
          <FauxButton className={cn("transition-opacity", sent && "opacity-60")}>
            <PaperPlaneTiltIcon weight="bold" className="size-4 rtl:-scale-x-100" />
            {sent ? "Sent" : "Send"}
          </FauxButton>
        </div>
      </Well>
    </div>
  );
}

function AccountsPicture() {
  const { ref, step } = useSequence(1, 0, 1100);
  const open = step >= 1;
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <Well className="flex flex-col gap-2 p-3">
        {[
          { face: "AM", role: "Student", icon: StudentIcon },
          { face: "DM", role: "Parent", icon: UsersThreeIcon },
        ].map(({ face, role, icon: RoleIcon }) => (
          <div
            key={role}
            className="flex items-center gap-3 rounded-sm bg-surface px-3 py-2"
          >
            <Initial>{face}</Initial>
            <span className="flex-1 text-sm text-heading">Own sign-in</span>
            <Badge variant="secondary">
              <RoleIcon />
              {role}
            </Badge>
          </div>
        ))}
      </Well>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors duration-500",
          open ? "border-transparent bg-accent-wash text-primary" : "bg-surface text-muted",
        )}
      >
        {open ? (
          <LockSimpleOpenIcon className="fz-motion size-5 [animation:fz-pop_.45s_ease_both]" />
        ) : (
          <LockSimpleIcon className="size-5" />
        )}
        <span className="font-medium">
          {open ? "Paid, and the class is open" : "Nature Study"}
        </span>
      </div>
    </div>
  );
}

/**
 * The colours a school could pick from in the picture. Only the brand's two
 * that carry white words at full contrast: lapis and turquoise deep.
 */
const SWATCHES = [
  { name: "Lapis", fill: "bg-lapis" },
  { name: "Turquoise deep", fill: "bg-turquoise-deep" },
] as const;

function BrandPicture() {
  const { ref, step } = useSequence(4, 1000, 600);
  const swatch = SWATCHES[step % SWATCHES.length];
  return (
    <div ref={ref}>
      <Well className="flex flex-col gap-3 p-3">
        <div className="overflow-hidden rounded-sm border bg-surface">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 transition-colors duration-500",
              swatch.fill,
            )}
          >
            <span className="inline-flex size-6 items-center justify-center rounded-sm bg-white/20 text-[11px] font-semibold text-white">
              Y
            </span>
            <span className="text-sm font-medium text-white">Your school</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3">
            <span className="h-2 w-3/4 rounded-full bg-wash-strong" />
            <span className="h-2 w-1/2 rounded-full bg-wash-strong" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {SWATCHES.map((option) => (
            <span
              key={option.name}
              className={cn(
                "size-7 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                option.fill,
                option === swatch && "ring-2 ring-heading",
              )}
            />
          ))}
          <span className="ms-auto text-caption">Your colors</span>
        </div>
      </Well>
    </div>
  );
}

const PAGE_CLASSES = ["Nature Study", "Latin I", "Art and journaling"];

function PagePicture() {
  const { ref, step } = useSequence(4, 450, 700);
  return (
    <div ref={ref}>
      <Well className="p-3">
        <div className="overflow-hidden rounded-sm border bg-surface">
          {/* The browser's own bar: three marks and an address. */}
          <div className="flex items-center gap-3 border-b px-3 py-2">
            <span className="flex gap-1.5">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="size-2.5 rounded-full bg-wash-strong" />
              ))}
            </span>
            <span className="h-6 flex-1 rounded-sm bg-wash" />
            <span
              className={cn(
                "rounded-sm px-2 py-1 text-xs font-medium transition-colors duration-300",
                step >= 1 ? "bg-accent-wash text-primary" : "bg-wash text-muted",
              )}
            >
              {step >= 1 ? "Published" : "Draft"}
            </span>
          </div>
          <div className="flex min-h-56 flex-col gap-4 p-4 sm:p-5">
            <div
              className={cn(
                "flex items-center gap-3 transition-all duration-500",
                step >= 1 ? "opacity-100" : "translate-y-2 opacity-0",
              )}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-lapis font-display font-semibold text-white">
                Y
              </span>
              <div>
                <p className="font-display text-lg font-semibold leading-tight text-heading">
                  Your school
                </p>
                <p className="text-caption">Classes for curious learners</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {PAGE_CLASSES.map((name, index) => (
                <div
                  key={name}
                  className={cn(
                    "flex flex-col gap-3 rounded-md border bg-background p-3 transition-all duration-500",
                    step >= index + 2 ? "opacity-100" : "translate-y-2 opacity-0",
                  )}
                >
                  <span className="aspect-[16/9] rounded-sm bg-wash-strong" />
                  <span className="text-sm font-medium text-heading">{name}</span>
                  <FauxButton className="h-8 self-start text-xs">Sign up</FauxButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Well>
    </div>
  );
}
