'use client';

import { useEffect, useMemo } from 'react';
import { AdditiveBlending, DoubleSide, ShaderMaterial, Vector3, Vector4, type PerspectiveCamera } from 'three';
import {
  ambientTime,
  createPose,
  facts,
  handoffPose,
  isCapture,
  poseCamera,
  projectToScreen,
  range,
  storyDirector,
  useCameraPath,
  useChapterCamera,
  useChapterFrame,
  useChapterFx,
  useIsPortrait,
  usePartQuality,
  useQuality,
  type CameraKeyframe,
} from '@/strata/story';
import { WINDOW_PARAMS } from '@/strata/story/shared/cabinet';
import { HALL_TOP_LIGHT } from './body';
import { BEAT, getFleet, litAt, offThreshold, partsAt, flashesBefore, rippleFront } from './fleet';
import { buildFleetSet, disposeFleetSet } from './geometry';
import { cabinetFrag, cabinetVert, floorFrag, floorVert, poolFrag, poolVert, trayFrag, trayVert } from './shaders';
import { signals } from './signals';

// Camera keys (STORYBOARD Ch7, mm). t = 0 is handoffPose('6-7', 1); the key at -0.4 is H7's start so the
// spline leaves the handoff at its speed. Framing eases fx 0.50 -> 0.60 over 0-0.12. The aisle, crane and
// aerial keys are raised and tilted so windows read over the rows and the last lit window stays in frame.
const PATH: CameraKeyframe[] = [
  { t: -0.4, pos: [0, 120, 2900], target: [0, 50, 0], fov: 30, fx: 0.5 },
  { t: 0, pos: [0, 120, 3200], target: [0, 50, 0], fov: 30, fx: 0.5 },
  { t: 0.12, pos: [0, 160, 3700], target: [0, 50, 0], fov: 30 },
  { t: 0.4, pos: [-1800, 3400, 10500], target: [0, -900, -6000], fov: 32 },
  { t: 0.7, pos: [-6000, 13000, 24000], target: [0, -1100, -14000], fov: 36 },
  { t: 0.88, pos: [0, 24000, 30000], target: [0, -1100, -8000], fov: 40 },
  { t: 1, pos: [0, 21500, 26500], target: [0, -1100, -6400], fov: 40 },
  { t: 1.4, pos: [0, 20600, 25300], target: [0, -1100, -5900], fov: 40 },
];

const FOG = { high: 0.000022, medium: 0.000022, low: 0.00003 } as const;
const FOG_COL = [0.0021, 0.003, 0.006] as const;
const HAZE = [0.016, 0.0095, 0.0055] as const;
const HERO_LIGHT = [1.0, 0.58, 0.3] as const;
const T_TICK = 2.1;

function createMaterials() {
  const u = {
    uTime: { value: 0 },
    uP: { value: 0 },
    uRipple: { value: -0.05 },
    uOff: { value: 1.0001 },
    uGlow: { value: 0 },
    uFade: { value: 1 },
    uFlashId: { value: -1 },
    uFlashAge: { value: 10 },
    uHeroCol: { value: new Vector3(...WINDOW_PARAMS.color) },
    uHeroI: { value: WINDOW_PARAMS.intensity as number },
    uHeroHot: { value: new Vector3(...WINDOW_PARAMS.hot) },
    uHeroHotspot: { value: WINDOW_PARAMS.hotspot as number },
    uStoryTime: { value: 0 },
    uFogCol: { value: new Vector3(...FOG_COL) },
    uHaze: { value: new Vector3() },
    uFogDensity: { value: FOG.high as number },
    uHeroLightPos: { value: new Vector3(0, 60, 560) },
    uHeroLightCol: { value: new Vector3() },
    uHeroWin: { value: new Vector3() },
    uTopLight: { value: 0.6 },
    uHall: { value: 0 },
    uHallBox: { value: new Vector4() },
    uEdge: { value: 0 },
    uViewH: { value: 900 },
    uAgvSpan: { value: 50000 },
    uAgvCenter: { value: 0 },
    uTraySize: { value: new Vector3(50400, 90, 420) },
  };
  const cabinet = new ShaderMaterial({ name: 'Fleet.Cabinet', vertexShader: cabinetVert, fragmentShader: cabinetFrag, uniforms: u });
  const pool = new ShaderMaterial({
    name: 'Fleet.Pools',
    vertexShader: poolVert,
    fragmentShader: poolFrag,
    uniforms: u,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -8,
  });
  const floor = new ShaderMaterial({ name: 'Fleet.Floor', vertexShader: floorVert, fragmentShader: floorFrag, uniforms: u });
  const tray = new ShaderMaterial({ name: 'Fleet.Trays', vertexShader: trayVert, fragmentShader: trayFrag, uniforms: u });
  return { u, cabinet, pool, floor, tray };
}

