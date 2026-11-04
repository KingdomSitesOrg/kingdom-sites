"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { cn } from "@/strata/ui/cn";
import { usePrefersReducedMotion } from "@/strata/ui/hooks";
import { useGate, useScreen, useTicker, screen, type PWindow } from "./gate";
import { useCaptureMode, useHudLive } from "./live";
import { nearRect, type ScreenBBox } from "./screen";

export type BBoxBracketsProps = {
  /** The chapter's `signals.bbox`: [minX, minY, maxX, maxY] in viewport px, NaN in slot 0 while hidden. */
  bbox: ScreenBBox;
  /** Label along the bottom, e.g. "88.0 mm" (pass the envelope value from facts). */
  width: ReactNode;
  /** Label up the side, e.g. "42.0 mm". */
  height: ReactNode;
  /** Gap between the box and the brackets, px. */
  pad?: number;
  window?: PWindow;
  progress?: () => number;
  live?: boolean;
  decorative?: boolean;
  className?: string;
};

const ARM = 12;
const LOCK_MS = 320;
const lockEase = gsap.parseEase("back.out(1.6)");

const corner = "absolute left-0 top-0 size-3 border-text-1/75 will-change-transform";
const dimLine = "absolute left-0 top-0 bg-hud-line will-change-transform";
const dimLabel =
  "glass absolute left-0 top-0 whitespace-nowrap rounded-xs px-1.5 py-0.5 hud-value text-[11px] text-text-1 will-change-transform";

/**
 * The signature motif (STORYBOARD 3.7): four 12 px corner brackets hugging the part's projected bounding box,
 * labelled along the bottom and up the side. Locks on (scale 1.6 -> 1.0, back.out(1.6), 320 ms) each time the
 * box appears; hidden while bbox[0] is NaN, outside its p-window or when the HUD is not live. Counts as one
 * readout toward the cap. Mount it directly in the Overlay root (it is position: fixed).
 */
export function BBoxBrackets({
  bbox,
  width,
  height,
  pad = 8,
  window,
  progress,
  live,
  decorative = true,
  className,
}: BBoxBracketsProps) {
  const root = useRef<HTMLDivElement>(null);
  const isLive = useHudLive(live);
  const capture = useCaptureMode();
  const reduced = usePrefersReducedMotion();
  const gate = useGate({ window, progress });
  const state = useRef({ on: false, lockAt: 0, a: Number.NaN, b: 0, c: 0, d: 0 });
  useScreen();

  useTicker((time) => {
    const el = root.current;
    if (!el) return;
    const s = state.current;
    const on = !Number.isNaN(bbox[0]) && gate();
    if (on !== s.on) {
      s.on = on;
      s.lockAt = time;
      el.dataset.visible = on ? "true" : "false";
    }
    if (!on) return;
    const k = capture || reduced ? 1 : Math.min(1, ((time - s.lockAt) * 1000) / LOCK_MS);
    const scale = 1.6 - 0.6 * lockEase(k);
    const cx = (bbox[0] + bbox[2]) * 0.5;
    const cy = (bbox[1] + bbox[3]) * 0.5;
    const x0 = cx + (bbox[0] - pad - cx) * scale;
    const y0 = cy + (bbox[1] - pad - cy) * scale;
    const x1 = cx + (bbox[2] + pad - cx) * scale;
    const y1 = cy + (bbox[3] + pad - cy) * scale;
    if (Math.abs(x0 - s.a) < 0.05 && Math.abs(y0 - s.b) < 0.05 && Math.abs(x1 - s.c) < 0.05 && Math.abs(y1 - s.d) < 0.05) return;
    s.a = x0;
    s.b = y0;
    s.c = x1;
    s.d = y1;
    const n = el.children as HTMLCollectionOf<HTMLElement>;
    // Side label on the right when it fits; on the left only if that stays clear of the copy column.
    const right = x1 + 44 < screen.width || nearRect(x0 - 10, cy, screen.column, 0);
    const sideX = right ? x1 + 10 : x0 - 10;
    const bottomY = y1 + 10;
    n[0].style.transform = `translate3d(${x0}px,${y0}px,0)`;
    n[1].style.transform = `translate3d(${x1 - ARM}px,${y0}px,0)`;
    n[2].style.transform = `translate3d(${x0}px,${y1 - ARM}px,0)`;
    n[3].style.transform = `translate3d(${x1 - ARM}px,${y1 - ARM}px,0)`;
    n[4].style.transform = `translate3d(${x0 + ARM}px,${bottomY}px,0) scaleX(${Math.max(0, x1 - x0 - 2 * ARM)})`;
    n[5].style.transform = `translate3d(${cx}px,${bottomY}px,0) translate(-50%,-50%)`;
    n[6].style.transform = `translate3d(${sideX}px,${y0 + ARM}px,0) scaleY(${Math.max(0, y1 - y0 - 2 * ARM)})`;
    n[7].style.transform = `translate3d(${sideX}px,${cy}px,0) translate(-50%,-50%) rotate(-90deg)`;
  }, isLive);

  useEffect(() => {
    if (isLive || !root.current) return;
    state.current.on = false;
    root.current.dataset.visible = "false";
  }, [isLive]);

  return (
    <div
      ref={root}
      aria-hidden={decorative || undefined}
      data-visible="false"
      data-hud-readout="bbox"
      className={cn(
        "pointer-events-none fixed inset-0 z-hud overflow-hidden transition-opacity duration-[120ms] data-[visible=false]:opacity-0 data-[visible=false]:duration-[240ms]",
        className,
      )}
    >
      <span className={cn(corner, "border-l border-t")} />
      <span className={cn(corner, "border-r border-t")} />
      <span className={cn(corner, "border-b border-l")} />
      <span className={cn(corner, "border-b border-r")} />
      <span className={cn(dimLine, "h-px w-px origin-left")} />
      <span className={dimLabel}>
        {width}
      </span>
      <span className={cn(dimLine, "h-px w-px origin-top")} />
      <span className={dimLabel}>
        {height}
      </span>
    </div>
  );
}
