'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { Vector3, type DirectionalLight, type Group, type Mesh, type Points } from 'three';
import { preloadPart, type PartData } from '@/strata/part';
import {
  createPose,
  handoffPose,
  poseCamera,
  range,
  storyDirector,
  useCameraPath,
  useChapter,
  useChapterCamera,
  useChapterFrame,
  useChapterFx,
  useIsPortrait,
  usePartQuality,
  useQuality,
  writeAnchor,
  type CameraKeyframe,
} from '@/strata/story';
import { Studio } from '@/strata/story/shared/studio';
import { thresholdAt, thresholdTable } from './field';
import { buildDust, countBelow, derive, disposeDerived, maxStressPoint } from './geometry';
import { BOLTS, LOAD_POINT, LOAD_TAIL, buildLoadCase } from './loadCase';
import {
  INFILL_DEPTH,
  createDustMaterial,
  createInfillMaterial,
  createLoadCaseMaterial,
  createNoiseTexture,
  createOptimizedMaterial,
  createSolidMaterial,
  fieldUniforms,
  optimizedUniforms,
  TITANIUM_ENV,
} from './materials';
import { buildOrders, type OrderResult } from './order';
import { signals } from './signals';
import {
  CUT_CLEAR,
  INFILL_PIVOT,
  cutZ,
  dofBokeh,
  erosion,
  infillReveal,
  infillScale,
  infillTurn,
  loadDraw,
  loadFade,
  massAt,
  savedAt,
  sigmaAt,
  sineInOut,
  sliceGlow,
  stressAmount,
  stressFront,
} from './timeline';

// Camera keys (STORYBOARD Ch3), pos -> target, fov, in mm; sine.inOut per segment (easedT). The end keys are
// handoffPose('2-3', 1) and handoffPose('3-4', 0). Interior keys are art-directed from the storyboard's: 0.30 rises
// to a high three-quarter so the erosion peak is not hidden behind the collar; the stress and section views dolly
// out and frame further right (fx) so the part clears the copy column, each with a hold (<= 1.5 deg drift) for its
// still, and the section view swings toward A4 so the exit move stays gentle.
const KEYS: CameraKeyframe[] = [
  { t: 0, pos: [198, 70, 139], target: [0, 20, 0], fov: 28, fx: 0.6 },
  { t: 0.3, pos: [150, 158, 178], target: [-4, 16, 0], fov: 28, fx: 0.65 },
  { t: 0.57, pos: [146, 69, 244], target: [0, 20, 0], fov: 26, fx: 0.66 },
  { t: 0.68, pos: [151, 69, 241], target: [0, 20, 0], fov: 26, fx: 0.66 },
  { t: 0.79, pos: [113, 75, 233], target: [0, 20, 0], fov: 24, fx: 0.66 },
  { t: 0.88, pos: [120, 75, 230], target: [0, 20, 0], fov: 24, fx: 0.66 },
  { t: 1, pos: [150, 80, 190], target: [0, 20, 0], fov: 26, fx: 0.6 },
];
const KEY_T = KEYS.map((k) => k.t);

/**
 * The one shadow light (STORYBOARD 3.3). Ch3 opens under the pose where Ch2's key sweep ends (front-left,
 * intensity 3), so the crossfade lights one bracket, then eases to its own key over p 0-0.12.
 */
const KEY_FROM = { position: [-150, 200, 200], intensity: 3 } as const;
const KEY_TO = { position: [120, 260, 160], intensity: 1.2 } as const;
const KEY_LIGHT = { position: KEY_FROM.position, target: [0, 21, 0], intensity: KEY_FROM.intensity } as const;

const DUST = { high: 4000, medium: 1500, low: 0 } as const;
/** Storyboard triangle budget per tier (hard limit). */
const TRI_BUDGET = { high: 160000, medium: 120000, low: 80000 } as const;
const SAMPLES = 6000;
const BLOOM = 0.8;
const BLOOM_SECTION = 0.5;