function hash1(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Smooth value noise in -1..1 (for the [J] jitter). */
function noise1(t: number, seed: number) {
  const i = Math.floor(t);
  const f = t - i;
  const s = f * f * (3 - 2 * f);
  const a = hash1(i + seed * 131.7);
  return (a + (hash1(i + 1 + seed * 131.7) - a) * s) * 2 - 1;
}

const ease = (x: number) => x * x * (3 - 2 * x);

export default function Scene() {
  const quality = useQuality();
  const geometryQuality = usePartQuality();
  const portrait = useIsPortrait();
  const camera = useChapterCamera();
  const fx = useChapterFx();
  const path = useCameraPath(PATH);

  const set = useMemo(() => buildFleetSet(geometryQuality), [geometryQuality]);
  useEffect(() => () => disposeFleetSet(set), [set]);
  const mats = useMemo(() => createMaterials(), []);
  useEffect(
    () => () => {
      mats.cabinet.dispose();
      mats.pool.dispose();
      mats.floor.dispose();
      mats.tray.dispose();
    },
    [mats],
  );

  useEffect(() => {
    const u = mats.u;
    u.uHallBox.value.set(...set.hallBox);
    u.uAgvSpan.value = set.agvSpan;
    u.uAgvCenter.value = (set.hallBox[0] + set.hallBox[1]) / 2;
    u.uTraySize.value.x = set.agvSpan;
    u.uFogDensity.value = FOG[quality];
  }, [mats, set, quality]);

  const scratch = useMemo(() => ({ pose: createPose(), screen: { x: 0, y: 0, visible: false } }), []);

  useChapterFrame((state, _delta, prog) => {
    const cam = state.camera as PerspectiveCamera;
    const { pose, screen } = scratch;
    if (prog.raw < 0) poseCamera(cam, handoffPose('6-7', prog.enter, portrait, undefined, pose), { portrait });
    else path.apply(cam, prog.raw, { portrait });

    const u = mats.u;
    const p = prog.p;
    const capture = isCapture();
    const time = ambientTime(prog.raw);
    const fade = 1 - ease(range(prog.exit, 0, 0.5));
    const ripple = rippleFront(p);
    const lit = litAt(p);
    u.uTime.value = time;
    u.uStoryTime.value = prog.time;
    u.uP.value = p;
    u.uRipple.value = ripple;
    u.uOff.value = offThreshold(p);
    u.uGlow.value = range(p, -0.02, BEAT.glowEnd);
    u.uFade.value = fade;
    u.uEdge.value = ease(range(p, 0.45, 0.8));
    u.uViewH.value = state.size.height * state.gl.getPixelRatio();

    const heroLight = (1 - ease(range(p, BEAT.glowEnd, 0.2))) * fade;
    u.uHeroLightCol.value.set(HERO_LIGHT[0], HERO_LIGHT[1], HERO_LIGHT[2]).multiplyScalar(heroLight * 0.6);
    u.uHeroWin.value.copy(u.uHeroCol.value).multiplyScalar(WINDOW_PARAMS.intensity * heroLight * 0.45);
    const hall = (0.55 + 0.45 * range(ripple, 0, 1)) * (lit / getFleet().activeCount) * fade * range(p, 0, BEAT.glowEnd);
    u.uHall.value = hall;
    u.uTopLight.value = HALL_TOP_LIGHT * (0.2 + 0.8 * (lit / getFleet().activeCount)) * fade;
    u.uHaze.value.set(HAZE[0], HAZE[1], HAZE[2]).multiplyScalar(hall);

    const wall = storyDirector.time;
    if (!capture) {
      const tick = Math.floor(wall / T_TICK);
      const list = getFleet().activeList;
      u.uFlashId.value = list[(Math.imul(tick + 7, 2654435761) >>> 0) % list.length];
      u.uFlashAge.value = wall - tick * T_TICK;
    } else {
      u.uFlashId.value = -1;
    }

    fx.exposure = 0.95 * fade;

    signals.partsToday = partsAt(p) + (capture ? 0 : Math.floor(wall / T_TICK));
    signals.flashCount = flashesBefore(p);
    if (p < BEAT.offStart) {
      const j = capture ? 0 : Math.round(3 * noise1(wall * 2, 3) * (1 - range(p, BEAT.offStart - 0.03, BEAT.offStart)));
      signals.active = facts.fleet.active + j;
    } else {
      signals.active = lit;
    }
    projectToScreen(0, 60, 400, cam, screen);
    signals.heroX = screen.x * state.size.width;
    signals.heroY = screen.y * state.size.height;
    signals.heroLead = screen.visible ? range(p, 0.95, 0.985) * (1 - range(prog.exit, 0.2, 0.36)) : 0;
  });

  useEffect(() => {
    camera.updateProjectionMatrix();
  }, [camera]);

  return (
    <>
      <mesh geometry={set.floor} material={mats.floor} rotation-x={-Math.PI / 2} position-y={-1100} dispose={null} />
      <mesh geometry={set.hero} material={mats.cabinet} frustumCulled={false} dispose={null} />
      <mesh geometry={set.near} material={mats.cabinet} frustumCulled={false} dispose={null} />
      <mesh geometry={set.far} material={mats.cabinet} frustumCulled={false} dispose={null} />
      {set.trays && <mesh geometry={set.trays} material={mats.tray} frustumCulled={false} dispose={null} />}
      <mesh geometry={set.pools} material={mats.pool} frustumCulled={false} renderOrder={2} dispose={null} />
    </>
  );
}
