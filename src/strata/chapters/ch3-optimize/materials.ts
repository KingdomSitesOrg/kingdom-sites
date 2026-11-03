// Ch3 materials (STORYBOARD 3.2 + Ch3 shaders). All created up front, driven by uniforms only.
import {
  AdditiveBlending,
  Color,
  Data3DTexture,
  DoubleSide,
  FrontSide,
  LinearFilter,
  MeshPhysicalMaterial,
  RedFormat,
  RepeatWrapping,
  ShaderMaterial,
  Vector3,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { paletteGLSL } from '@/strata/shaders/palette';
import { BAND, fieldGLSL, noiseGLSL, noiseLattice, NOISE_RES } from './field';

/** Bead-blasted Ti-6Al-4V, the back of the eroding shell, and the section cap. */
const TITANIUM = new Color('#8C9096');
export const TITANIUM_ENV = 1.5;
const SHELL_BACK = new Color('#0A0D14');
/** How far behind the section plane the lattice is drawn (mm); deeper sheets are hidden by nearer ones. */
export const INFILL_DEPTH = 9;
const CAP = new Color('#12161E');

const f = (v: number) => (Number.isInteger(v) ? `${v}.0` : `${v}`);
const c3 = (c: Color) => `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`;

// Bead-blast micro-roughness: +-0.06 at 0.4 mm.
const microGLSL = /* glsl */ `
float ch3Micro(vec3 p) {
  return 0.7 * ch3Noise(p * 2.5) + 0.3 * ch3Noise(p * 5.3 + vec3(3.1, -7.7, 1.9));
}
`;

const posVert = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
}
`;

/** The value-noise lattice as a repeating, linear-filtered R8 volume (one fetch per octave). */
export function createNoiseTexture() {
  const n = NOISE_RES;
  const t = new Data3DTexture(noiseLattice(), n, n, n);
  t.format = RedFormat;
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = RepeatWrapping;
  t.unpackAlignment = 1;
  t.needsUpdate = true;
  return t;
}

/** The erosion field's inputs: the noise lattice and the part's sdOptimized volume (shared, never disposed). */
export function fieldUniforms(noise: Data3DTexture, sdf: Data3DTexture, box: { min: ArrayLike<number>; max: ArrayLike<number> }) {
  return {
    uNoise: { value: noise },
    uSdf: { value: sdf },
    uSdfMin: { value: new Vector3(box.min[0], box.min[1], box.min[2]) },
    uSdfMax: { value: new Vector3(box.max[0], box.max[1], box.max[2]) },
  };
}

type FieldUniforms = ReturnType<typeof fieldUniforms>;

/**
 * The solid design space. `erode` is the dissolving variant (discard, both sides); the plain one has no discard
 * so the GPU keeps hidden-surface removal while nothing erodes.
 */
export function createSolidMaterial(field: FieldUniforms, shared: { uThr: { value: number }; uBand: { value: number } }, erode: boolean) {
  // CSM extends its base material at runtime; its typing hides the physical properties.
  return solidMaterial(field, shared, erode) as ReturnType<typeof solidMaterial> & MeshPhysicalMaterial;
}

function solidMaterial(field: FieldUniforms, shared: { uThr: { value: number }; uBand: { value: number } }, erode: boolean) {
  if (!erode) {
    return new CustomShaderMaterial({
      baseMaterial: MeshPhysicalMaterial,
      color: TITANIUM,
      metalness: 1,
      roughness: 0.34,
      envMapIntensity: TITANIUM_ENV,
      side: FrontSide,
      uniforms: { uNoise: field.uNoise },
      vertexShader: posVert,
      fragmentShader: /* glsl */ `
${noiseGLSL}
${microGLSL}
varying vec3 vPos;
void main() {
  csm_Roughness = 0.34 + 0.06 * ch3Micro(vPos);
}
`,
    });
  }
  return new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    color: TITANIUM,
    metalness: 1,
    roughness: 0.34,
    envMapIntensity: TITANIUM_ENV,
    side: DoubleSide,
    uniforms: { ...field, ...shared },
    vertexShader: posVert,
    fragmentShader: /* glsl */ `
