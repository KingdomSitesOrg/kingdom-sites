"use client";

import { useContext, useEffect, useRef } from "react";
import { ChapterContext } from "@/strata/story/context";
import { cn } from "@/strata/ui/cn";
import { fixed, type HudFormat } from "./format";
import { useHudLive, useHudTick } from "./live";

export type HudValueProps = {
  /** Read every tick while live (e.g. () => signals.temp). Cheap, allocation-free getters only. */
  get?: () => number | string;
  /**
   * A pure function of the chapter's p for scrubbed [S] readouts (layer, Z, stage). Unlike `get` it keeps
   * ticking in static mode, where the Scene does not run, so every still shows the value for its p.
   */
  scrub?: (p: number) => number | string;
  /** Rendered on the server and shown whenever a `get` value is not live (static mode). */
  fallback?: number | string;
  format?: HudFormat;
  decimals?: number;
  /** Zero-pad the integer part to this many digits. */
  pad?: number;
  /** DOM writes are quantized to buckets of this many ms. Default 67 (15 Hz, STORYBOARD 3.7); 0 = every frame. */
  throttle?: number;
  /** Force live on/off; defaults to the HudLive context. */
  live?: boolean;
  className?: string;
};

/** Live text value. Writes textContent on the gsap ticker only when the string changes; never re-renders React. */
export function HudValue({ get, scrub, fallback, format, decimals = 0, pad = 0, throttle = 67, live, className }: HudValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const progress = useContext(ChapterContext)?.progress;
  const isLive = useHudLive(live) && Boolean(get);
  const ticking = isLive || Boolean(scrub && progress);
  const last = useRef<string | null>(null);

  const toText = (v: number | string) => (typeof v === "string" ? v : format ? format(v) : fixed(v, decimals, pad));
  const paint = (s: string) => {
    const el = ref.current;
    if (!el || s === last.current) return;
    last.current = s;
    el.textContent = s;
  };
  const write = () => {
    if (scrub && progress) paint(toText(scrub(progress.current.p)));
    else if (get) paint(toText(get()));
  };

  useHudTick(ref, write, { enabled: ticking, throttle });

  useEffect(() => {
    if (ticking) return;
    // Not live (static mode, also after a runtime switch): show the representative value again.
    if (fallback !== undefined) paint(toText(fallback));
    else write();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticking, fallback]);

  return (
    <span ref={ref} className={cn("tabular", className)} suppressHydrationWarning>
      {fallback !== undefined ? toText(fallback) : scrub ? toText(scrub(0)) : "--"}
    </span>
  );
}
