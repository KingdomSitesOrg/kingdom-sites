"use client";

import { cn } from "@/strata/ui/cn";
import { useCaptureMode, useHudLive } from "./live";

/**
 * The 5 px molten "live" dot pulsing at 1.2 s (STORYBOARD 3.7). Renders nothing while the HUD is not live
 * (static mode, reduced motion) or under ?capture=1. Decorative.
 */
export function LiveDot({ live, className }: { live?: boolean; className?: string }) {
  const isLive = useHudLive(live);
  const capture = useCaptureMode();
  if (!isLive || capture) return null;
  return (
    <span aria-hidden data-live-dot className={cn("relative inline-flex size-[5px] shrink-0", className)}>
      <span className="absolute inset-0 animate-hud-pulse rounded-full bg-molten" />
      <span className="relative size-[5px] rounded-full bg-molten shadow-[0_0_6px_var(--molten-hot)]" />
    </span>
  );
}
