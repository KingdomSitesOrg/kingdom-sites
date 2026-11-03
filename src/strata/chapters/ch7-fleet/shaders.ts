import { paletteGLSL } from '@/strata/shaders/palette';
import { cabinetWindowGLSL } from '@/strata/story/shared/cabinet';
import { fleetBodyGLSL } from './body';
import { BEACON } from './geometry';

const f = (n: number) => n.toFixed(1);

/**
 * One window-state function drives every light in the hall (STORYBOARD Ch7): process colour, ambient
 * breathing and flicker [T], the neighbours' glow-up, the dispatch ripple, completion flashes [S] and [T],
 * lights-out back to front and the exit fade. Shared by the cabinet and floor-pool shaders, evaluated per
 * vertex (constant per instance), so the fragment cost is a lookup.
 */
const procGLSL = /* glsl */ `
${paletteGLSL}
vec3 procColor(float proc) {
  if (proc < 0.5) return PAL_MOLTEN * 2.6;
  if (proc < 1.5) return PAL_RESIN * 1.45;
  if (proc < 2.5) return vec3(1.0, 0.761, 0.479) * 1.25;
  return vec3(1.0, 0.62, 0.31) * 1.65;
}
`;

const windowGLSL = /* glsl */ `
${procGLSL}
uniform float uTime;
uniform float uP;
uniform float uRipple;
uniform float uOff;
uniform float uGlow;
uniform float uFade;
uniform float uFlashId;
uniform float uFlashAge;
uniform vec3 uHeroCol;
uniform float uHeroI;
uniform float uEdge;
uniform vec4 uHallBox;

attribute vec2 iPos;
attribute vec4 iA;
attribute vec4 iB;
attribute float iIndex;

float wHash(float n) { return fract(sin(n) * 43758.5453123); }

// The aerial's soft hall edge: the side columns and the back half dim towards the walls, so the hall
// fades into the haze instead of ending on a hard line (uEdge ramps it in for the pull-back).
float hallEdge() {
  vec2 c = vec2(uHallBox.x + uHallBox.y, uHallBox.z + uHallBox.w) * 0.5;
  vec2 h = vec2(uHallBox.y - uHallBox.x, uHallBox.w - uHallBox.z) * 0.5;
  float sx = smoothstep(0.45, 1.0, abs(iPos.x - c.x) / h.x);
  float sz = smoothstep(-0.1, 1.0, (c.y - iPos.y) / h.y);
  return 1.0 - uEdge * (1.0 - (1.0 - 0.9 * sx) * (1.0 - 0.96 * sz));
}

// Per-instance window state: base colour and level for cabinetWindow(), flash light added on top, the
// lights-out x exit-fade factor and the working level (status lights).
vec3 wBase;
vec3 wAdd;
float wLevel;
float wLit;
float wAct;
float wGlow;
float wEdge;
void windowState() {
  float proc = iA.x;
  float seed = iA.y;
  wEdge = hallEdge();
  wLit = clamp((uOff - iA.w) / 0.0006 + 1.0, 0.0, 1.0) * uFade * wEdge;
  wAdd = vec3(0.0);
  wGlow = 1.0;
  if (iB.z > 0.5) {
    wBase = uHeroCol;
    wLevel = uHeroI;
    wAct = 1.0;
    return;
  }
  vec3 col = procColor(proc);
  float t = uTime;
  float lv = 0.86 + 0.14 * sin(t * (0.45 + seed * 0.9) + seed * 41.0);
  if (proc > 2.5) {
    float f = wHash(floor(t * 17.0) + seed * 311.0);
    lv *= 0.8 + 0.4 * f * f;
  } else if (proc > 1.5) {
    lv *= 0.9 + 0.1 * sin(t * 2.3 + seed * 17.0);
  } else if (proc > 0.5) {
    float ph = fract(t / 4.2 + seed);
    float expo = smoothstep(0.0, 0.03, ph) * (1.0 - smoothstep(0.55, 0.6, ph));
    col = mix(col * 0.5, mix(col, PAL_UV * 1.7, 0.35), expo);
  }
  wGlow = smoothstep(iB.w, iB.w + 0.5, uGlow);
  lv *= wGlow;
  float d = uRipple - iA.z;
  lv *= mix(0.38, 1.0, smoothstep(0.0, 0.04, d));
  vec3 add = vec3(1.0, 0.92, 0.84) * 5.1 * exp(-max(d, 0.0) * 38.0) * step(0.0005, d);
  add += vec3(1.0, 0.97, 0.93) * 4.0 * exp(-abs(uP - iB.x) * 320.0);
  add += vec3(1.0, 0.97, 0.93) * 3.5 * (1.0 - step(0.5, abs(iIndex - uFlashId))) * exp(-uFlashAge * 10.0);
  float on = 1.0 - iB.y;
  wBase = col;
  wLevel = lv * on;
  wAdd = add * on;
  wAct = lv * on;
}

// The window's average emission (for the floor pools).
vec3 windowLight() {
  windowState();
  return (wBase * wLevel * 0.62 + wAdd) * wLit;
}
`;

