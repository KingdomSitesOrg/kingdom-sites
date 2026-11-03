// Faint build-plate grid at y = 0: 5 mm minor, 25 mm major, radial falloff, antialiased with derivatives. Across
// the exit crossfade it also lays down Ch5's dark PEI bed and the glow its nozzle throws on it, so the frame warms
// into the next chapter instead of only fading.
import { AdditiveBlending, Color, ShaderMaterial, Vector3 } from 'three';
import { linearRGB } from '@/strata/shaders/palette';

const vert = /* glsl */ `
varying vec2 vXZ;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vXZ = w.xz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const frag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAxis;
uniform float uAlpha;
uniform float uRadius;
uniform vec3 uBed;
uniform vec3 uBedBase;
uniform float uBedAmt;
uniform vec3 uGlowPos;
uniform vec3 uGlowCol;
varying vec2 vXZ;

float grid(vec2 p, float s, float px) {
  vec2 q = p / s;
  vec2 fw = fwidth(q);
  vec2 g = abs(fract(q - 0.5) - 0.5) / max(fw, 1e-4);
  float l = 1.0 - min(min(g.x, g.y) / px, 1.0);
  // fade lines that would alias into a solid wash
  return l * (1.0 - smoothstep(0.25, 0.6, max(fw.x, fw.y)));
}

void main() {
  float r = length(vXZ * vec2(0.8, 1.15));
  float fade = 1.0 - smoothstep(uRadius * 0.3, uRadius, r);
  float minor = grid(vXZ, 5.0, 1.0);
  float major = grid(vXZ, 25.0, 1.2);
  vec2 ad = abs(vXZ) / max(fwidth(vXZ), vec2(1e-4));
  float axis = (1.0 - min(min(ad.x, ad.y), 1.0)) * (1.0 - smoothstep(30.0, 90.0, r));
  vec3 col = uColor * (minor * 0.22 + major * 0.45) + uAxis * axis * 0.2;
  float a = uAlpha * fade;
  vec3 gd = vec3(vXZ.x, 0.0, vXZ.y) - uGlowPos;
  float gq = 1.0 + dot(gd, gd) * 0.05;
  vec3 bed = (uBedBase + uBed * uGlowCol / (gq * gq)) * uBedAmt;
  gl_FragColor = vec4(col * a + bed, 1.0);
}
`;

export function createGridMaterial() {
  return new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uColor: { value: new Color().setRGB(...linearRGB('text-2')).multiplyScalar(0.085) },
      uAxis: { value: new Color().setRGB(...linearRGB('resin')).multiplyScalar(0.2) },
      uAlpha: { value: 0 },
      uRadius: { value: 130 },
      uBed: { value: new Color('#2B2620').multiplyScalar(0.45) },
      uBedBase: { value: new Color('#2B2620').multiplyScalar(0.3) },
      uBedAmt: { value: 0 },
      uGlowPos: { value: new Vector3() },
      // Ch5's nozzle glow on the bed: molten-hot x 14 (ch5-print/Scene.tsx).
      uGlowCol: { value: new Vector3(...linearRGB('molten-hot')).multiplyScalar(14) },
    },
    transparent: true,
    depthWrite: true,
    blending: AdditiveBlending,
  });
}
