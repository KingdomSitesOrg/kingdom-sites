'use client';

import { useEffect, useMemo } from 'react';
import { AdditiveBlending, PlaneGeometry, ShaderMaterial, SphereGeometry } from 'three';
import { paletteGLSL } from '@/strata/shaders/palette';

/**
 * The molten dot carried across the 0 -> 1 crossfade (STORYBOARD 4, H1): an emissive sphere r 1.6 mm whose core
 * (--molten-core 80 % of the way to --molten-hot, x 2) shades to a --molten x 4 rim, so AgX keeps it an ember
 * rather than a white disc, under a camera-facing additive --molten halo 3 radii wide. Built to match
 * ch1-idea/dot.ts exactly (same geometry, colour, halo falloff and draw order) so the dot is pixel-identical on
 * both sides of the seam.
 */
export const MOLTEN_DOT = { radius: 1.6, core: 2, heat: 0.8, rim: 4, haloScale: 3, halo: 0.35 } as const;

const coreFrag = /* glsl */ `
${paletteGLSL}
uniform float uOpacity;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = 1.0 - max(dot(normalize(vN), normalize(vV)), 0.0);
  vec3 core = mix(PAL_MOLTEN_CORE, PAL_MOLTEN_HOT, ${MOLTEN_DOT.heat.toFixed(2)}) * ${MOLTEN_DOT.core.toFixed(1)};
  vec3 col = mix(core, PAL_MOLTEN * ${MOLTEN_DOT.rim.toFixed(1)}, f * f);
  gl_FragColor = vec4(col * uOpacity, 1.0);
}`;

const coreVert = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalMatrix * normal;
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const haloVert = /* glsl */ `
uniform float uSize;
varying vec2 vUv;
void main() {
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * uSize;
  vUv = position.xy;
  gl_Position = projectionMatrix * mv;
}`;

const haloFrag = /* glsl */ `
${paletteGLSL}
uniform float uIntensity;
varying vec2 vUv;
void main() {
  float r = length(vUv);
  if (r >= 1.0) discard;
  float g = exp(-r * r * 5.0) * (1.0 - r);
  gl_FragColor = vec4(PAL_MOLTEN * (g * ${MOLTEN_DOT.halo.toFixed(2)} * uIntensity), 1.0);
}`;

export function createMoltenDot() {
  const sphere = new SphereGeometry(MOLTEN_DOT.radius, 32, 16);
  const quad = new PlaneGeometry(2, 2);
  const core = new ShaderMaterial({
    vertexShader: coreVert,
    fragmentShader: coreFrag,
    uniforms: { uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
  });
  const halo = new ShaderMaterial({
    vertexShader: haloVert,
    fragmentShader: haloFrag,
    uniforms: { uSize: { value: MOLTEN_DOT.radius * MOLTEN_DOT.haloScale }, uIntensity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  return {
    sphere,
    quad,
    core,
    halo,
    /** 0 hides the dot. */
    setOpacity(v: number) {
      core.uniforms.uOpacity.value = v;
      halo.uniforms.uIntensity.value = v;
    },
    /** Inside Ch0 the hotend may hide the dot; across the seam it draws on top, as Ch1's does. */
    setOccluded(on: boolean) {
      core.depthTest = on;
    },
    dispose() {
      sphere.dispose();
      quad.dispose();
      core.dispose();
      halo.dispose();
    },
  };
}

export type MoltenDotParts = ReturnType<typeof createMoltenDot>;

/** Renders a dot made by createMoltenDot at `position` (dot first, halo over it). */
export function MoltenDot({ position, parts }: { position: readonly [number, number, number]; parts: MoltenDotParts }) {
  return (
    <group position={position as [number, number, number]}>
      <mesh geometry={parts.sphere} material={parts.core} renderOrder={1} frustumCulled={false} />
      <mesh geometry={parts.quad} material={parts.halo} renderOrder={2} frustumCulled={false} />
    </group>
  );
}

/** Owns a dot for the lifetime of the calling component. */
export function useMoltenDot() {
  const parts = useMemo(() => createMoltenDot(), []);
  useEffect(() => () => parts.dispose(), [parts]);
  return parts;
}
