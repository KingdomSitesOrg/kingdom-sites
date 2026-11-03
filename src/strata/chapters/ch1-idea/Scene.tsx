'use client';

import { use, useEffect, useMemo, useRef } from 'react';
import { Box3, Matrix4, PerspectiveCamera, PlaneGeometry, SphereGeometry, Vector3, type Mesh, type Points } from 'three';
import { preloadPart } from '@/strata/part';
import {
  ambientTime,
  createPose,
  hideBBox,
  poseCamera,
  range,
  storyDirector,
  useChapter,
  useChapterCamera,
  useChapterFrame,
  useChapterFx,
  useIsPortrait,
  usePartQuality,
  writeBBox,
} from '@/strata/story';
import { cloudBreath, cloudCount, cloudPointSize, preloadCloudSamples } from '@/strata/story/shared/cloud';
import { Studio } from '@/strata/story/shared/studio';
import { createFx } from '@/strata/story/fx';
import { BEATS, swarmQ } from './beats';
import { DOT_RADIUS, HALO_SCALE, createDotMaterial, createHaloMaterial } from './dot';
import { GRID_HALF, createGridMaterial } from './grid';
import { CLOUD_CENTER, D, poseAt } from './pose';
import { signals } from './signals';
import { countLanded, createSwarmGeometry, createSwarmMaterial, setStarts, setTargets } from './swarm';

const v = new Vector3();
const IDENTITY = new Matrix4();
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Screen radius (px) the dot shrinks to as it becomes the caret. */
const CARET_DOT_PX = 2.2;

