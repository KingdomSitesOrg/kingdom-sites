/**
 * The canonical palette (STORYBOARD 3.1) as GLSL constants, linear-light RGB (sRGB hex decoded), so a
 * shader colour matches the CSS token after the renderer's sRGB output. Multiply emissives above 1 for
 * bloom (molten core x 6 for the hot dot). Mirrors src/app/globals.css and src/ui/tokens.ts.
 */
import { materials, palette, type MaterialToken, type PaletteToken } from '@/strata/ui/tokens';

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** Linear RGB triple for a palette token, for uniforms and three Color.setRGB(..., LinearSRGBColorSpace). */
export function linearRGB(token: PaletteToken): [number, number, number] {
  const hex = palette[token];
  const n = parseInt(hex.slice(1), 16);
  return [toLinear(((n >> 16) & 255) / 255), toLinear(((n >> 8) & 255) / 255), toLinear((n & 255) / 255)];
}

/** Linear RGB triple for a STORYBOARD 3.2 material colour (`materials` in '@/strata/ui'). */
export function materialLinear(name: MaterialToken): [number, number, number] {
  const n = parseInt(materials[name].slice(1), 16);
  return [toLinear(((n >> 16) & 255) / 255), toLinear(((n >> 8) & 255) / 255), toLinear((n & 255) / 255)];
}

const vec3 = (token: PaletteToken) => {
  const [r, g, b] = linearRGB(token);
  return `vec3(${r.toFixed(5)}, ${g.toFixed(5)}, ${b.toFixed(5)})`;
};

const NAMES: [string, PaletteToken][] = [
  ['BG_0', 'bg-0'],
  ['BG_1', 'bg-1'],
  ['BG_2', 'bg-2'],
  ['BG_3', 'bg-3'],
  ['TEXT_1', 'text-1'],
  ['TEXT_2', 'text-2'],
  ['MOLTEN', 'molten'],
  ['MOLTEN_HOT', 'molten-hot'],
  ['MOLTEN_CORE', 'molten-core'],
  ['MOLTEN_DEEP', 'molten-deep'],
  ['RESIN', 'resin'],
  ['RESIN_DEEP', 'resin-deep'],
  ['UV', 'uv'],
  ['OK', 'ok'],
  ['STRESS_LO', 'stress-lo'],
  ['STRESS_MID', 'stress-mid'],
  ['STRESS_HI', 'stress-hi'],
];

/** `const vec3 PAL_MOLTEN = vec3(...)` etc. Include once per shader; guarded. */
export const paletteGLSL = /* glsl */ `
#ifndef STRATA_PALETTE
#define STRATA_PALETTE
${NAMES.map(([n, t]) => `const vec3 PAL_${n} = ${vec3(t)};`).join('\n')}
#endif
`;
