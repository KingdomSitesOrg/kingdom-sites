import { AdditiveBlending, ShaderMaterial } from 'three';
import { paletteGLSL } from '@/strata/shaders/palette';

/** Half-size (mm) of the design-space floor the cloud forms on. */
export const GRID_HALF = 150;

/** The design-space floor on y = 0: a faint resin pool under the part, a barely-there 10 mm grid within it. */
export function createGridMaterial() {
  return new ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vXZ = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      ${paletteGLSL}
      uniform float uOpacity;
      varying vec2 vXZ;
      float lines(vec2 p, float cell) {
        vec2 d = fwidth(p / cell);
        vec2 g = abs(fract(p / cell - 0.5) - 0.5) / d;
        // Lines thinner than a pixel fade instead of aliasing at grazing angles.
        float w = 1.0 - smoothstep(0.25, 0.6, max(d.x, d.y));
        return (1.0 - min(min(g.x, g.y), 1.0)) * w;
      }
      void main() {
        float r = length(vXZ * vec2(0.75, 1.0));
        float fade = smoothstep(${GRID_HALF.toFixed(1)}, 10.0, r);
        fade *= fade * fade;
        // A soft resin pool where the part will form, with a whisper of the 10 mm grid inside it.
        float pool = exp(-r * r / 5000.0);
        float a = (lines(vXZ, 10.0) * 0.16 * fade + pool * 0.3) * uOpacity;
        if (a <= 0.002) discard;
        gl_FragColor = vec4(PAL_RESIN_DEEP * a * 0.075, 1.0);
      }
    `,
    uniforms: { uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
}
