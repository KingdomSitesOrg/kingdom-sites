import { gsap } from 'gsap';
import type Lenis from 'lenis';
import { createFx } from './fx';
import { storyStore } from './store';
import type { ChapterDefinition, ChapterFx, ChapterProgress, HandoffInfo, SlotState, StoryStats } from './types';

type TickListener = (time: number, delta: number) => void;

interface SectionRecord {
  el: HTMLElement;
  sticky: HTMLElement;
  /** Document y of the section top. */
  top: number;
  height: number;
  /** Height of the sticky container: one handoff's worth of scroll. */
  stickyH: number;
  /** Scroll distance while pinned (height - stickyH). */
  pinned: number;
}

interface Waiter {
  index: number;
  resolve: (ok: boolean) => void;
  deadline: number;
  warn: boolean;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The scroll director: one gsap.ticker callback per frame drives Lenis, recomputes every chapter's
 * progress from cached section offsets, notifies DOM listeners, then advances the canvas.
 * Everything here is plain mutable state, read by reference; React only sees the low-frequency store.
 */
class Director {
  defs: ChapterDefinition[] = [];
  sections: (SectionRecord | undefined)[] = [];
  slots: (SlotState | undefined)[] = [];
  handoff: HandoffInfo = { active: false, outgoing: 0, incoming: 1, t: 0, seam: 1, style: 'wipe', via: 'dark' };
  /** The one chapter on screen outside handoffs, or -1. */
  single = 0;
  storyTop = 0;
  storyEnd = 0;
  canvasEl: HTMLElement | null = null;
  canvasHeight = 0;
  time = 0;
  delta = 1 / 60;
  stats: StoryStats = { fps: 60, drawCalls: 0, triangles: 0, geometries: 0, textures: 0, dpr: 1 };
  lenis: Lenis | null = null;
  /** Set by the canvas: renders one frame. */
  renderHook: ((time: number) => void) | null = null;
  /** Set by the canvas renderer: the target chapters render into, so compileAsync builds the right program variants. */
  compileTarget: unknown = null;
  /** Test hook (seam check): render only this chapter, alone, as if no handoff were running. */
  solo: number | null = null;
  /** Per chapter: the p where its copy is fully on screen (the timeline's `rest`), for focus recovery. */
  restP: number[] = [];
  /** Live story position for ticker readers (nav.ts readStoryPosition). */
  position = { active: 0, p: 0, overall: 0, onScreen: true };

  private progressList: ChapterProgress[] = [];
  private fxList: ChapterFx[] = [];
  private listeners = new Set<TickListener>();
  private afterRender = new Set<TickListener>();
  private waiters: Waiter[] = [];
  private refs = 0;
  private measured = false;
  private ro: ResizeObserver | null = null;
  private resizeQueued = false;

  setChapters(defs: ChapterDefinition[]) {
    if (this.defs.length) return;
    this.defs = defs;
  }

  progress(index: number): ChapterProgress {
    let p = this.progressList[index];
    if (!p) {
      const first = index === 0;
      p = this.progressList[index] = { p: 0, raw: 0, enter: first ? 1 : 0, exit: 0, visible: first, time: 0 };
    }
    return p;
  }

  fx(index: number): ChapterFx {
    return this.fxList[index] ?? (this.fxList[index] = createFx(this.defs[index]?.fx));
  }

  registerSection(index: number, el: HTMLElement, sticky: HTMLElement) {
    this.sections[index] = { el, sticky, top: 0, height: 0, stickyH: 0, pinned: 1 };
    this.ro?.observe(el);
    this.queueMeasure();
  }

  unregisterSection(index: number, el: HTMLElement) {
    if (this.sections[index]?.el === el) this.sections[index] = undefined;
    this.ro?.unobserve(el);
  }

  setCanvasElement(el: HTMLElement | null) {
    this.canvasEl = el;
    this.queueMeasure();
  }

  /** Document scrollY that pins chapter `index` at progress `p` (p outside 0..1 reaches into the handoffs). */
  scrollYFor(index: number, p: number) {
    if (!this.measured) this.measure();
    const s = this.sections[index];
    return s ? s.top + p * s.pinned : 0;
  }

  /** Length of one handoff in raw units for chapter `index` (h = 1 / (length - 1)). */
  handoffSpan(index: number) {
    const s = this.sections[index];
    return s ? s.stickyH / s.pinned : 0;
  }

  measure() {
    const y = window.scrollY;
    let last: SectionRecord | undefined;
    for (const s of this.sections) {
      if (!s) continue;
      s.top = s.el.getBoundingClientRect().top + y;
      s.height = s.el.offsetHeight;
      s.stickyH = s.sticky.offsetHeight || window.innerHeight;
      s.pinned = Math.max(1, s.height - s.stickyH);
      if (!last) this.storyTop = s.top;
      last = s;
    }
    this.storyEnd = last ? last.top + last.height : 0;
    this.canvasHeight = this.canvasEl?.clientHeight || window.innerHeight;
    this.measured = last !== undefined;
    const vp = storyStore.getState().viewport;
    if (vp.width !== window.innerWidth || vp.height !== window.innerHeight) {
      storyStore.setState({ viewport: { width: window.innerWidth, height: window.innerHeight } });
    }
  }

