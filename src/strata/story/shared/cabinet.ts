import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  LinearSRGBColorSpace,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { linearRGB } from '@/strata/shaders/palette';
import type { PaletteToken } from '@/strata/ui/tokens';

/**
 * The procedural LPBF cabinet (STORYBOARD 2.3, Ch6, Ch7, H₇). One function builds every level of
 * detail from the same dimensions, so Ch6's hero cabinet and Ch7's hall agree at the crossfade:
 * 900 W x 1,700 H x 800 D, floor y = -1,100, front face z = +400, window 520 x 360 centred at
 * (0, 60, 400). Millimetres, origin at the metal cell's build plate (O₃).
 *
 *   'full' (Ch6 hero): door, vents, bezel, handle, HMI, status strip; the chamber behind the window is
 *          left open for Ch6's own interior.
 *   'near' (Ch7, 6 x 6 around the hero): shell with the window opening, bezel, handle, status strip.
 *   'far'  (Ch7, the rest): one box with the window quad.
 *
 * Geometries carry a linear `color` attribute (body, lights) and are merged per material, so Ch7 can
 * instance each with one draw call. The caller owns and disposes everything returned.
 */

export const CABINET = {
  width: 900,
  height: 1700,
  depth: 800,
  floorY: -1100,
  topY: 600,
  frontZ: 400,
  window: { width: 520, height: 360, center: [0, 60, 400] as const },
  /** Window glow plane, just behind the glass. */
  windowZ: 396,
  glassZ: 404,
} as const;

export type CabinetDetail = 'full' | 'near' | 'far';

export interface CabinetGeometry {
  /** Shell, trims and recesses (vertex colours), one material: cabinetMaterials().body. */
  body: BufferGeometry;
  /** Window glass pane (null on far). */
  glass: BufferGeometry | null;
  /** Emissive window plane with uv 0..1 across the opening. */
  window: BufferGeometry;
  /** Small emissives: status strip, HMI screen (vertex colours, HDR). Null on far. */
  lights: BufferGeometry | null;
}

/** sRGB hex (a STORYBOARD 3.2 material value) to linear RGB. */
const hexLinear = (hex: string): [number, number, number] => {
  const c = new Color().setStyle(hex);
  return [c.r, c.g, c.b];
};
const tok = (t: PaletteToken, k = 1): [number, number, number] => {
  const [r, g, b] = linearRGB(t);
  return [r * k, g * k, b * k];
};

/** STORYBOARD 3.2: black anodised panels, brushed aluminium trims, a darker recess. */
const C = {
  anodised: hexLinear('#16181D'),
  panel: hexLinear('#1C1F26'),
  recess: hexLinear('#07080B'),
  aluminium: hexLinear('#B7BCC4'),
  status: tok('molten', 2.2),
  hmi: tok('ok', 1.5),
};

function box(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  color: readonly [number, number, number],
): BufferGeometry {
  const g = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return paint(g, color);
}

function paint(g: BufferGeometry, color: readonly [number, number, number]): BufferGeometry {
  const n = g.getAttribute('position').count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    c[i * 3] = color[0];
    c[i * 3 + 1] = color[1];
    c[i * 3 + 2] = color[2];
  }
  g.setAttribute('color', new BufferAttribute(c, 3));
  return g;
}

function merge(parts: BufferGeometry[]): BufferGeometry {
  const g = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!g) throw new Error('cabinet: merge failed');
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

function windowPlane(z: number): BufferGeometry {
  const { width, height, center } = CABINET.window;
  const g = new PlaneGeometry(width, height);
  g.translate(center[0], center[1], z);
  return g;
}

