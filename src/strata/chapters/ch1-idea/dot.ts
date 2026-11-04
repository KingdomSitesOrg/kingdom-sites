import {
  AdditiveBlending,
  Color,
  LinearSRGBColorSpace,
  MeshBasicMaterial,
  ShaderMaterial,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { linearRGB, paletteGLSL } from '@/strata/shaders/palette';

/**
 * The molten dot shared with Ch0 across H1 (STORYBOARD 4): sphere r 1.6 mm, --molten-core leaning 80 % to --molten-hot, x 2, shading to a
 * --molten x 4 rim, under a --molten halo sprite. Matches ch0-ignition/MoltenDot.tsx exactly.
 */
export const DOT_RADIUS = 1.6;
export const DOT_GAIN = 2;
/** How far the core leans from --molten-core to --molten-hot. */
const DOT_HEAT = 0.8;
const RIM_GAIN = 4;
/** Halo quad half-size as a multiple of the dot radius. */
export const HALO_SCALE = 3;

export function createDotMaterial() {
  const core = linearRGB('molten-core');
  const hot = linearRGB('molten-hot');
  const [r, g, b] = core.map((v, i) => (v + (hot[i] - v) * DOT_HEAT) * DOT_GAIN);
  const c = new Color().setRGB(r, g, b, LinearSRGBColorSpace);
  const m = new MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, depthTest: false });
  m.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRimN;\nvarying vec3 vRimV;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRimN = normalMatrix * normal;\nvRimV = -mvPosition.xyz;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\n${paletteGLSL}\nvarying vec3 vRimN;\nvarying vec3 vRimV;`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float rimF = 1.0 - max(dot(normalize(vRimN), normalize(vRimV)), 0.0);
diffuseColor.rgb = mix(diffuseColor.rgb, PAL_MOLTEN * ${RIM_GAIN.toFixed(1)}, rimF * rimF);`,
      );
  };
  m.customProgramCacheKey = () => 'idea-dot';
  return m;
}

/** Camera-facing additive --molten glow at 0.35, falling off to nothing at 3 radii. */
export function createHaloMaterial() {
  return new ShaderMaterial({
    vertexShader: /* glsl */ `
      uniform float uSize;
      varying vec2 vUv;
      void main() {
        vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        mv.xy += position.xy * uSize;
        vUv = position.xy;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${paletteGLSL}
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        float r = length(vUv);
        if (r >= 1.0) discard;
        float g = exp(-r * r * 5.0) * (1.0 - r);
        gl_FragColor = vec4(PAL_MOLTEN * (g * 0.35 * uIntensity), 1.0);
      }
    `,
    uniforms: { uSize: { value: DOT_RADIUS * HALO_SCALE }, uIntensity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
}
