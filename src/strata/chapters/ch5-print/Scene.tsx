'use client';

import { use, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, MeshBasicMaterial, Object3D, type DirectionalLight, type Group, type InstancedMesh, type Mesh } from 'three';
import { buildLineGeometry, createLineMaterial, toLayerPath } from '../ch4-slice/lines';
import {
  ambientTime,
  clamp,
  facts,
  createCameraPath,
  createPose,
  handoffPose,
  isCapture,
  lerp,
  poseCamera,
  projectToScreen,
  range,
  useChapterCamera,
  useChapterFrame,
  useChapterFx,
  useIsPortrait,
  usePartQuality,
  useQuality,
  writeAnchor,
  type CameraKeyframe,
  type CameraPath,
  type Quality,
} from '@/strata/story';
import { latestPart, preloadPart } from '@/strata/part';
import { linearRGB } from '@/strata/shaders/palette';
import { createGrowthGeometry, createGrowthMaterials, warmGrowthOrder } from './growth';
import { PrinterStudio } from './lighting';
import { createPrinterMaterials, disposePrinterMaterials } from './materials';
import { getSupportContacts, loadMotion } from './paths';
import { getSupports } from './supports';
import { disposePrinter, getPrinter, CHAIN, FRAME, type MatKey } from './printer';
import { peiData } from './pei';
import { signals } from './signals';
import { anchorWeight, heatAt, layerAt, layerNumber, LAYER_MM, parkAt, sineInOut, timeLeftAt } from './timeline';
import { createTrail } from './trail';

const NOZZLE_C = facts.fdmProof.nozzleC;
const REPS: Record<Quality, number> = { high: 32, medium: 16, low: 8 };
const TRAIL_MAX: Record<Quality, number> = { high: 900, medium: 600, low: 400 };
const SHADOW_MAP: Record<Quality, number> = { high: 1024, medium: 512, low: 0 };

const MACRO_OFF: [number, number, number] = [34, 12, 44];
const MACRO_FOV = 18;
const MACRO_R = Math.hypot(MACRO_OFF[0], MACRO_OFF[1], MACRO_OFF[2]);
const MACRO_EL = Math.asin(MACRO_OFF[1] / MACRO_R);
const MACRO_YAW = Math.atan2(MACRO_OFF[0], MACRO_OFF[2]);
const HOLD_END = { pos: [0, 157, 23.6] as const, fov: 29.6 };
const LATE_KEYS: CameraKeyframe[] = [
  { t: 0.45, pos: [140, 36, 186], target: [0, -12, 0], fov: 26 },
  { t: 0.7, pos: [-210, -10, 170], target: [0, -20, 0], fov: 28 },
  { t: 0.86, pos: [-70, 44, 540], target: [0, -14, 0], fov: 27 },
  { t: 1.0, pos: [0, 420, 1125], target: [0, 209, 0], fov: 30 },
  { t: 1.25, pos: [0, 470, 1350], target: [0, 221, 0], fov: 30 },
];

/** Desktop screen-x of the target: 0.60 at the handoff, left of the copy column for the descent, centred once the copy is gone, left again when it returns. */
function fxAt(p: number) {
  if (p < 0.13) return lerp(0.6, 0.42, sineInOut(range(p, 0.05, 0.12)));
  if (p < 0.5) return lerp(0.42, 0.5, sineInOut(range(p, 0.15, 0.24)));
  return lerp(0.5, 0.37, sineInOut(range(p, 0.78, 0.9)));
}

const LIGHT_DIR = { x: -0.42, y: 0.78, z: 0.46 };

