'use client';

import { forwardRef, useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import {
  BackSide,
  BufferAttribute,
  Color,
  DoubleSide,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  type DirectionalLight,
  type Texture,
  type WebGLRenderer,
} from 'three';
import { linearRGB } from '@/strata/shaders/palette';
import { useQuality } from '../hooks';

/**
 * The product-photography rig (STORYBOARD 3.3) as one component: an environment of Lightformers (a key
 * softbox, two strip rims and one small chapter accent), plus the chapter's single optional shadow light
 * (1024² high, 512² medium, none on low). The default rig also carries the studio fill (dim walls, an
 * overhead box, a left strip, a back horizon strip and a front card) so satin titanium reflects a room,
 * not black between three lights. Ch1-Ch4 use it unchanged so lighting is identical across their
 * crossfades. The static rig is prefiltered once per renderer, extras, accent and fill and shared by every
 * chapter (remounts cost nothing and leak nothing); only an animated rig (frames > 1 or key/rim
 * multipliers) falls back to drei's Environment.
 */

/** Key softbox colour from the storyboard (warm white; not a palette token). */
const KEY_COLOR = new Color().setRGB(0.905, 0.879, 0.838, LinearSRGBColorSpace); // #F4F1EC

export const STUDIO = {
  key: { scale: [6, 6] as const, intensity: 2.4, position: [0, 8, 6] as const },
  rim: { scale: [0.6, 6] as const, intensity: 3.0, x: 7, y: 2, z: -3 },
  accent: {
    scale: [1.2, 1.2] as const,
    position: [-5, 1.5, 5] as const,
    molten: 0.15,
    resin: 0.2,
  },
  shadowMap: { high: 1024, medium: 512, low: 0 },
  fill: {
    radius: 30,
    /** Wall luminance below, at and above the horizon. */
    walls: { floor: 0.04, horizon: 0.26, top: 0.18 },
    tint: [0.88, 0.91, 0.97] as const,
    formers: [
      { intensity: 7, position: [0, 10, 3], scale: [10, 6] },
      { intensity: 4.5, position: [-8, 2, 4], scale: [1, 8] },
      { intensity: 3.5, position: [0, 2, -9], scale: [16, 0.6] },
      { intensity: 0.6, position: [0, 2.5, 9], scale: [7, 2.5] },
    ],
  },
} as const;

export type StudioAccent = 'molten' | 'resin' | 'none';

/** An extra rect light in the environment, in the same units as `STUDIO` (it faces the origin). */
export interface StudioFormer {
  color: Color | string;
  intensity: number;
  position: readonly [number, number, number];
  scale: readonly [number, number];
}

export interface StudioShadow {
  /** World position of the light (mm); it aims at `target` (default the part centre). */
  position: readonly [number, number, number];
  target?: readonly [number, number, number];
  /** Default 1.2. */
  intensity?: number;
  /** Orthographic half-extent of the shadow camera, mm (default 80: the part plus margin). */
  extent?: number;
}

export interface StudioProps {
  /** Chapter accent: molten 0.15 (Ch0, Ch5, metal cell), resin 0.2 (Ch1, Ch2, SLA cell). */
  accent?: StudioAccent;
  /** Multipliers for reveals (Ch8 rim-then-key). They only show if the environment re-renders: raise `frames`. */
  keyLight?: number;
  rimLight?: number;
  /** Environment renders: 1 (default) once at mount; Infinity while animating key/rim. */
  frames?: number;
  /** The one shadow-casting light; omitted means none. Cast nothing on low. */
  shadow?: StudioShadow;
  /**
   * Chapter-specific rect lights added to the rig (a dark machine needs back strips and a horizon line).
   * Pass a module-level constant: the prefiltered environment is cached per array.
   */
  extra?: readonly StudioFormer[];
  /** scene.environmentIntensity while mounted (default 1). */
  intensity?: number;
  /** Studio fill (walls and soft boxes). Default: on for the plain rig, off when `extra` brings its own. */
  fill?: boolean;
}

/** <Studio accent="resin" shadow={{ position: [120, 260, 160] }} ref={lightRef} /> */
export const Studio = forwardRef<DirectionalLight, StudioProps>(function Studio(
  { accent = 'none', keyLight = 1, rimLight = 1, frames = 1, shadow, extra, intensity = 1, fill = !extra },
  ref,
) {
  const quality = useQuality();
  const accentColor = useMemo(() => {
    if (accent === 'none') return null;
    const [r, g, b] = linearRGB(accent);
    return new Color().setRGB(r, g, b, LinearSRGBColorSpace);
  }, [accent]);
  const accentIntensity = accent === 'molten' ? STUDIO.accent.molten : STUDIO.accent.resin;
  const animated = frames !== 1 || keyLight !== 1 || rimLight !== 1;

  return (
    <>
      {animated ? (
        <Environment resolution={256} frames={frames} environmentIntensity={intensity}>
          <Lightformer
            form="rect"
            color={KEY_COLOR}
            intensity={STUDIO.key.intensity * keyLight}
            position={STUDIO.key.position}
            scale={[...STUDIO.key.scale]}
          />
          <Lightformer
            form="rect"
            color="white"
            intensity={STUDIO.rim.intensity * rimLight}
            position={[-STUDIO.rim.x, STUDIO.rim.y, STUDIO.rim.z]}
            scale={[...STUDIO.rim.scale]}
          />
          <Lightformer
            form="rect"
            color="white"
            intensity={STUDIO.rim.intensity * rimLight}
            position={[STUDIO.rim.x, STUDIO.rim.y, STUDIO.rim.z]}
            scale={[...STUDIO.rim.scale]}
          />
          {accentColor && (
            <Lightformer
              form="rect"
              color={accentColor}
              intensity={accentIntensity}
              position={STUDIO.accent.position}
              scale={[...STUDIO.accent.scale]}
            />
          )}
          {extra?.map((f, i) => (
            <Lightformer key={i} form="rect" color={f.color} intensity={f.intensity} position={f.position} scale={[...f.scale]} />
          ))}
          {fill && <AnimatedFill />}
        </Environment>
      ) : (
        <SharedEnvironment accent={accent} extra={extra} intensity={intensity} fill={fill} />
      )}
      {shadow && <ShadowLight ref={ref} shadow={shadow} mapSize={STUDIO.shadowMap[quality]} />}
    </>
  );
});

const ShadowLight = forwardRef<DirectionalLight, { shadow: StudioShadow; mapSize: number }>(function ShadowLight(
  { shadow, mapSize },
  ref,
) {
  const target = useMemo(() => new Object3D(), []);
  const [tx, ty, tz] = shadow.target ?? [0, 21, 0];
  const extent = shadow.extent ?? 80;
  useLayoutEffect(() => {
    target.position.set(tx, ty, tz);
    target.updateMatrixWorld();
  }, [target, tx, ty, tz]);
  const cast = mapSize > 0;
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={ref}
        color={KEY_COLOR}
        intensity={shadow.intensity ?? 1.2}
        position={shadow.position}
        target={target}
        castShadow={cast}
        shadow-mapSize={[Math.max(mapSize, 1), Math.max(mapSize, 1)]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.4}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={2000}
      />
    </>
  );
});

