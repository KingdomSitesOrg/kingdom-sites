"use client";

import { useSyncExternalStore } from "react";

function subscribeQuery(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

const subscribers = new Map<string, (onChange: () => void) => () => void>();

/** Live matchMedia result. Returns serverValue during SSR and hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  let subscribe = subscribers.get(query);
  if (!subscribe) {
    subscribe = subscribeQuery(query);
    subscribers.set(query, subscribe);
  }
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True on touch-first devices (no precise hover). */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)", true);
}
