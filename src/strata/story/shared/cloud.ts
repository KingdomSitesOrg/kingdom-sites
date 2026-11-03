'use client';

import { useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, LinearSRGBColorSpace, ShaderMaterial } from 'three';
import { usePart, type PartData } from '@/strata/part';
import { sdSolidXYZ } from '@/strata/part/sdf';
import { linearRGB } from '@/strata/shaders/palette';
import type { Quality } from '../types';

/**
 * The shared point cloud (STORYBOARD 2.3, Ch1, Ch2, H₂): seed 7, area-weighted samples of `part.solid`
 * per tier, 1.6 px x DPR (cap 3 px), --resin, additive. Ch1 lands its swarm on these exact samples and
 * Ch2 starts from them, so both chapters render the identical cloud across the crossfade.
 */
export const CLOUD = {
  seed: 7,
  kind: 'solid',
  counts: { high: 24000, medium: 12000, low: 6000 },
  pointPx: 1.6,
  maxPx: 3,
  breathAmp: 0.08,
  breathHz: 0.5,
} as const;

export const CLOUD_COLOR = linearRGB('resin');

export function cloudCount(quality: Quality): number {
  return CLOUD.counts[quality];
}

const hullCache = new WeakMap<PartData, Map<number, Float32Array>>();

/** True when the ray along the sample's normal leaves the part's envelope without re-entering the solid. */
function seesOut(x: number, y: number, z: number, nx: number, ny: number, nz: number): boolean {
  let t = 0.6;
  for (let k = 0; k < 20; k++) {
    const px = x + nx * t;
    const py = y + ny * t;
    const pz = z + nz * t;
    if (px < -45 || px > 45 || py < -1 || py > 43 || pz < -21 || pz > 21) return true;
    const d = sdSolidXYZ(px, py, pz);
    if (d < -0.02) return false;
    t += d > 0.35 ? d : 0.35;
  }
  return true;
}

/**
 * xyz in mm (world units), cached per part and tier: never mutate it. Area-weighted samples of the solid's
 * outer hull: the bore, bolt wells and clamp slot face back into the part, and in a see-through cloud they
 * read as bright lines caged inside it, so those samples are skipped.
 */
export function cloudSamples(part: PartData, quality: Quality): Float32Array {
  const count = CLOUD.counts[quality];
  let byCount = hullCache.get(part);
  if (!byCount) hullCache.set(part, (byCount = new Map()));
  const hit = byCount.get(count);
  if (hit) return hit;
  const { positions: p, normals: n } = part.samplesWithNormals(CLOUD.kind, Math.ceil(count * 1.6), CLOUD.seed);
  const total = p.length / 3;
  const inner = new Uint8Array(total);
  const out = new Float32Array(count * 3);
  let k = 0;
  for (let i = 0; i < total && k < count; i++) {
    const o = i * 3;
    if (!seesOut(p[o], p[o + 1], p[o + 2], n[o], n[o + 1], n[o + 2])) {
      inner[i] = 1;
      continue;
    }
    out.set(p.subarray(o, o + 3), k * 3);
    k++;
  }
  for (let i = 0; i < total && k < count; i++) {
    if (!inner[i]) continue;
    out.set(p.subarray(i * 3, i * 3 + 3), k * 3);
    k++;
  }
  byCount.set(count, out);
  return out;
}

const pending = new WeakMap<PartData, Map<number, Promise<Float32Array>>>();

/** cloudSamples, built in an idle slot rather than during a render or commit. Cached: safe to pass to use(). */
export function preloadCloudSamples(part: PartData, quality: Quality): Promise<Float32Array> {
  const count = CLOUD.counts[quality];
  let byCount = pending.get(part);
  if (!byCount) pending.set(part, (byCount = new Map()));
  let hit = byCount.get(count);
  if (!hit) {
    const ready = hullCache.get(part)?.get(count);
    hit = ready
      ? Promise.resolve(ready)
      : new Promise((resolve) => {
          const run = () => resolve(cloudSamples(part, quality));
          if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 300 });
          else setTimeout(run, 0);
        });
    byCount.set(count, hit);
  }
  return hit;
}

/** Point diameter in device pixels: 1.6 px x DPR, capped at 3 px. */
export function cloudPointSize(dpr: number): number {
  return Math.min(CLOUD.pointPx * dpr, CLOUD.maxPx);
}

/**
 * Breathing scale (point size +-8 % at 0.5 Hz). Pass `prog.time`, the shared story clock: it is the
 * same value in Ch1 and Ch2 during the handoff, so the seam stays identical (ambientTime(raw) is per
 * chapter under capture and would not match).
 */
export function cloudBreath(time: number): number {
  return 1 + CLOUD.breathAmp * Math.sin(2 * Math.PI * CLOUD.breathHz * time);
}

/** The cloud's samples for this tier, or null until the part is generated. */
export function useCloudSamples(quality: Quality): Float32Array | null {
  const part = usePart(quality);
  return useMemo(() => (part ? cloudSamples(part, quality) : null), [part, quality]);
}

/** Round soft sprite, shared by every cloud shader. `cloudSprite(gl_PointCoord)` -> 0..1. */
export const cloudSpriteGLSL = /* glsl */ `
#ifndef STRATA_CLOUD_SPRITE
#define STRATA_CLOUD_SPRITE
float cloudSprite(vec2 pc) {
  float d = length(pc - 0.5) * 2.0;
  return 1.0 - smoothstep(0.35, 1.0, d);
}
#endif
`;

const vertexShader = /* glsl */ `
uniform float uSize;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize;
}
`;

const fragmentShader = /* glsl */ `
${cloudSpriteGLSL}
uniform vec3 uColor;
uniform float uOpacity;
void main() {
  float a = cloudSprite(gl_PointCoord) * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor * a, 1.0);
}
`;

/** A geometry over the shared samples (the attribute array is shared; dispose the geometry, not the data). */
export function createCloudGeometry(samples: Float32Array): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(samples, 3));
  g.computeBoundingSphere();
  return g;
}

/** The formed cloud's material. Drive it with updateCloudMaterial every frame. Dispose it yourself. */
export function createCloudMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uSize: { value: CLOUD.pointPx },
      uColor: { value: new Color().setRGB(...CLOUD_COLOR, LinearSRGBColorSpace) },
      uOpacity: { value: 1 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/** uSize = cloudPointSize(dpr) x cloudBreath(time); opacity 0..1. */
export function updateCloudMaterial(material: ShaderMaterial, dpr: number, time: number, opacity = 1) {
  material.uniforms.uSize.value = cloudPointSize(dpr) * cloudBreath(time);
  material.uniforms.uOpacity.value = opacity;
}
