"use client";

import { useRef, useState } from "react";
import { cn } from "@/strata/ui/cn";
import { useHudLive, useHudTick } from "./live";

export type HudTickerProps = {
  /** Line source: called with an increasing index. Defaults to a seeded G-code stream. */
  next?: (i: number) => string;
  /** Lines per second. */
  rate?: number;
  /** Visible rows. */
  rows?: number;
  seed?: number;
  live?: boolean;
  className?: string;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded, plausible FDM G-code (perimeters, infill, layer changes, temperature holds). */
export function gcodeStream(seed = 7) {
  const rnd = mulberry32(seed);
  let x = 120;
  let y = 120;
  let z = 0.2;
  let e = 0;
  let layer = 1;
  let moves = 0;
  return (): string => {
    moves++;
    if (moves % 34 === 0) {
      layer++;
      z += 0.05;
      return `;LAYER:${layer} Z${z.toFixed(2)}`;
    }
    if (moves % 34 === 1 && layer > 1) return `G1 Z${z.toFixed(3)} F600`;
    if (moves % 53 === 0) return `M104 S${(244 + Math.round(rnd() * 4)).toString()} ; hold`;
    if (rnd() < 0.12) {
      x = 80 + rnd() * 80;
      y = 80 + rnd() * 80;
      return `G0 X${x.toFixed(3)} Y${y.toFixed(3)} F9000`;
    }
    x = Math.min(170, Math.max(70, x + (rnd() - 0.5) * 14));
    y = Math.min(170, Math.max(70, y + (rnd() - 0.5) * 14));
    e += 0.02 + rnd() * 0.05;
    return `G1 X${x.toFixed(3)} Y${y.toFixed(3)} E${e.toFixed(4)}`;
  };
}

function splitLine(line: string): [string, string, string] {
  if (line.startsWith(";")) return ["", "", line];
  const sp = line.indexOf(" ");
  const cmd = sp < 0 ? line : line.slice(0, sp);
  const rest = sp < 0 ? "" : line.slice(sp + 1);
  const c = rest.indexOf(";");
  return c < 0 ? [cmd, rest, ""] : [cmd, rest.slice(0, c).trimEnd(), rest.slice(c)];
}

const ROW_H = 18;

/** Scrolling G-code style log. Decorative (aria-hidden); rows are recycled DOM nodes, no React renders while running. */
export function HudTicker({ next, rate = 7, rows = 7, seed = 7, live, className }: HudTickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isLive = useHudLive(live);
  const [initial] = useState(() => {
    const src = gcodeStream(seed);
    return Array.from({ length: rows + 1 }, (_, i) => (next ? next(i) : src()));
  });
  const state = useRef<{ src: () => string; i: number } | null>(null);

  useHudTick(
    listRef,
    () => {
      const list = listRef.current;
      if (!list) return;
      if (!state.current) {
        const src = gcodeStream(seed);
        for (let k = 0; k <= rows; k++) src();
        state.current = { src, i: rows + 1 };
      }
      const s = state.current;
      const line = next ? next(s.i) : s.src();
      const row = list.firstElementChild as HTMLElement | null;
      if (!row) return;
      const [cmd, args, comment] = splitLine(line);
      const parts = row.children;
      parts[0].textContent = String(s.i + 1).padStart(5, "0");
      parts[1].textContent = cmd;
      parts[1].setAttribute("data-cmd", cmd.charAt(0));
      parts[2].textContent = args;
      parts[3].textContent = comment;
      s.i++;
      list.appendChild(row);
      list.style.transition = "none";
      list.style.transform = `translate3d(0, ${ROW_H}px, 0)`;
      void list.offsetHeight;
      list.style.transition = "transform 220ms var(--ease-out-expo)";
      list.style.transform = "translate3d(0, 0, 0)";
    },
    { enabled: isLive, throttle: 1000 / rate },
  );

  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden font-mono text-[11px] [--fade:28%] mask-fade-y", className)}
      style={{ height: ROW_H * rows }}
    >
      <div ref={listRef} className="absolute inset-x-0 bottom-0 will-change-transform">
        {initial.map((line, i) => {
          const [cmd, args, comment] = splitLine(line);
          return (
            <div key={i} className="flex gap-3 whitespace-nowrap" style={{ height: ROW_H, lineHeight: `${ROW_H}px` }}>
              <span className="text-text-3 tabular">{String(i + 1).padStart(5, "0")}</span>
              <span
                data-cmd={cmd.charAt(0)}
                className="w-9 shrink-0 text-resin data-[cmd=G]:text-resin data-[cmd=M]:text-molten"
              >
                {cmd}
              </span>
              <span className="truncate text-text-2 tabular">{args}</span>
              <span className="truncate text-text-2">{comment}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
