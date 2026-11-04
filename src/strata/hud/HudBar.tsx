"use client";

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/strata/ui/cn";
import { useHudLive, useHudTick } from "./live";

export type HudBarTone = "molten" | "resin" | "uv" | "thermal";

export type HudBarProps = {
  /** 0..1 static value (SSR and static mode). */
  value?: number;
  /** Live 0..1 source. */
  get?: () => number;
  label?: ReactNode;
  /** Text shown at the right of the label row; pass a HudValue for a live readout. */
  readout?: ReactNode;
  /** Number of tick divisions under the bar (0 = none). */
  ticks?: number;
  tone?: HudBarTone;
  throttle?: number;
  live?: boolean;
  className?: string;
};

const fills: Record<HudBarTone, string> = {
  molten: "linear-gradient(90deg, var(--molten-deep), var(--molten) 70%, var(--molten-hot))",
  resin: "linear-gradient(90deg, var(--resin-deep), var(--resin) 70%, color-mix(in oklab, var(--resin) 55%, white))",
  uv: "linear-gradient(90deg, color-mix(in oklab, var(--uv) 55%, black), var(--uv) 70%, color-mix(in oklab, var(--uv) 60%, white))",
  thermal:
    "linear-gradient(90deg, var(--resin-deep), var(--uv) 38%, var(--molten) 72%, var(--molten-hot))",
};
const heads: Record<HudBarTone, string> = {
  molten: "var(--molten-hot)",
  resin: "var(--resin)",
  uv: "var(--uv)",
  thermal: "var(--molten-core)",
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Progress / thermal meter. The fill is a clip of a fixed gradient, so hot colours appear as it rises. */
export function HudBar({ value = 0, get, label, readout, ticks = 10, tone = "molten", throttle = 0, live, className }: HudBarProps) {
  const root = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const isLive = useHudLive(live) && Boolean(get);
  const last = useRef(-1);
  const lastAria = useRef(-1);

  useHudTick(
    root,
    () => {
      if (!get || !root.current) return;
      const v = clamp01(get());
      if (Math.abs(v - last.current) < 0.0005) return;
      last.current = v;
      root.current.style.setProperty("--v", v.toFixed(4));
      const pct = Math.round(v * 100);
      if (pct !== lastAria.current && meter.current) {
        lastAria.current = pct;
        meter.current.setAttribute("aria-valuenow", String(pct));
      }
    },
    { enabled: isLive, throttle },
  );

  const v0 = clamp01(value);
  return (
    <div ref={root} className={cn("flex flex-col gap-2", className)} style={{ "--v": v0 } as CSSProperties}>
      {label || readout ? (
        <div className="flex items-baseline justify-between gap-4">
          {label ? (
            <span id={labelId} className="hud-label text-text-2">
              {label}
            </span>
          ) : (
            <span />
          )}
          {readout ? <span className="font-mono text-[13px] text-text-1 tabular">{readout}</span> : null}
        </div>
      ) : null}
      <div
        ref={meter}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v0 * 100)}
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : "Progress"}
        className="relative h-1.5 rounded-pill bg-bg-3 shadow-[inset_0_0_0_1px_var(--line)]"
      >
        <div
          className="absolute inset-0 rounded-pill"
          style={{ background: fills[tone], clipPath: "inset(0 calc(100% - var(--v) * 100%) 0 0 round 999px)" }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 h-3 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-pill"
          style={{
            left: "calc(var(--v) * 100%)",
            background: heads[tone],
            boxShadow: `0 0 10px 1px ${heads[tone]}`,
          }}
        />
      </div>
      {ticks > 0 ? (
        <div
          aria-hidden
          className="h-1.5"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, var(--line-strong) 0 1px, transparent 1px calc(100% / ${ticks}))`,
            backgroundSize: "calc(100% - 1px) 100%",
            backgroundRepeat: "no-repeat",
            boxShadow: "inset -1px 0 0 var(--line-strong)",
          }}
        />
      ) : null}
    </div>
  );
}
