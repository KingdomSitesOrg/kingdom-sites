"use client";

import { useRef } from "react";
import { cn } from "@/strata/ui/cn";
import { useHudLive, useHudTick } from "./live";

export type HudCounterProps = {
  /** Static value (SSR and static mode). */
  value?: number;
  /** Live source, read every tick. */
  get?: () => number;
  /** Integer digits shown; leading zeros are dimmed like an odometer. */
  digits?: number;
  decimals?: number;
  /** Thousands separators. */
  group?: boolean;
  throttle?: number;
  live?: boolean;
  /** Accessible description, e.g. "Parts printed today". */
  label?: string;
  className?: string;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function layout(digits: number, decimals: number, group: boolean) {
  const out: ("d" | "," | ".")[] = [];
  for (let i = 0; i < digits; i++) {
    out.push("d");
    const left = digits - 1 - i;
    if (group && left > 0 && left % 3 === 0) out.push(",");
  }
  if (decimals) {
    out.push(".");
    for (let i = 0; i < decimals; i++) out.push("d");
  }
  return out;
}

function digitsOf(value: number, digits: number, decimals: number) {
  const max = Math.pow(10, digits) - Math.pow(10, -decimals);
  const v = Math.min(Math.max(0, value), max);
  return v.toFixed(decimals).replace(".", "").padStart(digits + decimals, "0");
}

function leadCount(s: string, digits: number) {
  let n = 0;
  while (n < digits - 1 && s[n] === "0") n++;
  return n;
}

/** Odometer: each digit is a rolling strip; updates set transforms directly. */
export function HudCounter({
  value = 0,
  get,
  digits = 6,
  decimals = 0,
  group = true,
  throttle = 0,
  live,
  label,
  className,
}: HudCounterProps) {
  const root = useRef<HTMLSpanElement>(null);
  const sr = useRef<HTMLSpanElement>(null);
  const last = useRef("");
  const lastSr = useRef(0);
  const isLive = useHudLive(live) && Boolean(get);

  const cells = layout(digits, decimals, group);
  const initial = digitsOf(value, digits, decimals);
  const initialLead = leadCount(initial, digits);
  const fmt = (s: string) => {
    const int = s.slice(0, digits).replace(/^0+(?=\d)/, "");
    const withGroups = group ? Number(int).toLocaleString("en-US") : int;
    return decimals ? `${withGroups}.${s.slice(digits)}` : withGroups;
  };

  useHudTick(
    root,
    (time) => {
      const el = root.current;
      if (!el || !get) return;
      const s = digitsOf(get(), digits, decimals);
      if (s === last.current) return;
      last.current = s;
      const lead = leadCount(s, digits);
      const strips = el.querySelectorAll<HTMLElement>("[data-strip]");
      for (let i = 0; i < strips.length; i++) {
        const strip = strips[i];
        strip.style.transform = `translate3d(0, ${-Number(s[i]) * 10}%, 0)`;
        strip.dataset.lead = i < lead ? "1" : "0";
      }
      if (sr.current && time - lastSr.current > 2) {
        lastSr.current = time;
        sr.current.textContent = (label ? `${label}: ` : "") + fmt(s);
      }
    },
    { enabled: isLive, throttle },
  );

  let d = 0;
  return (
    <span className={cn("relative inline-flex font-mono tabular leading-none", className)}>
      <span ref={root} aria-hidden className="inline-flex">
        {cells.map((c, i) => {
          if (c !== "d") {
            return (
              <span key={i} className="text-text-2">
                {c}
              </span>
            );
          }
          const idx = d++;
          const digit = Number(initial[idx]);
          return (
            <span key={i} className="relative inline-block h-[1em] w-[1ch] overflow-hidden">
              <span
                data-strip
                data-lead={idx < initialLead ? "1" : "0"}
                className="absolute inset-x-0 top-0 flex flex-col transition-[transform,color] duration-[700ms] ease-out-expo data-[lead=1]:text-text-3"
                style={{ transform: `translate3d(0, ${-digit * 10}%, 0)` }}
              >
                {DIGITS.map((n) => (
                  <span key={n} className="block h-[1em] text-center">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      <span ref={sr} className="sr-only" suppressHydrationWarning>
        {label ? `${label}: ` : ""}
        {fmt(initial)}
      </span>
    </span>
  );
}