  queueMeasure = () => {
    if (this.resizeQueued || typeof window === 'undefined') return;
    this.resizeQueued = true;
    requestAnimationFrame(() => {
      this.resizeQueued = false;
      this.measure();
      this.update();
    });
  };

  update() {
    const n = this.defs.length;
    if (!n) return;
    if (!this.measured) this.measure();
    const y = window.scrollY;
    let active = 0;
    for (let i = 0; i < n; i++) {
      const s = this.sections[i];
      const pr = this.progress(i);
      pr.time = this.time;
      if (!s) continue;
      const raw = (y - s.top) / s.pinned;
      pr.raw = raw;
      pr.p = clamp01(raw);
      pr.enter = i === 0 ? 1 : clamp01((y - s.top + s.stickyH) / s.stickyH);
      pr.exit = clamp01((y - s.top - s.pinned) / s.stickyH);
      pr.visible = y > s.top - s.stickyH && y < s.top + s.height;
      if (y >= s.top - s.stickyH * 0.5) active = i;
    }

    const h = this.handoff;
    h.active = false;
    this.single = -1;
    for (let i = 0; i < n; i++) {
      if (!this.progress(i).visible) continue;
      const next = i + 1 < n ? this.progress(i + 1) : null;
      if (next?.visible) {
        const enter = this.defs[i + 1].enter;
        h.active = true;
        h.outgoing = i;
        h.incoming = i + 1;
        h.t = next.enter;
        h.seam = (this.sections[i + 1]!.top - y) / (this.canvasHeight || window.innerHeight);
        h.style = enter.style;
        h.via = enter.style === 'cut' ? (enter.via ?? 'dark') : 'dark';
      } else {
        this.single = i;
      }
      break;
    }

    const st = storyStore.getState();
    const onScreen = !this.measured || y < this.storyEnd - 1;
    const running = onScreen && st.mode === 'webgl' && document.visibilityState === 'visible';
    if (st.active !== active || st.onScreen !== onScreen || st.running !== running) {
      storyStore.setState({ active, onScreen, running });
    }
    const pos = this.position;
    pos.active = active;
    pos.p = this.progress(active).p;
    pos.onScreen = onScreen;
    const span = this.storyEnd - this.storyTop - (this.canvasHeight || window.innerHeight);
    pos.overall = span > 0 ? clamp01((y - this.storyTop) / span) : 0;
  }

  /** DOM listener, run every frame after progress is updated and before the canvas renders. */
  onTick(fn: TickListener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** DOM listener, run every frame after the canvas rendered: reads the signals Scenes wrote this frame. */
  onAfterRender(fn: TickListener) {
    this.afterRender.add(fn);
    return () => {
      this.afterRender.delete(fn);
    };
  }

  /** Resolves true once chapter `index` is mounted, compiled and drawn >= 3 frames, false on timeout. */
  whenReady(index: number, timeoutMs = 20000, warn = true): Promise<boolean> {
    return new Promise((resolve) => {
      this.waiters.push({ index, resolve, deadline: performance.now() + timeoutMs, warn });
    });
  }

  private tick = (time: number, deltaMs: number) => {
    const { flags, running, mode } = storyStore.getState();
    this.lenis?.raf(time * 1000);
    const dt = flags.capture ? 1 / 60 : Math.min(deltaMs / 1000, 0.1);
    this.delta = dt;
    this.time = flags.capture ? 10 + window.scrollY / 600 : this.time + dt;
    if (deltaMs > 0) this.stats.fps += (1000 / deltaMs - this.stats.fps) * 0.08;
    this.update();
    for (const fn of this.listeners) fn(this.time, dt);
    if (running && this.renderHook) this.renderHook(time);
    for (const fn of this.afterRender) fn(this.time, dt);
    if (this.waiters.length) this.checkWaiters(mode === 'static');
  };

  private checkWaiters(staticMode: boolean) {
    const now = performance.now();
    this.waiters = this.waiters.filter((w) => {
      const slot = this.slots[w.index];
      if (staticMode || (slot && slot.compiled && slot.drawn >= 3)) {
        w.resolve(true);
        return false;
      }
      if (now > w.deadline) {
        if (w.warn) console.warn(`[strata] whenReady(${w.index}) timed out`);
        w.resolve(false);
        return false;
      }
      return true;
    });
  }

  private onVisibility = () => this.update();

  start() {
    if (this.refs++) return;
    gsap.ticker.lagSmoothing(0);
    // First on the ticker: every other gsap ticker callback (the HUD kit's) runs after the frame rendered,
    // so DOM that follows Scene signals is never a frame late.
    gsap.ticker.add(this.tick, false, true);
    this.ro = new ResizeObserver(this.queueMeasure);
    for (const s of this.sections) if (s) this.ro.observe(s.el);
    window.addEventListener('resize', this.queueMeasure);
    window.addEventListener('load', this.queueMeasure);
    document.addEventListener('visibilitychange', this.onVisibility);
    document.fonts?.ready.then(this.queueMeasure);
    this.measure();
    this.update();
  }

  stop() {
    if (--this.refs) return;
    gsap.ticker.remove(this.tick);
    this.ro?.disconnect();
    this.ro = null;
    window.removeEventListener('resize', this.queueMeasure);
    window.removeEventListener('load', this.queueMeasure);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
}

export const director = new Director();
