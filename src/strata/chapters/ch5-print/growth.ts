// The part grows for real (STORYBOARD Ch5 "Growth"): part.optimized in PA12-CF, every fragment above the current
// layer discarded (no renderer clipping planes). Back faces draw the top cap: a flat plane at uZ carrying the real
// bead pattern of that layer, computed in the shader from the same fields the slicer contours: three perimeters
// on the part SDF and the gyroid infill zero set. Hot band below the top, layer ridges on the walls.
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  FrontSide,
  MeshDepthMaterial,
  MeshStandardMaterial,
  RGBADepthPacking,
  ShaderChunk,
  type Vector3,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { hashGLSL } from '@/strata/shaders/noise';
import { TOOLPATH } from '@/strata/part';
import { paletteGLSL } from '@/strata/shaders/palette';

export interface GrowthUniforms {
  uClip: { value: number };
  uHeat: { value: number };
  uBedY: { value: number };
  uDetail: { value: number };
  /** Layer-1 bead-in 0..1: 0 hides the cap, small values keep only each bead's centre line, 1 the full bead. */
  uBeadIn: { value: number };
  uGlowPos: { value: Vector3 };
  uGlowColor: { value: Vector3 };
}

// centroid: under MSAA an edge-on sliver must not extrapolate its height below the cut and glow
const vertexHead = /* glsl */ `
uniform float uClip;
centroid varying vec3 vPart;
centroid varying vec3 vWorldP;
`;
const vertexBody = /* glsl */ `
vPart = position;
vWorldP = (modelMatrix * vec4(position, 1.0)).xyz;
`;

/**
 * The slicer contours the part field without the y >= 0 floor cut; near the plate the floor term would swamp the
 * horizontal distance. Same here: drop it, and measure rings from the visible edge, which the floor's edge break
 * pulls in by -y - k + 2 sqrt(k y) below y = k.
 */
function withoutFloor(sdfGLSL: string): { glsl: string; k: string } {
  const m = /return pt_smax\(d, -p\.y, ([0-9.]+)\);/.exec(sdfGLSL);
  return { glsl: m ? sdfGLSL.replace(m[0], 'return d;') : sdfGLSL, k: m ? m[1] : '0.9' };
}

/** Lowest-y triangle order of a source geometry, computed once per geometry (it never changes). */
const orderCache = new WeakMap<BufferGeometry, { index: Uint32Array; minY: Float32Array }>();

/** Sub-micron height buckets: the sort runs on numeric keys (bucket, then triangle), no comparator. */
const Q = 4096;
const Y0 = 64;

/** Sorts the part's triangles ahead of the mount (idle), so createGrowthGeometry only copies. */
export function warmGrowthOrder(source: BufferGeometry) {
  sortedOrder(source);
}

function sortedOrder(source: BufferGeometry) {
  const hit = orderCache.get(source);
  if (hit) return hit;
  const pos = source.getAttribute('position');
  const src = pos.array as Float32Array;
  const index = source.getIndex();
  const idx = index?.array;
  const tris = idx ? idx.length / 3 : pos.count / 3;
  const keys = new Float64Array(tris);
  for (let t = 0; t < tris; t++) {
    const a = idx ? idx[t * 3] : t * 3,
      b = idx ? idx[t * 3 + 1] : t * 3 + 1,
      c = idx ? idx[t * 3 + 2] : t * 3 + 2;
    const y = Math.min(src[a * 3 + 1], src[b * 3 + 1], src[c * 3 + 1]);
    keys[t] = Math.ceil((y + Y0) * Q) * 4194304 + t;
  }
  keys.sort();
  const sortedIndex = new Uint32Array(tris * 3);
  const sortedMinY = new Float32Array(tris);
  for (let i = 0; i < tris; i++) {
    const k = keys[i];
    const t = k % 4194304;
    sortedIndex[i * 3] = idx ? idx[t * 3] : t * 3;
    sortedIndex[i * 3 + 1] = idx ? idx[t * 3 + 1] : t * 3 + 1;
    sortedIndex[i * 3 + 2] = idx ? idx[t * 3 + 2] : t * 3 + 2;
    sortedMinY[i] = (k - t) / 4194304 / Q - Y0;
  }
  const out = { index: sortedIndex, minY: sortedMinY };
  orderCache.set(source, out);
  return out;
}