const fogGLSL = /* glsl */ `
uniform vec3 uFogCol;
uniform vec3 uHaze;
uniform float uFogDensity;
uniform vec4 uHallBox;
// Warm haze lit by the windows, only over the hall footprint so the horizon stays clean.
vec3 fogColor(vec3 world) {
  vec2 q = world.xz;
  float mx = smoothstep(uHallBox.x - 9000.0, uHallBox.x + 4000.0, q.x) * smoothstep(uHallBox.y + 9000.0, uHallBox.y - 4000.0, q.x);
  float mz = smoothstep(uHallBox.z - 9000.0, uHallBox.z + 4000.0, q.y) * smoothstep(uHallBox.w + 9000.0, uHallBox.w - 2000.0, q.y);
  float low = 1.0 - smoothstep(-1100.0, 8000.0, world.y);
  return uFogCol + uHaze * mx * mz * (0.4 + 0.6 * low);
}
vec3 applyFog(vec3 col, vec3 world) {
  float d = length(world - cameraPosition);
  float f = 1.0 - exp(-pow(uFogDensity * d, 2.0));
  return mix(col, fogColor(world), f);
}
// Lights keep more of themselves through haze than surfaces do.
vec3 applyFogE(vec3 col, vec3 world) {
  float d = length(world - cameraPosition);
  float f = 1.0 - exp(-pow(uFogDensity * d, 2.0));
  return mix(col, fogColor(world), f * 0.6);
}
`;

export const cabinetVert = /* glsl */ `
${windowGLSL}
attribute float aZone;
attribute vec3 aCol;
attribute vec2 aUv;
uniform float uViewH;
varying float vBeam;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vCol;
varying vec2 vUv;
varying float vZone;
flat varying vec4 vWin;
flat varying vec4 vAdd;
flat varying vec4 vInst;
flat varying float vGlow;

// A far beacon bar is thinner than a pixel and breaks into shimmering dashes: widen its cross-section to
// at least 1.5 px and dim it by the same factor, so it keeps its energy as a steady line.
vec3 beaconMinWidth(vec3 p) {
  vBeam = 1.0;
  if (aZone < 11.5) return p;
  vec3 c = vec3(0.0, ${f(BEACON.y)}, ${f(BEACON.z)});
  vec3 dir = c + vec3(iPos.x, 0.0, iPos.y) - cameraPosition;
  float d = length(dir);
  float s = abs(dir.y) / d;
  float thick = ${f(BEACON.height)} * sqrt(1.0 - s * s) + ${f(BEACON.depth)} * s;
  float px = thick * uViewH * 0.5 * projectionMatrix[1][1] / d;
  float k = max(1.0, 1.5 / max(px, 1e-3));
  vBeam = 1.0 / k;
  return c + (p - c) * vec3(1.0, k, k);
}

void main() {
  vec3 p = beaconMinWidth(position);
  vec3 w = vec3(p.x + iPos.x, p.y, p.z + iPos.y);
  vWorld = w;
  vLocal = position;
  vNormal = normal;
  vCol = aCol;
  vUv = aUv;
  vZone = aZone;
  windowState();
  vWin = vec4(wBase, wLevel);
  vAdd = vec4(wAdd, wLit);
  vInst = vec4(iA.x, iA.y, iB.z, wAct);
  vGlow = wGlow * (0.2 + 0.8 * wEdge);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

export const cabinetFrag = /* glsl */ `
${procGLSL}
${cabinetWindowGLSL}
${fleetBodyGLSL}
${fogGLSL}
uniform vec3 uHeroLightPos;
uniform vec3 uHeroLightCol;
uniform vec3 uHeroHot;
uniform float uHeroHotspot;
uniform float uTopLight;
uniform float uHall;
uniform float uTime;
uniform float uStoryTime;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vCol;
varying vec2 vUv;
varying float vZone;
varying float vBeam;
flat varying vec4 vWin;
flat varying vec4 vAdd;
flat varying vec4 vInst;
flat varying float vGlow;

