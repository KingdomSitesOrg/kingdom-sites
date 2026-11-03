"use client";

import { useContext, useEffect, useEffectEvent } from "react";
import { gsap } from "gsap";
import { ChapterContext } from "@/strata/story/context";
import { copyColumn } from "./screen";

/** [from, to] in chapter progress p: the element shows only while from <= p <= to. */
export type PWindow = readonly [number, number];

export type GateOptions = {
  /** p-window inside the chapter (STORYBOARD 3.7: each readout has one). */
  window?: PWindow;
  /** Progress source; defaults to the enclosing chapter's p. Use it outside a chapter (lab pages). */
  progress?: () => number;
};

/**
 * Returns a cheap predicate for ticker callbacks: true while the enclosing chapter is on screen and its p
 * (or `progress()`) is inside `window`. Outside a chapter and without `progress` it is always true.
 */
export function useGate({ window, progress }: GateOptions) {
  const prog = useContext(ChapterContext)?.progress;
  return (): boolean => {
    if (prog && !progress && !prog.current.visible) return false;
    if (!window) return true;
    if (!progress && !prog) return true;
    const p = progress ? progress() : prog!.current.p;
    return p >= window[0] && p <= window[1];
  };
}

/** Runs fn(timeSeconds) on every gsap tick while enabled. fn must only touch the DOM. */
export function useTicker(fn: (time: number) => void, enabled = true) {
  const onTick = useEffectEvent(fn);
  useEffect(() => {
    if (!enabled) return;
    const cb = (t: number) => onTick(t);
    gsap.ticker.add(cb);
    return () => gsap.ticker.remove(cb);
  }, [enabled]);
}

/** Viewport size and the copy-column rect, refreshed on resize (never read layout per frame). */
export const screen = { width: 1280, height: 800, column: new Float32Array(4) };
let screenRefs = 0;
const measureScreen = () => {
  screen.width = window.innerWidth;
  screen.height = window.innerHeight;
  copyColumn(screen.width, screen.height, screen.column);
};

export function useScreen() {
  useEffect(() => {
    if (screenRefs++ === 0) {
      measureScreen();
      window.addEventListener("resize", measureScreen);
    }
    return () => {
      if (--screenRefs === 0) window.removeEventListener("resize", measureScreen);
    };
  }, []);
}