export default function Scene() {
  const quality = usePartQuality();
  const portrait = useIsPortrait();
  const camera = useChapterCamera();
  const fx = useChapterFx();
  const { index, def } = useChapter();
  const baseFx = useMemo(() => createFx(def.fx), [def]);
  // Suspends until the worker has built the part: the chapter only counts as ready with its cloud.
  const part = use(preloadPart(quality));
  const count = cloudCount(quality);
  const samples = use(preloadCloudSamples(part, quality));

  const geometry = useMemo(() => createSwarmGeometry(count), [count]);
  const arrivals = useMemo(() => new Float32Array(count), [count]);
  const material = useMemo(() => createSwarmMaterial(), []);
  const dotGeometry = useMemo(() => new SphereGeometry(DOT_RADIUS, 32, 16), []);
  const haloGeometry = useMemo(() => new PlaneGeometry(2, 2), []);
  const dotMaterial = useMemo(() => createDotMaterial(), []);
  const haloMaterial = useMemo(() => createHaloMaterial(), []);
  const gridGeometry = useMemo(() => new PlaneGeometry(GRID_HALF * 2, GRID_HALF * 2).rotateX(-Math.PI / 2), []);
  const gridMaterial = useMemo(() => createGridMaterial(), []);
  const pose = useMemo(() => createPose(), []);
  const seamPose = useMemo(() => createPose(), []);
  const seamCam = useMemo(() => new PerspectiveCamera(), []);
  // Same box Ch2 frames with its brackets, so the lock-on carries across the crossfade.
  const box = useMemo(() => {
    if (!part.solid.boundingBox) part.solid.computeBoundingBox();
    return new Box3().copy(part.solid.boundingBox!);
  }, [part]);
  const layout = useRef({ version: -1, w: 0, h: 0, targets: 0 });
  const targetsVersion = useRef(0);

  useEffect(() => {
    setTargets(geometry, samples);
    targetsVersion.current++;
  }, [geometry, samples]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(
    () => () => {
      material.dispose();
      dotGeometry.dispose();
      haloGeometry.dispose();
      dotMaterial.dispose();
      haloMaterial.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
    },
    [material, dotGeometry, haloGeometry, dotMaterial, haloMaterial, gridGeometry, gridMaterial],
  );

  const points = useRef<Points>(null);
  const dot = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const grid = useRef<Mesh>(null);

  useChapterFrame((state, _delta, prog) => {
    poseCamera(camera, poseAt(prog.raw, prog.enter, prog.exit, portrait, pose), { portrait });
    camera.updateMatrixWorld();

    const { width: w, height: h } = state.size;
    const lay = layout.current;
    if (lay.version !== signals.layoutVersion || lay.w !== w || lay.h !== h || lay.targets !== targetsVersion.current) {
      lay.version = signals.layoutVersion;
      lay.w = w;
      lay.h = h;
      lay.targets = targetsVersion.current;
      setStarts(geometry, signals.ink, signals.textRect, w, h, arrivals);
    }

    const q = swarmQ(prog.p);
    const dpr = state.viewport.dpr;
    const u = material.uniforms;
    u.uQ.value = q;
    u.uTime.value = ambientTime(prog.raw);
    u.uSize.value = cloudPointSize(dpr);
    // The shared story clock, as Ch2 uses it: the cloud breathes in phase across the crossfade.
    u.uBreath.value = cloudBreath(prog.time);
    u.uInvProj.value.copy(camera.projectionMatrixInverse);
    u.uCamWorld.value.copy(camera.matrixWorld);
    u.uFocus.value = camera.position.distanceTo(v.set(CLOUD_CENTER[0], CLOUD_CENTER[1], CLOUD_CENTER[2]));
    u.uBokeh.value = 3.5 * dpr;
    // Drawn (all culled in the vertex shader) from 0.2, so the GPU pipeline is warm before the burst.
    if (points.current) points.current.visible = prog.p >= 0.2;
    signals.landed = q > 0 ? countLanded(arrivals, q) : 0;
    signals.samples = count;

    const floor = range(prog.p, 0.09, 0.2) * (1 - range(prog.p, 0.6, 0.82));
    gridMaterial.uniforms.uOpacity.value = floor;
    if (grid.current) grid.current.visible = floor > 0;

    updateDot(prog.raw, w, h);
    if (prog.p >= BEATS.bbox - 0.02) writeBBox(signals, box, IDENTITY, camera, state.size);
    else hideBBox(signals);

    // Depth of field lives in the particle shader: the renderer's depth-mixed focus would turn the gaps
    // between points into haze.
    fx.dof.enabled = false;
    // Over the first half of the exit handoff the grade settles onto Ch2's, so each side of the crossfade
    // is graded the same (the renderer blends the two by t anyway).
    const next = storyDirector.fx(index + 1);
    const settle = range(prog.exit, 0, 0.5);
    const k = settle * settle * (3 - 2 * settle);
    fx.exposure = baseFx.exposure + (next.exposure - baseFx.exposure) * k;
    fx.bloom.intensity = baseFx.bloom.intensity + (next.bloom.intensity - baseFx.bloom.intensity) * k;
    fx.bloom.threshold = baseFx.bloom.threshold + (next.bloom.threshold - baseFx.bloom.threshold) * k;
    fx.bloom.radius = baseFx.bloom.radius + (next.bloom.radius - baseFx.bloom.radius) * k;
    fx.grain = baseFx.grain + (next.grain - baseFx.grain) * k;
    fx.vignette = baseFx.vignette + (next.vignette - baseFx.vignette) * k;
    fx.ca = baseFx.ca + (next.ca - baseFx.ca) * k;
  });

  function updateDot(raw: number, w: number, h: number) {
    const d = dot.current;
    const g = halo.current;
    if (!d || !g) return;
    const show = raw < BEATS.dotEnd + 0.01;
    d.visible = show;
    g.visible = show;
    if (!show) return;
    const k = ease(range(raw, 0, BEATS.dotEnd - 0.005));
    v.set(D[0], D[1], D[2]).applyMatrix4(camera.matrixWorldInverse);
    const depth = Math.max(1, -v.z);
    if (raw > 0) {
      // A straight glide on screen from where the dot sat at the seam to the caret, at D's own depth.
      seamCam.aspect = camera.aspect;
      poseCamera(seamCam, poseAt(0, 1, 0, portrait, seamPose), { portrait });
      seamCam.updateMatrixWorld();
      v.set(D[0], D[1], D[2]).project(seamCam);
      const sx = v.x;
      const sy = v.y;
      v.set(D[0], D[1], D[2]).project(camera);
      const cx = (signals.caret[0] / w) * 2 - 1;
      const cy = 1 - (signals.caret[1] / h) * 2;
      v.x = sx + (cx - sx) * k;
      v.y = sy + (cy - sy) * k;
    } else {
      v.set(D[0], D[1], D[2]).project(camera);
    }
    v.unproject(camera);
    const focal = h / 2 / Math.tan((camera.fov * Math.PI) / 360);
    const natural = (DOT_RADIUS * focal) / depth;
    const px = Math.exp(Math.log(natural) + (Math.log(CARET_DOT_PX) - Math.log(natural)) * k);
    const r = (px * depth) / focal;
    d.position.copy(v);
    d.scale.setScalar(r / DOT_RADIUS);
    g.position.copy(v);
    const fade = 1 - range(raw, BEATS.dotEnd - 0.012, BEATS.dotEnd + 0.005);
    dotMaterial.opacity = fade;
    haloMaterial.uniforms.uSize.value = r * HALO_SCALE;
    haloMaterial.uniforms.uIntensity.value = fade;
  }

  return (
    <>
      <Studio accent="resin" />
      <mesh ref={grid} geometry={gridGeometry} material={gridMaterial} frustumCulled={false} />
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
      <mesh ref={dot} geometry={dotGeometry} material={dotMaterial} frustumCulled={false} renderOrder={1} />
      <mesh ref={halo} geometry={haloGeometry} material={haloMaterial} frustumCulled={false} renderOrder={2} />
    </>
  );
}