vec3 skyEnv(vec3 r) {
  return fleetSky(r, uTopLight, uHall);
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - vWorld);
  float z = vZone;
  vec3 lp = vLocal;
  float lit = vAdd.a;
  bool hero = vInst.z > 0.5;
  float dist = length(vWorld - cameraPosition);
  float boost = 1.0 + 1.4 * smoothstep(6000.0, 50000.0, dist);
  // The near (6 x 6) LOD becomes the far LOD with distance: aluminium trims to anodised, status strip out,
  // so the aerial never shows the LOD split.
  float lod = smoothstep(8000.0, 18000.0, dist);
  vec3 col;
  bool emissive = true;

  if (z < 0.5) {
    // Body: black anodised panels and brushed aluminium trims (vertex colours), lit by a dim cool top
    // light, the window's own glow on the bezel, the floor pool below and the hero's spill.
    emissive = false;
    vec3 albedo = mix(vCol, vec3(0.0080, 0.0091, 0.0123), lod * fleetMetal(vCol));
    col = fleetBody(albedo, n, v, lp, vWin.rgb * vWin.a * 0.62 * lit, uTopLight, uHall);
    vec3 hl = uHeroLightPos - vWorld;
    float hd = length(hl);
    float hAtt = 1.0 / (1.0 + hd * hd / (900.0 * 900.0));
    float own = hero ? 0.0 : 1.0;
    col += fleetBase(albedo) * uHeroLightCol * hAtt * max(dot(n, hl / hd), 0.0) * 3.0 * own;
    // Neighbours come up out of the dark with their windows (Ch6 ends on the hero alone).
    col *= vGlow;
  } else if (z < 7.5) {
    // The cabinet's own small lights: status strip (process colour in the fleet) and the HMI screen.
    bool hmi = vCol.b > vCol.r;
    vec3 c = hero ? vCol : hmi ? vCol * 0.3 : procColor(vInst.x) * vInst.w * 0.9;
    col = c * lit * boost * (hero ? 1.0 : 1.0 - lod);
  } else if (z < 10.5) {
    // The window: the shared cabinetWindow() glow behind dark glass.
    vec3 w;
    if (hero) {
      w = cabinetWindow(vUv, vWin.rgb, uHeroHot, vWin.a, uHeroHotspot, uStoryTime, 0.0);
    } else {
      vec3 hot = vInst.x > 0.5 && vInst.x < 1.5 ? vec3(0.75, 0.92, 1.0) : vec3(1.0, 0.9, 0.74);
      float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
      w = cabinetWindow(vUv, vWin.rgb, hot, vWin.a, 1.2, uTime, vInst.y) + vAdd.rgb * (0.45 + 0.55 * edge);
      // Far away only a window's edge shows past the cabinet in front: a centre-weighted window keeps
      // those slivers dim, so the far rows do not break into shimmering ticks.
      float far = smoothstep(22000.0, 55000.0, dist);
      float centre = smoothstep(0.0, 0.32, vUv.x) * smoothstep(1.0, 0.68, vUv.x) * smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
      w *= mix(1.0, 0.15 + 1.25 * centre, far);
    }
    col = w * lit * boost;
    float rim = pow(1.0 - abs(dot(v, vec3(0.0, 0.0, 1.0))), 3.0);
    float glassA = mix(0.25, 0.85, rim);
    vec3 glass = (vec3(0.0033, 0.0052, 0.0144) * 0.4 + skyEnv(reflect(-v, vec3(0.0, 0.0, 1.0))) * 0.8) * (0.25 + 0.75 * uTopLight / 0.6) * vGlow;
    col = col * (1.0 - glassA) + glass * glassA;
  } else {
    // Ch7's beacon bar on each roof: a line of process light that reads across the hall.
    float top = 0.18 + 0.82 * step(0.5, n.y);
    col = procColor(vInst.x) * vInst.w * lit * 0.42 * top * boost * boost * vBeam;
  }
  col = emissive ? applyFogE(col, vWorld) : applyFog(col, vWorld);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const poolVert = /* glsl */ `
${windowGLSL}
uniform float uAgvSpan;
uniform float uAgvCenter;
varying vec2 vUv;
varying vec3 vWorld;
flat varying vec3 vCol;
flat varying float vKind;

void main() {
  vUv = position.xy;
  vec3 w;
  if (iA.x > 8.5) {
    float dir = iB.x;
    float x = mod(iB.y + uTime * iB.w * dir, uAgvSpan) - uAgvSpan * 0.5 + uAgvCenter;
    float edge = smoothstep(uAgvSpan * 0.5, uAgvSpan * 0.5 - 4000.0, abs(x - uAgvCenter));
    w = vec3(x + position.x * 1400.0, -1100.0 + 6.0, iPos.y + (position.y - 0.5) * 1400.0);
    float lit = clamp((uOff - iA.w) / 0.004 + 1.0, 0.0, 1.0) * uFade;
    vCol = vec3(0.55, 0.85, 1.0) * 0.55 * edge * lit * smoothstep(0.0, 0.5, uGlow);
    vKind = 1.0;
  } else {
    w = vec3(iPos.x + position.x * 1050.0, -1100.0 + 6.0, iPos.y + 400.0 + position.y * 1500.0);
    vCol = windowLight() * 0.25;
    vKind = 0.0;
  }
  vWorld = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

export const poolFrag = /* glsl */ `
${fogGLSL}
varying vec2 vUv;
varying vec3 vWorld;
flat varying vec3 vCol;
flat varying float vKind;