${paletteGLSL}
${fieldGLSL}
${microGLSL}
uniform float uThr;
uniform float uBand;
varying vec3 vPos;
void main() {
  float d;
  float fv = ch3Field(vPos, d);
  if (fv > uThr) discard;
  // The band hugs the front: at most ~4 px wide on screen, never on surfaces that already are the final part.
  float w = clamp(fwidth(fv) * 4.0, 0.06, ${f(BAND)});
  float e = 1.0 - smoothstep(0.0, w, uThr - fv);
  e *= uBand * smoothstep(0.15, 0.7, d);
  vec3 albedo = gl_FrontFacing ? csm_DiffuseColor.rgb : ${c3(SHELL_BACK)};
  albedo *= 1.0 - 0.7 * e;
  csm_DiffuseColor = vec4(albedo, 1.0);
  csm_Roughness = gl_FrontFacing ? 0.34 + 0.06 * ch3Micro(vPos) : 0.9;
  csm_Metalness = gl_FrontFacing ? 1.0 : 0.0;
  // Embers, not neon: the band's heat varies along the front.
  float ember = 0.4 + 0.6 * smoothstep(-0.35, 0.55, ch3Noise(vPos * 0.55 + vec3(3.7, 1.3, -2.1)));
  float e2 = e * e;
  csm_Emissive = (PAL_MOLTEN_CORE * 3.2 * e2 * e2 + PAL_MOLTEN * 1.5 * e2 + PAL_MOLTEN_DEEP * 0.45 * e) * ember;
}
`,
  });
}

export function optimizedUniforms(noise: Data3DTexture) {
  return {
    uNoise: { value: noise },
    uCut: { value: 22 },
    uCutOn: { value: 0 },
    uStress: { value: 0 },
    uFront: { value: 0 },
    uGlint: { value: 1 },
    uLoad: { value: new Vector3(31, 42, 0) },
    uSpan: { value: 80 },
    /** The wipe seam in drawing-buffer pixels from the bottom, and the device pixel ratio. */
    uSliceY: { value: -10 },
    uSlicePx: { value: 1 },
    uSlice: { value: 0 },
  };
}

/**
 * The optimized truss: titanium, stress heatmap, the exit slicing line and (`cut` variant only, which pays for
 * discard and both sides) the section cut.
 */
export function createOptimizedMaterial(uniforms: ReturnType<typeof optimizedUniforms>, cut: boolean) {
  const material = new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    color: TITANIUM,
    metalness: 1,
    roughness: 0.34,
    envMapIntensity: TITANIUM_ENV,
    side: cut ? DoubleSide : FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2,
    uniforms,
    vertexShader: /* glsl */ `
attribute float stress;
varying vec3 vPos;
varying float vStress;
void main() {
  vPos = position;
  vStress = stress;
}
`,
    fragmentShader: /* glsl */ `
${cut ? '#define CH3_CUT' : ''}
${paletteGLSL}
${noiseGLSL}
${microGLSL}
uniform float uCut;
uniform float uCutOn;
uniform float uStress;
uniform float uFront;
uniform float uGlint;
uniform vec3 uLoad;
uniform float uSpan;
uniform float uSliceY;
uniform float uSlicePx;
uniform float uSlice;
varying vec3 vPos;
varying float vStress;

vec3 ch3Heat(float s) {
  s = clamp(s, 0.0, 1.0);
  vec3 c = mix(PAL_STRESS_LO, PAL_STRESS_MID, smoothstep(0.12, 0.62, s));
  return mix(c, PAL_STRESS_HI, smoothstep(0.62, 0.96, s));
}

