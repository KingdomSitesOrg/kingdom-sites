"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "@/strata/ui/hooks";

const HudLiveContext = createContext<boolean | undefined>(undefined);

/**
 * Turns live HUD updates on or off for a subtree. The story root wraps chapters with
 * <HudLive value={mode === "webgl"}>; without a provider HUD is live unless the user prefers reduced motion.
 */
export function HudLive({ value, children }: { value: boolean; children: ReactNode }) {
  return <HudLiveContext.Provider value={value}>{children}</HudLiveContext.Provider>;
}

export function useHudLive(override?: boolean): boolean {
  const ctx = useContext(HudLiveContext);
  const reduced = usePrefersReducedMotion();
  return override ?? ctx ?? !reduced;
}

type TickOptions = { enabled: boolean; throttle?: number };

const noSubscribe = () => () => {};
let captureFlag: boolean | undefined;
const readCapture = () =>
  (captureFlag ??= new URLSearchParams(window.location.search).get("capture") === "1");

/** True under ?capture=1 (deterministic screenshots): pulsing dots and lock-on animations switch off. */
export function useCaptureMode(): boolean {
  return useSyncExternalStore(noSubscribe, readCapture, () => false);
}

/**
 * Calls tick(timeSeconds) on the shared gsap ticker while enabled and while the element is
 * near the viewport. No React state is touched; tick should write to the DOM directly.
 * `throttle` quantizes calls to fixed buckets of that many ms (67 = the storyboard's 15 Hz).
 */
export function useHudTick(
  ref: RefObject<Element | null>,
  tick: (time: number) => void,
  { enabled, throttle = 0 }: TickOptions,
) {
  const onTick = useEffectEvent(tick);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    let visible = true;
    let last = -1;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting;
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    const fn = (time: number) => {
      if (!visible) return;
      if (throttle) {
        const bucket = Math.floor((time * 1000) / throttle);
        if (bucket === last) return;
        last = bucket;
      }
      onTick(time);
    };
    gsap.ticker.add(fn);
    return () => {
      gsap.ticker.remove(fn);
      io.disconnect();
    };
  }, [ref, enabled, throttle]);
}
