// Layer-1 toolpaths as instanced screen-space lines: one draw call for every class, drawn by arc length.
import {
  BufferAttribute,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  ShaderMaterial,
  Vector2,
} from 'three';
import { linearRGB } from '@/strata/shaders/palette';

/** Segment classes on the GPU: 0 outer perimeter, 1 inset perimeter, 2 infill, 3 travel, 4 return travel, 5 ghost contour. */
export const CLS = { outer: 0, inset: 1, infill: 2, travel: 3, park: 4, ghost: 5 } as const;

/** One layer flattened into print order. */
export interface LayerPath {
  /** x, z pairs. */
  xz: Float32Array;
  /** Per segment class (0..3). */
  cls: Uint8Array;
  /** The pen's clock per point: cumulative mm, travel counted at TRAVEL_CLOCK. */
  dist: Float32Array;
  /** Cumulative extruded length per point (mm), travel excluded: the PATH readout. */
  ext: Float32Array;
  total: number;
  extruded: number;
  start: [number, number];
  end: [number, number];
}

const vert = /* glsl */ `
attribute vec4 iA;
attribute vec4 iB;
attribute float iC;
uniform vec2 uRes;
uniform float uWidth;
varying float vDist;
varying float vCls;
varying float vAcross;
varying float vHalf;

void main() {
  vec4 a = projectionMatrix * modelViewMatrix * vec4(iA.xyz, 1.0);
  vec4 b = projectionMatrix * modelViewMatrix * vec4(iB.xyz, 1.0);
  vec2 sa = a.xy / a.w * uRes * 0.5;
  vec2 sb = b.xy / b.w * uRes * 0.5;
  vec2 dv = sb - sa;
  float len = length(dv);
  vec2 dir = len > 1e-4 ? dv / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float w = iC > 4.5 ? uWidth * 0.75 : uWidth;
  float t = position.x;
  vec4 p = mix(a, b, t);
  vec2 off = nrm * position.y * (w * 0.5 + 1.0) + dir * (t * 2.0 - 1.0) * (w * 0.5);
  p.xy += off / (uRes * 0.5) * p.w;
  gl_Position = p;
  vDist = mix(iA.w, iB.w, t);
  vCls = iC;
  vAcross = position.y * (w * 0.5 + 1.0);
  vHalf = w * 0.5;
}
`;

const frag = /* glsl */ `
uniform float uDraw;
uniform float uWidth;
uniform float uAlpha;
uniform float uGhost;
uniform float uPark;
uniform float uHeadAmt;
uniform float uParkFade;
uniform float uTravelA;
uniform float uWarm;
uniform vec3 uWarmCol;
uniform vec3 uOuter;
uniform vec3 uInset;
uniform vec3 uInfill;
uniform vec3 uTravel;
uniform vec3 uGhostCol;
uniform vec3 uHead;
varying float vDist;
varying float vCls;
varying float vAcross;
varying float vHalf;

void main() {
  float cov = clamp(vHalf + 0.5 - abs(vAcross), 0.0, 1.0);
  vec3 col;
  float a = 1.0;
  if (vCls > 4.5) {
    // the ghost plan blends at its own opacity instead of masking the grid under it
    gl_FragColor = vec4(uGhostCol * uAlpha, cov * uGhost);
    return;
  } else if (vCls > 3.5) {
    if (vDist > uPark) discard;
    if (fract(vDist / 1.6) > 0.5) discard;
    col = uTravel;
    a = uParkFade;
  } else {
    if (vDist > uDraw) discard;
    if (vCls < 0.5) col = uOuter;
    else if (vCls < 1.5) col = uInset;
    else if (vCls < 2.5) col = uInfill;
    else {
      if (fract(vDist / 0.48) > 0.5) discard;
      col = uTravel;
      a = uTravelA;
    }
    col = mix(col, uWarmCol, uWarm * step(vCls, 2.5));
    float head = exp(-(uDraw - vDist) * 0.4) * step(vCls, 2.5) * uHeadAmt;
    col += uHead * head;
  }
  if (cov < 0.003) discard;
  gl_FragColor = vec4(col * a * uAlpha, cov);
}
`;

export function createLineMaterial() {
  const c = (t: Parameters<typeof linearRGB>[0], k = 1) => new Color().setRGB(...linearRGB(t)).multiplyScalar(k);
  return new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uRes: { value: new Vector2(1, 1) },
      uWidth: { value: 3.2 },
      uDraw: { value: 0 },
      uAlpha: { value: 1 },
      uGhost: { value: 0 },
      uPark: { value: 0 },
      uHeadAmt: { value: 1 },
      uParkFade: { value: 1 },
      uTravelA: { value: 1 },
      uWarm: { value: 0 },
      uWarmCol: { value: c('molten-hot', 0.55) },
      uOuter: { value: c('molten', 1.25) },
      uInset: { value: c('molten-hot', 0.62) },
      uInfill: { value: c('resin', 0.95) },
      uTravel: { value: c('text-1', 0.35) },
      uGhostCol: { value: c('resin', 0.35) },
      uHead: { value: new Color(6, 5.2, 4.4) },
    },
    transparent: true,
    depthWrite: false,
  });
}