void main() {
  float a;
  if (vKind > 0.5) {
    vec2 q = vec2(vUv.x * 2.0, (vUv.y - 0.5) * 2.0);
    a = exp(-dot(q, q) * 5.0) + exp(-dot(q, q) * 160.0) * 3.0;
  } else {
    float ax = abs(vUv.x);
    float core = exp(-ax * ax * 44.0);
    float soft = exp(-ax * ax * 9.0) * (1.0 - smoothstep(0.28, 0.5, ax));
    float along = pow(max(1.0 - vUv.y, 0.0), 2.2) * smoothstep(0.0, 0.06, vUv.y);
    a = (core * 0.75 + soft * 0.35) * along;
  }
  vec3 c = vCol * a;
  float d = length(vWorld - cameraPosition);
  float f = 1.0 - exp(-pow(uFogDensity * d, 2.0));
  gl_FragColor = vec4(c * (1.0 - 0.6 * f), 1.0);
}
`;

export const floorVert = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const floorFrag = /* glsl */ `
${fogGLSL}
uniform vec3 uHeroLightPos;
uniform vec3 uHeroLightCol;
uniform vec3 uHeroWin;
uniform float uTopLight;
uniform float uHall;
varying vec3 vWorld;

float fHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fHash(i);
  float b = fHash(i + vec2(1.0, 0.0));
  float c = fHash(i + vec2(0.0, 1.0));
  float d = fHash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float aaLine(float d, float w) {
  float fw = fwidth(d) + 1e-4;
  return 1.0 - smoothstep(w - fw, w + fw, abs(d));
}