void main() {
#ifdef CH3_CUT
  if (vPos.z > uCut) discard;
#endif
  vec3 albedo = csm_DiffuseColor.rgb;
  float rough = 0.34 + 0.06 * ch3Micro(vPos);
  float metal = 1.0;
  vec3 emit = vec3(0.0);

  float dn = distance(vPos, uLoad) / uSpan;
  float reveal = 1.0 - smoothstep(uFront - 0.09, uFront, dn);
  float s = uStress * reveal;
  if (s > 0.001) {
    float k = vStress * 10.0;
    float iso = abs(fract(k) - 0.5);
    float isoLine = 1.0 - smoothstep(0.0, fwidth(k) * 1.3, 0.5 - iso);
    vec3 h = ch3Heat(vStress) * (1.0 - 0.3 * isoLine);
    albedo = mix(albedo, h, s);
    metal = mix(1.0, 0.3, s);
    rough = mix(rough, 0.3, s);
    emit += h * 0.07 * s;
  }
  float fe = uFront - dn;
  emit += vec3(1.0, 0.93, 0.8) * 1.1 * uGlint * exp(-fe * fe * 9000.0) * uStress * step(uFront, 1.04);

#ifdef CH3_CUT
  if (!gl_FrontFacing) {
    albedo = ${c3(CAP)};
    metal = 0.0;
    rough = 0.62;
    emit *= 0.0;
    csm_FragNormal = normalize((viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
  }
  // 0.4 mm at the section edge, never wider than ~2 px where the surface runs along the plane.
  float rimW = min(0.4, fwidth(vPos.z) * 2.0);
  float rim = (1.0 - smoothstep(0.0, rimW, uCut - vPos.z)) * uCutOn;
  emit += PAL_RESIN * 2.2 * rim;
#endif

  // The slicing plane is the renderer's wipe seam: the metal it has just cut through glows above it.
  float dy = (gl_FragCoord.y - uSliceY) / uSlicePx;
  float line = exp(-dy * dy * 0.12);
  float heat = step(0.0, dy) * exp(-dy * 0.075);
  emit += (PAL_MOLTEN_CORE * 5.0 * line + PAL_MOLTEN * 1.5 * heat) * uSlice;

  csm_DiffuseColor = vec4(albedo, 1.0);
  csm_Roughness = rough;
  csm_Metalness = metal;
  csm_Emissive = emit;
}
`,
  });
  // CSM extends its base material at runtime; its typing hides the physical properties.
  return material as typeof material & MeshPhysicalMaterial;
}

/** Gyroid infill, resin at 70 % with emissive 0.4, grown in by an organic front. */
export function createInfillMaterial(field: ReturnType<typeof fieldUniforms>) {
  const resin = new Color('#38E1FF');
  return new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    color: resin.clone().multiplyScalar(0.7),
    metalness: 0,
    roughness: 0.32,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    side: DoubleSide,
    uniforms: { ...field, uReveal: { value: 0 }, uCut: { value: 22 }, uDepth: { value: INFILL_DEPTH } },
    vertexShader: /* glsl */ `
varying vec3 vPos;
varying vec3 vWorld;
void main() {
  vPos = position;
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
}
`,
    fragmentShader: /* glsl */ `
${paletteGLSL}
${fieldGLSL}
uniform float uReveal;
uniform float uCut;
uniform float uDepth;
varying vec3 vPos;
varying vec3 vWorld;
void main() {
  float behind = uCut - vWorld.z;
  if (behind < 0.0 || behind > uDepth) discard;
  // While it swings into place the lattice only shows inside the part.
  if (ch3Sdf(vWorld) > -0.5) discard;
  float g = 0.5 + 0.5 * ch3Organic(vPos * 2.2 + vec3(4.0, 0.0, 0.0));
  g = mix(g, 1.0 - clamp(vPos.y / 44.0, 0.0, 1.0), 0.35);
  float t = uReveal * 1.12;
  if (g > t) discard;
  float edge = 1.0 - smoothstep(0.0, 0.07, t - g);
  // Sheets receding behind the section fall off into the dark; the sheet's cut (back faces seen through the
  // plane) is the bright, flat section pattern: resin at 70 % with emissive 0.4.
  float fade = 1.0 - smoothstep(uDepth * 0.12, uDepth, behind);
  fade *= fade;
  vec3 c = csm_DiffuseColor.rgb * 0.55 * fade;
  vec3 glow = PAL_RESIN * (0.12 * fade + 3.0 * edge * edge);
  if (!gl_FrontFacing) {
    c = csm_DiffuseColor.rgb;
    glow = PAL_RESIN * (0.4 + 3.0 * edge * edge);
    csm_FragNormal = normalize((viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
  }
  csm_DiffuseColor = vec4(c, 1.0);
  csm_Emissive = glow;
}
`,
  });
}

/** Load case: unlit cyan line meshes drawn on along aDraw. */
export function createLoadCaseMaterial() {
  return new ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uFade: { value: 1 } },
    vertexShader: /* glsl */ `
attribute float aDraw;
varying float vDraw;
void main() {
  vDraw = aDraw;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
    fragmentShader: /* glsl */ `
${paletteGLSL}
uniform float uDraw;
uniform float uFade;
varying float vDraw;
void main() {
  if (vDraw > uDraw || uFade <= 0.001) discard;
  float head = exp(-(uDraw - vDraw) * 60.0) * step(uDraw, 0.999);
  vec3 c = PAL_RESIN * 1.35 + vec3(1.0) * 2.5 * head;
  gl_FragColor = vec4(c * uFade, 1.0);
}
`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Dust and sparks thrown off the erosion front: released when the threshold passes their sample. */
export function createDustMaterial(field: ReturnType<typeof fieldUniforms>) {
  return new ShaderMaterial({
    uniforms: {
      ...field,
      uThr: { value: 100 },
      uLife: { value: 3.2 },
      uTime: { value: 0 },
      uSize: { value: 2.2 },
      uPixelRatio: { value: 1 },
      uOn: { value: 0 },
    },
    vertexShader: /* glsl */ `
${fieldGLSL}
attribute vec3 aNormal;
attribute float aSeed;
uniform float uThr;
uniform float uLife;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uOn;
varying float vAge;
varying float vSeed;
void main() {
  float d;
  float age = (ch3Field(position, d) - uThr) / uLife;
  if (uOn < 0.5 || age <= 0.0 || age >= 1.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }
  float a = aSeed * 6.2831853;
  vec3 jitter = vec3(cos(a), 0.35 + fract(aSeed * 7.31), sin(a)) * 0.7;
  vec3 dir = normalize(aNormal + jitter);
  float travel = 1.0 - (1.0 - age) * (1.0 - age);
  vec3 p = position + dir * travel * (4.0 + 7.0 * fract(aSeed * 3.7));
  p.y += age * age * 7.0;
  p += 0.8 * age * vec3(sin(uTime * 1.3 + a), sin(uTime * 1.1 + a * 1.7), cos(uTime * 1.2 + a));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (1.0 - 0.55 * age) * (0.55 + 0.9 * fract(aSeed * 13.1));
  vAge = age;
  vSeed = aSeed;
}
`,
    fragmentShader: /* glsl */ `
${paletteGLSL}
varying float vAge;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float soft = smoothstep(0.5, 0.1, d);
  vec3 hot = mix(PAL_MOLTEN_CORE * 5.0, PAL_MOLTEN * 1.6, smoothstep(0.0, 0.22, vAge));
  vec3 dust = vec3(0.32, 0.34, 0.38) * 0.55;
  vec3 c = mix(hot, dust, smoothstep(0.18, 0.5, vAge + 0.25 * vSeed));
  float a = (1.0 - vAge) * (1.0 - vAge) * soft;
  gl_FragColor = vec4(c * a, 1.0);
}
`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
}
