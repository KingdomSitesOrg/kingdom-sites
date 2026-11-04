import { Color, MeshPhysicalMaterial, ShaderMaterial, Vector3, Vector4, type IUniform, type Texture, type WebGLProgramParametersWithUniforms } from 'three';
import { linearRGB, paletteGLSL } from '@/strata/shaders/palette';
import { RX, RY } from './filament';

export interface SceneUniforms {
  /** 1 = shown, 0 = background. Letters, plate and hotend fade together. */
  uFade: IUniform<number>;
  uBg: IUniform<Color>;
  /** Scales the filament's residual heat glow. */
  uHeat: IUniform<number>;
  /** Extra fade for every letter but the period (they sink into bokeh on the macro push). */
  uLetters: IUniform<number>;
  /** Extrusion distance (mm) where the closing period starts. */
  uPeriodFrom: IUniform<number>;
  /** The period's own fade: it goes first in the exit, so only the molten dot reaches Ch1. */
  uPeriod: IUniform<number>;
}

export function createSceneUniforms(): SceneUniforms {
  return {
    uFade: { value: 0 },
    uBg: { value: new Color().setRGB(...linearRGB('bg-0')) },
    uHeat: { value: 1 },
    uLetters: { value: 1 },
    uPeriodFrom: { value: 1e9 },
    uPeriod: { value: 1 },
  };
}

const FADE = /* glsl */ `
gl_FragColor.rgb = mix(uBg, gl_FragColor.rgb, uFade * uFade);
#include <dithering_fragment>`;

/**
 * Pearl PA filament. The bead normal is rebuilt per pixel from the profile angle (smooth, round beads from a
 * coarse ring), layer grooves and the plate contact are occluded, and the last-laid filament keeps a molten glow.
 */
export function createFilamentMaterial(u: SceneUniforms) {
  const m = new MeshPhysicalMaterial({
    color: new Color('#ECE7DF'),
    roughness: 0.36,
    clearcoat: 0.3,
    clearcoatRoughness: 0.32,
    sheen: 0.6,
    sheenRoughness: 0.45,
    sheenColor: new Color('#FFF1DE'),
  });
  m.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    s.uniforms.uFade = u.uFade;
    s.uniforms.uBg = u.uBg;
    s.uniforms.uHeat = u.uHeat;
    s.uniforms.uLetters = u.uLetters;
    s.uniforms.uPeriodFrom = u.uPeriodFrom;
    s.uniforms.uPeriod = u.uPeriod;
    s.vertexShader = s.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute vec3 aLat;
attribute vec2 aProf;
attribute vec2 aData;
varying vec3 vLatV;
varying vec3 vUpV;
varying vec2 vProf;
varying vec2 vData;`,
      )
      .replace(
        '#include <defaultnormal_vertex>',
        `#include <defaultnormal_vertex>
vLatV = normalMatrix * aLat;
vUpV = normalMatrix * vec3(0.0, 1.0, 0.0);
vProf = aProf;
vData = aData;`,
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
${paletteGLSL}
uniform float uFade;
uniform vec3 uBg;
uniform float uHeat;
uniform float uLetters;
uniform float uPeriodFrom;
uniform float uPeriod;
varying vec3 vLatV;
varying vec3 vUpV;
varying vec2 vProf;
varying vec2 vData;
vec3 heatRamp(float h) {
  vec3 c = mix(PAL_MOLTEN_DEEP * 0.5, PAL_MOLTEN, smoothstep(0.04, 0.45, h));
  c = mix(c, PAL_MOLTEN_CORE, smoothstep(0.55, 1.0, h));
  return c * (6.0 * h * h);
}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
diffuseColor.rgb *= 1.0 - 0.9 * smoothstep(0.08, 0.55, vData.y);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
normal = normalize(vLatV * (cos(vProf.x) / ${RX.toFixed(4)}) + normalize(vUpV) * (sin(vProf.x) / ${RY.toFixed(4)}));
nonPerturbedNormal = normal;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
totalEmissiveRadiance += heatRamp(vData.y) * uHeat;`,
      )
      .replace(
        '#include <aomap_fragment>',
        `#include <aomap_fragment>
{
  float occ = vProf.y;
  reflectedLight.indirectDiffuse *= occ;
  reflectedLight.indirectSpecular *= mix(1.0, occ, 0.85);
  reflectedLight.directDiffuse *= mix(1.0, occ, 0.55);
  reflectedLight.directSpecular *= mix(1.0, occ, 0.5);
}`,
      )
      .replace(
        '#include <dithering_fragment>',
        `float shown = mix(uLetters * uLetters, uPeriod * uPeriod, step(uPeriodFrom, vData.x));
// Faded beads write no depth: depth of field through the 0 -> 1 crossfade reads Ch0's depth.
if (shown < 0.002) discard;
gl_FragColor.rgb = mix(uBg, gl_FragColor.rgb, shown);
${FADE}`,
      );
  };
  m.customProgramCacheKey = () => 'ig-filament';
  return m;
}

export interface PlateUniforms {
  /** World position of the hot nozzle tip and its radiance (linear, already scaled by intensity). */
  uLightPos: IUniform<Vector3>;
  uLightColor: IUniform<Color>;
}

