import { director } from './director';
import { scrollTo } from './nav';
import { storyStore } from './store';
import type { EnterStyle, Quality, StoryMode } from './types';

export interface StrataTestHooks {
  version: 1;
  chapters: { id: string; index: number; stills: number[]; enter: EnterStyle }[];
  readonly mode: StoryMode;
  readonly quality: Quality;
  scrollYFor(index: number, p: number): number;
  /** One handoff in chapter `index`'s raw units (h = 1 / (length - 1)) for the current viewport. */
  handoffSpan(index: number): number;
  goto(index: number, p: number): Promise<void>;
  whenReady(index: number): Promise<boolean>;
  /** Renders only chapter `index` (null: back to normal), as one side of a handoff without its partner. */
  solo(index: number | null): Promise<void>;
  stats(): StrataStats;
}

export interface StrataStats {
  fps: number;
  /** Active chapter (switches at handoff midpoints). */
  chapter: number;
  p: number;
  /** The one chapter drawn this frame, or -1 during a handoff (draws and tris then cover both chapters). */
  single: number;
  handoff: boolean;
  drawCalls: number;
  triangles: number;
  /** Renderer-wide GPU memory counters (three's renderer.info.memory): watch them for leaks. */
  geometries: number;
  textures: number;
  dpr: number;
}

declare global {
  interface Window {
    __strata?: StrataTestHooks;
  }
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** window.__strata, installed with ?capture=1 or ?debug=1. Same maths as useStoryNav(). */
export function installTestHooks() {
  const hooks: StrataTestHooks = {
    version: 1,
    chapters: director.defs.map((d, index) => ({ id: d.id, index, stills: d.stills, enter: d.enter.style })),
    get mode() {
      return storyStore.getState().mode;
    },
    get quality() {
      return storyStore.getState().quality;
    },
    scrollYFor: (index, p) => director.scrollYFor(index, p),
    handoffSpan(index) {
      director.measure();
      return director.handoffSpan(index);
    },
    async goto(index, p) {
      await scrollTo(index, p, { immediate: true });
      await nextFrame();
    },
    whenReady(index) {
      const s = storyStore.getState();
      if (s.mode === 'static') return nextFrame().then(() => true);
      if (s.canvas === 'idle') storyStore.setState({ canvas: 'requested' });
      return director.whenReady(index);
    },
    async solo(index) {
      director.solo = index;
      await nextFrame();
      await nextFrame();
    },
    stats() {
      const chapter = storyStore.getState().active;
      const st = director.stats;
      return {
        fps: Math.round(st.fps * 10) / 10,
        chapter,
        p: director.progress(chapter).p,
        single: director.single,
        handoff: director.handoff.active,
        drawCalls: st.drawCalls,
        triangles: st.triangles,
        geometries: st.geometries,
        textures: st.textures,
        dpr: st.dpr,
      };
    },
  };
  window.__strata = hooks;
  return () => {
    if (window.__strata === hooks) delete window.__strata;
    director.solo = null;
  };
}
