'use client';

import { use, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Box3, Vector3, type Group, type Mesh } from 'three';
import { COLLAR, preloadPart } from '@/strata/part';
import {
  hideAnchor,
  hideBBox,
  isCapture,
  partStore,
  range,
  useCameraPath,
  useChapterFrame,
  useChapterFx,
  usePartQuality,
  useQuality,
  writeAnchor,
  writeBBox,
  type CameraKeyframe,
} from '@/strata/story';
import { Studio } from '@/strata/story/shared/studio';
import { shownOf, swapAt, type SwapState } from './choice';
import { ContactShadow } from './ContactShadow';
import { createInfillMaterial, createPartMaterials, createStudioUniforms, createTurntableMaterial } from './materials';
import { signals } from './signals';
import { createCycloramaGeometry, createCycloramaMaterial, createTurntableGeometry, TURNTABLE_TOP } from './stage';

/** Desktop screen-x of the part (STORYBOARD Ch8: the part settles at about 62 %). */
const FX = 0.62;

// Camera keys (STORYBOARD Ch8), mm. The -0.5 key holds the camera near K0 through the darkness cut.
const PATH: CameraKeyframe[] = [
  { t: -0.5, pos: [0, 76, 640], target: [0, 30, 0], fov: 22, fx: FX },
  { t: 0, pos: [0, 74, 620], target: [0, 30, 0], fov: 22, fx: FX },
  { t: 0.3, pos: [120, 84, 430], target: [0, 31, 0], fov: 22, fx: FX },
  { t: 0.6, pos: [95, 52, 395], target: [-4, 31, 0], fov: 22, fx: FX },
  { t: 0.86, pos: [14, 66, 425], target: [-6, 32, 0], fov: 22, fx: FX },
  { t: 1, pos: [0, 66, 425], target: [-6, 32, 0], fov: 22, fx: FX },
  { t: 1.5, pos: [-6, 67, 422], target: [-6, 32, 0], fov: 22, fx: FX },
];

/** Turntable yaw from scroll (rad): a slow scrubbed turn under the idle rotation. */
const YAW0 = -0.62;
const YAW_SCROLL = 0.75;
const RAD_PER_PX = 0.0062;
const AUTO_SPEED = 0.12;

const ENVELOPE = new Box3(new Vector3(-44, 0, -20), new Vector3(44, 42, 20));
// Top of the clamp collar on the calibrated part (STORYBOARD's (0, 42, 0) predates it).
const COLLAR_TOP = new Vector3((COLLAR.x0 + COLLAR.x1) / 2, COLLAR.y + COLLAR.rOuter, 0);
const PART_CENTER_Y = TURNTABLE_TOP + 21;

const ease = (t: number) => t * t * (3 - 2 * t);