const FILL_COLOR = new Color().setRGB(...STUDIO.fill.tint, LinearSRGBColorSpace);

/** Inverted sphere with a vertex-colour wall gradient: dark floor, bright horizon, dimmer ceiling. */
function fillWalls(): Mesh {
  const geo = new SphereGeometry(STUDIO.fill.radius, 48, 24);
  const pos = geo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const { floor, horizon, top } = STUDIO.fill.walls;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / STUDIO.fill.radius;
    const t = y < 0 ? Math.min(1, Math.max(0, (y + 0.4) / 0.4)) : y;
    const v = y < 0 ? floor + (horizon - floor) * t * t * (3 - 2 * t) : horizon + (top - horizon) * t;
    colors[i * 3] = FILL_COLOR.r * v;
    colors[i * 3 + 1] = FILL_COLOR.g * v;
    colors[i * 3 + 2] = FILL_COLOR.b * v;
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  return new Mesh(geo, new MeshBasicMaterial({ vertexColors: true, side: BackSide, toneMapped: false }));
}

function AnimatedFill() {
  const walls = useMemo(() => fillWalls(), []);
  useLayoutEffect(
    () => () => {
      walls.geometry.dispose();
      (walls.material as MeshBasicMaterial).dispose();
    },
    [walls],
  );
  return (
    <>
      <primitive object={walls} />
      {STUDIO.fill.formers.map((f, i) => (
        <Lightformer key={i} form="rect" color={FILL_COLOR} intensity={f.intensity} position={f.position} scale={[...f.scale]} />
      ))}
    </>
  );
}