// The chunk is prefetched two chapters ahead: build the machine, the bed maps, the supports and the growth order
// on idle then, so the mount at one chapter ahead only uploads.
if (typeof window !== 'undefined') {
  const warm = () => {
    getPrinter();
    peiData();
    getSupports(getSupportContacts());
    const part = latestPart();
    if (part) warmGrowthOrder(part.optimized);
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(warm, { timeout: 3000 });
  else window.setTimeout(warm, 200);
}

/** Linear molten-hot: the colour the nozzle throws on the bed and the fresh layer. */
const GLOW = linearRGB('molten-hot');
const HEATER = linearRGB('molten');
/** Ch4's pen point (ch4-slice/Scene.tsx): white-hot, cooling to molten-hot across the crossfade as the nozzle takes its place. */
const PEN_HOT = new Color(9, 7.6, 6.2);
const PEN_NOZZLE = new Color(...linearRGB('molten-hot')).multiplyScalar(3);
const HEATER_HOT = linearRGB('molten-core');

export default function Scene() {
  const quality = useQuality();
  const partQuality = usePartQuality();
  const portrait = useIsPortrait();
  const camera = useChapterCamera();
  const fx = useChapterFx();
  // Suspends until the bracket and its toolpaths exist, so the chapter is only ready once the nozzle has a path.
  const part = use(preloadPart(partQuality));
  const motion = use(loadMotion(part, REPS[partQuality]));

  const geo = useMemo(() => getPrinter(), []);
  useEffect(() => () => disposePrinter(geo), [geo]);
  const mats = useMemo(() => createPrinterMaterials(), []);
  useEffect(() => () => disposePrinterMaterials(mats), [mats]);
  const growth = useMemo(
    () => createGrowthMaterials(part.sdfGLSL, { pos: mats.uniforms.glowPos, color: mats.uniforms.glowColor }),
    [part, mats],
  );
  useEffect(
    () => () => {
      growth.front.dispose();
      growth.back.dispose();
      growth.depth.dispose();
    },
    [growth],
  );
  const body = useMemo(() => createGrowthGeometry(part.optimized), [part]);
  const supports = useMemo(() => getSupports(getSupportContacts()), []);
  useEffect(() => () => supports?.dispose(), [supports]);
  useEffect(() => () => body.geometry.dispose(), [body]);
  // Ch4's layer-1 lines, drawn with Ch4's own material: across the crossfade both chapters show the same lines,
  // then they resolve into the printed beads (p 0-0.06).
  const lines = useMemo(() => {
    const tp = motion.layer1;
    return buildLineGeometry(toLayerPath(tp.xz, tp.cls.subarray(1)), 0.02, [], 0, partQuality === 'low' ? 2 : 1);
  }, [motion, partQuality]);
  useEffect(() => () => lines.geometry.dispose(), [lines]);
  const lineMat = useMemo(() => createLineMaterial(), []);
  useEffect(() => () => lineMat.dispose(), [lineMat]);
  const linesRef = useRef<Mesh>(null);
  const penMat = useMemo(() => new MeshBasicMaterial({ color: PEN_NOZZLE.clone(), transparent: true }), []);
  useEffect(() => () => penMat.dispose(), [penMat]);
  const penRef = useRef<Mesh>(null);
  const trail = useMemo(() => createTrail(TRAIL_MAX[partQuality]), [partQuality]);
  useEffect(() => () => trail.dispose(), [trail]);

  const world = useMemo<CameraPath>(() => {
    const a = { x: 0, z: 0 };
    motion.anchorAt(0.25, a);
    return createCameraPath([
      { t: 0.25, pos: [a.x + MACRO_OFF[0], MACRO_OFF[1], a.z + MACRO_OFF[2]], target: [a.x, -1, a.z], fov: MACRO_FOV },
      ...LATE_KEYS,
    ]);
  }, [motion]);

  const gantry = useRef<Group>(null);
  const toolhead = useRef<Group>(null);
  const bed = useRef<Group>(null);
  const chain = useRef<InstancedMesh>(null);
  const capMesh = useRef<Mesh>(null);
  const light = useRef<DirectionalLight>(null);
  const lightTarget = useMemo(() => new Object3D(), []);
  const shadowSize = SHADOW_MAP[quality];

  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target = lightTarget;
    l.shadow.autoUpdate = false;
    l.shadow.needsUpdate = true;
  }, [lightTarget, shadowSize]);

  useLayoutEffect(
    () => () => {
      camera.clearViewOffset();
    },
    [camera],
  );

  const state = useMemo(
    () => ({
      tip: { x: motion.start[0], y: 0, z: motion.start[1] },
      anchor: { x: 0, z: 0 },
      pose: createPose(),
      sample: new Float32Array(7),
      screen: { x: 0, y: 0, visible: false },
      ambient: 0,
      frame: 0,
      shadowRaw: Number.NaN,
    }),
    [motion],
  );

  useChapterFrame((r3f, _delta, prog) => {
    const { p, raw } = prog;
    const s = state;
    const CAPTURE = isCapture();
    s.frame++;

    // ----- story state (pure in p) -----
    const L = layerAt(p);
    const layer = layerNumber(p);
    const uZ = layer * LAYER_MM;
    motion.tipAt(p, s.tip);
    const tip = s.tip;
    bed.current?.position.set(0, -uZ, 0);
    gantry.current?.position.set(0, 0, tip.z);
    toolhead.current?.position.set(tip.x, tip.y, 0);
    growth.uniforms.uClip.value = uZ;
    body.setClip(uZ);
    if (capMesh.current) capMesh.current.visible = uZ < 41.95;
    growth.uniforms.uBedY.value = -uZ;
    growth.uniforms.uHeat.value = heatAt(p);
    growth.uniforms.uDetail.value = quality === 'low' ? 0 : 1;
    growth.uniforms.uBeadIn.value = raw < 0 ? 0 : sineInOut(range(p, 0.004, 0.05));
    const lm = linesRef.current;
    if (lm) {
      // Ch4's exit values (ch4-slice/Scene.tsx) at the same crossfade t, held at their end state once Ch5 owns the frame
      const e = prog.enter;
      const alpha = 1 - sineInOut(range(p, 0.02, 0.06));
      lm.visible = alpha > 0;
      const lu = lineMat.uniforms;
      lu.uWidth.value = (portrait ? 2 : 1.6) * r3f.viewport.dpr;
      lu.uRes.value.set(r3f.size.width * r3f.viewport.dpr, r3f.size.height * r3f.viewport.dpr);
      lu.uDraw.value = 1e6;
      lu.uPark.value = 0;
      lu.uHeadAmt.value = 0;
      lu.uParkFade.value = 0;
      lu.uTravelA.value = 1 - range(e, 0, 0.45);
      lu.uWarm.value = 0.7 * range(e, 0.1, 0.7);
      lu.uAlpha.value = alpha;
    }
    const pen = penRef.current;
    if (pen) {
      const show = 1 - range(p, 0.01, 0.04);
      pen.visible = show > 0;
      pen.position.set(motion.start[0], 0.85, motion.start[1]);
      penMat.opacity = show;
      penMat.color.lerpColors(PEN_HOT, PEN_NOZZLE, range(prog.enter, 0, 0.5));
    }
    const count = motion.trailAt(p, trail.pieces, trail.max);
    trail.update(count, uZ - 0.012);

    // ----- ambient life (time only; frozen once the exit wipe is half way) -----
    if (prog.exit < 0.5) s.ambient = ambientTime(raw);
    const u = mats.uniforms;
    u.fan.value.x = s.ambient * 31;
    u.fan.value.y = 0.34;
    u.belt.value.set(tip.x + tip.z, tip.x - tip.z, tip.x + tip.z, tip.z - tip.x);
    u.tipHeat.value = 1 - 0.35 * parkAt(p);
    u.reveal.value = p < 0.1 ? 0.8 + 26 * sineInOut(range(p, 0.015, 0.05)) + 300 * sineInOut(range(p, 0.05, 0.1)) : 1e4;
    u.dim.value = 0.3 + 0.7 * sineInOut(range(p, 0, 0.08));

    // cable chain: lower run on the beam from the fixed end, U bend, upper run back to the toolhead
    const ch = chain.current;
    if (ch) {
      const r = CHAIN.radius;
      const total = CHAIN.links * CHAIN.pitch;
      const xb = (total - Math.PI * r + CHAIN.fixedX + tip.x) / 2;
      const a = xb - CHAIN.fixedX;
      const m = ch.instanceMatrix.array as Float32Array;
      for (let i = 0; i < CHAIN.links; i++) {
        const d = (i + 0.5) * CHAIN.pitch;
        let x: number, y: number, th: number;
        if (d < a) {
          x = CHAIN.fixedX + d;
          y = CHAIN.y;
          th = 0;
        } else if (d < a + Math.PI * r) {
          th = (d - a) / r;
          x = xb + r * Math.sin(th);
          y = CHAIN.y + r - r * Math.cos(th);
        } else {
          x = xb - (d - a - Math.PI * r);
          y = CHAIN.y + 2 * r;
          th = Math.PI;
        }
        const c = Math.cos(th),
          sn = Math.sin(th);
        const e = i * 16;
        m[e] = c;
        m[e + 1] = sn;
        m[e + 2] = 0;
        m[e + 3] = 0;
        m[e + 4] = -sn;
        m[e + 5] = c;
        m[e + 6] = 0;
        m[e + 7] = 0;
        m[e + 8] = 0;
        m[e + 9] = 0;
        m[e + 10] = 1;
        m[e + 11] = 0;
        m[e + 12] = x;
        m[e + 13] = y;
        m[e + 14] = CHAIN.z;
        m[e + 15] = 1;
      }
      ch.instanceMatrix.needsUpdate = true;
    }
    // filament tube from the toolhead top to the rear top rail
    const tb = u.tube;
    tb[0].value.set(tip.x, 88 + tip.y, tip.z + 4);
    tb[1].value.set(tip.x, 200 + tip.y, tip.z + 10);
    tb[2].value.set(tip.x * 0.4, 260, -150);
    tb[3].value.set(0, FRAME.top + 2, -FRAME.half);

    // ----- camera -----
    const pose = s.pose;
    if (prog.enter < 1) {
      handoffPose('4-5', prog.enter, portrait, undefined, pose);
    } else {
      const w = anchorWeight(p);
      if (raw < 0.25) {
        const k = sineInOut(raw / 0.06);
        pose.pos[0] = 0;
        pose.pos[1] = lerp(160, HOLD_END.pos[1], k);
        pose.pos[2] = lerp(24, HOLD_END.pos[2], k);
        pose.target[0] = 0;
        pose.target[1] = 0;
        pose.target[2] = 0;
        pose.fov = lerp(30, HOLD_END.fov, k);
      } else {
        world.sample(raw, s.sample);
        pose.pos[0] = s.sample[0];
        pose.pos[1] = s.sample[1];
        pose.pos[2] = s.sample[2];
        pose.target[0] = s.sample[3];
        pose.target[1] = s.sample[4];
        pose.target[2] = s.sample[5];
        pose.fov = s.sample[6];
      }
      if (w > 0) {
        motion.anchorAt(p, s.anchor);
        const ax = s.anchor.x,
          az = s.anchor.z;
        if (raw < 0.25) {
          // the descent swings down an arc in front of the hotend, looking at the nozzle, never through the toolhead
          const bx = pose.pos[0] - ax,
            by = pose.pos[1],
            bz = pose.pos[2] - az;
          const r0 = Math.hypot(bx, by, bz);
          const r = lerp(r0, MACRO_R, w) + 45 * Math.sin(Math.PI * w);
          const el = lerp(Math.asin(by / r0), MACRO_EL, w);
          const yaw = lerp(Math.atan2(bx, bz), MACRO_YAW, w);
          pose.pos[0] = ax + r * Math.cos(el) * Math.sin(yaw);
          pose.pos[1] = r * Math.sin(el);
          pose.pos[2] = az + r * Math.cos(el) * Math.cos(yaw);
          const wt = sineInOut(range(p, 0.06, 0.1));
          pose.target[0] = lerp(pose.target[0], ax, wt);
          pose.target[1] = lerp(pose.target[1], -1, wt);
          pose.target[2] = lerp(pose.target[2], az, wt);
        } else {
          pose.pos[0] = lerp(pose.pos[0], ax + MACRO_OFF[0], w);
          pose.pos[1] = lerp(pose.pos[1], MACRO_OFF[1], w);
          pose.pos[2] = lerp(pose.pos[2], az + MACRO_OFF[2], w);
          pose.target[0] = lerp(pose.target[0], ax, w);
          pose.target[1] = lerp(pose.target[1], -1, w);
          pose.target[2] = lerp(pose.target[2], az, w);
        }
        pose.fov = lerp(pose.fov, MACRO_FOV, w);
      }
      pose.fx = fxAt(p);
      pose.up[0] = 0;
      pose.up[1] = 1;
      pose.up[2] = 0;
    }
    const cam = camera;
    poseCamera(cam, pose, { portrait });
    const dist = Math.hypot(pose.pos[0] - pose.target[0], pose.pos[1] - pose.target[1], pose.pos[2] - pose.target[2]);

    // ----- fx: DoF windows, CA in the macro, heat shimmer above the tip -----
    const tipDist = Math.hypot(cam.position.x - tip.x, cam.position.y - tip.y, cam.position.z - tip.z);
    const partDist = Math.hypot(cam.position.x, cam.position.y + uZ * 0.5, cam.position.z);
    const dof = fx.dof;
    if (p >= 0.06 && p < 0.5) {
      dof.enabled = true;
      const toPart = sineInOut(range(p, 0.3, 0.4));
      dof.focusDistance = lerp(tipDist, partDist, toPart);
      dof.focusRange = lerp(16, 90, toPart);
      dof.bokehScale =
        p < 0.3 ? lerp(0, 6, range(p, 0.11, 0.15)) : lerp(6, 3, range(p, 0.3, 0.45)) * (1 - range(p, 0.45, 0.5));
    } else if (p >= 0.7 && p < 0.82) {
      dof.enabled = true;
      const rack = sineInOut(range(p, 0.7, 0.8));
      dof.focusDistance = lerp(dist - 120, partDist, rack);
      dof.focusRange = 60;
      dof.bokehScale = 2.5 * range(p, 0.7, 0.72) * (1 - range(p, 0.8, 0.82));
    } else {
      dof.enabled = false;
      dof.bokehScale = 0;
    }
    fx.ca = 0.06 * range(p, 0.06, 0.09) * (1 - range(p, 0.22, 0.25));
    projectToScreen(tip.x, tip.y + 4, tip.z, cam, s.screen);
    const spot = fx.haze[0];
    if (spot) {
      const close = 1 - range(tipDist, 70, 320);
      spot.x = s.screen.x;
      spot.y = s.screen.y;
      spot.radius = lerp(0.015, 0.08, close);
      spot.strength = s.screen.visible && p > 0.03 ? lerp(0.15, 0.5, close) * (1 - parkAt(p)) : 0;
    }

    // ----- lights: the key's shadow frustum follows the shot; the nozzle glow lights the fresh bead -----
    const l = light.current;
    // the shadow (and the frustum fitted to the shot) only changes with p: refresh on a cadence while it moves, so a
    // stale map is never read through a newer frustum, and never at rest
    const macro = anchorWeight(p);
    if (l && raw !== s.shadowRaw && (CAPTURE || shadowSize === 0 || macro > 0.5 || s.frame % (p < 0.3 ? 3 : 4) === 0)) {
      s.shadowRaw = raw;
      // the macro gets a tight frustum (finer texels on the bed around the nozzle), the wide shots the whole machine
      const ext = clamp(dist * 1.5, lerp(90, 60, macro), 460);
      const cx = lerp(pose.target[0], 0, range(dist, 80, 500));
      const cy = pose.target[1];
      const cz = lerp(pose.target[2], 0, range(dist, 80, 500));
      lightTarget.position.set(cx, cy, cz);
      lightTarget.updateMatrixWorld();
      l.position.set(cx + LIGHT_DIR.x * 1600, cy + LIGHT_DIR.y * 1600, cz + LIGHT_DIR.z * 1600);
      const sc = l.shadow.camera;
      if (sc.right !== ext) {
        sc.left = -ext;
        sc.right = ext;
        sc.top = ext;
        sc.bottom = -ext;
        sc.updateProjectionMatrix();
      }
      if (shadowSize > 0) l.shadow.needsUpdate = true;
    }
    if (l) {
      l.intensity = (0.95 + 0.6 * sineInOut(range(p, 0.84, 0.96))) * sineInOut(range(p, 0.02, 0.12));
    }
    // 5 -> 6: the heater line sits along the bottom of frame at exit 0 and flares white-hot as the seam is born from it.
    const flare = sineInOut(range(raw, 0.97, 1.012));
    const hk = 2 * (1 - flare);
    const hc = 9 * flare;
    mats.heater.color.setRGB(
      HEATER[0] * hk + HEATER_HOT[0] * hc,
      HEATER[1] * hk + HEATER_HOT[1] * hc,
      HEATER[2] * hk + HEATER_HOT[2] * hc,
    );
    u.glowPos.value.set(tip.x, tip.y + 0.4, tip.z);
    // Ch4's bed glow under the pen is half as bright again as this one through the dimmed bed: match it across the crossfade
    const gk = 14 * (1 - 0.65 * parkAt(p)) * (1 + 0.5 * (1 - range(p, 0, 0.08)));
    u.glowColor.value.set(GLOW[0] * gk, GLOW[1] * gk, GLOW[2] * gk);

    // ----- signals for the HUD -----
    signals.L = L;
    signals.layer = layer;
    signals.uZ = uZ;
    signals.remaining = timeLeftAt(p);
    // [J] 270 +- 0.4 at about 2 Hz, off under capture
    const tj = s.ambient;
    signals.temp = CAPTURE ? NOZZLE_C : NOZZLE_C + Math.sin(tj * 12.6) * 0.26 + Math.sin(tj * 7.1 + 1.7) * 0.14;
    writeAnchor(signals, 'tip', tip, cam, r3f.size);
    signals.plotX = (tip.x + 46) / 92;
    signals.plotY = (tip.z + 22) / 44;
    signals.layerPathId = motion.plotIndexAt(p);
  });

  const static_ = Object.entries(geo.frame) as [MatKey, (typeof geo.frame)[MatKey]][];
  const castFrame: MatKey[] = ['black'];
  const castGantry: MatKey[] = ['alu', 'black'];
  const castTool: MatKey[] = ['alu', 'black', 'sock'];
  const castBed: MatKey[] = ['alu', 'black'];

  return (
    <>
      <PrinterStudio />
      <directionalLight
        ref={light}
        color="#F4F1EC"
        intensity={1.5}
        castShadow={shadowSize > 0}
        shadow-mapSize={[Math.max(1, shadowSize), Math.max(1, shadowSize)]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.8}
        shadow-camera-near={1}
        shadow-camera-far={3600}
      />
      <primitive object={lightTarget} />
      <mesh position={[0, 380, -1250]} material={mats.backdrop}>
        <planeGeometry args={[6000, 3000]} />
      </mesh>

      {static_.map(([k, g]) => (
        <mesh key={k} geometry={g} material={mats[k]} castShadow={castFrame.includes(k)} />
      ))}
      <mesh geometry={geo.tube} material={mats.tube} frustumCulled={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FRAME.bottom - 11, 0]} material={mats.floor} receiveShadow>
        <circleGeometry args={[1700, 64]} />
      </mesh>

      <group ref={gantry}>
        {(Object.entries(geo.gantry) as [MatKey, (typeof geo.gantry)[MatKey]][]).map(([k, g]) => (
          <mesh key={k} geometry={g} material={mats[k]} castShadow={castGantry.includes(k)} />
        ))}
        <instancedMesh ref={chain} args={[geo.link, mats.link, CHAIN.links]} frustumCulled={false} />
        <group ref={toolhead}>
          {(Object.entries(geo.toolhead) as [MatKey, (typeof geo.toolhead)[MatKey]][]).map(([k, g]) => (
            <mesh key={k} geometry={g} material={mats[k]} castShadow={castTool.includes(k)} />
          ))}
        </group>
      </group>

      <group ref={bed}>
        {(Object.entries(geo.bed) as [MatKey, (typeof geo.bed)[MatKey]][]).map(([k, g]) => (
          <mesh
            key={k}
            geometry={g}
            material={mats[k]}
            castShadow={castBed.includes(k)}
            receiveShadow={k === 'pei' || k === 'alu'}
          />
        ))}
        <mesh
          geometry={body.geometry}
          material={growth.front}
          customDepthMaterial={growth.depth}
          castShadow
          receiveShadow
        />
        <mesh ref={capMesh} geometry={body.geometry} material={growth.back} renderOrder={1} />
        {/* never drawn: puts the clipped shadow-depth program in the slot's compileAsync, so the first shadow pass
            finds it linked instead of linking it synchronously */}
        <mesh geometry={body.geometry} material={growth.depth} visible={false} />
        {supports && <mesh geometry={supports} material={growth.front} customDepthMaterial={growth.depth} castShadow receiveShadow />}
        <primitive object={trail.mesh} />
      </group>
      <mesh ref={linesRef} geometry={lines.geometry} material={lineMat} renderOrder={2} frustumCulled={false} />
      <mesh ref={penRef} material={penMat} renderOrder={3}>
        <sphereGeometry args={[0.5, 20, 14]} />
      </mesh>
    </>
  );
}
