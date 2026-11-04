'use client';

import { PlaneGeometry, ShaderMaterial, type Mesh } from 'three';
import { CABINET } from '@/strata/story/shared/cabinet';
import { useOwned } from './frame';

/** Hall floor under the rail: x from beyond SLA to short of the metal cabinet, the trucks' visible band in z. */
const HALL = { x0: -6200, x1: -500, z0: -5200, z1: 1600 } as const;

/**
 * The dark hall the trucks travel through: polished floor at the cabinet floor height with rows of dim marker
 * strips every 600 mm and a soft pool under each cell. Unlit and drawn only while a truck is on (uLit > 0).
 */
export function useHall() {
  return useOwned(() => {
    const w = HALL.x1 - HALL.x0;
    const d = HALL.z1 - HALL.z0;
    const geometry = new PlaneGeometry(w, d)
      .rotateX(-Math.PI / 2)
      .translate((HALL.x0 + HALL.x1) / 2, CABINET.floorY, (HALL.z0 + HALL.z1) / 2);
    const material = new ShaderMaterial({
      uniforms: { uLit: { value: 0 } },
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uLit; varying vec3 vW;
        void main() {
          vec2 q = vW.xz;
          vec2 cell = vec2(mod(q.x + 300.0, 600.0) - 300.0, mod(q.y + 600.0, 1200.0) - 600.0);
          float aa = max(fwidth(q.x), fwidth(q.y));
          float dash = (1.0 - smoothstep(110.0 - aa, 110.0 + aa, abs(cell.x))) * (1.0 - smoothstep(7.0 - aa, 7.0 + aa * 1.5, abs(cell.y)));
          float edge = smoothstep(${HALL.x0.toFixed(1)}, ${(HALL.x0 + 900).toFixed(1)}, q.x) * smoothstep(${HALL.x1.toFixed(1)}, ${(HALL.x1 - 900).toFixed(1)}, q.x)
            * smoothstep(${HALL.z0.toFixed(1)}, ${(HALL.z0 + 1800).toFixed(1)}, q.y) * smoothstep(${HALL.z1.toFixed(1)}, ${(HALL.z1 - 500).toFixed(1)}, q.y);
          vec2 a = q - vec2(-4800.0, -300.0);
          vec2 b = q - vec2(-2400.0, -300.0);
          float pools = exp(-dot(a, a) / 900000.0) + exp(-dot(b, b) / 900000.0);
          vec3 c = vec3(0.006, 0.008, 0.012) + vec3(0.05, 0.065, 0.09) * pools;
          c += vec3(0.62, 0.74, 0.95) * dash * 1.4 * (0.35 + 0.65 * pools);
          gl_FragColor = vec4(c * edge * uLit, 1.0);
        }`,
    });
    return {
      geometry,
      material,
      setMesh(mesh: Mesh | null, lit: number) {
        if (!mesh) return;
        material.uniforms.uLit.value = lit;
        mesh.visible = lit > 0.001;
      },
      dispose() {
        geometry.dispose();
        material.dispose();
      },
    };
  }, []);
}
