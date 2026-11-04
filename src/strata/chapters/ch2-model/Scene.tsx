'use client';

import { use, useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Box3, Color, Matrix4, Vector3, type DirectionalLight, type Mesh, type WebGLRenderTarget } from 'three';
import { preloadPart } from '@/strata/part';
import { linearRGB } from '@/strata/shaders/palette';
import {
  createPose,
  FRAMING,
  handoffPose,
  poseCamera,
  range,
  storyDirector,
  useCameraPath,
  useChapterCamera,
  useChapterFrame,
  useChapterFx,
  useChapterProgress,
  useIsPortrait,
  usePartQuality,
  writeAnchor,
  writeBBox,
  type CameraKeyframe,
} from '@/strata/story';
import { cloudBreath, cloudPointSize, cloudSamples } from '@/strata/story/shared/cloud';
import { Studio } from '@/strata/story/shared/studio';
import { buildModelGeometry, FRONT_ORIGIN } from './geometry';
import {
  CLAY_ENV,
  TITANIUM,
  createCloudMaterial,
  createLowPolyMaterial,
  createNodeMaterial,
  createSurfaceMaterial,
  createWireMaterial,
} from './materials';
import { signals } from './signals';
import { BEAT, beat, sine, stageAt } from './stages';

// STORYBOARD Ch2 camera; the first and last keys are handoffPose('1-2', 1) and handoffPose('2-3', 0).
const KEYS: CameraKeyframe[] = [
  { t: 0, pos: [-161, 80, 170], target: [0, 20, 0], fov: 28 },
  { t: 0.35, pos: [-60, 40, 230], target: [0, 20, 0], fov: 28 },
  { t: 0.65, pos: [90, 110, 200], target: [0, 18, 0], fov: 28 },
  { t: 1, pos: [190, 70, 150], target: [0, 20, 0], fov: 28 },
];

/** sine.inOut inside each key segment (STORYBOARD 3.6): the camera settles at every key. */
function easeKeys(raw: number) {
  for (let k = 0; k < KEYS.length - 1; k++) {
    const a = KEYS[k].t;
    const b = KEYS[k + 1].t;
    if (raw <= b || k === KEYS.length - 2) return a + (b - a) * sine((raw - a) / (b - a));
  }
  return raw;
}

/** While the copy is up: screen-x shift (desktop) and dolly-out factor, both exact at the two seams. */
const FRAMING_SHIFT = 0.06;
const DOLLY = 0.12;
/**
 * The key (the studio's one shadow light) sweeps 70 degrees about y from the camera side to a front-left
 * three-quarter, where the bracket's flat faces catch a satin gradient. Ch3 starts under this end pose:
 * [-150, 200, 200] aimed at [0, 21, 0], intensity 3, environment unrotated. It swells mid-sweep.
 */
const KEY_TARGET = [0, 21, 0] as const;
const KEY_END = [-150, 200, 200] as const;
const KEY_SHADOW = { position: KEY_END, intensity: 0 };
const KEY_REST = 3;
const SWEEP = (70 * Math.PI) / 180;
const VOID = new Color(...linearRGB('bg-0'));
const IDENTITY = new Matrix4();
const WARM_PX = 64;