void main() {
  vec2 p = vWorld.xz;
  vec3 v = normalize(cameraPosition - vWorld);
  float m = vnoise(p * 0.0007) * 0.6 + vnoise(p * 0.0031) * 0.4;
  vec3 base = vec3(0.0042, 0.0050, 0.0068) * (0.75 + 0.5 * m);
  float jx = aaLine(mod(p.x + 700.0, 4200.0) - 2100.0, 6.0);
  float jz = aaLine(mod(p.y, 4000.0) - 2000.0, 6.0);
  base *= 1.0 - 0.35 * max(jx, jz);
  float inHall = step(uHallBox.x, p.x) * step(p.x, uHallBox.y) * step(uHallBox.z, p.y) * step(p.y, uHallBox.w);
  float lane = mod(p.y - 1000.0, 2000.0) - 1000.0;
  float mark = aaLine(abs(lane) - 520.0, 22.0) * inHall * step(p.y, 1300.0);
  base = mix(base, vec3(0.020, 0.018, 0.014), mark * 0.6);

  vec3 col = base * uTopLight * vec3(0.55, 0.64, 0.85);
  vec3 hl = uHeroLightPos - vWorld;
  float hd = length(hl);
  float front = smoothstep(380.0, 900.0, p.y);
  float hAtt = 1.0 / (1.0 + hd * hd / (1100.0 * 1100.0));
  col += base * uHeroLightCol * hAtt * max(hl.y / hd, 0.0) * 5.0 * front;

  // Polished concrete: a soft vertical streak of the hero window, mirrored in the floor.
  vec3 r = reflect(-v, vec3(0.0, 1.0, 0.0));
  float tz = (400.0 - vWorld.z) / min(r.z, -1e-3);
  vec3 hit = vWorld + r * max(tz, 0.0);
  float wx = smoothstep(330.0, 200.0, abs(hit.x));
  float wy = smoothstep(-700.0, -60.0, hit.y) * smoothstep(420.0, 160.0, hit.y);
  float fres = 0.04 + 0.96 * pow(1.0 - max(v.y, 0.0), 5.0);
  col += uHeroWin * wx * wy * step(0.0, tz) * step(r.z, -1e-3) * (0.08 + 0.5 * fres) * front;
  col += vec3(0.04, 0.024, 0.012) * uHall * fres * 0.25;

  col = applyFog(col, vWorld);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const trayVert = /* glsl */ `
attribute vec2 iPos;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vLocal;
uniform vec3 uTraySize;
void main() {
  vec3 l = position * uTraySize;
  vec3 w = vec3(l.x + iPos.x, l.y + 2700.0, l.z + iPos.y);
  vWorld = w;
  vNormal = normal;
  vLocal = l;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

export const trayFrag = /* glsl */ `
${fogGLSL}
uniform float uTopLight;
uniform float uHall;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vLocal;
void main() {
  vec3 n = normalize(vNormal);
  float rung = step(0.72, fract(vLocal.x / 300.0));
  vec3 base = vec3(0.012, 0.013, 0.016) * (1.0 + rung * 0.6 * step(0.5, n.y));
  vec3 col = base * uTopLight * vec3(0.55, 0.64, 0.85) * (0.4 + 0.6 * max(n.y, 0.0));
  col += vec3(0.05, 0.03, 0.015) * uHall * max(-n.y, 0.0) * 0.15;
  col = applyFog(col, vWorld);
  gl_FragColor = vec4(col, 1.0);
}
`;