export function buildCabinet(detail: CabinetDetail): CabinetGeometry {
  const W = CABINET.width / 2;
  const D = CABINET.depth / 2;
  const F = CABINET.floorY;
  const T = CABINET.topY;
  const Z = CABINET.frontZ;
  const wx = CABINET.window.width / 2;
  const wy0 = CABINET.window.center[1] - CABINET.window.height / 2;
  const wy1 = CABINET.window.center[1] + CABINET.window.height / 2;

  if (detail === 'far') {
    return {
      body: merge([box(-W, W, F, T, -D, Z, C.anodised)]),
      glass: null,
      window: windowPlane(Z + 1),
      lights: null,
    };
  }

  const bandY0 = wy0 - 80;
  const bandY1 = wy1 + 90;
  const chamberBack = -300;
  const body: BufferGeometry[] = [
    // Plinth (recessed kick), lower body, window band (columns, sill, header, chamber back), upper body, cap.
    box(-W + 20, W - 20, F, F + 60, -D + 20, Z - 30, C.recess),
    box(-W, W, F + 60, bandY0, -D, Z, C.anodised),
    box(-W, -wx, bandY0, bandY1, -D, Z, C.anodised),
    box(wx, W, bandY0, bandY1, -D, Z, C.anodised),
    box(-wx, wx, bandY0, wy0, -D, Z, C.anodised),
    box(-wx, wx, wy1, bandY1, -D, Z, C.anodised),
    box(-wx, wx, wy0, wy1, -D, chamberBack, C.recess),
    box(-W, W, bandY1, T - 40, -D, Z, C.anodised),
    box(-W + 5, W - 5, T - 40, T, -D + 5, Z - 5, C.aluminium),
    // Window bezel.
    box(-wx - 24, wx + 24, wy0 - 24, wy0, Z, Z + 12, C.aluminium),
    box(-wx - 24, wx + 24, wy1, wy1 + 24, Z, Z + 12, C.aluminium),
    box(-wx - 24, -wx, wy0, wy1, Z, Z + 12, C.aluminium),
    box(wx, wx + 24, wy0, wy1, Z, Z + 12, C.aluminium),
    // Door handle.
    box(wx + 70, wx + 86, wy0 + 20, wy1 - 20, Z + 12, Z + 40, C.aluminium),
  ];
  const lights: BufferGeometry[] = [box(-300, 300, T - 30, T - 20, Z - 6, Z + 1, C.status)];

  if (detail === 'full') {
    // Powder-handling door with a seam, six vent slats, chamber side walls and floor lip, HMI.
    body.push(box(-W + 12, W - 12, F + 80, bandY0 - 20, Z, Z + 3, C.panel));
    for (let i = 0; i < 6; i++) {
      const y = F + 180 + i * 34;
      body.push(box(-220, 220, y, y + 12, Z + 3, Z + 10, C.recess));
    }
    body.push(box(-wx, -wx + 6, wy0, wy1, chamberBack, Z, C.recess));
    body.push(box(wx - 6, wx, wy0, wy1, chamberBack, Z, C.recess));
    body.push(box(-wx - 40, wx + 40, bandY1 + 40, bandY1 + 44, Z, Z + 2, C.aluminium));
    // Panel seams on the upper body and the window band, and a slim LED status strip beside the window.
    for (const x of [-W / 3, W / 3]) body.push(box(x - 2, x + 2, bandY1 + 60, T - 40, Z, Z + 1, C.recess));
    body.push(box(-W, W, bandY1 + 56, bandY1 + 60, Z, Z + 1, C.recess));
    body.push(box(-W, W, bandY0 - 4, bandY0, Z, Z + 1, C.recess));
    lights.push(box(wx + 44, wx + 50, wy0 + 40, wy1 - 40, Z + 12, Z + 14, C.hmi));
  }

  const glass = new PlaneGeometry(CABINET.window.width, CABINET.window.height);
  glass.translate(CABINET.window.center[0], CABINET.window.center[1], CABINET.glassZ);

  return { body: merge(body), glass, window: windowPlane(CABINET.windowZ), lights: merge(lights) };
}

/** The warm window: LPBF amber-white at HDR intensity with a slow hotspot (the laser at work). */
export const WINDOW_PARAMS = {
  color: tok('molten-hot'),
  hot: tok('molten-core'),
  intensity: 1.6,
  hotspot: 1.8,
} as const;

/**
 * vec3 cabinetWindow(vec2 uv, vec3 base, vec3 hot, float intensity, float hotspot, float time, float phase)
 * Ch7 calls it from its instanced shader with per-instance colour and phase; the hero uses phase 0 and
 * WINDOW_PARAMS. Pass the shared story clock (`prog.time`) so Ch6 and Ch7 match at H₇.
 */
