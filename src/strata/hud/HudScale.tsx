"use client";

import { useRef, type CSSProperties } from "react";
import { cn } from "@/strata/ui/cn";
import { useHudLive, useHudTick } from "./live";

export type HudScaleProps = {
  /** Range covered by the ruler, in mm. */
  from?: number;
  to?: number;
  /** mm between minor ticks. */
  step?: number;
  /** Every n-th tick is major and labelled. */
  majorEvery?: number;
  orientation?: "horizontal" | "vertical";
  unit?: string;
  /** Static marker position in mm. */
  marker?: number;
  /** Live marker position in mm. */
  getMarker?: () => number;
  tone?: "molten" | "resin";
  live?: boolean;
  className?: string;
};

/** Ruler with mm ticks and an optional moving marker (e.g. Z-height). Decorative: pair it with a real readout. */
export function HudScale({
  from = 0,
  to = 100,
  step = 1,
  majorEvery = 10,
  orientation = "horizontal",
  unit = "mm",
  marker,
  getMarker,
  tone = "molten",
  live,
  className,
}: HudScaleProps) {
  const root = useRef<HTMLDivElement>(null);
  const isLive = useHudLive(live) && Boolean(getMarker);
  const span = to - from;
  const count = Math.round(span / step);
  const horizontal = orientation === "horizontal";
  const last = useRef(NaN);

  useHudTick(
    root,
    () => {
      if (!getMarker || !root.current) return;
      const t = Math.min(1, Math.max(0, (getMarker() - from) / span));
      if (Math.abs(t - last.current) < 0.0005) return;
      last.current = t;
      root.current.style.setProperty("--m", t.toFixed(4));
    },
    { enabled: isLive },
  );

  const ticks = [];
  const labels = [];
  for (let i = 0; i <= count; i++) {
    const major = i % majorEvery === 0;
    const mid = !major && majorEvery % 2 === 0 && i % (majorEvery / 2) === 0;
    const len = major ? 10 : mid ? 6.5 : 4;
    const p = (i / count) * 100;
    ticks.push(
      horizontal ? (
        <line key={i} x1={`${p}%`} x2={`${p}%`} y1={0} y2={len} className={major ? "stroke-hud-line" : "stroke-line-strong"} />
      ) : (
        <line key={i} y1={`${100 - p}%`} y2={`${100 - p}%`} x1={0} x2={len} className={major ? "stroke-hud-line" : "stroke-line-strong"} />
      ),
    );
    if (major) {
      const val = from + i * step;
      labels.push(
        <span
          key={i}
          className="absolute font-mono text-[11px] leading-none tracking-[0.08em] text-text-2 tabular"
          style={horizontal ? { left: `${p}%`, top: 14, transform: "translateX(-50%)" } : { top: `${100 - p}%`, left: 14, transform: "translateY(-50%)" }}
        >
          {Number.isInteger(val) ? val : val.toFixed(1)}
        </span>,
      );
    }
  }

  const m = marker !== undefined ? Math.min(1, Math.max(0, (marker - from) / span)) : getMarker ? 0 : undefined;
  const color = tone === "molten" ? "var(--molten)" : "var(--resin)";

  return (
    <div
      ref={root}
      aria-hidden
      className={cn("relative select-none", horizontal ? "h-7 w-full" : "h-full w-9", className)}
      style={{ "--m": m ?? 0 } as CSSProperties}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" strokeWidth={1} shapeRendering="crispEdges">
        {horizontal ? (
          <line x1="0" x2="100%" y1="0" y2="0" className="stroke-line-strong" />
        ) : (
          <line y1="0" y2="100%" x1="0" x2="0" className="stroke-line-strong" />
        )}
        {ticks}
      </svg>
      {labels}
      <span
        className="absolute font-mono text-[11px] uppercase leading-none tracking-[0.12em] text-text-2"
        style={horizontal ? { right: 0, top: -14 } : { left: 14, top: -16 }}
      >
        {unit}
      </span>
      {m !== undefined ? (
        <span
          className="absolute"
          style={
            horizontal
              ? { left: "calc(var(--m) * 100%)", top: -2, height: 16, width: 1, background: color, boxShadow: `0 0 8px ${color}` }
              : { top: "calc((1 - var(--m)) * 100%)", left: -2, width: 16, height: 1, background: color, boxShadow: `0 0 8px ${color}` }
          }
        />
      ) : null}
    </div>
  );
}