const LOAD_TAIL_V = new Vector3(...LOAD_TAIL);

/** Raw progress remapped so each key segment eases in and out (sine.inOut). */
function easedT(raw: number) {
  if (raw <= 0 || raw >= 1) return raw;
  let i = 0;
  while (i < KEY_T.length - 2 && raw > KEY_T[i + 1]) i++;
  const a = KEY_T[i];
  const b = KEY_T[i + 1];
  return a + (b - a) * sineInOut((raw - a) / (b - a));
}

type Orders = { part: PartData; r: OrderResult };

export default function Scene() {
  const quality = useQuality();
  const partQuality = usePartQuality();
  const portrait = useIsPortrait();
  const camera = useChapterCamera();
  const fx = useChapterFx();
  const path = useCameraPath(KEYS);
  // Suspends until the bracket exists, so the chapter only counts as ready with the real geometry.
  const part = use(preloadPart(partQuality));
  const pose = useMemo(() => createPose(), []);
  const { index } = useChapter();
  const keyRef = useRef<DirectionalLight>(null);

  const noise = useMemo(() => createNoiseTexture(), []);
  useEffect(() => () => noise.dispose(), [noise]);
  const field = useMemo(() => fieldUniforms(noise, part.sdfTexture, part.sdfBox), [noise, part]);
  const optU = useMemo(() => optimizedUniforms(noise), [noise]);
  const mats = useMemo(() => {
    const erosionU = { uThr: { value: 100 }, uBand: { value: 1 } };
    return {
      erosion: erosionU,
      solid: createSolidMaterial(field, erosionU, false),
      solidErode: createSolidMaterial(field, erosionU, true),
      optimized: createOptimizedMaterial(optU, false),
      optimizedCut: createOptimizedMaterial(optU, true),
      infill: createInfillMaterial(field),
      load: createLoadCaseMaterial(),
      dust: createDustMaterial(field),
    };
  }, [field, optU]);
  useEffect(
    () => () => {
      for (const m of [mats.solid, mats.solidErode, mats.optimized, mats.optimizedCut, mats.infill, mats.load, mats.dust]) m.dispose();
    },
    [mats],
  );

  // Triangle orders come from a worker; until then the shared geometries draw whole.
  const [orders, setOrders] = useState<Orders | null>(null);
  useEffect(() => {
    let live = true;
    void buildOrders(part.optimized, part.infill).then((r) => live && setOrders({ part, r }));
    return () => {
      live = false;
    };
  }, [part]);
  const derived = useMemo(() => {
    if (!orders || orders.part !== part) return null;
    const { r } = orders;
    return {
      skin: derive(part.optimized, r.skin.index),
      skinVisible: r.skin.visible,
      cut: derive(part.optimized, r.opt.index),
      cutMinZ: r.opt.minZ,
      infill: derive(part.infill, r.infill.index),
      infillMinZ: r.infill.minZ,
    };
  }, [orders, part]);
  useEffect(
    () => () => {
      if (!derived) return;
      disposeDerived(derived.skin);
      disposeDerived(derived.cut);
      disposeDerived(derived.infill);
    },
    [derived],
  );

  const table = useMemo(() => thresholdTable(part.samples('solid', SAMPLES, 31)), [part]);
  const dust = useMemo(() => (DUST[partQuality] > 0 ? buildDust(part, DUST[partQuality]) : null), [part, partQuality]);
  useEffect(() => () => dust?.dispose(), [dust]);
  const loadGeo = useMemo(() => buildLoadCase(), []);
  useEffect(() => () => loadGeo.dispose(), [loadGeo]);
  const sigmaPoint = useMemo(() => new Vector3(...maxStressPoint(part)), [part]);

  useEffect(() => {
    let far = 0;
    for (const [bx, bz] of BOLTS) far = Math.max(far, Math.hypot(bx - LOAD_POINT[0], 4 - LOAD_POINT[1], bz - LOAD_POINT[2]));
    optU.uSpan.value = far;
    optU.uLoad.value.set(...LOAD_POINT);
  }, [optU]);

  const solidRef = useRef<Mesh>(null);
  const solidErodeRef = useRef<Mesh>(null);
  const optRef = useRef<Mesh>(null);
  const optCutRef = useRef<Mesh>(null);
  const infillGroup = useRef<Group>(null);
  const infillRef = useRef<Mesh>(null);
  const loadRef = useRef<Mesh>(null);
  const dustRef = useRef<Points>(null);

  useChapterFrame((state, _delta, prog) => {
    const { p, raw, enter, exit, time } = prog;
    if (enter < 1) poseCamera(camera, handoffPose('2-3', enter, portrait, undefined, pose), { portrait });
    else if (exit > 0) poseCamera(camera, handoffPose('3-4', exit, portrait, undefined, pose), { portrait });
    else path.apply(camera, easedT(raw), { portrait });
    camera.updateMatrixWorld();

    const key = keyRef.current;
    if (key) {
      const k = sineInOut(range(raw, 0, 0.12));
      const a = KEY_FROM.position;
      const b = KEY_TO.position;
      key.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
      key.intensity = KEY_FROM.intensity + (KEY_TO.intensity - KEY_FROM.intensity) * k;
    }

    signals.mass = massAt(p);
    signals.saved = savedAt(p);
    signals.sigma = sigmaAt(p);

    const q = erosion(p);
    const thr = thresholdAt(table, q);
    const solid = solidRef.current;
    const solidErode = solidErodeRef.current;
    if (solid && solidErode) {
      solid.visible = q <= 0;
      solidErode.visible = q > 0 && q < 1;
      mats.erosion.uThr.value = thr;
      mats.erosion.uBand.value = 1 - sineInOut(Math.min(1, Math.max(0, (q - 0.9) / 0.1)));
    }

    const cut = cutZ(p);
    const cutting = cut < CUT_CLEAR - 0.5;
    const optPlain = optRef.current;
    const optCut = optCutRef.current;
    let optTris = 0;
    if (optPlain && optCut) {
      optPlain.visible = q > 0 && !cutting;
      optCut.visible = q > 0 && cutting;
      optU.uCut.value = cut;
      optU.uCutOn.value = cutting ? 1 : 0;
      optU.uStress.value = stressAmount(p);
      // A material's own envMapIntensity counts only when envMap is set; the studio puts it on scene.environment.
      const env = state.scene.environment;
      mats.solid.envMap = mats.solidErode.envMap = mats.optimized.envMap = mats.optimizedCut.envMap = env;
      mats.optimized.envMapIntensity = mats.optimizedCut.envMapIntensity = TITANIUM_ENV - 0.5 * optU.uStress.value;
      optU.uFront.value = stressFront(p);
      optU.uGlint.value = p < 0.9 ? 1 : 0.3;
      const h = storyDirector.handoff;
      const wiping = exit > 0 && h.active && h.outgoing === index && h.style === 'wipe';
      const dpr = state.viewport.dpr;
      optU.uSlice.value = wiping ? sliceGlow(h.t) : 0;
      optU.uSliceY.value = (1 - h.seam) * state.size.height * dpr;
      optU.uSlicePx.value = dpr;
      if (derived) {
        // While the solid stands, the optimized triangles under its skin are hidden anyway: skip them.
        const skinTris = q < 1 ? derived.skinVisible : derived.cutMinZ.length;
        derived.skin.geometry.setDrawRange(0, skinTris * 3);
        const cutTris = countBelow(derived.cutMinZ, cut);
        derived.cut.geometry.setDrawRange(0, cutTris * 3);
        optTris = cutting ? cutTris : skinTris;
      }
    }

    const reveal = infillReveal(p);
    const ig = infillGroup.current;
    const im = infillRef.current;
    if (ig && im) {
      im.visible = reveal > 0;
      const turn = infillTurn(p);
      const s = infillScale(p);
      ig.rotation.y = turn;
      ig.scale.setScalar(s);
      mats.infill.uniforms.uReveal.value = reveal;
      mats.infill.uniforms.uCut.value = cut;
      if (derived) {
        // Only the slab the shader keeps (INFILL_DEPTH behind the plane), widened for the swing and capped so the
        // chapter stays inside its triangle budget (the deepest, faded sheets go first).
        const [px, , pz] = INFILL_PIVOT;
        const slack = (44 - px) * Math.abs(Math.tan(turn));
        const zc = s * Math.cos(turn);
        const end = countBelow(derived.infillMinZ, pz + (cut - pz) / zc + slack);
        const room = Math.max(0, TRI_BUDGET[quality] - optTris - 4000);
        const start = Math.max(countBelow(derived.infillMinZ, pz + (cut - INFILL_DEPTH - pz) / zc - slack - 1.5), end - room);
        derived.infill.geometry.setDrawRange(start * 3, Math.max(0, end - start) * 3);
      }
    }

    const load = loadRef.current;
    if (load) {
      const draw = loadDraw(p);
      const fade = loadFade(p);
      load.visible = draw > 0 && fade > 0;
      mats.load.uniforms.uDraw.value = draw;
      mats.load.uniforms.uFade.value = fade;
    }

    const dustPts = dustRef.current;
    if (dustPts) {
      dustPts.visible = q > 0 && q < 1;
      const u = mats.dust.uniforms;
      u.uThr.value = thr;
      u.uOn.value = dustPts.visible ? 1 : 0;
      u.uTime.value = time;
      u.uPixelRatio.value = state.viewport.dpr;
    }

    // Bloom eases down while the lattice section is on screen so its edges stay crisp.
    fx.bloom.intensity = BLOOM - (BLOOM - BLOOM_SECTION) * reveal;
    const bokeh = dofBokeh(p);
    fx.dof.enabled = bokeh > 0.01;
    if (fx.dof.enabled) {
      // Rack focus rides the section plane (STORYBOARD: cut plane -> core over 0.72-0.80).
      const e = camera.matrixWorld.elements;
      const cp = camera.position;
      fx.dof.focusDistance = Math.max(10, -((0 - cp.x) * e[8] + (20 - cp.y) * e[9] + (cut - cp.z) * e[10]));
      fx.dof.focusRange = 70;
      fx.dof.bokehScale = bokeh;
    }

    writeAnchor(signals, 'load', LOAD_TAIL_V, camera, state.size);
    writeAnchor(signals, 'sigma', sigmaPoint, camera, state.size);
  });

  const geoSkin = derived?.skin.geometry ?? part.optimized;
  const geoCut = derived?.cut.geometry ?? part.optimized;
  const geoInfill = derived?.infill.geometry ?? part.infill;
  const shadows = quality !== 'low';

  return (
    <>
      <Studio ref={keyRef} accent="resin" shadow={KEY_LIGHT} />
      <mesh ref={solidRef} geometry={part.solid} material={mats.solid} dispose={null} castShadow={shadows} receiveShadow={shadows} />
      <mesh ref={solidErodeRef} geometry={part.solid} material={mats.solidErode} dispose={null} />
      <mesh ref={optRef} geometry={geoSkin} material={mats.optimized} dispose={null} renderOrder={1} />
      <mesh ref={optCutRef} geometry={geoCut} material={mats.optimizedCut} dispose={null} renderOrder={1} />
      <group ref={infillGroup} position={INFILL_PIVOT}>
        <mesh
          ref={infillRef}
          geometry={geoInfill}
          material={mats.infill}
          position={[-INFILL_PIVOT[0], -INFILL_PIVOT[1], -INFILL_PIVOT[2]]}
          dispose={null}
        />
      </group>
      <mesh ref={loadRef} geometry={loadGeo} material={mats.load} dispose={null} renderOrder={2} />
      {dust && <points ref={dustRef} geometry={dust} material={mats.dust} dispose={null} renderOrder={3} />}
    </>
  );
}
