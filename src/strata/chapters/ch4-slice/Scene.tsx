'use client';

import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Color, MeshBasicMaterial, type BufferGeometry, type Mesh, type PerspectiveCamera, type WebGLRenderTarget } from 'three';
import { LAYER, preloadPart, type PartData, type Toolpath } from '@/strata/part';
import {
  createPose,
  handoffPose,
  isCapture,
  poseCamera,
  range,
  storyDirector,
  useChapter,
  useCameraPath,
  useChapterCamera,
  useChapterFrame,
  useChapterFx,
  useIsPortrait,
  usePartQuality,
  useQuality,
  type CameraKeyframe,
} from '@/strata/story';
import { BEATS, drawAt, fanAt, parkAt, pulse } from './beats';
import { createGridMaterial } from './grid';
import { buildLineGeometry, createLineMaterial, sampleLayer, toLayerPath } from './lines';
import { createStackMaterials, FAN_DEG, FILL } from './stack';
import { signals } from './signals';
import { Studio } from '@/strata/story/shared/studio';
import { linearRGB } from '@/strata/shaders/palette';

type V3 = readonly [number, number, number];

const SLABS = { high: 120, medium: 72, low: 40 } as const;
/** About this many cards fan out on every tier. */
const CARDS = 40;
/** The white-hot pen point, and the molten-hot it cools to as Ch5's nozzle takes its place. */
const PEN_HOT = new Color(9, 7.6, 6.2);
const PEN_NOZZLE = new Color(...linearRGB('molten-hot')).multiplyScalar(3);
const GHOST_YS = [5, 10, 15, 20, 25, 30, 35, 40];

const H4 = { a: handoffPose('3-4', 0), b: handoffPose('3-4', 1) };
const H5 = { a: handoffPose('4-5', 0), b: handoffPose('4-5', 1) };

const rotY = (p: V3, deg: number, about: V3 = [0, 20, 0]): V3 => {
  const a = (deg * Math.PI) / 180;
  const x = p[0] - about[0];
  const z = p[2] - about[2];
  return [about[0] + x * Math.cos(a) + z * Math.sin(a), p[1], about[2] - x * Math.sin(a) + z * Math.cos(a)];
};

// STORYBOARD Ch4 camera; t = 0.08 and t = 0.86 keep the opening and closing holds still. The 3-4 wipe eases the
// subject right to fx 0.65, clear of the copy column, and it stays there until the copy has gone.
const KEYS: CameraKeyframe[] = [
  { t: -0.5, pos: H4.a.pos, target: H4.a.target, fov: H4.a.fov, fx: H4.a.fx },
  { t: 0, pos: H4.b.pos, target: H4.b.target, fov: H4.b.fov, fx: H4.b.fx },
  { t: 0.08, pos: rotY(H4.b.pos, 0.5), target: [-1, 21, 0], fov: 26.3, fx: 0.65 },
  { t: 0.3, pos: [215, 100, 268], target: [-8, 58, -10], fov: 30, fx: 0.62 },
  { t: 0.5, pos: [160, 120, 200], target: [0, 20, 0], fov: 28, fx: 0.65 },
  { t: 0.72, pos: [30, 150, 70], target: [0, 0, 0], fov: 30 },
  { t: 0.86, pos: [3, 168, 31], target: [0, 0, 0], fov: 30 },
  { t: 1, pos: H5.a.pos, target: H5.a.target, fov: H5.a.fov },
  { t: 1.5, pos: H5.b.pos, target: H5.b.target, fov: H5.b.fov },
];

const pathCache = new WeakMap<PartData, Promise<Toolpath[]>>();
/** One stable promise per part, so use() can suspend on it. */
function layerPaths(part: PartData) {
  let hit = pathCache.get(part);
  if (!hit) {
    hit = part.toolpaths([LAYER.first, ...GHOST_YS]);
    pathCache.set(part, hit);
  }
  return hit;
}

/** Per-point classes (the move ending at each point) to per-segment classes. */
const segmentClasses = (cls: Uint8Array) => cls.subarray(1);

/** Splits the outer-perimeter runs of a toolpath into polylines, for the ghost contour plan. */
function outerRuns(xz: Float32Array, cls: Uint8Array) {
  const seg = segmentClasses(cls);
  const runs: Float32Array[] = [];
  let start = -1;
  for (let i = 0; i <= seg.length; i++) {
    const on = i < seg.length && seg[i] === 0;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      runs.push(xz.slice(start * 2, (i + 1) * 2));
      start = -1;
    }
  }
  return runs;
}