export default function Scene() {
  const quality = usePartQuality();
  // Suspends until the shared part exists, so the slot compiles every stage's programs in one go.
  const part = use(preloadPart(quality));
  const camera = useChapterCamera();
  const fx = useChapterFx();
  const portrait = useIsPortrait();
  const scene = useThree((s) => s.scene);
  const path = useCameraPath(KEYS);

  const geo = useMemo(() => buildModelGeometry(part, quality, cloudSamples(part, quality)), [part, quality]);
  const mats = useMemo(() => {
    const r = geo.frontRadius;
    return {
      cloud: createCloudMaterial(r),
      nodes: createNodeMaterial(r),
      wire: createWireMaterial(r),
      low: createLowPolyMaterial(r),
      surface: createSurfaceMaterial(r),
    };
  }, [geo]);

  useEffect(() => {
    signals.stageCount.points = geo.counts.points;
    signals.stageCount.edges = geo.counts.edges;
    signals.stageCount.faces = geo.counts.faces;
    signals.stageCount.subdFaces = geo.counts.subdFaces;
    return () => {
      geo.dispose();
      for (const m of Object.values(mats)) m.dispose();
    };
  }, [geo, mats]);

  const cloudRef = useRef<Mesh>(null);
  const nodesRef = useRef<Mesh>(null);
  const wireRef = useRef<Mesh>(null);
  const lowRef = useRef<Mesh>(null);
  const surfaceRef = useRef<Mesh>(null);
  const keyRef = useRef<DirectionalLight>(null);
  const backdropRef = useRef<Mesh>(null);

  // compileAsync links every program at mount, but ANGLE still builds each pipeline on its first draw. Draw each
  // stage mesh that is not on screen yet once, shadow pass included, one mesh per idle callback, into a 64 px
  // corner of the chapter target, so the first scroll through the stages never stalls. The next frame clears it.
  const gl = useThree((s) => s.gl);
  const progress = useChapterProgress();
  useEffect(() => {
    let cancelled = false;
    let idle = 0;
    let step = 0;
    const later = (fn: () => void) => {
      idle = typeof requestIdleCallback === 'function' ? requestIdleCallback(fn) : window.setTimeout(fn, 100);
    };
    const warm = () => {
      const target = storyDirector.compileTarget as WebGLRenderTarget | null;
      const meshes = [cloudRef.current, nodesRef.current, wireRef.current, lowRef.current, surfaceRef.current];
      const surface = surfaceRef.current;
      if (cancelled || !target || !surface || step >= meshes.length) return;
      const mesh = meshes[step++];
      if (!mesh || (progress.current.visible && mesh.visible)) return later(warm);
      const shown = meshes.map((m) => m?.visible ?? false);
      const cast = surface.castShadow;
      const culled = mesh.frustumCulled;
      meshes.forEach((m) => m && (m.visible = m === mesh));
      surface.castShadow = mesh === surface;
      mesh.frustumCulled = false;
      const { viewport, scissor, scissorTest } = target;
      const vp = viewport.clone();
      const sc = scissor.clone();
      viewport.set(0, 0, WARM_PX, WARM_PX);
      scissor.set(0, 0, WARM_PX, WARM_PX);
      target.scissorTest = true;
      const prev = gl.getRenderTarget();
      gl.setRenderTarget(target);
      gl.render(scene, camera);
      viewport.copy(vp);
      scissor.copy(sc);
      target.scissorTest = scissorTest;
      gl.setRenderTarget(prev);
      meshes.forEach((m, i) => m && (m.visible = shown[i]));
      surface.castShadow = cast;
      mesh.frustumCulled = culled;
      later(warm);
    };
    void gl
      .compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) later(warm);
      });
    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [gl, scene, camera, mats, progress]);

  const scratch = useMemo(() => {
    const box = new Box3();
    if (!part.solid.boundingBox) part.solid.computeBoundingBox();
    box.copy(part.solid.boundingBox!);
    return { pose: createPose(), box, target: new Vector3(), dir: new Vector3() };
  }, [part]);

  useChapterFrame((state, _delta, prog) => {
    const { pose, box } = scratch;
    if (prog.enter < 1) handoffPose('1-2', prog.enter, portrait, undefined, pose);
    else if (prog.exit > 0) handoffPose('2-3', prog.exit, portrait, undefined, pose);
    else {
      path.pose(easeKeys(prog.raw), pose, portrait);
      // While the copy is up the subject eases right and back so part and brackets clear the copy column.
      const settle = sine(range(prog.raw, 0, 0.07)) - sine(range(prog.raw, 0.86, 1));
      pose.fx = FRAMING.fx + FRAMING_SHIFT * settle;
      const k = 1 + DOLLY * settle;
      for (let i = 0; i < 3; i++) pose.pos[i] = pose.target[i] + (pose.pos[i] - pose.target[i]) * k;
    }
    poseCamera(camera, pose, { portrait });
    const tgt = scratch.target.set(pose.target[0], pose.target[1], pose.target[2]);
    const d = camera.position.distanceTo(tgt);

    const p = prog.p;
    const t = prog.time;
    const dpr = state.viewport.dpr;

    // Stage uniforms: pure functions of p.
    const front = sine(beat(p, BEAT.wire)) * 1.06;
    const faceFront = beat(p, BEAT.faces) * 1.15;
    const refine = beat(p, BEAT.refine) * 1.25;
    const cu = mats.cloud.uniforms;
    cu.uSize.value = cloudPointSize(dpr);
    cu.uBreath.value = cloudBreath(t);
    cu.uFront.value = front;
    const out = 1 - sine(beat(p, BEAT.cloudOut));
    cu.uFade.value = (1 - 0.75 * sine(beat(p, BEAT.cloudDim))) * out;
    cu.uHead.value = out;

    const nu = mats.nodes.uniforms;
    nu.uSize.value = Math.min(2.6 * dpr, 5);
    nu.uFront.value = front;
    nu.uRefine.value = refine;
    nu.uFade.value = 1 - 0.6 * beat(p, [0.38, 0.5]);

    const wu = mats.wire.uniforms;
    wu.uFront.value = front;
    wu.uRefine.value = refine;
    wu.uEdge.value = 0.7 - 0.25 * beat(p, [0.36, 0.5]);
    wu.uConn.value = 0.5 * (1 - sine(beat(p, [0.33, 0.42])));
    wu.uCage.value = 0.35 * (1 - sine(beat(p, BEAT.cage)));
    wu.uTime.value = t;

    const lu = mats.low.uniforms;
    lu.uFaceFront.value = faceFront;
    lu.uRefine.value = refine;

    const su = mats.surface.uniforms;
    su.uRefine.value = refine;
    su.uWire.value = 0.6 * (1 - sine(beat(p, BEAT.wireOverlay)));
    su.uSmooth.value = sine(beat(p, BEAT.smooth));
    su.uMat.value = sine(beat(p, BEAT.material)) * 1.25;
    // A material's own envMapIntensity counts only when envMap is set; the studio puts it on scene.environment.
    mats.surface.envMap = state.scene.environment;
    mats.surface.envMapIntensity = CLAY_ENV + (TITANIUM.env - CLAY_ENV) * Math.min(1, su.uMat.value / 1.2);

    // Only stage meshes within reach of the current p are drawn.
    if (cloudRef.current) cloudRef.current.visible = p < 0.45;
    if (nodesRef.current) nodesRef.current.visible = p > 0.09 && p < 0.63;
    if (wireRef.current) wireRef.current.visible = p > 0.09 && p < 0.75;
    if (lowRef.current) lowRef.current.visible = p > 0.29 && p < 0.63;
    const surface = surfaceRef.current;
    if (surface) {
      surface.visible = p > 0.53;
      surface.castShadow = p > BEAT.refine[1];
    }

    // Key and environment sweep together; the band of light swells while it travels.
    const sweep = beat(p, BEAT.light);
    const a = SWEEP * (1 - sine(sweep));
    const key = keyRef.current;
    if (key) {
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const ox = KEY_END[0] - KEY_TARGET[0];
      const oz = KEY_END[2] - KEY_TARGET[2];
      key.position.set(KEY_TARGET[0] + ox * c + oz * sn, KEY_END[1], KEY_TARGET[2] - ox * sn + oz * c);
      key.intensity = (KEY_REST + 1.5 * Math.sin(Math.PI * sweep)) * beat(p, [0.34, 0.45]);
    }
    scene.environmentRotation.y = a;

    // Depth of field: rack from the near collar edge to the part centre, then open up before the handoff.
    // A backdrop in the void colour sits just behind the part inside the focus band, so the blurred frame
    // never bleeds the part's edges into the background as a halo.
    const dof = fx.dof;
    dof.enabled = p >= BEAT.rack[0];
    const vd = scratch.dir.copy(tgt).sub(camera.position).normalize();
    let back = 0;
    for (let i = 0; i < 8; i++) {
      const dx = (i & 1 ? box.max.x : box.min.x) - tgt.x;
      const dy = (i & 2 ? box.max.y : box.min.y) - tgt.y;
      const dz = (i & 4 ? box.max.z : box.min.z) - tgt.z;
      back = Math.max(back, dx * vd.x + dy * vd.y + dz * vd.z);
    }
    back += 4;
    dof.focusDistance = d - 30 * (1 - sine(beat(p, BEAT.rack)));
    dof.focusRange = 2 * back + 160 * sine(beat(p, BEAT.dofOpen));
    dof.bokehScale = 2;
    const bd = backdropRef.current;
    if (bd) {
      bd.visible = dof.enabled;
      bd.position.copy(camera.position).addScaledVector(vd, d + back);
      bd.quaternion.copy(camera.quaternion);
      const hh = 2.4 * (d + back) * Math.tan((camera.fov * Math.PI) / 360);
      bd.scale.set(hh * camera.aspect, hh, 1);
    }

    writeBBox(signals, box, IDENTITY, camera, state.size);
    writeAnchor(signals, 'collar', FRONT_ORIGIN, camera, state.size);
    signals.stage = stageAt(p);
  });

  return (
    <>
      <Studio ref={keyRef} accent="resin" shadow={KEY_SHADOW} />
      <points ref={cloudRef} geometry={geo.cloud} material={mats.cloud} dispose={null} renderOrder={3} />
      <points ref={nodesRef} geometry={geo.nodes} material={mats.nodes} dispose={null} renderOrder={4} visible={false} />
      <lineSegments ref={wireRef} geometry={geo.wire} material={mats.wire} dispose={null} renderOrder={2} visible={false} />
      <mesh ref={lowRef} geometry={geo.low} material={mats.low} dispose={null} visible={false} />
      <mesh
        ref={surfaceRef}
        geometry={geo.surface}
        material={mats.surface}
        dispose={null}
        receiveShadow
        visible={false}
      />
      <mesh ref={backdropRef} visible={false} frustumCulled={false}>
        <planeGeometry />
        <meshBasicMaterial color={VOID} />
      </mesh>
    </>
  );
}
