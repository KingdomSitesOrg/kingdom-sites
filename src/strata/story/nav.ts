'use client';

import { director } from './director';
import { storyStore, useStoryStore } from './store';

/**
 * Story navigation (STORYBOARD 2.3, 5.1, 8.2): the same maths as window.__strata, always available.
 * Also the global same-page anchor handler (focus moves to the target heading) and the readers the
 * HUD's phase rail uses.
 */

export interface StoryNav {
  /** Document scrollY that pins chapter `index` at progress `p` (p outside 0..1 reaches into the handoffs). */
  scrollYFor(index: number, p: number): number;
  /** Scrolls so chapter `index` sits at `p`. Smooth unless `immediate` (or reduced motion). Resolves when there. */
  scrollTo(index: number, p: number, options?: { immediate?: boolean }): Promise<void>;
  /**
   * Fades a --bg-0 cover in (240 ms), jumps instantly, waits for the chapter (or 1,200 ms), fades out
   * (400 ms). Chapters in between never mount. No cover under reduced motion or in static mode.
   * `focus` (selector or element) receives focus after the jump.
   */
  jumpBehindCover(index: number, p: number, options?: { focus?: string | HTMLElement | null }): Promise<void>;
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const COVER_IN_MS = 240;
const COVER_OUT_MS = 400;
const READY_TIMEOUT_MS = 1200;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

let cover: HTMLElement | null = null;
let jumping = false;

/** Called by <JumpCover /> (mounted once by the Story root). */
export function registerCover(el: HTMLElement | null) {
  cover = el;
}

function instantMotion() {
  const s = storyStore.getState();
  return s.reducedMotion || s.mode === 'static';
}

export function scrollYFor(index: number, p: number): number {
  return director.scrollYFor(index, p);
}

async function scrollToY(y: number, immediate: boolean): Promise<void> {
  const lenis = director.lenis;
  const instant = immediate || instantMotion();
  if (lenis) {
    if (instant) {
      lenis.scrollTo(y, { immediate: true, force: true });
      director.update();
      await nextFrame();
      return;
    }
    await new Promise<void>((resolve) => {
      const distance = Math.abs(y - window.scrollY) / Math.max(1, window.innerHeight);
      lenis.scrollTo(y, {
        force: true,
        duration: Math.min(1.6, 0.6 + distance * 0.25),
        easing: (t) => 1 - Math.pow(1 - t, 3),
        onComplete: () => resolve(),
      });
      window.setTimeout(resolve, 2400);
    });
    return;
  }
  window.scrollTo({ top: y, behavior: instant ? 'instant' : 'smooth' });
  director.update();
  if (instant) {
    await nextFrame();
    return;
  }
  await new Promise<void>((resolve) => {
    const done = () => {
      window.removeEventListener('scrollend', done);
      resolve();
    };
    window.addEventListener('scrollend', done, { once: true });
    window.setTimeout(done, 1600);
  });
}

export function scrollTo(index: number, p: number, options: { immediate?: boolean } = {}): Promise<void> {
  director.measure();
  return scrollToY(director.scrollYFor(index, p), Boolean(options.immediate));
}

function fadeCover(el: HTMLElement, to: 0 | 1, ms: number) {
  el.style.transition = `opacity ${ms}ms ${EASE}`;
  el.style.pointerEvents = to ? 'auto' : 'none';
  el.style.opacity = String(to);
  return wait(ms);
}

function requestCanvas() {
  const s = storyStore.getState();
  if (s.mode === 'webgl' && s.canvas === 'idle') storyStore.setState({ canvas: 'requested' });
}

export async function jumpBehindCover(
  index: number,
  p: number,
  options: { focus?: string | HTMLElement | null } = {},
): Promise<void> {
  if (jumping) return;
  jumping = true;
  try {
    const useCover = !instantMotion() && cover !== null;
    if (useCover) await fadeCover(cover!, 1, COVER_IN_MS);
    await scrollTo(index, p, { immediate: true });
    focusTarget(options.focus ?? null);
    if (storyStore.getState().mode === 'webgl') {
      requestCanvas();
      await director.whenReady(index, READY_TIMEOUT_MS, false);
    }
    if (useCover && cover) await fadeCover(cover, 0, COVER_OUT_MS);
  } finally {
    jumping = false;
  }
}

const NAV: StoryNav = { scrollYFor, scrollTo, jumpBehindCover };

/** Story navigation for DOM code (buttons, stage strips, CTAs). The returned object is stable. */
export function useStoryNav(): StoryNav {
  return NAV;
}

/** Focuses an element (or the first match of a selector) without scrolling, making it focusable if needed. */
export function focusTarget(target: string | HTMLElement | null) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

/** The heading an anchor jump should focus: #<id>-title, else the first heading inside, else the element. */
function headingFor(id: string, el: HTMLElement): HTMLElement {
  return (
    document.getElementById(`${id}-title`) ??
    el.querySelector<HTMLElement>('h1, h2, h3') ??
    el
  );
}

/** Where an anchor lands inside a chapter: copy is on screen by then (STORYBOARD 3.6). */
const CHAPTER_LANDING: Record<string, number> = { ignition: 0, fleet: 0.4 };
const DEFAULT_LANDING = 0.15;
/** Anchors that always use the cover jump (5.1). */
const COVER_JUMPS = new Set(['fleet']);

/**
 * Same-page navigation for every `<a href="#id">`: chapter targets land where their copy is visible
 * (#fleet and far jumps go behind the cover), other targets scroll to their top, and focus moves to
 * the target heading. Links keep working without JS. Returns a cleanup function.
 */
export function installAnchorNavigation(): () => void {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a || a.target === '_blank') return;
    const id = decodeURIComponent(a.getAttribute('href')!.slice(1));
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    if (window.location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    void navigateTo(id, el);
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

async function navigateTo(id: string, el: HTMLElement) {
  const heading = headingFor(id, el);
  const index = director.defs.findIndex((d) => d.id === id);
  if (index >= 0) {
    const p = CHAPTER_LANDING[id] ?? DEFAULT_LANDING;
    const far = Math.abs(index - storyStore.getState().active) > 1;
    if (COVER_JUMPS.has(id) || far) {
      await jumpBehindCover(index, p, { focus: heading });
      return;
    }
    focusTarget(heading);
    await scrollTo(index, p);
    return;
  }
  focusTarget(heading);
  const y = el.getBoundingClientRect().top + window.scrollY;
  await scrollToY(y, Math.abs(y - window.scrollY) > window.innerHeight * 2);
}

export interface StoryChapterInfo {
  index: number;
  id: string;
  title: string;
  /** Two-digit code: '00' .. '08'. */
  code: string;
  /** Phase rail label: '00 Ignition'. */
  label: string;
}

let chapterInfo: StoryChapterInfo[] | null = null;

/** Every chapter in story order (ids, titles, codes). Stable; available once the Story module is loaded. */
export function getStoryChapters(): readonly StoryChapterInfo[] {
  if (!chapterInfo || chapterInfo.length !== director.defs.length) {
    chapterInfo = director.defs.map((d, index) => {
      const code = String(index).padStart(2, '0');
      return { index, id: d.id, title: d.title, code, label: `${code} ${d.title}` };
    });
  }
  return chapterInfo;
}

/** React: the chapter list (static). */
export function useStoryChapters(): readonly StoryChapterInfo[] {
  return getStoryChapters();
}

/** React: the active chapter index (switches at handoff midpoints; re-renders only then). */
export function useActiveChapter(): number {
  return useStoryStore((s) => s.active);
}

/** React: false once the story has scrolled away (#customers reached the top). */
export function useStoryOnScreen(): boolean {
  return useStoryStore((s) => s.onScreen);
}

export interface StoryPosition {
  /** Active chapter index. */
  readonly active: number;
  /** The active chapter's pinned progress 0..1. */
  readonly p: number;
  /** Whole-story scroll progress 0..1 (for the mobile progress line). */
  readonly overall: number;
  /** Story on screen (false once #customers reaches the top). */
  readonly onScreen: boolean;
}

/**
 * Ticker-friendly live position: one object, updated by the director every frame before DOM
 * listeners run. Read it inside useStoryTick / gsap ticker callbacks; never copy it into React state.
 */
export function readStoryPosition(): StoryPosition {
  return director.position;
}