/**
 * A private copy of the bracket with its triangles sorted by lowest y, so each frame draws only the triangles that
 * reach below the cut (drawRange): the unprinted part costs nothing in the colour, cap and shadow passes. The copy is
 * ours to dispose; the shared geometry is never touched.
 */
export function createGrowthGeometry(source: BufferGeometry) {
  const pos = source.getAttribute('position');
  const { index: sortedIndex, minY: sortedMinY } = sortedOrder(source);
  const tris = sortedMinY.length;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute((pos.array as Float32Array).slice(), 3));
  geometry.setAttribute(
    'normal',
    new BufferAttribute((source.getAttribute('normal').array as Float32Array).slice(), 3),
  );
  geometry.setIndex(new BufferAttribute(sortedIndex.slice(), 1));
  geometry.boundingBox = source.boundingBox?.clone() ?? null;
  geometry.boundingSphere = source.boundingSphere?.clone() ?? null;

  /** Draws every triangle whose lowest corner is at or below `clip` (mm). */
  const setClip = (clip: number) => {
    let lo = 0,
      hi = tris;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedMinY[mid] <= clip) lo = mid + 1;
      else hi = mid;
    }
    geometry.setDrawRange(0, lo * 3);
  };
  return { geometry, setClip };
}

/** Vertices well above the cut collapse to one point outside the clip volume, so the unprinted part never rasterizes. */
const collapse = 'if (position.y > uClip + 2.0) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);';

export function createGrowthMaterials(sdfGLSL: string, glow: { pos: { value: Vector3 }; color: { value: Vector3 } }) {
  const sdf = withoutFloor(sdfGLSL);
  const uniforms: GrowthUniforms = {
    uClip: { value: 0.05 },
    uHeat: { value: 0 },
    uBedY: { value: 0 },
    uDetail: { value: 1 },
    uBeadIn: { value: 1 },
    uGlowPos: glow.pos,
    uGlowColor: glow.color,
  };

  // Two draws: the walls first, then the back faces as the cap. A discard shader gets no early depth write, but a
  // fragment can still be rejected early against depth already written, so hidden back faces never run the cap maths.
  // Standard, not Physical; the PA12-CF sheen is a cheap grazing rim.
  const front = new MeshStandardMaterial({
    color: '#1B1C20',
    roughness: 0.62,
    metalness: 0,
    side: FrontSide,
    shadowSide: BackSide,
  });
  const back = new MeshStandardMaterial({ color: '#1B1C20', roughness: 0.62, metalness: 0, side: BackSide });
  back.defines = { CAP_PASS: '' };

  const onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    Object.assign(s.uniforms, uniforms);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexHead}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertexBody}`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n${collapse}`);
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
${paletteGLSL}
${hashGLSL}
${sdf.glsl}
const float FLOOR_K = ${sdf.k};
uniform float uClip;
uniform float uHeat;
uniform float uBedY;
uniform float uDetail;
uniform float uBeadIn;
uniform vec3 uGlowPos;
uniform vec3 uGlowColor;
centroid varying vec3 vPart;
centroid varying vec3 vWorldP;
const float GK = 6.28318530718 / ${TOOLPATH.infillCell.toFixed(3)};
const float BW = ${TOOLPATH.lineWidth.toFixed(3)};
const vec3 SHEEN = vec3(0.016, 0.019, 0.026);
float beadRidge(float d) { float u = clamp(abs(d) / (BW * 0.55), 0.0, 1.0); return sqrt(1.0 - u * u); }
`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        /* glsl */ `#include <clipping_planes_fragment>
  if (vPart.y > uClip) discard;
  #ifdef CAP_PASS
  const bool isCap = true;
  #else
  const bool isCap = false;
  #endif
  vec3 capRd = vWorldP - cameraPosition;
  float capT = abs(capRd.y) > 1e-5 ? (uBedY + uClip - cameraPosition.y) / capRd.y : 1.0;
  vec3 capW = isCap ? cameraPosition + capRd * clamp(capT, 0.0, 1.0) : vWorldP;
  float capFw = length(fwidth(capW.xz));
  float capH = 0.0;
  float capGap = 1.0;
  if (isCap) {
    vec3 cp = vec3(capW.x, uClip - 0.025, capW.z);
    float detail = (1.0 - smoothstep(0.08, 0.24, capFw)) * uDetail;
    if (detail > 0.0) {
      float yy = cp.y;
      float dOut = yy < FLOOR_K ? -yy - FLOOR_K + 2.0 * sqrt(FLOOR_K * max(yy, 0.0)) : 0.0;
      float d = sdOptimized(cp) - dOut;
      float hp = max(max(beadRidge(d + BW * 0.5), beadRidge(d + BW * 1.5)), beadRidge(d + BW * 2.5));
      vec3 sg = sin(GK * cp), cg = cos(GK * cp);
      float g = sg.x * cg.y + sg.y * cg.z + sg.z * cg.x;
      vec2 gr = GK * vec2(cg.x * cg.y - sg.z * sg.x, -sg.y * sg.z + cg.z * cg.x);
      float hi = beadRidge(g / max(length(gr), 1e-3)) * step(d, 0.1 - BW * 3.0);
      float h = d > 0.05 - BW * 3.0 ? hp : hi;
      capH = mix(0.55, h, detail);
      capGap = mix(1.0, smoothstep(0.0, 0.3, h) * 0.75 + 0.25, detail);
    } else {
      capH = 0.55;
    }
    if (capH < 1.0 - uBeadIn) discard;
  }
