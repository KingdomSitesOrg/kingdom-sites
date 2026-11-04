'use client';

import { Suspense, use, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { Color, PerspectiveCamera, Scene, type WebGLRenderTarget } from 'three';
import { ChapterContext, type ChapterContextValue } from '../context';
import { director } from '../director';
import { useStoryStore } from '../store';
import type { ChapterDefinition, SceneModule, SlotState } from '../types';

const loads = new WeakMap<ChapterDefinition, Promise<SceneModule>>();

/** Starts downloading a chapter's scene chunk (idempotent). */
export function preloadScene(def: ChapterDefinition) {
  let p = loads.get(def);
  if (!p) {
    p = def.scene();
    loads.set(def, p);
  }
  return p;
}

const requestIdle = (fn: () => void): number =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 600 }) : window.setTimeout(fn, 120);
const cancelIdle = (id: number) => {
  if (!id) return;
  if (typeof cancelIdleCallback === 'function') cancelIdleCallback(id);
  else window.clearTimeout(id);
};

/**
 * One per chapter. Owns the chapter's THREE.Scene and camera, mounts the Scene component through a
 * portal while the chapter is within +-1 of the active one (kept until beyond +-2), prefetches the
 * chunk at +-2, compiles shaders before the renderer may show it, and runs the chapter's frame
 * callbacks only while it is visible. The chapter ahead of the active one (from Ch2 on) waits until
 * the handoff into the active chapter has finished and the main thread is idle, so its mount and
 * compile never land mid-transition; it mounts at once if its own handoff starts first.
 */
export function ChapterSlot({ def, index }: { def: ChapterDefinition; index: number }) {
  const active = useStoryStore((s) => s.active);
  const size = useThree((s) => s.size);
  const dist = Math.abs(index - active);

  const slot = useMemo<SlotState>(() => {
    const scene = new Scene();
    scene.name = `chapter:${def.id}`;
    scene.background = new Color(def.background);
    const camera = new PerspectiveCamera(def.camera?.fov ?? 30, 1, def.camera?.near ?? 0.5, def.camera?.far ?? 4000);
    camera.position.set(0, 60, 300);
    return { index, scene, camera, subs: new Set(), compiled: false, drawn: 0 };
  }, [def, index]);

  useEffect(() => {
    director.slots[index] = slot;
    return () => {
      if (director.slots[index] === slot) director.slots[index] = undefined;
    };
  }, [index, slot]);

  useLayoutEffect(() => {
    slot.camera.aspect = size.width / Math.max(1, size.height);
    slot.camera.updateProjectionMatrix();
  }, [slot, size.width, size.height]);

  const ahead = index > 1 && index === active + 1;
  const [mounted, setMounted] = useState(dist <= 1);
  const [released, setReleased] = useState(false);
  const want = (dist <= 1 && (!ahead || released || mounted)) || (mounted && dist <= 2);
  if (want !== mounted) {
    setMounted(want);
    if (!want) setReleased(false);
  }

  const waiting = ahead && !mounted && !released;
  useEffect(() => {
    if (!waiting) return;
    let idle = 0;
    let done = false;
    const release = () => setReleased(true);
    const off = director.onTick(() => {
      if (done) return;
      const h = director.handoff;
      if (h.active && h.incoming === index) {
        done = true;
        release();
      } else if (!h.active) {
        done = true;
        idle = requestIdle(release);
      }
    });
    return () => {
      off();
      cancelIdle(idle);
    };
  }, [waiting, index]);

  const near = dist <= 2;
  useEffect(() => {
    if (near) void preloadScene(def);
  }, [near, def]);

  const ctx = useMemo<ChapterContextValue>(
    () => ({
      index,
      id: def.id,
      def,
      progress: { current: director.progress(index) },
      fx: director.fx(index),
      root: { current: director.sections[index]?.sticky as HTMLDivElement | null ?? null },
      slot,
    }),
    [def, index, slot],
  );

  if (!mounted) return null;
  return createPortal(
    <ChapterContext.Provider value={ctx}>
      <FrameDriver slot={slot} />
      <Suspense fallback={null}>
        <SceneModuleView def={def} />
        <CompileWhenCommitted slot={slot} />
      </Suspense>
    </ChapterContext.Provider>,
    slot.scene,
    { camera: slot.camera },
  );
}

/** Suspends on the (cached) chunk promise, then renders the module's default export. */
function SceneModuleView({ def }: { def: ChapterDefinition }) {
  const { default: SceneComponent } = use(preloadScene(def));
  return <SceneComponent />;
}

function FrameDriver({ slot }: { slot: SlotState }) {
  useFrame((state) => {
    const prog = director.progress(slot.index);
    if (!prog.visible) return;
    const delta = director.delta;
    for (const sub of slot.subs) sub.current(state, delta, prog);
  });
  return null;
}

/** Commits together with the Scene (same Suspense boundary), then compiles its programs off the critical path. */
function CompileWhenCommitted({ slot }: { slot: SlotState }) {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    let alive = true;
    const prev = gl.getRenderTarget();
    gl.setRenderTarget((director.compileTarget as WebGLRenderTarget | null) ?? null);
    const pending = gl.compileAsync(slot.scene, slot.camera);
    gl.setRenderTarget(prev);
    pending
      .catch(() => undefined)
      .then(() => {
        if (alive) slot.compiled = true;
      });
    return () => {
      alive = false;
      slot.compiled = false;
      slot.drawn = 0;
    };
  }, [gl, slot]);
  return null;
}
