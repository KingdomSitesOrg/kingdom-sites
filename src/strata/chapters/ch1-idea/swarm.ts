import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, LinearSRGBColorSpace, Matrix4, ShaderMaterial, Vector3 } from 'three';
import { seededRandom } from '@/strata/story';
import { curlGLSL } from '@/strata/shaders/noise';
import { paletteGLSL } from '@/strata/shaders/palette';
import { CLOUD_COLOR, cloudSpriteGLSL } from '@/strata/story/shared/cloud';
import { SWEEP, SWEEP_JITTER } from './beats';
import { CLOUD_CENTER } from './pose';

/** Particles start on a plane this far (mm) in front of the camera, pinned to the DOM glyphs on screen. */
export const START_DEPTH = 120;
/** Curl amplitude (mm) mid-flight. */
export const CURL_AMP = 10;

/**
 * One THREE.Points: `position` is the cloud target (shared samples), `aStart` the glyph start on screen
 * (NDC x, y) plus departure and arrival on the swarm clock q, `aSeed` four seeded randoms.
 */
export function createSwarmGeometry(count: number) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aStart', new BufferAttribute(new Float32Array(count * 4), 4));
  const seeds = new Float32Array(count * 4);
  const rand = seededRandom(0x1d7a);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rand();
  g.setAttribute('aSeed', new BufferAttribute(seeds, 4));
  return g;
}

export function setTargets(g: BufferGeometry, targets: Float32Array) {
  const pos = g.getAttribute('position') as BufferAttribute;
  (pos.array as Float32Array).set(targets.subarray(0, pos.array.length));
  pos.needsUpdate = true;
  g.computeBoundingSphere();
}

/**
 * Departure follows the glyph's x across the prompt (the burst sweeps left to right); arrival follows the
 * target's height (bottom layers land first). Returns the arrivals sorted, for the landed counter.
 */
export function setStarts(
  g: BufferGeometry,
  ink: Float32Array | null,
  rect: Float32Array,
  width: number,
  height: number,
  sortedArrivals: Float32Array,
) {
  const start = g.getAttribute('aStart') as BufferAttribute;
  const pos = g.getAttribute('position').array as Float32Array;
  const a = start.array as Float32Array;
  const n = a.length / 4;
  const rand = seededRandom(0x5eed);
  const inkCount = ink ? ink.length / 3 : 0;
  const rw = Math.max(1, rect[2] - rect[0]);
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let xn: number;
    if (inkCount) {
      const j = Math.min(inkCount - 1, Math.floor(rand() * inkCount)) * 3;
      x = ink![j] + (rand() - 0.5) * 0.6;
      y = ink![j + 1] + (rand() - 0.5) * 0.6;
      xn = ink![j + 2];
    } else {
      x = rect[0] + rand() * rw;
      y = rect[1] + (0.3 + 0.4 * rand()) * (rect[3] - rect[1]);
      xn = (x - rect[0]) / rw;
      rand();
    }
    const depart = SWEEP * xn + SWEEP_JITTER * rand();
    const yn = Math.min(1, Math.max(0, pos[i * 3 + 1] / 42));
    let arrive = 0.36 + 0.48 * yn + 0.12 * rand();
    arrive = Math.min(0.985, Math.max(arrive, depart + 0.28));
    a[i * 4] = (x / width) * 2 - 1;
    a[i * 4 + 1] = 1 - (y / height) * 2;
    a[i * 4 + 2] = depart;
    a[i * 4 + 3] = arrive;
    sortedArrivals[i] = arrive;
  }
  sortedArrivals.sort();
  start.needsUpdate = true;
}

