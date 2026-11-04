"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/strata/ui/cn";
import { useGate, useTicker, type PWindow } from "./gate";
import { useHudLive } from "./live";

export type HudClusterProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children: ReactNode;
  /** p-window inside the chapter; the cluster enters and exits at its edges. */
  window?: PWindow;
  /** Progress source outside a chapter (lab pages). */
  progress?: () => number;
  /** Controlled visibility when there is no window. Default true. */
  visible?: boolean;
  /** aria-hidden (default true). Pass false when the values carry meaning the copy does not. */
  decorative?: boolean;
  /** Inner padding classes. */
  padding?: string;
  /** Force live on/off; defaults to the HudLive context. Not live = always shown. */
  live?: boolean;
};

const line = "absolute scale-100 bg-hud-line transition-[scale] duration-[180ms] ease-out group-data-[state=out]/cluster:delay-[240ms] group-data-[state=out]/cluster:duration-0";
const bracket = "absolute size-2 border-text-2";

/**
 * A HUD cluster (STORYBOARD 3.7): readouts on the copy-panel material, framed by 1 px hairlines and 8 px
 * corner brackets. Entry: the hairlines draw in 180 ms, then the values fade in over 120 ms. Exit: 240 ms fade.
 * Position it with className (the root is only a wrapper). Keep at most 4 readouts on screen on desktop and 2 on
 * mobile across all clusters, counting BBoxBrackets as one (`desktopOnly` on HudReadout drops extras on phones).
 */
export function HudCluster({
  children,
  window,
  progress,
  visible = true,
  decorative = true,
  padding = "px-4 py-3",
  live,
  className,
  ...rest
}: HudClusterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isLive = useHudLive(live);
  const gated = isLive && Boolean(window || progress);
  const gate = useGate({ window, progress });
  const on = useRef(visible);

  useTicker(() => {
    const el = ref.current;
    if (!el) return;
    const next = gate();
    if (next !== on.current) {
      on.current = next;
      el.dataset.state = next ? "in" : "out";
    }
  }, gated);

  useEffect(() => {
    if (gated || !ref.current) return;
    const next = visible || !isLive;
    on.current = next;
    ref.current.dataset.state = next ? "in" : "out";
  }, [gated, visible, isLive]);

  return (
    <div
      ref={ref}
      aria-hidden={decorative || undefined}
      data-hud-cluster
      data-state="in"
      className={cn(
        "group/cluster data-[state=out]:pointer-events-none",
        className,
      )}
      {...rest}
    >
      <div
        className={cn(
          "relative isolate transition-opacity duration-0 group-data-[state=out]/cluster:opacity-0 group-data-[state=out]/cluster:duration-[240ms]",
          padding,
        )}
      >
        <span
          aria-hidden
          className="glass absolute inset-0 -z-10 transition-opacity duration-[180ms] group-data-[state=out]/cluster:opacity-0 group-data-[state=out]/cluster:delay-[240ms] group-data-[state=out]/cluster:duration-0"
          style={{ borderColor: "transparent" }}
        />
        <span aria-hidden className={cn(line, "inset-x-0 top-0 h-px origin-left", "group-data-[state=out]/cluster:scale-x-0")} />
        <span aria-hidden className={cn(line, "inset-y-0 right-0 w-px origin-top", "group-data-[state=out]/cluster:scale-y-0")} />
        <span aria-hidden className={cn(line, "inset-x-0 bottom-0 h-px origin-right", "group-data-[state=out]/cluster:scale-x-0")} />
        <span aria-hidden className={cn(line, "inset-y-0 left-0 w-px origin-bottom", "group-data-[state=out]/cluster:scale-y-0")} />
        <span aria-hidden className={cn(bracket, "-left-px -top-px border-l border-t")} />
        <span aria-hidden className={cn(bracket, "-right-px -top-px border-r border-t")} />
        <span aria-hidden className={cn(bracket, "-bottom-px -left-px border-b border-l")} />
        <span aria-hidden className={cn(bracket, "-bottom-px -right-px border-b border-r")} />
        <div
          className="relative transition-opacity delay-[180ms] duration-[120ms] group-data-[state=out]/cluster:opacity-0 group-data-[state=out]/cluster:delay-[240ms] group-data-[state=out]/cluster:duration-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