`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
  float age = isCap ? 0.0 : max(0.0, uClip - vPart.y);
  float heat = exp(-age / 0.22) * uHeat;
  if (isCap) diffuseColor.rgb *= 0.7 + 0.5 * capH;
  diffuseColor.rgb *= capGap;
  {
    float fwC = length(fwidth(vPart));
    float glint = step(0.985, hash13(floor(vPart * 5.0))) * (1.0 - smoothstep(0.03, 0.12, fwC));
    diffuseColor.rgb += glint * 0.18;
  }
`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, 0.22, smoothstep(0.1, 0.8, heat));
  if (isCap) roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.7, capH);
`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
  {
    vec3 up = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    float fy = fwidth(vPart.y);
    float ridge = sin(vPart.y * 125.6637) * 0.012 * (1.0 - smoothstep(0.012, 0.04, fy));
    vec3 bpos = isCap ? (viewMatrix * vec4(capW, 1.0)).xyz : -vViewPosition;
    vec3 bn = isCap ? up : normal;
    float bh = isCap ? capH * 0.16 : ridge;
    vec3 dpdx = dFdx(bpos), dpdy = dFdy(bpos);
    float dhx = dFdx(bh), dhy = dFdy(bh);
    vec3 r1 = cross(dpdy, bn), r2 = cross(bn, dpdx);
    float det = dot(dpdx, r1);
    normal = normalize(abs(det) * bn - sign(det) * (dhx * r1 + dhy * r2));
  }
`,
      )
      .replace(
        '#include <lights_fragment_begin>',
        ShaderChunk.lights_fragment_begin.replaceAll('receiveShadow', '(receiveShadow && !isCap)'),
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
  {
    vec3 hot = mix(PAL_MOLTEN_DEEP * 0.5, PAL_MOLTEN * 1.6, smoothstep(0.1, 0.5, heat));
    hot = mix(hot, PAL_MOLTEN_CORE * 2.4, smoothstep(0.62, 1.0, heat));
    float band = smoothstep(0.0, 0.06, heat) * (1.0 - smoothstep(0.35, 0.8, age));
    if (isCap) hot *= capGap * (0.03 + 0.2 * capH * capH);
    totalEmissiveRadiance += hot * band;
    float rim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
    totalEmissiveRadiance += SHEEN * (rim * rim * rim) * (isCap ? 0.0 : 1.0);
    vec3 gd = capW - uGlowPos;
    { float gq = 1.0 + dot(gd, gd) * 0.05; totalEmissiveRadiance += diffuseColor.rgb * uGlowColor / (gq * gq); }
  }
`,
      );
  };
  front.onBeforeCompile = onBeforeCompile;
  back.onBeforeCompile = onBeforeCompile;
  front.customProgramCacheKey = () => 'ch5-growth-front';
  back.customProgramCacheKey = () => 'ch5-growth-back';

  // side as the shadow pass sets it (the walls' shadowSide), so the compile-time program is the one it uses
  const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: BackSide });
  depth.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    s.uniforms.uClip = uniforms.uClip;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uClip;\nvarying float vPartY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPartY = position.y;')
      .replace('#include <project_vertex>', `#include <project_vertex>\n${collapse}`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uClip;\nvarying float vPartY;')
      .replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\n  if (vPartY > uClip) discard;',
      );
  };
  depth.customProgramCacheKey = () => 'ch5-growth-depth';

  return { front, back, depth, uniforms };
}
