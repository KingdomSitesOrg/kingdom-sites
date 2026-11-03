"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "./cn";
import { usePrefersReducedMotion } from "./hooks";

export type NumberFormat = Intl.NumberFormatOptions | ((n: number) => string);

export type AnimatedNumberProps = {
  value: number;
  /** Start value for the first count-up. */
  from?: number;
  /** Seconds for the first count-up; later value changes take 60% of this. */
  duration?: number;
  /** Intl options (serializable, fine from Server Components) or a formatter function (Client Components only). */
  format?: NumberFormat;
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Announce value changes politely to screen readers (e.g. a live price). */
  live?: boolean;
  className?: string;
};

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Counts up when scrolled into view, then tweens between later values. Writes textContent
 * directly (no React renders per frame). SSR and reduced motion show the final value.
 */
export function AnimatedNumber({
  value,
  from = 0,
  duration = 1.6,
  format,
  locale = "en-US",
  prefix = "",
  suffix = "",
  live = false,
  className,
}: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const started = useRef(false);
  const formatOptions = typeof format === "object" ? JSON.stringify(format) : "";
  const decimals = Number.isInteger(value) ? 0 : Math.min(2, String(value).split(".")[1]?.length ?? 0);

  const fmt = useMemo(() => {
    if (typeof format === "function") return (n: number) => prefix + format(n) + suffix;
    const opts: Intl.NumberFormatOptions = formatOptions ? JSON.parse(formatOptions) : {};
    if (opts.minimumFractionDigits === undefined && opts.maximumFractionDigits === undefined) {
      opts.minimumFractionDigits = opts.maximumFractionDigits = decimals;
    }
    const nf = new Intl.NumberFormat(locale, opts);
    return (n: number) => prefix + nf.format(n) + suffix;
    // formatOptions stands in for the object identity of format.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof format === "function" ? format : null, formatOptions, decimals, locale, prefix, suffix]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      started.current = true;
      shown.current = value;
      el.textContent = fmt(value);
      return;
    }
    let raf = 0;
    let io: IntersectionObserver | null = null;
    const run = (start: number, seconds: number) => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / (seconds * 1000));
        const v = start + (value - start) * easeOutExpo(t);
        shown.current = v;
        el.textContent = fmt(t >= 1 ? value : v);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (!started.current) {
      shown.current = from;
      el.textContent = fmt(from);
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            started.current = true;
            run(from, duration);
          }
        },
        { threshold: 0.35 },
      );
      io.observe(el);
    } else if (shown.current !== value) {
      run(shown.current ?? from, duration * 0.6);
    } else {
      el.textContent = fmt(value);
    }
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [value, reduced, fmt, from, duration]);

  const finalText = fmt(value);
  return (
    <span className={cn("tabular", className)}>
      <span ref={ref} aria-hidden suppressHydrationWarning>
        {finalText}
      </span>
      <span className="sr-only" aria-live={live ? "polite" : undefined}>
        {finalText}
      </span>
    </span>
  );
}
