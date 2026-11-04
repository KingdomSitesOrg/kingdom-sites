'use client';

import { useContext, useEffect, useLayoutEffect, useRef, type DependencyList } from 'react';
import { gsap } from 'gsap';
import type { PerspectiveCamera } from 'three';
import { ChapterContext, type ChapterContextValue } from './context';
import { director } from './director';
import { useStoryStore } from './store';
import { layoutFor, type Layout } from './framing';
import type { ChapterFrameCallback, ChapterFx, ChapterProgress, Quality, StoryMode } from './types';

/** { index, id, def, progress, fx, root } for the chapter this component belongs to (Scene or Overlay). */
export function useChapter(): ChapterContextValue {
  const ctx = useContext(ChapterContext);
  if (!ctx) throw new Error('useChapter() must be used inside a chapter Scene or Overlay');
  return ctx;
}

/** Ref to this chapter's live progress. Read .current inside frame or ticker callbacks; it never re-renders. */
export function useChapterProgress(): { readonly current: ChapterProgress } {
  return useChapter().progress;
}

/** This chapter's mutable fx object. Write to it inside useChapterFrame. */
export function useChapterFx(): ChapterFx {
  return useChapter().fx;
}

/** Like useFrame, but runs only while this chapter is visible. Delta is in seconds (fixed 1/60 in capture mode). */
export function useChapterFrame(callback: ChapterFrameCallback) {
  const { slot } = useChapter();
  if (!slot) throw new Error('useChapterFrame() must be used inside a chapter Scene');
  const ref = useRef(callback);
  useLayoutEffect(() => {
    ref.current = callback;
  });
  useLayoutEffect(() => {
    slot.subs.add(ref);
    return () => {
      slot.subs.delete(ref);
    };
  }, [slot]);
}

/** This chapter's PerspectiveCamera (also useThree().camera inside the Scene). */
export function useChapterCamera(): PerspectiveCamera {
  const { slot } = useChapter();
  if (!slot) throw new Error('useChapterCamera() must be used inside a chapter Scene');
  return slot.camera;
}

export function useQuality(): Quality {
  return useStoryStore((s) => s.quality);
}

/**
 * The tier to build the shared part (and other heavy geometry) at: the detected ceiling, which never changes
 * at runtime. Adaptive drops cost shading, not triangles, so geometry keyed on it never rebuilds mid-scroll.
 */
export function usePartQuality(): Quality {
  return useStoryStore((s) => s.qualityCeiling);
}

export function useStoryMode(): StoryMode {
  return useStoryStore((s) => s.mode);
}

export function useReducedMotion(): boolean {
  return useStoryStore((s) => s.reducedMotion);
}

export function useViewport(): { width: number; height: number } {
  return useStoryStore((s) => s.viewport);
}

/**
 * The page layout, one rule for Scenes and Overlays: 'stacked' below 768 px wide (copy band on top, CSS
 * `max-md:`), 'column' from 768 px (copy column on the left, CSS `md:`). Re-renders only on resize.
 */
export function useLayout(): Layout {
  return useStoryStore((s) => layoutFor(s.viewport.width));
}

/** True in the stacked layout (below 768 px): portrait framing, subject centred at 58 % height. */
export function useIsPortrait(): boolean {
  return useStoryStore((s) => layoutFor(s.viewport.width) === 'stacked');
}

/**
 * Runs on every story frame (gsap ticker) right after progress is updated, before the canvas renders. For
 * DOM that follows Scene output (signals written in useChapterFrame), pass `{ after: 'render' }`: it then runs
 * after the frame rendered, so it reads this frame's values.
 */
export function useStoryTick(
  callback: (time: number, delta: number) => void,
  options: { after?: 'progress' | 'render' } = {},
) {
  const ref = useRef(callback);
  useLayoutEffect(() => {
    ref.current = callback;
  });
  const after = options.after ?? 'progress';
  useEffect(() => {
    const fn = (t: number, d: number) => ref.current(t, d);
    return after === 'render' ? director.onAfterRender(fn) : director.onTick(fn);
  }, [after]);
}

type TimelineSource = 'p' | 'enter' | 'exit' | ((progress: ChapterProgress) => number);

/**
 * A paused GSAP timeline whose progress follows this chapter's p (or another source) every frame.
 * Build it with relative durations: the whole timeline maps onto 0..1. Selectors are scoped to the
 * chapter's sticky container. Under reduced motion it is held at `rest` (default 1, the end state):
 * pass the point where all the copy is on screen, for example 0.5 when copy also fades out at the end.
 * `restInStatic` holds it there in every static mode too (?static=1, no WebGL, context loss). `rest` is also
 * where keyboard focus entering a faded-out overlay scrolls the chapter to.
 */
export function useChapterTimeline(
  build: (tl: gsap.core.Timeline, root: HTMLElement) => void,
  deps: DependencyList = [],
  options: { source?: TimelineSource; rest?: number; restInStatic?: boolean } = {},
) {
  const chapter = useChapter();
  const reducedMotion = useReducedMotion();
  const isStatic = useStoryStore((s) => s.booted && s.mode === 'static');
  const reduced = reducedMotion || (Boolean(options.restInStatic) && isStatic);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const buildRef = useRef(build);
  useLayoutEffect(() => {
    buildRef.current = build;
  });
  const source = options.source ?? 'p';
  const rest = options.rest ?? 1;
  useEffect(() => {
    if (source === 'p') director.restP[chapter.index] = rest;
  }, [chapter.index, source, rest]);

  useLayoutEffect(() => {
    const root = resolveRoot(chapter);
    if (!root) return;
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      buildRef.current(tl, root);
    }, root);
    const timeline = tl!;
    tlRef.current = timeline;
    const pick = typeof source === 'function' ? source : (pr: ChapterProgress) => pr[source];
    let last = -1;
    const sync = () => {
      const v = reduced ? rest : pick(chapter.progress.current);
      if (v !== last) {
        last = v;
        timeline.progress(v);
      }
    };
    sync();
    const off = director.onTick(sync);
    return () => {
      off();
      ctx.revert();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt only when the caller's deps change
  }, [chapter, reduced, source, rest, ...deps]);
  return tlRef;
}

/**
 * The chapter's sticky container. Children's layout effects run before the parent's ref is attached,
 * so fall back to the DOM (already inserted at that point).
 */
function resolveRoot(chapter: ChapterContextValue): HTMLElement | null {
  return (
    chapter.root.current ??
    document.getElementById(chapter.id)?.querySelector<HTMLElement>(':scope > div') ??
    null
  );
}
