'use client';

import { use, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Color, Object3D, Vector3, type Group, type Mesh, type PointLight, type SpotLight, type Texture } from 'three';
import {
  ambientTime,
  createPose,
  isCapture,
  projectToScreen,
  range,
  useChapterCamera,
  useChapterFrame,
  useChapterFx,
  useIsPortrait,
  usePartQuality,
  useQuality,
} from '@/strata/story';
import { preloadPart } from '@/strata/part';
import { applyCamera, sampleCamera } from './camera';
import { LpbfCell, type MetalState } from './cells/lpbf/LpbfCell';
import { SLA_ORIGIN, SlaCell } from './cells/sla/SlaCell';
import { SLS_ORIGIN, SlsCell } from './cells/sls/SlsCell';
import { requestGeometry } from './geometry';
import { bakeEnvironments } from './lib/env';
import { useHall } from './lib/hall';
import { CellContext, type CellFrame, type CellLights, type CellRegistry, type CellUpdate } from './lib/frame';
import { signals } from './signals';
import {
  LPBF_SCAN,
  cellAt,
  exposureAt,
  lpbfGrade,
  lpbfOutro,
  lpbfPartTemp,
  lpbfQA,
  sineInOut,
  slaFlash,
  slaLayer,
  slaPlateY,
  truckAt,
} from './timeline';
import { MACHINES_FX } from './fx';
import { FLEET_FX } from '../ch7-fleet/fx';

const ORIGINS = [SLA_ORIGIN, SLS_ORIGIN, 0] as const;
const RENDER_RADIUS = 1500;
const NESTED_RES = { high: 1.6, medium: 1.9, low: 2.3 } as const;

/** One key spot per cell (a pool of light, darkness between): offset from the aim point, aim, cone, colour, intensity. */
const KEYS = [
  { from: [260, 620, 420], aim: [0, 40, 0], angle: 0.3, color: [1, 0.96, 0.9], intensity: 3.2 },
  { from: [-420, 420, 300], aim: [25, 0, -10], angle: 0.2, color: [0.92, 0.95, 1], intensity: 1.4 },
  { from: [220, 640, 340], aim: [0, 10, 0], angle: 0.36, color: [0.75, 0.82, 1], intensity: 1.1 },
] as const;
/** The metal cell's key swings out to light the cabinet front for the pull-back. */
const KEY_OUT = { from: [-1600, 2300, 3200], aim: [0, 80, 400], angle: 0.42, color: [0.85, 0.9, 1], intensity: 1.5 };

const ACCENTS = [
  { color: [0.22, 0.88, 1] as [number, number, number], intensity: 0.2, pos: [-6, 3, 4] as [number, number, number], size: [1.2, 3] as [number, number] },
  { color: [1, 0.6, 0.3] as [number, number, number], intensity: 0.15, pos: [5, 5, -4] as [number, number, number], size: [3, 1] as [number, number] },
  { color: [1, 0.42, 0.1] as [number, number, number], intensity: 0.15, pos: [-6, 2, 4] as [number, number, number], size: [1.2, 3] as [number, number] },
];

// Start the worker as soon as the chunk is prefetched (two chapters ahead).
if (typeof window !== 'undefined') void requestGeometry(NESTED_RES.high);

/** A smooth seeded wobble for [J] readouts, about 2 Hz, in -1..1. */
const jitter = (t: number, seed: number) =>
  0.6 * Math.sin(t * 8.9 + seed * 1.7) + 0.4 * Math.sin(t * 17.3 + seed * 4.1 + 1.3);