export const cabinetWindowGLSL = /* glsl */ `
#ifndef STRATA_CABINET_WINDOW
#define STRATA_CABINET_WINDOW
vec3 cabinetWindow(vec2 uv, vec3 base, vec3 hot, float intensity, float hotspot, float time, float phase) {
  // The chamber through the glass: lit back wall, LED bar, powder bed with a bright front lip, parked recoater.
  const float BED = 0.3;
  float side = smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x);
  float roof = smoothstep(1.0, 0.84, uv.y);
  float bed = step(uv.y, BED);
  float wall = mix(0.42, 1.0, smoothstep(0.95, BED, uv.y));
  float powder = 0.22 + 0.26 * smoothstep(0.0, BED, uv.y);
  float coater = step(0.08, uv.x) * step(uv.x, 0.15) * step(BED, uv.y) * step(uv.y, BED + 0.14);
  float shade = mix(wall, powder, bed) * (0.2 + 0.8 * side) * (0.45 + 0.55 * roof) * (1.0 - 0.8 * coater);
  float lip = exp(-(uv.y - BED) * (uv.y - BED) * 9000.0) * step(0.1, uv.x) * step(uv.x, 0.9);
  float led = exp(-(uv.y - 0.9) * (uv.y - 0.9) * 5000.0) * (0.3 + 0.7 * side);
  vec2 hp = vec2(0.5 + 0.26 * sin(time * 0.7 + phase * 6.2832), BED - 0.06 + 0.03 * sin(time * 1.3 + phase * 3.1));
  vec2 d = (uv - hp) * vec2(1.44, 1.0);
  float spot = exp(-dot(d, d) * 55.0);
  float pool = exp(-dot(d, d) * 8.0);
  return base * intensity * (shade + 0.9 * lip + 0.8 * led + 0.45 * pool * (0.4 + 0.6 * bed)) + hot * intensity * hotspot * spot;
}
#endif
`;

export interface CabinetMaterials {
  body: MeshStandardMaterial;
  glass: MeshStandardMaterial;
  window: ShaderMaterial;
  lights: MeshBasicMaterial;
  dispose(): void;
}

/**
 * Materials for the hero cabinet (Ch6 full, Ch7 hero). Window uniforms: uIntensity (0..1 scale of
 * WINDOW_PARAMS.intensity; Ch7 lights-out writes it), uTime (shared story clock), uPhase.
 */
export function createCabinetMaterials(): CabinetMaterials {
  const body = new MeshStandardMaterial({ vertexColors: true, metalness: 0.6, roughness: 0.42 });
  const glass = new MeshStandardMaterial({
    color: new Color().setRGB(...linearRGB('bg-2'), LinearSRGBColorSpace),
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    side: DoubleSide,
  });
  glass.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
      float rim = pow(1.0 - saturate(abs(dot(normalize(vViewPosition), normal))), 3.0);
      gl_FragColor.a = mix(gl_FragColor.a, 0.85, rim);`,
    );
  };
  glass.customProgramCacheKey = () => 'strata-cabinet-glass';
  const windowMat = new ShaderMaterial({
    uniforms: {
      uBase: { value: new Color().setRGB(...WINDOW_PARAMS.color, LinearSRGBColorSpace) },
      uHot: { value: new Color().setRGB(...WINDOW_PARAMS.hot, LinearSRGBColorSpace) },
      uIntensity: { value: 1 },
      uTime: { value: 0 },
      uPhase: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${cabinetWindowGLSL}
      uniform vec3 uBase;
      uniform vec3 uHot;
      uniform float uIntensity;
      uniform float uTime;
      uniform float uPhase;
      varying vec2 vUv;
      void main() {
        vec3 c = cabinetWindow(vUv, uBase, uHot, ${WINDOW_PARAMS.intensity.toFixed(3)} * uIntensity, ${WINDOW_PARAMS.hotspot.toFixed(3)}, uTime, uPhase);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const lights = new MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  return {
    body,
    glass,
    window: windowMat,
    lights,
    dispose() {
      body.dispose();
      glass.dispose();
      windowMat.dispose();
      lights.dispose();
    },
  };
}
