'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { advance, Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { preloadPart } from '@/strata/part';
import { director } from '../director';
import { dprCap, dprFloor, tierRank, TIERS } from '../quality';
import { storyStore, useStoryStore } from '../store';
import type { ChapterDefinition, Quality } from '../types';
import { ChapterSlot } from './ChapterSlot';
import { createPipeline, type Pipeline } from './pipeline';
import './threeConsole';

/**
 * The one shared WebGL canvas behind every chapter. It never runs its own loop: the director's gsap
 * tick advances it (after Lenis and progress have updated) only while the story is on screen and the
 * tab is visible, so DOM and canvas move in the same frame and nothing renders behind the SaaS page.
 */
export default function StoryCanvas({ chapters }: { chapters: ChapterDefinition[] }) {
  const dpr = useStoryStore((s) => s.dpr);
  const onScreen = useStoryStore((s) => s.onScreen);
  const ready = useStoryStore((s) => s.canvas === 'ready');
  const capture = useStoryStore((s) => s.flags.capture);
  const adaptive = useStoryStore((s) => !s.flags.capture && !s.flags.forcedQuality);
  const [shadows] = useState(() => storyStore.getState().quality !== 'low');
  const wrap = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    director.setCanvasElement(wrap.current);
    return () => director.setCanvasElement(null);
  }, []);

  // The bracket is built in Web Workers: start once the first chapter is on screen, so neither the boot
  // nor a later chapter's mount pays for it.
  useEffect(() => {
    let live = true;
    const { active, qualityCeiling } = storyStore.getState();
    void director.whenReady(active, 20000, false).then(() => {
      if (live) void preloadPart(qualityCeiling);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden
      data-story-canvas
      className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh"
      style={{
        opacity: ready ? 1 : 0,
        transition: capture ? 'none' : 'opacity 900ms cubic-bezier(.2,.7,.2,1)',
        visibility: onScreen ? 'visible' : 'hidden',
      }}
    >
      <Canvas
        frameloop="never"
        dpr={dpr}
        resize={RESIZE}
        flat
        shadows={shadows ? 'percentage' : false}
        gl={{ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' }}
        onCreated={onCreated}
      >
        <Driver />
        <Renderer />
        {chapters.map((def, i) => (
          <ChapterSlot key={def.id} def={def} index={i} />
        ))}
        {adaptive && <Adaptive />}
      </Canvas>
    </div>
  );
}

/** The canvas is position: fixed, so scroll offsets never matter; scroll-debounced measuring would hold back the first size (and the context) for as long as Lenis keeps scrolling. */
const RESIZE = { scroll: false, debounce: { scroll: 0, resize: 0 } };

function onCreated(state: RootState) {
  state.gl.info.autoReset = false;
  state.gl.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('[strata] WebGL context lost, switching to static mode');
    storyStore.setState({ mode: 'static', canvas: 'idle' });
  });
}

/** Hands the director a function that advances this root by one frame. */
function Driver() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    director.renderHook = (time) => advance(time, false, get());
    return () => {
      director.renderHook = null;
    };
  }, [get]);
  return null;
}

function Renderer() {
  const gl = useThree((s) => s.gl);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);
  const quality = useStoryStore((s) => s.quality);
  const pipe = useRef<Pipeline | null>(null);

  useLayoutEffect(() => {
    const p = createPipeline(gl, quality);
    pipe.current = p;
    director.compileTarget = p.chapterPass.targetA;
    return () => {
      pipe.current = null;
      director.compileTarget = null;
      p.dispose();
    };
  }, [gl, quality]);

  useLayoutEffect(() => {
    pipe.current?.setSize(width, height);
  }, [gl, quality, width, height, dpr]);

  useFrame(() => pipe.current?.render(director.time, director.delta), 1);
  return null;
}

/** A step is held at least this long before the monitor may move again. */
const SETTLE_MS = 3000;

/**
 * Steps DPR, then tier, down when frames drop and back up (never above the detected tier) when there is headroom.
 * It never locks: each step is held for SETTLE_MS, and stepping up needs two good windows in a row.
 */
function Adaptive() {
  const last = useRef(0);
  const ups = useRef(0);
  const step = (patch: { dpr: number; quality?: Quality }) => {
    storyStore.setState(patch);
    last.current = performance.now();
    ups.current = 0;
  };
  const settling = () => performance.now() - last.current < SETTLE_MS;
  const decline = () => {
    ups.current = 0;
    if (settling()) return;
    const s = storyStore.getState();
    const device = window.devicePixelRatio || 1;
    const floor = dprFloor(s.quality, device);
    if (s.dpr > floor + 0.01) {
      step({ dpr: Math.max(floor, Math.round(s.dpr * 0.8 * 100) / 100) });
    } else if (s.quality !== 'low') {
      const q = TIERS[tierRank(s.quality) - 1];
      step({ quality: q, dpr: dprCap(q, device) });
    }
  };
  const incline = () => {
    if (settling() || ++ups.current < 2) return;
    const s = storyStore.getState();
    const device = window.devicePixelRatio || 1;
    const cap = dprCap(s.quality, device);
    if (s.dpr < cap - 0.01) {
      step({ dpr: Math.min(cap, Math.round(s.dpr * 1.25 * 100) / 100) });
    } else if (tierRank(s.quality) < tierRank(s.qualityCeiling)) {
      const q = TIERS[tierRank(s.quality) + 1];
      step({ quality: q, dpr: Math.max(dprFloor(q, device), dprCap(q, device) - 0.3) });
    }
  };
  return <PerformanceMonitor ms={300} iterations={8} bounds={() => [44, 57]} onDecline={decline} onIncline={incline} />;
}