export default function Scene() {
  const quality = useQuality();
  const partQuality = usePartQuality();
  const part: PartData = use(preloadPart(partQuality));
  const portrait = useIsPortrait();
  const camera = useChapterCamera();
  const fx = useChapterFx();
  const path = useCameraPath(KEYS);
  const count = SLABS[partQuality];
  const spacing = 42 / count;
  const slab0Top = spacing * (0.5 + FILL / 2);
  const lineY = slab0Top + 0.03;

  const stackMats = useMemo(() => createStackMaterials(), []);
  const lineMat = useMemo(() => createLineMaterial(), []);
  const gridMat = useMemo(() => createGridMaterial(), []);
  const penMat = useMemo(() => new MeshBasicMaterial({ color: PEN_HOT.clone(), transparent: true }), []);
  useEffect(
    () => () => {
      stackMats.solid.dispose();
      stackMats.fade.dispose();
      lineMat.dispose();
      gridMat.dispose();
      penMat.dispose();
    },
    [stackMats, lineMat, gridMat, penMat],
  );

  // Layer 1 and the ghost contours are cheap, so the Scene waits for them (readiness gates captures). The slab
  // stack takes up to a second: live, the stripe stand-in covers it; under capture the Scene waits for it too.
  const tps = use(layerPaths(part));
  const captured = isCapture() ? use(part.sliceStack(count, FILL)) : null;
  const [loaded, setLoaded] = useState<{ count: number; geometry: BufferGeometry } | null>(null);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const penRef = useRef<Mesh>(null);
  const solidRef = useRef<Mesh>(null);
  const fadeRef = useRef<Mesh>(null);
  useEffect(() => {
    let alive = true;
    let idle = 0;
    const later = (fn: () => void) =>
      (idle = typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 1000 }) : window.setTimeout(fn, 100));
    // Draw every mesh once into the chapter target, the real stack and the pen included, before the stack is
    // swapped in: their first on-screen frames would otherwise stall on program first use and the buffer upload.
    const warm = (geometry: BufferGeometry) => {
      const target = storyDirector.compileTarget as WebGLRenderTarget | null;
      const meshes = [solidRef.current, fadeRef.current, penRef.current];
      if (!target || meshes.some((m) => !m)) return;
      const [solid, fade] = meshes as Mesh[];
      const shown = meshes.map((m) => m!.visible);
      const prevGeometry = solid.geometry;
      const u = stackMats.uniforms;
      const standIn = u.uStandIn.value;
      solid.geometry = fade.geometry = geometry;
      meshes.forEach((m) => (m!.visible = true));
      u.uStandIn.value = 0;
      const prev = gl.getRenderTarget();
      gl.setRenderTarget(target);
      gl.render(scene, camera);
      gl.setRenderTarget(prev);
      u.uStandIn.value = standIn;
      solid.geometry = fade.geometry = prevGeometry;
      meshes.forEach((m, i) => (m!.visible = shown[i]));
    };
    void (captured ? Promise.resolve(captured) : part.sliceStack(count, FILL)).then((geometry) => {
      if (!alive) return;
      later(() => {
        if (!alive) return;
        warm(geometry);
        if (!captured) setLoaded({ count, geometry });
      });
    });
    return () => {
      alive = false;
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [part, count, captured, gl, scene, camera, stackMats]);
  const stack = captured ?? (loaded?.count === count ? loaded.geometry : null);

  const paths = useMemo(() => {
    const layer = toLayerPath(tps[0].xz, segmentClasses(tps[0].cls));
    const ghosts = tps.slice(1).flatMap((t) => outerRuns(t.xz, t.cls));
    const { geometry, back } = buildLineGeometry(layer, lineY, ghosts, 0.03, partQuality === 'low' ? 2 : 1);
    return { layer, geometry, back };
  }, [tps, lineY, partQuality]);
  useEffect(() => () => paths.geometry.dispose(), [paths]);

  useLayoutEffect(() => {
    const u = stackMats.uniforms;
    u.uStandIn.value = stack ? 0 : 1;
    u.uCount.value = count;
    u.uSpacing.value = spacing;
    u.uFanAngle.value = ((portrait ? FAN_DEG.portrait : FAN_DEG.landscape) * Math.PI) / 180;
    const group = Math.max(1, Math.round(count / CARDS));
    u.uGroup.value = group;
    u.uGap.value = (portrait ? 36 : 84) / (Math.ceil(count / group) - 1);
  }, [stackMats, stack, count, spacing, portrait]);

  useLayoutEffect(
    () => () => {
      camera.clearViewOffset();
      camera.up.set(0, 1, 0);
    },
    [camera],
  );

  const pen = useMemo(() => new Float32Array(2), []);
  const pose = useMemo(() => createPose(), []);
  const { index } = useChapter();

  useChapterFrame((state, _delta, prog) => {
    const cam = state.camera as PerspectiveCamera;
    const { p, raw } = prog;

    // camera: the shared handoff poses outside the pin, the storyboard keys inside it
    if (raw < 0) handoffPose('3-4', prog.enter, portrait, undefined, pose);
    else if (raw > 1) handoffPose('4-5', prog.exit, portrait, undefined, pose);
    else path.pose(raw, pose, portrait);
    poseCamera(cam, pose, { portrait });
    const t = pose.target;
    const d = Math.hypot(cam.position.x - t[0], cam.position.y - t[1], cam.position.z - t[2]);

    // slab stack
    const u = stackMats.uniforms;
    const ready = u.uStandIn.value < 0.5;
    const solid = ready && p < BEATS.lift[0];
    if (solidRef.current) solidRef.current.visible = solid;
    if (fadeRef.current) fadeRef.current.visible = !solid;
    u.uFan.value = ready ? fanAt(p) : 0;
    u.uLine.value = ready && p > BEATS.line[0] && p < BEATS.line[1] + 0.02 ? range(p, BEATS.line[0], BEATS.line[1]) * 1.12 - 0.04 : -1;
    u.uFlash.value = pulse(p, BEATS.flash[0], BEATS.flash[1]);
    u.uLift.value = range(p, BEATS.lift[0], BEATS.lift[1]);
    const h = storyDirector.handoff;
    const wiping = prog.enter < 1 && h.active && h.incoming === index && h.style === 'wipe';
    u.uSeam.value = wiping ? range(h.t, 0, 0.03) * (1 - range(h.t, 0.97, 1)) : 0;
    u.uSeamY.value = (1 - h.seam) * state.size.height * state.viewport.dpr;
    u.uSeamPx.value = state.viewport.dpr;

    // grid and toolpaths; across the exit handoff only layer 1 and the pen stay, so Ch5's bed can take over
    const leave = 1 - range(prog.exit, 0, 0.45);
    // slab 0, cut at layer 1's height, dissolves into its own toolpaths
    u.uFade.value = leave * (1 - 0.92 * range(p, BEATS.draw[0], BEATS.draw[0] + 0.1));
    gridMat.uniforms.uAlpha.value = range(p, 0.5, 0.64) * leave;
    const lu = lineMat.uniforms;
    lu.uWidth.value = (portrait ? 2 : 1.6) * state.viewport.dpr;
    lu.uRes.value.set(state.size.width * state.viewport.dpr, state.size.height * state.viewport.dpr);
    // a faint plan of the part behind layer 1 (eight contours that mostly coincide, so per line it is very faint)
    lu.uGhost.value = (0.1 * range(p, 0.6, 0.64) - 0.07 * range(p, 0.64, 0.7)) * leave;
    const L = paths.layer;
    const drawn = L.total * drawAt(p);
    const park = parkAt(p);
    lu.uDraw.value = p < BEATS.draw[0] ? -1 : drawn;
    lu.uPark.value = park * paths.back;
    lu.uHeadAmt.value = 1 - park;
    lu.uParkFade.value = 1 - range(p, 0.97, 1);
    // Across the crossfade the lines warm to the colour Ch5's nozzle glow gives the printed beads.
    lu.uTravelA.value = leave;
    lu.uWarm.value = 0.7 * range(prog.exit, 0.1, 0.7);
    signals.drawMM = sampleLayer(L, drawn, pen);
    if (park > 0) {
      pen[0] = lerpN(L.end[0], L.start[0], park);
      pen[1] = lerpN(L.end[1], L.start[1], park);
    }
    const gu = gridMat.uniforms;
    gu.uBedAmt.value = range(prog.exit, 0.05, 0.45);
    gu.uGlowPos.value.set(pen[0], lineY + 0.9, pen[1]);
    const penMesh = penRef.current;
    if (penMesh) {
      const show = range(p, BEATS.draw[0] - 0.005, BEATS.draw[0] + 0.02);
      penMesh.visible = show > 0;
      penMesh.position.set(pen[0], lineY + 0.5, pen[1]);
      penMesh.scale.setScalar(0.4 + 0.6 * show);
      penMat.opacity = show;
      penMat.color.lerpColors(PEN_HOT, PEN_NOZZLE, range(prog.exit, 0, 0.5));
    }
    signals.penWorld[0] = pen[0];
    signals.penWorld[1] = lineY + 0.5;
    signals.penWorld[2] = pen[1];
    signals.layer = 1;

    // post: snap flash bloom spike, DoF on slab 0 from 0.60
    fx.bloom.intensity = 1 + 0.8 * pulse(p, BEATS.flash[0], BEATS.flash[1]);
    const dof = range(p, BEATS.dof[0], BEATS.dof[1]);
    fx.dof.enabled = dof > 0 && quality !== 'low';
    fx.dof.bokehScale = 3 * dof;
    fx.dof.focusDistance = d;
    fx.dof.focusRange = 46;
  });

  return (
    <>
      <Studio />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} material={gridMat} renderOrder={0}>
        <planeGeometry args={[420, 420]} />
      </mesh>
      {/* both visible at mount so both programs compile; the frame loop shows one */}
      <mesh ref={solidRef} geometry={stack ?? part.optimized} material={stackMats.solid} renderOrder={1} dispose={null} />
      <mesh ref={fadeRef} geometry={stack ?? part.optimized} material={stackMats.fade} renderOrder={1} dispose={null} />
      <mesh geometry={paths.geometry} material={lineMat} renderOrder={2} frustumCulled={false} dispose={null} />
      <mesh ref={penRef} material={penMat} renderOrder={3}>
        <sphereGeometry args={[0.5, 20, 14]} />
      </mesh>
    </>
  );
}

function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
