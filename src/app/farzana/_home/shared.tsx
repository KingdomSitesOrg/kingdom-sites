"use client";

import Link from "next/link";
import { type CSSProperties, type ReactNode, useRef } from "react";
import { CalendarCheckIcon, FilmStripIcon } from "@phosphor-icons/react";

import { Diamond } from "../_ui/diamond";
import { buttonClass } from "../_ui/button";
import { BOOK_PATH, FILM_PATH } from "../_ui/contact";
import { cn } from "../_ui/cn";

import { useInView } from "./motion";

/** A CSS custom property on a `style`, which React's types do not know. */
export function vars(values: Record<string, string | number>) {
  return values as CSSProperties;
}

/** Fades its children up the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Milliseconds after the others, to stagger a row. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useInView(ref);
  return (
    <div
      ref={ref}
      data-shown={shown}
      className={cn("fz-reveal", className)}
      style={vars({ "--d": `${delay}ms` })}
    >
      {children}
    </div>
  );
}

/** A section's opening: the small label, the title, and a line under it. */
export function SectionIntro({
  eyebrow,
  title,
  children,
  align = "center",
  id,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "center" | "start";
  /** Set on the title, so the bar's links can land on it. */
  id?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start",
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="scroll-mt-28 text-balance sm:text-[36px] sm:leading-[43px]">
        {title}
      </h2>
      {children ? (
        <p className="max-w-xl text-pretty text-lg text-muted">{children}</p>
      ) : null}
    </Reveal>
  );
}

/** The label over a section title, with the brand's diamond as its bullet. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
      <Diamond size={8} />
      {children}
    </span>
  );
}

/**
 * The page's two actions. Booking a call comes first — the page is built to
 * get a teacher on a call with Thomas — and watching the film is the quieter
 * second.
 */
export function Actions({
  className,
  onLapis = false,
}: {
  className?: string;
  /** On the lapis closing band, the secondary action takes light words. */
  onLapis?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Link href={BOOK_PATH} className={buttonClass({ size: "lg" })}>
        <CalendarCheckIcon weight="bold" />
        Book a 15-minute call
      </Link>
      <Link
        href={FILM_PATH}
        className={buttonClass({
          size: "lg",
          variant: "outline",
          className: onLapis
            ? "border-white/25 text-white hover:bg-white/10"
            : "bg-surface",
        })}
      >
        <FilmStripIcon weight="bold" />
        Watch the film
      </Link>
    </div>
  );
}

/**
 * A pretend control inside an illustration. It looks like a button so the
 * picture reads, but it is not one: no hover, no hand, nothing to press.
 */
export function FauxButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-sm bg-primary px-3.5 text-sm font-medium text-primary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A round initial standing in for a person in an illustration. The tint is
 * laid over a solid surface, so where faces overlap in a row, one never shows
 * through the next.
 */
export function Initial({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface bg-[linear-gradient(var(--wash-strong),var(--wash-strong))] text-xs font-semibold text-heading",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The brand progress bar: an 8px rounded track with a turquoise fill. */
export function Bar({
  value,
  className,
}: {
  /** 0 to 100. */
  value: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("block h-2 overflow-hidden rounded-full bg-border", className)}
    >
      <span
        className="block h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
        style={{ width: `${value}%` }}
      />
    </span>
  );
}