export default function Scene() {
  const quality = useQuality();
  const partQuality = usePartQuality();
  const path = useCameraPath(PATH);
  const fx = useChapterFx();
  const gl = useThree((s) => s.gl);
  // Suspends until the bracket exists, so the slot compiles (and whenReady resolves) with the part on the table.
  const part = use(preloadPart(partQuality));

  const shared = useMemo(() => createStudioUniforms(), []);
  const mats = useMemo(() => createPartMaterials(shared, quality), [shared, quality]);
  const infillMat = useMemo(() => createInfillMaterial(shared), [shared]);
  const table = useMemo(() => createTurntableMaterial(shared), [shared]);
  const tableGeo = useMemo(() => createTurntableGeometry(partQuality === 'low' ? 96 : 192), [partQuality]);
  const cycGeo = useMemo(() => createCycloramaGeometry(), []);
  const cycMat = useMemo(() => createCycloramaMaterial(shared.uKey), [shared]);

  useEffect(() => () => mats.forEach((m) => m.material.dispose()), [mats]);
  useEffect(() => () => infillMat.material.dispose(), [infillMat]);
  useEffect(
    () => () => {
      table.material.dispose();
      tableGeo.dispose();
      cycGeo.dispose();
      cycMat.dispose();
    },
    [table, tableGeo, cycGeo, cycMat],
  );

  useLayoutEffect(() => {
    const prev = gl.transmissionResolutionScale;
    gl.transmissionResolutionScale = 0.5;
    return () => {
      gl.transmissionResolutionScale = prev;
    };
  }, [gl]);

  const turntable = useRef<Group>(null);
  const partGroup = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([null, null, null]);
  const infill = useRef<Mesh>(null);

  const state = useMemo(
    () => ({
      swap: { from: 0, to: 0, k: 0 } as SwapState,
      user: 0,
      ambient: 0,
      auto: 0,
      world: new Vector3(),
      anchor: new Float32Array(3),
    }),
    [],
  );

  useChapterFrame((r3f, delta, prog) => {
    const camera = r3f.camera;
    const capture = isCapture();
    const time = prog.time;
    path.apply(camera, prog.raw);

    const rim = ease(range(prog.enter, 0.5, 0.75));
    const key = ease(range(prog.enter, 0.75, 1));
    shared.uRim.value = rim;
    shared.uKey.value = key;
    table.hair.value = 0.6 * rim;
    fx.exposure = 0.88 + 0.12 * key;

    const s = signals;
    if (capture) {
      state.user = 0;
      state.ambient = 0;
      s.yawVel = 0;
    } else {
      if (s.dragging) {
        const d = s.dragDX * RAD_PER_PX;
        s.dragDX = 0;
        state.user += d;
        const v = d / Math.max(delta, 1 / 240);
        s.yawVel += (v - s.yawVel) * (1 - Math.exp(-18 * delta));
      } else {
        state.user += s.yawVel * delta;
        s.yawVel *= Math.exp(-4 * delta);
      }
      if (s.keyYaw !== 0) {
        const step = Math.abs(s.keyYaw) < 1e-4 ? s.keyYaw : s.keyYaw * (1 - Math.exp(-12 * delta));
        state.user += step;
        s.keyYaw -= step;
      }
      const idle = time - s.lastInput;
      const pinnedIdle = partStore.getState().materialPinned && idle > 6;
      const spin = !s.dragging && !s.held && idle > 2.5 && !pinnedIdle ? AUTO_SPEED : 0;
      state.auto = s.held ? 0 : state.auto + (spin - state.auto) * (1 - Math.exp(-1.5 * delta));
      state.ambient += state.auto * delta;
    }
    const yaw = YAW0 + prog.raw * YAW_SCROLL + state.user + state.ambient;
    s.yaw = yaw;
    const deg = Math.round((((yaw * 180) / Math.PI) % 360 + 360) % 360) % 360;
    s.yawDeg = deg;

    const tt = turntable.current;
    if (tt) {
      tt.rotation.y = yaw;
      tt.updateMatrixWorld();
    }

    const sw = swapAt(prog.p, time, state.swap);
    const swapping = sw.k > 0 && sw.k < 1 && sw.from !== sw.to;
    const scanY = swapping ? -1 + sw.k * 44.5 : 43;
    shared.uScanY.value = scanY;
    shared.uBand.value = swapping ? 1 : 0;
    s.scanY = scanY;
    s.material = shownOf(sw);
    const settled = sw.k >= 0.5 ? sw.to : sw.from;
    for (let i = 0; i < 3; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      m.visible = swapping ? i === sw.from || i === sw.to : i === settled;
      mats[i].clip.value = swapping ? (i === sw.to ? 1 : i === sw.from ? -1 : 0) : 0;
    }
    const inf = infill.current;
    if (inf) {
      inf.visible = meshes.current[2]?.visible === true;
      infillMat.clip.value = mats[2].clip.value;
    }

    const pg = partGroup.current;
    if (pg) {
      writeBBox(s, ENVELOPE, pg.matrixWorld, camera, r3f.size);
      state.world.copy(COLLAR_TOP).applyMatrix4(pg.matrixWorld);
      state.anchor[0] = state.world.x;
      state.anchor[1] = state.world.y;
      state.anchor[2] = state.world.z;
      writeAnchor(s, 'collar', state.anchor, camera, r3f.size);
    } else {
      hideBBox(s);
      hideAnchor(s, 'collar');
    }

    fx.dof.enabled = quality !== 'low';
    const dx = camera.position.x;
    const dy = camera.position.y - PART_CENTER_Y;
    const dz = camera.position.z;
    fx.dof.focusDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    fx.dof.focusRange = 1000;
    fx.dof.bokehScale = 1.5;
  });

  return (
    <>
      <Studio fill={false} />
      <mesh geometry={cycGeo} material={cycMat} />
      <group ref={turntable}>
        <mesh geometry={tableGeo} material={table.material} />
        <group ref={partGroup} position-y={TURNTABLE_TOP}>
          {mats.map((m, i) => (
            <mesh
              key={i}
              ref={(el) => {
                meshes.current[i] = el;
              }}
              geometry={part.optimized}
              material={m.material}
              visible={false}
              dispose={null}
            />
          ))}
          <mesh ref={infill} geometry={part.infill} material={infillMat.material} renderOrder={2} visible={false} dispose={null} />
          <ContactShadow key={part.optimized.uuid} y={0.05} scale={[150, 90]} far={44} blur={2.4} opacity={0.55} resolution={256} />
        </group>
      </group>
    </>
  );
}
