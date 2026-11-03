"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/strata/ui/cn";
import { useMediaQuery } from "@/strata/ui/hooks";
import { useGate, useScreen, useTicker, screen, type PWindow } from "./gate";
import { LeaderLabel, LeaderShape, leaderPoints, leaderRoot, type LeaderTone } from "./LeaderShape";
import { useHudLive } from "./live";
import { nearRect, type ScreenAnchors } from "./screen";

export type LeaderProps = {
  /** The chapter's `signals.anchors` (read by reference every tick). */
  anchors: ScreenAnchors;
  /** Key of the anchor to follow. */
  name: string;
  /** Label offset from the anchor in px; the line runs 45° for |dy|, then horizontally. */
  dx?: number;
  dy?: number;
  /** Offsets below 768 px. */
  mobile?: { dx: number; dy: number };
  tone?: LeaderTone;
  label?: ReactNode;
  value?: ReactNode;
  /** Custom chip content instead of label/value (e.g. a <HudReadout>). */
  children?: ReactNode;
  /** p-window inside the chapter. */
  window?: PWindow;
  /** Progress source outside a chapter. */
  progress?: () => number;
  /** Hide while the dot or the label end is within 24 px of the copy column. Default true. */
  avoidCopyColumn?: boolean;
  live?: boolean;
  /** aria-hidden (default true): HUD text that repeats the copy stays out of the accessibility tree. */
  decorative?: boolean;
  className?: string;
};

/**
 * A leader that follows a projected 3D point: 3 px dot, 1 px line with one 45° elbow, label on the
 * copy-panel material. Position is viewport px (fixed), written as a transform every tick; it hides
 * when the anchor is off (`visible` 0), outside its p-window, near the copy column or not live.
 * Mount it directly in the Overlay root, never inside a transformed parent (fixed would break).
 */
export function Leader({
  anchors,
  name,
  dx = 72,
  dy = -44,
  mobile,
  tone = "molten",
  label,
  value,
  children,
  window,
  progress,
  avoidCopyColumn = true,
  live,
  decorative = true,
  className,
}: LeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const small = useMediaQuery("(max-width: 767px)");
  const ox = small && mobile ? mobile.dx : dx;
  const oy = small && mobile ? mobile.dy : dy;
  const end = leaderPoints(ox, oy).end;
  const isLive = useHudLive(live);
  const gate = useGate({ window, progress });
  const state = useRef({ on: false, x: Number.NaN, y: Number.NaN });
  useScreen();

  useTicker(() => {
    const el = ref.current;
    const a = anchors[name];
    if (!el) return;
    const s = state.current;
    let on = Boolean(a) && a[2] >= 0.5 && gate();
    if (on && avoidCopyColumn) {
      on = !nearRect(a[0], a[1], screen.column) && !nearRect(a[0] + end, a[1] + oy, screen.column);
    }
    if (on && !(Math.abs(a[0] - s.x) <= 0.05 && Math.abs(a[1] - s.y) <= 0.05)) {
      s.x = a[0];
      s.y = a[1];
      el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
    }
    if (on !== s.on) {
      s.on = on;
      el.dataset.visible = on ? "true" : "false";
    }
  }, isLive);

  useEffect(() => {
    if (isLive || !ref.current) return;
    state.current.on = false;
    ref.current.dataset.visible = "false";
  }, [isLive]);

  return (
    <div
      ref={ref}
      aria-hidden={decorative || undefined}
      data-visible="false"
      data-hud-leader={name}
      className={cn(leaderRoot, "fixed left-0 top-0 z-hud", className)}
    >
      <LeaderShape dx={ox} dy={oy} tone={tone}>
        {children ?? <LeaderLabel label={label} value={value} tone={tone} />}
      </LeaderShape>
    </div>
  );
}