/** Number of sorted arrivals <= q. */
export function countLanded(sorted: Float32Array, q: number) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= q) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const vertex = /* glsl */ `
${paletteGLSL}
${curlGLSL}
uniform float uQ;
uniform float uTime;
uniform float uSize;
uniform float uBreath;
uniform float uCurl;
uniform float uStartDepth;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform vec3 uCenter;
uniform vec3 uCloud;
uniform float uFocus;
uniform float uBokeh;
attribute vec4 aStart;
attribute vec4 aSeed;
varying vec3 vColor;
varying float vCoc;

void main() {
  if (uQ <= aStart.z) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec3(0.0);
    vCoc = 0.0;
    return;
  }
  float k = clamp((uQ - aStart.z) / (aStart.w - aStart.z), 0.0, 1.0);
  vec3 T = position;
  vec3 world = T;
  if (k < 1.0) {
    vec4 nv = uInvProj * vec4(aStart.xy, -1.0, 1.0);
    vec3 ray = nv.xyz / nv.w;
    vec3 S = (uCamWorld * vec4(ray * (uStartDepth / -ray.z), 1.0)).xyz;
    vec3 fan = aSeed.xyz * 2.0 - 1.0;
    vec3 P1 = mix(S, T, 0.28) + vec3(8.0 + fan.x * 6.0, 12.0 + 16.0 * aSeed.w, fan.z * 7.0);
    vec3 away = T - uCenter;
    away = away / max(length(away), 1e-3);
    vec3 P2 = T + away * (6.0 + 12.0 * aSeed.y) + vec3(0.0, 8.0 + 10.0 * aSeed.z, 0.0);
    float u = 1.0 - pow(1.0 - k, 2.0);
    float iu = 1.0 - u;
    vec3 B = iu * iu * iu * S + 3.0 * iu * iu * u * P1 + 3.0 * iu * u * u * P2 + u * u * u * T;
    vec3 c = curlNoise(T * 0.02 + uTime * 0.1);
    world = B + c / (1.0 + length(c)) * uCurl * sin(3.14159265 * k);
  }
  vec4 mv = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;
  float hot = 1.0 - smoothstep(0.0, 0.22, k);
  vec3 molten = mix(PAL_MOLTEN * 1.15, PAL_MOLTEN_CORE * 1.3, hot) * smoothstep(0.0, 0.06, k);
  float flick = 0.8 + 0.2 * sin(uTime * (7.0 + 9.0 * aSeed.x) + aSeed.y * 40.0);
  vec3 col = mix(molten * flick, uCloud, smoothstep(0.7, 1.0, k));
  float base = uSize * uBreath * (1.0 + 0.25 * (1.0 - smoothstep(0.55, 1.0, k)));
  // In-flight embers off the focal plane open into soft bokeh discs; landed points are always sharp.
  float coc = k < 1.0 ? clamp(abs(-mv.z - uFocus) / uFocus * 1.2, 0.0, 1.0) * (1.0 - smoothstep(0.55, 0.95, k)) : 0.0;
  float size = base + coc * uBokeh;
  vCoc = coc;
  vColor = col * pow(base / size, 1.25);
  gl_PointSize = size;
}
`;

const fragment = /* glsl */ `
${cloudSpriteGLSL}
varying vec3 vColor;
varying float vCoc;
void main() {
  // Landed points (vCoc 0) shade exactly like the shared cloud material Ch2 starts from.
  float a = cloudSprite(gl_PointCoord);
  if (vCoc > 0.0) {
    float r = length(gl_PointCoord * 2.0 - 1.0);
    float disc = smoothstep(1.0, 0.55, r);
    a = mix(a, disc, smoothstep(0.0, 0.3, vCoc));
  }
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * a, 1.0);
}
`;

export function createSwarmMaterial() {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uQ: { value: -1 },
      uTime: { value: 0 },
      uSize: { value: 1.6 },
      uBreath: { value: 1 },
      uCurl: { value: CURL_AMP },
      uStartDepth: { value: START_DEPTH },
      uInvProj: { value: new Matrix4() },
      uCamWorld: { value: new Matrix4() },
      uCenter: { value: new Vector3(...CLOUD_CENTER) },
      uCloud: { value: new Color().setRGB(...CLOUD_COLOR, LinearSRGBColorSpace) },
      uFocus: { value: 300 },
      uBokeh: { value: 12 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
}