const NO_EXTRA: readonly StudioFormer[] = [];
const envCache = new WeakMap<WebGLRenderer, WeakMap<readonly StudioFormer[], Map<string, Texture>>>();

/** The static rig rendered into a PMREM once per renderer, extras, accent and fill; never disposed (shared by chapters). */
function studioEnvironment(gl: WebGLRenderer, accent: StudioAccent, extra: readonly StudioFormer[], fill: boolean): Texture {
  let byExtra = envCache.get(gl);
  if (!byExtra) envCache.set(gl, (byExtra = new WeakMap()));
  let byKey = byExtra.get(extra);
  if (!byKey) byExtra.set(extra, (byKey = new Map()));
  const key = `${accent}:${fill ? 1 : 0}`;
  const hit = byKey.get(key);
  if (hit) return hit;
  const scene = new Scene();
  const plane = new PlaneGeometry(1, 1);
  const add = (color: Color, intensity: number, pos: readonly number[], scale: readonly number[]) => {
    const mat = new MeshBasicMaterial({
      color: color.clone().multiplyScalar(intensity),
      side: DoubleSide,
      toneMapped: false,
    });
    const mesh = new Mesh(plane, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  };
  const white = new Color(1, 1, 1);
  add(KEY_COLOR, STUDIO.key.intensity, STUDIO.key.position, STUDIO.key.scale);
  add(white, STUDIO.rim.intensity, [-STUDIO.rim.x, STUDIO.rim.y, STUDIO.rim.z], STUDIO.rim.scale);
  add(white, STUDIO.rim.intensity, [STUDIO.rim.x, STUDIO.rim.y, STUDIO.rim.z], STUDIO.rim.scale);
  if (accent !== 'none') {
    const [r, g, b] = linearRGB(accent);
    const intensity = accent === 'molten' ? STUDIO.accent.molten : STUDIO.accent.resin;
    add(new Color().setRGB(r, g, b, LinearSRGBColorSpace), intensity, STUDIO.accent.position, STUDIO.accent.scale);
  }
  for (const f of extra) add(new Color(f.color), f.intensity, f.position, f.scale);
  if (fill) {
    scene.add(fillWalls());
    for (const f of STUDIO.fill.formers) add(FILL_COLOR, f.intensity, f.position, f.scale);
  }
  const pmrem = new PMREMGenerator(gl);
  const target = pmrem.fromScene(scene, 0, 0.1, 1000);
  pmrem.dispose();
  plane.dispose();
  scene.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    (o.material as MeshBasicMaterial).dispose();
    if (o.geometry !== plane) o.geometry.dispose();
  });
  byKey.set(key, target.texture);
  return target.texture;
}

function SharedEnvironment({
  accent,
  extra = NO_EXTRA,
  intensity,
  fill,
}: {
  accent: StudioAccent;
  extra?: readonly StudioFormer[];
  intensity: number;
  fill: boolean;
}) {
  const get = useThree((s) => s.get);
  useLayoutEffect(() => {
    const { gl, scene } = get();
    scene.environment = studioEnvironment(gl, accent, extra, fill);
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
    };
  }, [get, accent, extra, intensity, fill]);
  return null;
}