const plateVert = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const plateFrag = /* glsl */ `
${paletteGLSL}
uniform float uFade;
uniform vec3 uBg;
uniform sampler2D uContact;
uniform sampler2D uGrain;
uniform vec4 uRect;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform vec3 uKeyDir;
varying vec3 vWorld;
const float PI = 3.14159265;
void main() {
  vec2 xz = vWorld.xz;
  vec3 V = normalize(cameraPosition - vWorld);
  float nv = max(V.y, 1e-3);
  float grain = 0.72 + 0.42 * texture2D(uGrain, xz / 61.0).r + 0.22 * texture2D(uGrain, xz / 17.0 + 0.37).r;
  float rough = clamp(0.35 * grain, 0.12, 0.9);
  float a2 = rough * rough * rough * rough;

  vec2 cuv = (xz - uRect.xy) / uRect.zw;
  float inside = step(0.0, cuv.x) * step(cuv.x, 1.0) * step(0.0, cuv.y) * step(cuv.y, 1.0);
  vec2 c = texture2D(uContact, clamp(cuv, 0.0, 1.0)).rg * inside;
  float occ = 1.0 - 0.82 * c.r - 0.35 * c.g;

  // Studio floor: a navy pool of light under the headline, contact shadow under every letter.
  float r = length(xz * vec2(0.62, 1.0));
  vec3 col = PAL_BG_2 * 0.55 * exp(-r * r / (2.0 * 78.0 * 78.0)) * (1.0 - 0.75 * c.g);

  // The hot nozzle as a point light: GGX highlight plus a little diffuse, falling off with distance squared.
  vec3 L = uLightPos - vWorld;
  float d2 = dot(L, L);
  L *= inversesqrt(d2);
  vec3 H = normalize(L + V);
  float nl = max(L.y, 0.0);
  float nh = max(H.y, 0.0);
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * dd * dd);
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
  float vis = 0.5 / (nl * sqrt(nv * nv * (1.0 - a2) + a2) + nv * sqrt(nl * nl * (1.0 - a2) + a2) + 1e-4);
  col += uLightColor / d2 * (D * F * vis + 0.006) * nl * occ;

  // Softbox sheen: the key light's reflection, widened by roughness, stronger toward grazing (Fresnel).
  vec3 R = vec3(-V.x, V.y, -V.z);
  float fe = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  float box = smoothstep(0.86 - rough * 0.5, 1.0, dot(R, uKeyDir));
  col += (vec3(0.95, 0.93, 0.9) * 0.55 * box + PAL_BG_2 * 1.4) * fe * occ;

  float edge = smoothstep(110.0, 280.0, length(xz * vec2(0.82, 1.0)));
  col = mix(col, uBg, edge);
  gl_FragColor = vec4(mix(uBg, col, uFade * uFade), 1.0);
}`;

/**
 * The dark build plate as one light shader (it fills the frame, so it skips the physical IBL path): a navy pool
 * under the headline, contact shadows from a blurred stroke texture, the hot nozzle's GGX reflection, a softbox
 * sheen toward grazing angles, and a radial falloff into the void so its edge never shows.
 */
export function createPlateMaterial(
  u: SceneUniforms,
  light: PlateUniforms,
  maps: { contact: Texture; rough: Texture; contactRect: readonly [number, number, number, number] },
) {
  return new ShaderMaterial({
    vertexShader: plateVert,
    fragmentShader: plateFrag,
    uniforms: {
      uFade: u.uFade,
      uBg: u.uBg,
      uContact: { value: maps.contact },
      uGrain: { value: maps.rough },
      uRect: { value: new Vector4(...maps.contactRect) },
      uLightPos: light.uLightPos,
      uLightColor: light.uLightColor,
      uKeyDir: { value: new Vector3(0, 0.8, 0.6).normalize() },
    },
  });
}

/**
 * Hotend metals in one draw: aMat picks hardened steel (0), brushed aluminium (1), dark cartridge (2) or the
 * glowing nozzle tip (3).
 */
export function createHotendMaterial(u: SceneUniforms, tipGlow: IUniform<number>, show: IUniform<number>) {
  const m = new MeshPhysicalMaterial({ color: new Color('#5E6168'), metalness: 1, roughness: 0.3, transparent: true });
  m.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    s.uniforms.uFade = u.uFade;
    s.uniforms.uBg = u.uBg;
    s.uniforms.uTip = tipGlow;
    s.uniforms.uShow = show;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aMat;\nvarying float vMat;\nvarying vec3 vLocal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvMat = aMat;\nvLocal = position;`);
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
${paletteGLSL}
uniform float uFade;
uniform vec3 uBg;
uniform float uTip;
uniform float uShow;
varying float vMat;
varying vec3 vLocal;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float mSteel = 1.0 - step(0.5, vMat);
float mAlu = step(0.5, vMat) * (1.0 - step(1.5, vMat));
float mDark = step(1.5, vMat) * (1.0 - step(2.5, vMat));
float mTip = step(2.5, vMat);
diffuseColor.rgb = vec3(0.111, 0.120, 0.141) * (mSteel + mTip) + vec3(0.474, 0.508, 0.558) * mAlu + vec3(0.024, 0.026, 0.031) * mDark;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = 0.3 * (mSteel + mTip) + 0.3 * mAlu + 0.55 * mDark;`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
metalnessFactor = 1.0 - 0.45 * mDark;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
{
  float ring = 1.0 - smoothstep(0.0, 1.6, vLocal.y);
  totalEmissiveRadiance += mix(PAL_MOLTEN, PAL_MOLTEN_CORE, ring) * (mTip * 2.4 + mSteel * ring * ring * 0.7) * uTip;
}`,
      )
      .replace('#include <dithering_fragment>', `${FADE}\ngl_FragColor.a = uShow * uShow;`);
  };
  m.customProgramCacheKey = () => 'ig-hotend';
  return m;
}
