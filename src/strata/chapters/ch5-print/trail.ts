// The bead being laid (STORYBOARD Ch5 "Bead trail"): instanced flattened capsules over the last 40 mm of printed
// path behind the nozzle, rebuilt from the toolpath for the current p (pure). Heat runs molten core -> molten ->
// PA12-CF black along the trail; only the touched instance range is uploaded.
import {
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { paletteGLSL } from '@/strata/shaders/palette';
import { facts } from '@/strata/story';
import { TRAIL_MM } from './motion';

const BEAD_W = facts.fdmProof.beadMM * 1.08;
const BEAD_H = 0.075;

export interface Trail {
  mesh: InstancedMesh;
  pieces: Float32Array;
  max: number;
  update(count: number, y: number): void;
  dispose(): void;
}

export function createTrail(max: number): Trail {
  const geo = new CylinderGeometry(0.5, 0.5, 1, 10, 1, false);
  geo.rotateZ(Math.PI / 2);
  const heat = new InstancedBufferAttribute(new Float32Array(max), 1);
  heat.setUsage(DynamicDrawUsage);
  geo.setAttribute('aHeat', heat);

  const material = new MeshStandardMaterial({ color: '#1B1C20', roughness: 0.38, metalness: 0 });
  material.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aHeat;\nvarying float vHeat;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeat = aHeat;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\n${paletteGLSL}\nvarying float vHeat;`)
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
  {
    float h = pow(vHeat, 2.2);
    vec3 c = mix(PAL_MOLTEN_DEEP * 0.45, PAL_MOLTEN * 2.0, smoothstep(0.06, 0.4, h));
    c = mix(c, PAL_MOLTEN_CORE * 4.5, smoothstep(0.62, 0.95, h));
    totalEmissiveRadiance += c * smoothstep(0.0, 0.08, h);
    diffuseColor.rgb *= 1.0 - 0.6 * smoothstep(0.05, 0.3, h);
  }
`,
      );
  };
  material.customProgramCacheKey = () => 'ch5-trail';

  const mesh = new InstancedMesh(geo, material, max);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false;
  const pieces = new Float32Array(max * 5);
  const m = mesh.instanceMatrix.array as Float32Array;
  const h = heat.array as Float32Array;

  return {
    mesh,
    pieces,
    max,
    update(count, y) {
      for (let i = 0; i < count; i++) {
        const o = i * 5;
        const ax = pieces[o],
          az = pieces[o + 1],
          bx = pieces[o + 2],
          bz = pieces[o + 3];
        const dx = bx - ax,
          dz = bz - az;
        const len = Math.sqrt(dx * dx + dz * dz);
        const c = len > 1e-6 ? dx / len : 1;
        const s = len > 1e-6 ? -dz / len : 0;
        const sx = len + BEAD_W * 0.6;
        const e = i * 16;
        m[e] = c * sx;
        m[e + 1] = 0;
        m[e + 2] = -s * sx;
        m[e + 3] = 0;
        m[e + 4] = 0;
        m[e + 5] = BEAD_H;
        m[e + 6] = 0;
        m[e + 7] = 0;
        m[e + 8] = s * BEAD_W;
        m[e + 9] = 0;
        m[e + 10] = c * BEAD_W;
        m[e + 11] = 0;
        m[e + 12] = (ax + bx) * 0.5;
        m[e + 13] = y;
        m[e + 14] = (az + bz) * 0.5;
        m[e + 15] = 1;
        h[i] = Math.max(0, 1 - pieces[o + 4] / TRAIL_MM);
      }
      mesh.count = count;
      if (count > 0) {
        mesh.instanceMatrix.clearUpdateRanges();
        mesh.instanceMatrix.addUpdateRange(0, count * 16);
        mesh.instanceMatrix.needsUpdate = true;
        heat.clearUpdateRanges();
        heat.addUpdateRange(0, count);
        heat.needsUpdate = true;
      }
    },
    dispose() {
      geo.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