export default function Scene() {
  const quality = useQuality();
  const camera = useChapterCamera();
  const fx = useChapterFx();
  const portrait = useIsPortrait();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  // Suspend on the ceiling tier's part and geometry so whenReady and the first frame include them; adaptive
  // drops never rebuild them.
  const partQuality = usePartQuality();
  const part = use(preloadPart(partQuality));
  const geo = use(requestGeometry(NESTED_RES[partQuality]));

  const g0 = useRef<Group>(null);
  const g1 = useRef<Group>(null);
  const g2 = useRef<Group>(null);
  const key = useRef<SpotLight>(null);
  const la = useRef<PointLight>(null);
  const lb = useRef<PointLight>(null);
  const keyTarget = useMemo(() => new Object3D(), []);
  const lights = useMemo(() => ({}) as CellLights, []);
  const envs = useRef<Texture[]>([]);
  const hallMesh = useRef<Mesh>(null);
  const hall = useHall();

  // Studio environments are baked before the scene's programs compile (they change the shader variant).
  useLayoutEffect(() => {
    const textures = bakeEnvironments(gl, ACCENTS);
    envs.current = textures;
    scene.environment = textures[0];
    return () => {
      scene.environment = null;
    };
  }, [gl, scene]);

  useLayoutEffect(() => {
    lights.a = la.current!;
    lights.b = lb.current!;
  }, [lights]);

  const registry = useMemo(() => {
    const lists = [new Set<{ current: CellUpdate }>(), new Set<{ current: CellUpdate }>(), new Set<{ current: CellUpdate }>()];
    const reg: CellRegistry & { lists: typeof lists } = {
      lists,
      add(i, fn) {
        lists[i].add(fn);
        return () => {
          lists[i].delete(fn);
        };
      },
    };
    return reg;
  }, []);

  const sample = useMemo(() => createPose(), []);
  const camPos = useMemo(() => new Vector3(), []);
  const frame = useMemo<CellFrame>(
    () => ({ p: 0, raw: 0, amb: 0, time: 0, dt: 0, capture: false, quality: 'high', camera: camPos, dist: 1 }),
    [camPos],
  );
  const scratch = useMemo(() => new Vector3(), []);
  const metal = useMemo<MetalState>(() => ({ pool: new Vector3(), poolOn: 0, partHeat: 1 }), []);
  const screen = useMemo(() => ({ x: 0, y: 0, visible: false }), []);
  const keyColor = useMemo(() => new Color(), []);

  useChapterFrame((_state, delta, prog) => {
    sampleCamera(prog.raw, prog.exit, sample, portrait);
    const dist = applyCamera(camera, sample, portrait);
    camPos.copy(camera.position);

    const capture = isCapture();
    const amb = ambientTime(prog.raw);
    const groups = [g0.current, g1.current, g2.current];
    let lead = 0;
    let best = Infinity;
    const vis = [false, false, false];
    for (let i = 0; i < 3; i++) {
      const dx = sample.target[0] - ORIGINS[i];
      const d = Math.sqrt(dx * dx + sample.target[1] * sample.target[1] + sample.target[2] * sample.target[2]);
      vis[i] = d < RENDER_RADIUS || (i === 2 && prog.raw > 0.85);
      const g = groups[i];
      if (g) g.visible = vis[i];
      if (d < best) {
        best = d;
        lead = i;
      }
    }

    frame.p = prog.p;
    frame.raw = prog.raw;
    frame.dt = delta;
    frame.time = prog.time;
    frame.capture = capture;
    frame.quality = quality;
    frame.dist = dist;
    if (lights.a && lights.b) {
      for (let pass = 0; pass < 2; pass++)
        for (let i = 0; i < 3; i++) {
          if (!vis[i] || (pass === 0) === (i === lead)) continue;
          frame.amb = amb;
          for (const fn of registry.lists[i]) fn.current(frame);
        }
    }

    // 6 -> 7: outside the window the cell's key and studio reflections go down, leaving the cabinet lit the way
    // Ch7's hall lights its hero; the grade eases into Ch7's over the same pull-back.
    const outro = lead === 2 ? lpbfOutro(prog.raw) : 0;
    const grade = lead === 2 ? lpbfGrade(prog.raw) : 0;

    // One key light, re-aimed at the lead cell.
    const k = KEYS[lead];
    const kl = key.current;
    if (kl) {
      const o = lead === 2 ? sineInOut(range(prog.p, 0.88, 0.96)) : 0;
      const mix = (a: number, b: number) => a + (b - a) * o;
      kl.target = keyTarget;
      keyTarget.position.set(ORIGINS[lead] + mix(k.aim[0], KEY_OUT.aim[0]), mix(k.aim[1], KEY_OUT.aim[1]), mix(k.aim[2], KEY_OUT.aim[2]));
      kl.position.set(ORIGINS[lead] + mix(k.from[0], KEY_OUT.from[0]), mix(k.from[1], KEY_OUT.from[1]), mix(k.from[2], KEY_OUT.from[2]));
      kl.angle = mix(k.angle, KEY_OUT.angle);
      keyColor.setRGB(mix(k.color[0], KEY_OUT.color[0]), mix(k.color[1], KEY_OUT.color[1]), mix(k.color[2], KEY_OUT.color[2]));
      kl.color.copy(keyColor);
      kl.intensity = mix(k.intensity, KEY_OUT.intensity) * (1 - outro);
      keyTarget.updateMatrixWorld();
    }
    if (envs.current.length) scene.environment = envs.current[lead];
    scene.environmentIntensity = 1 - outro;

    // Post: exposure dips over the trucks, DoF windows, haze at the melt pool; the entry UV flash blooms
    // under the 5 -> 6 seam, and the pull-back eases into Ch7's grade.
    const p = prog.p;
    fx.exposure = exposureAt(p) + (FLEET_FX.exposure - MACHINES_FX.exposure) * grade;
    fx.bloom.intensity =
      MACHINES_FX.bloom.intensity + (FLEET_FX.bloom.intensity - MACHINES_FX.bloom.intensity) * grade + (prog.raw < 0 ? 0.7 * slaFlash(prog.raw) : 0);
    fx.bloom.threshold = MACHINES_FX.bloom.threshold + (FLEET_FX.bloom.threshold - MACHINES_FX.bloom.threshold) * grade;
    fx.bloom.radius = MACHINES_FX.bloom.radius + (FLEET_FX.bloom.radius - MACHINES_FX.bloom.radius) * grade;
    fx.grain = MACHINES_FX.grain + (FLEET_FX.grain - MACHINES_FX.grain) * grade;
    fx.vignette = MACHINES_FX.vignette + (FLEET_FX.vignette - MACHINES_FX.vignette) * grade;
    const dof = fx.dof;
    if (p > 0.155 && p < 0.25) {
      const d = camera.position.distanceTo(scratch.set(SLA_ORIGIN, slaPlateY(prog.raw) - 21, 0));
      const u = sineInOut(range(p, 0.16, 0.22));
      dof.enabled = true;
      dof.focusDistance = d - 60 + 60 * u;
      dof.focusRange = 70;
      dof.bokehScale = 2.5 * range(p, 0.155, 0.165) * (1 - range(p, 0.24, 0.25));
    } else if (p > 0.675 && p < 0.785) {
      const d = camera.position.distanceTo(metal.poolOn ? metal.pool : scratch.set(-28, 2, 0));
      dof.enabled = true;
      dof.focusDistance = d;
      dof.focusRange = 18 + 30 * range(p, 0.72, 0.78);
      dof.bokehScale = 5 * range(p, 0.675, 0.685) * (1 - range(p, 0.775, 0.785));
    } else {
      dof.enabled = false;
    }
    const spot = fx.haze[0];
    if (spot) {
      projectToScreen(metal.pool.x, metal.pool.y + 1.5, metal.pool.z, camera, screen);
      spot.x = screen.x;
      spot.y = screen.y;
      spot.radius = 0.05;
      spot.strength = vis[2] && metal.poolOn && p < LPBF_SCAN[1] && screen.visible ? 0.35 : 0;
    }

    hall.setMesh(hallMesh.current, truckAt(p));

    signals.cell = cellAt(p);
    signals.layer = slaLayer(prog.raw);
    signals.partTemp = lpbfPartTemp(p);
    signals.qa = lpbfQA(p) ? 1 : 0;
    signals.bedJitter = capture ? 0 : 0.3 * jitter(prog.time, 1);
    signals.poolJitter = capture ? 0 : 12 * jitter(prog.time, 2);
  });

  return (
    <CellContext.Provider value={registry}>
      <spotLight ref={key} intensity={1} decay={0} penumbra={0.85} angle={0.35} distance={0} />
      <pointLight ref={la} intensity={0} decay={2} distance={0} />
      <pointLight ref={lb} intensity={0} decay={2} distance={0} />
      <primitive object={keyTarget} />
      <mesh ref={hallMesh} geometry={hall.geometry} material={hall.material} />
      <group ref={g0} position={[SLA_ORIGIN, 0, 0]}>
        <SlaCell part={part} sections={geo.sla} quality={quality} lights={lights} />
      </group>
      <group ref={g1} position={[SLS_ORIGIN, 0, 0]} visible={false}>
        <SlsCell geo={geo} quality={quality} lights={lights} />
      </group>
      <group ref={g2} visible={false}>
        <LpbfCell part={part} geo={geo} quality={quality} lights={lights} state={metal} />
      </group>
    </CellContext.Provider>
  );
}