/** Base quad (x along 0..1, y across -1..1) shared by every instance. */
function baseQuad(g: InstancedBufferGeometry) {
  g.setAttribute('position', new BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 2, 1, 3]);
}

/**
 * Layer 1 in print order, the dashed return to S1, and faint contours of higher layers (a topographic plan).
 * `stride` > 1 keeps every other infill polyline on low.
 */
export function buildLineGeometry(layer: LayerPath, y: number, ghosts: Float32Array[], ghostY: number, stride: number) {
  const n = layer.xz.length / 2;
  let ghostSegs = 0;
  for (const l of ghosts) ghostSegs += l.length / 2 - 1;
  const cap = n - 1 + 1 + ghostSegs;
  const A = new Float32Array(cap * 4);
  const B = new Float32Array(cap * 4);
  const C = new Float32Array(cap);
  let k = 0;
  let infillRun = 0;
  for (let i = 0; i < n - 1; i++) {
    const cls = layer.cls[i];
    if (cls === CLS.infill && stride > 1) {
      if (i > 0 && layer.cls[i - 1] !== CLS.infill) infillRun++;
      if (infillRun % stride === 1) continue;
    }
    A.set([layer.xz[i * 2], y, layer.xz[i * 2 + 1], layer.dist[i]], k * 4);
    B.set([layer.xz[i * 2 + 2], y, layer.xz[i * 2 + 3], layer.dist[i + 1]], k * 4);
    C[k++] = cls;
  }
  const back = Math.hypot(layer.start[0] - layer.end[0], layer.start[1] - layer.end[1]);
  A.set([layer.end[0], y + 0.02, layer.end[1], 0], k * 4);
  B.set([layer.start[0], y + 0.02, layer.start[1], back], k * 4);
  C[k++] = CLS.park;
  for (const l of ghosts) {
    for (let i = 0; i < l.length / 2 - 1; i++) {
      A.set([l[i * 2], ghostY, l[i * 2 + 1], 0], k * 4);
      B.set([l[i * 2 + 2], ghostY, l[i * 2 + 3], 0], k * 4);
      C[k++] = CLS.ghost;
    }
  }
  const g = new InstancedBufferGeometry();
  baseQuad(g);
  g.setAttribute('iA', new InstancedBufferAttribute(A.subarray(0, k * 4), 4));
  g.setAttribute('iB', new InstancedBufferAttribute(B.subarray(0, k * 4), 4));
  g.setAttribute('iC', new InstancedBufferAttribute(C.subarray(0, k), 1));
  g.instanceCount = k;
  return { geometry: g, back };
}

/** Travel moves run faster than extrusion, so they take this share of the pen's clock per mm. */
const TRAVEL_CLOCK = 0.3;

/** Flattens a toolpath (whatever its source) into the pen's clock and the PATH readout's extruded length. */
export function toLayerPath(xz: Float32Array, cls: Uint8Array): LayerPath {
  const n = xz.length / 2;
  const dist = new Float32Array(n);
  const ext = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    const d = Math.hypot(xz[i * 2] - xz[i * 2 - 2], xz[i * 2 + 1] - xz[i * 2 - 1]);
    const travel = cls[i - 1] === CLS.travel;
    dist[i] = dist[i - 1] + (travel ? d * TRAVEL_CLOCK : d);
    ext[i] = ext[i - 1] + (travel ? 0 : d);
  }
  return {
    xz,
    cls,
    dist,
    ext,
    total: dist[n - 1],
    extruded: ext[n - 1],
    start: [xz[0], xz[1]],
    end: [xz[n * 2 - 2], xz[n * 2 - 1]],
  };
}

/** Pen position at arc length s: writes x, z into out and returns the extruded length at s. Binary search, no allocation. */
export function sampleLayer(layer: LayerPath, s: number, out: Float32Array) {
  const { dist, xz, ext } = layer;
  const n = dist.length;
  if (s <= 0) {
    out[0] = xz[0];
    out[1] = xz[1];
    return 0;
  }
  if (s >= layer.total) {
    out[0] = xz[n * 2 - 2];
    out[1] = xz[n * 2 - 1];
    return layer.extruded;
  }
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (dist[mid] <= s) lo = mid;
    else hi = mid;
  }
  const seg = dist[hi] - dist[lo] || 1;
  const t = (s - dist[lo]) / seg;
  out[0] = xz[lo * 2] + (xz[hi * 2] - xz[lo * 2]) * t;
  out[1] = xz[lo * 2 + 1] + (xz[hi * 2 + 1] - xz[lo * 2 + 1]) * t;
  return ext[lo] + (ext[hi] - ext[lo]) * t;
}
