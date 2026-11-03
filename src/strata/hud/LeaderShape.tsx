import type { ReactNode } from "react";
import { cn } from "@/strata/ui/cn";

export type LeaderTone = "molten" | "resin" | "uv" | "neutral" | "ok" | "warn";

const toneVar: Record<LeaderTone, string> = {
  molten: "var(--molten)",
  resin: "var(--resin)",
  uv: "var(--uv)",
  neutral: "var(--text-2)",
  ok: "var(--ok)",
  warn: "var(--warn)",
};

const toneText: Record<LeaderTone, string> = {
  molten: "text-molten",
  resin: "text-resin",
  uv: "text-uv",
  neutral: "text-text-1",
  ok: "text-ok",
  warn: "text-warn",
};

/**
 * Root classes for anything that renders a LeaderShape: the root carries data-visible="true|false".
 * Entry: the line draws in 180 ms, then the label fades in over 120 ms. Exit: 240 ms fade (STORYBOARD 3.7).
 */
export const leaderRoot =
  "group/leader pointer-events-none size-0 transition-opacity duration-0 data-[visible=false]:opacity-0 data-[visible=false]:duration-[240ms]";

/** Elbow geometry: a 45° run covering |dy|, then horizontal to dx (|dx| is raised to |dy| if smaller). */
export function leaderPoints(dx: number, dy: number) {
  const sx = dx >= 0 ? 1 : -1;
  const run = Math.abs(dy);
  const end = sx * Math.max(Math.abs(dx), run);
  return { sx, end, points: `0,0 ${sx * run},${dy} ${end},${dy}` };
}

/** Compact label + value for a leader's chip. */
export function LeaderLabel({ label, value, tone = "molten" }: { label: ReactNode; value?: ReactNode; tone?: LeaderTone }) {
  return (
    <>
      <span className="hud-label text-text-2">{label}</span>
      {value !== undefined ? <span className={cn("hud-value", toneText[tone])}>{value}</span> : null}
    </>
  );
}

/**
 * The leader graphic (dot, 1 px line with one 45° elbow, label chip on the copy-panel material), drawn from
 * the origin of a size-0 parent that uses `leaderRoot`. Shared by HudTag (static anchor) and Leader (live).
 */
export function LeaderShape({
  dx,
  dy,
  tone = "molten",
  children,
  chipClassName,
}: {
  dx: number;
  dy: number;
  tone?: LeaderTone;
  children: ReactNode;
  chipClassName?: string;
}) {
  const color = toneVar[tone];
  const { sx, end, points } = leaderPoints(dx, dy);
  return (
    <>
      <span
        aria-hidden
        className="absolute left-0 top-0 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <svg aria-hidden className="absolute left-0 top-0 overflow-visible" width="1" height="1">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1"
          pathLength={1}
          strokeDasharray="1"
          vectorEffect="non-scaling-stroke"
          className="transition-[stroke-dashoffset] duration-[180ms] ease-out [stroke-dashoffset:0] group-data-[visible=false]/leader:delay-[240ms] group-data-[visible=false]/leader:duration-0 group-data-[visible=false]/leader:[stroke-dashoffset:1]"
        />
      </svg>
      <div
        className={cn(
          "glass absolute flex items-baseline gap-2 whitespace-nowrap rounded-xs px-2 py-1 transition-opacity delay-[180ms] duration-[120ms] group-data-[visible=false]/leader:opacity-0 group-data-[visible=false]/leader:delay-[240ms] group-data-[visible=false]/leader:duration-0",
          chipClassName,
        )}
        style={{
          left: end,
          top: dy,
          transform: sx > 0 ? "translate(4px, -50%)" : "translate(calc(-100% - 4px), -50%)",
        }}
      >
        {children}
      </div>
    </>
  );
}
