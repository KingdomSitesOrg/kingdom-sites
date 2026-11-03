import {
  BufferAttribute,
  BufferGeometry,
  Color,
  LatheGeometry,
  ShaderMaterial,
  Vector2,
  type IUniform,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { palette } from '@/strata/ui/tokens';

/** Turntable profile (r, y) in mm, bottom to top so every band's normal faces out: Ø 180 x 12, 1 mm chamfers, rim groove at y = 6. */
const TURNTABLE_PROFILE: [number, number][] = [
  [89, 0],
  [90, 1],
  [90, 5.7],
  [89.6, 5.7],
  [89.6, 6.3],
  [90, 6.3],
  [90, 11],
  [89, 12],
  [0, 12],
];

export const TURNTABLE_TOP = 12;

/** One flat-shaded lathe band per profile segment, merged: crisp chamfers that catch a clean highlight. */
export function createTurntableGeometry(segments: number) {
  const bands: BufferGeometry[] = [];
  for (let i = 0; i < TURNTABLE_PROFILE.length - 1; i++) {
    const [r0, y0] = TURNTABLE_PROFILE[i];
    const [r1, y1] = TURNTABLE_PROFILE[i + 1];
    bands.push(new LatheGeometry([new Vector2(r0, y0), new Vector2(r1, y1)], segments));
  }
  const merged = mergeGeometries(bands);
  for (const b of bands) b.dispose();
  if (!merged) throw new Error('turntable merge failed');
  merged.deleteAttribute('uv');
  return merged;
}

/**
 * The cyclorama: a floor at y = 0 that curves up into a back wall (cove radius 520 mm), wide enough
 * for every camera key. Only positions: the shader works in world space.
 */
export function createCycloramaGeometry() {
  const profile: [number, number][] = [];
  const floorFront = 1600;
  const coveStart = -260;
  const radius = 520;
  profile.push([floorFront, 0]);
  for (let z = 1200; z > coveStart; z -= 160) profile.push([z, 0]);
  const arc = 28;
  for (let i = 0; i <= arc; i++) {
    const a = (i / arc) * (Math.PI / 2);
    profile.push([coveStart - Math.sin(a) * radius, radius - Math.cos(a) * radius]);
  }
  profile.push([coveStart - radius, 1400]);
  profile.push([coveStart - radius, 3200]);

  const xs = [-2400, -900, 0, 900, 2400];
  const cols = xs.length;
  const rows = profile.length;
  const pos = new Float32Array(cols * rows * 3);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const o = (r * cols + c) * 3;
      pos[o] = xs[c];
      pos[o + 1] = profile[r][1];
      pos[o + 2] = profile[r][0];
    }
  }
  const index: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = a + cols;
      const e = d + 1;
      index.push(a, b, d, b, e, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setIndex(index);
  return g;
}

/** Unlit studio sweep (STORYBOARD 3.2): #0B0F18 on the floor to #03050A up the wall, a soft light pool, a low back glow
 * on the cove for the clear resin to refract, the turntable's shadow. */
export function createCycloramaMaterial(uKey: IUniform<number>) {
  return new ShaderMaterial({
    name: 'Ch8Cyclorama',
    uniforms: {
      uKey,
      uFloor: { value: new Color('#0B0F18') },
      uTop: { value: new Color(palette['bg-0']) },
      uPool: { value: new Color('#121826') },
      uBack: { value: new Color('#1A2539') },
    },
    vertexShader: /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: /* glsl */ `
uniform float uKey;
uniform vec3 uFloor;
uniform vec3 uTop;
uniform vec3 uPool;
uniform vec3 uBack;
varying vec3 vW;
void main() {
  float up = smoothstep(0.0, 900.0, vW.y);
  vec3 c = mix(uFloor, uTop, up);
  vec2 pf = vec2(vW.x / 420.0, (vW.z + 120.0) / 360.0);
  float pool = exp(-dot(pf, pf) * 1.6) * (1.0 - smoothstep(0.0, 260.0, vW.y));
  vec2 hw = vec2(vW.x / 520.0, (vW.y - 140.0) / 420.0);
  float halo = exp(-dot(hw, hw) * 2.0) * smoothstep(-200.0, -420.0, vW.z);
  c = mix(c, uPool, clamp(pool * 0.85 + halo * 0.55, 0.0, 1.0));
  vec2 bw = vec2(vW.x / 300.0, (vW.y - 24.0) / 80.0);
  c += uBack * exp(-dot(bw, bw)) * smoothstep(-240.0, -420.0, vW.z) * uKey;
  float r = length(vW.xz);
  float shade = 1.0 - 0.7 * (1.0 - smoothstep(86.0, 132.0, r)) * (1.0 - step(2.0, vW.y));
  c *= shade * mix(0.3, 1.0, uKey);
  gl_FragColor = vec4(c, 1.0);
}`,
  });
}
