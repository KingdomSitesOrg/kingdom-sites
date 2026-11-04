'use client';

import { useRef } from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearFilter,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector4,
  type Group,
} from 'three';
import { seededRandom } from '@/strata/story';
import { paletteGLSL } from '@/strata/shaders/palette';
import type { PartData } from '@/strata/part';
import type { Loops } from '../../geometry';
import { anodised, box, brushed, chrome, cyl, merge, rbox } from '../../lib/build';
import { acquireGrain, grainGLSL, releaseGrain } from '../../lib/grain';
import { useCellFrame, useOwned, type CellLights } from '../../lib/frame';
import { patch, planeNormalGLSL } from '../../lib/patch';
import { SLA_LAYER_Y, slaBuiltY, slaDrips, slaFlash, slaMaskIndex, slaPlateY } from '../../timeline';

export const SLA_ORIGIN = -4800;
const RESIN_Y = 30;
const LCD = { w: 192, d: 120 } as const;
const MASK = { w: 512, h: 320 } as const;
const DRIPS = { high: 48, medium: 24, low: 12 } as const;
const G = 9810;
const HANG = 0.5;
const DRIP_PERIOD = 1.6;
const RINGS = 8;

/** The resin-cell rig: vat, LCD, Z column, plate and the inverted part. Origin at the vat floor centre. */
export function SlaCell({ part, sections, quality, lights }: {
  part: PartData | null;
  sections: Loops[] | null;
  quality: 'high' | 'medium' | 'low';
  lights: CellLights;
}) {
  const carriage = useRef<Group>(null);
  const drips = DRIPS[quality];

  const statics = useOwned(() => {
    const frame = merge([
      rbox(300, 60, 210, 0, -32, -5, 8),
      rbox(212, 4, 8, 0, -0.5, 64, 1.5),
      rbox(212, 4, 8, 0, -0.5, -64, 1.5),
      rbox(8, 46, 136, -101, 21, 0, 2),
      rbox(8, 46, 136, 101, 21, 0, 2),
      rbox(206, 5, 6, 0, 42.5, -63.5, 2),
      rbox(48, 302, 40, 0, 149, -128, 5),
      rbox(110, 10, 70, 0, -1, -126, 3),
    ]);
    const screw = merge([cyl(4, 290, 0, 145, -100), cyl(2.4, 296, -16, 148, -106), cyl(2.4, 296, 16, 148, -106)]);
    // Cutaway: the vat's camera-side wall and lip are left off, so the resin face itself is the window.
    const pane = box(188, 40, 2.5, 0, 20, -63.5);
    const plate = rbox(150, 10, 100, 0, 5, 0, 2.5);
    const arm = merge([rbox(76, 44, 28, 0, 36, -98, 5), rbox(42, 12, 90, 0, 16, -66, 4), cyl(11, 12, 0, 16, 18, 'y', 32), cyl(5, 22, 0, 26, 18, 'y', 24)]);
    const resin = box(188, RESIN_Y - 0.5, 120, 0, (RESIN_Y + 0.5) / 2, 0);
    const surface = new PlaneGeometry(188, 120, 1, 1).rotateX(-Math.PI / 2).translate(0, RESIN_Y, 0);
    const lcd = new PlaneGeometry(LCD.w, LCD.d).rotateX(-Math.PI / 2).translate(0, -0.6, 0);
    const shaft = merge(
      Array.from({ length: 6 }, (_, i) => new PlaneGeometry(LCD.w, LCD.d).rotateX(-Math.PI / 2).translate(0, 0.8 + i * 2.2, 0)),
    );
    const drop = new IcosahedronGeometry(1, 1);
    return {
      frame, screw, pane, plate, arm, resin, surface, lcd, shaft, drop,
      dispose() {
        [frame, screw, pane, plate, arm, resin, surface, lcd, shaft, drop].forEach((g) => g.dispose());
      },
    };
  }, []);

  const mats = useOwned(() => {
    const shared = {
      uFlash: { value: 0 },
      uMask: { value: null as CanvasTexture | null },
      uAmb: { value: 0 },
      uBuilt: { value: 0 },
      uPlate: { value: 0 },
      uActive: { value: 0 },
      uRings: { value: Array.from({ length: RINGS }, () => new Vector4(0, 0, -1, 0)) },
      uGrain: { value: acquireGrain() },
    };
    const frame = anodised('sla-frame');
    const arm = anodised('sla-arm');
    const plate = brushed('sla-plate', 'x');
    const screw = chrome();
    // Acrylic window: a cheap fresnel sheen with a soft studio-strip reflection, no lit pass.
    const pane = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - w.xyz);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main() {
          float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
          vec3 r = reflect(-normalize(vV), normalize(vN));
          float strip = smoothstep(0.82, 0.98, abs(r.x)) * smoothstep(-0.2, 0.4, r.y) + smoothstep(0.7, 0.95, r.y) * 0.5;
          vec3 c = vec3(0.012, 0.016, 0.03) + vec3(0.9) * strip * (0.08 + 0.5 * fr);
          gl_FragColor = vec4(c, 0.1 + fr * 0.45 + strip * 0.1);
        }`,
    });

    const lcd = new ShaderMaterial({
      uniforms: shared,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        ${paletteGLSL}
        uniform sampler2D uMask; uniform float uFlash;
        varying vec2 vUv;
        void main() {
          vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
          float m = texture2D(uMask, uv).r;
          vec2 px = fract(uv * vec2(${LCD.w}.0, ${LCD.d}.0) * 2.0);
          float grid = step(0.12, px.x) * step(0.12, px.y);
          vec3 idle = vec3(0.004, 0.005, 0.012) * (0.6 + 0.4 * grid);
          vec3 lit = PAL_UV * (0.08 + 22.0 * uFlash) * m * (0.75 + 0.25 * grid);
          gl_FragColor = vec4(idle + lit, 1.0);
        }`,
    });

    const shaft = new ShaderMaterial({
      uniforms: shared,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying float vY;
        void main() { vUv = uv; vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        ${paletteGLSL}
        uniform sampler2D uMask; uniform float uFlash;
        varying vec2 vUv; varying float vY;
        void main() {
          vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
          float spread = vY * 0.0018;
          float m = texture2D(uMask, uv + vec2(spread * 0.5, -spread * 0.8)).r;
          float fall = exp(-vY * 0.32);
          vec3 c = mix(PAL_UV * 1.4, PAL_RESIN * 1.2, smoothstep(0.0, 9.0, vY));
          gl_FragColor = vec4(c * m * fall * uFlash * 1.0, 1.0);
        }`,
    });

    const resin = new ShaderMaterial({
      uniforms: shared,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vW; varying vec3 vN; varying vec3 vL;
        void main() {
          vL = position;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        ${paletteGLSL}
        ${grainGLSL}
        uniform float uFlash; uniform float uAmb; uniform sampler2D uMask;
        varying vec3 vW; varying vec3 vN; varying vec3 vL;
        void main() {
          if (vN.y > 0.5) discard;
          vec3 V = normalize(cameraPosition - vW);
          float facing = abs(dot(normalize(vN), V));
          float h = clamp(vL.y / ${RESIN_Y}.0, 0.0, 1.0);
          float caustic = ch6G(vL.xz * 0.006 + vec2(uAmb * 0.004, 0.0)).x * ch6G(vL.xz * 0.011 + vec2(0.3, uAmb * 0.003)).x;
          vec3 body = PAL_RESIN_DEEP * (0.012 + 0.03 * h * h) + PAL_RESIN * caustic * 0.02;
          vec2 muv = vec2(vL.x / ${LCD.w}.0 + 0.5, vL.z / ${LCD.d}.0 + 0.5);
          float m = texture2D(uMask, vec2(muv.x, 1.0 - muv.y)).r;
          float centre = exp(-dot(vL.xz, vL.xz) / 2600.0);
          vec3 glow = uFlash * (PAL_RESIN * 0.09 * centre * (1.0 - h) + PAL_UV * 0.5 * exp(-h * 6.0) * (0.15 + m));
          float edge = pow(1.0 - facing, 2.0);
          float lip = smoothstep(0.93, 1.0, h);
          gl_FragColor = vec4(body + glow + PAL_RESIN * (edge * 0.03 + lip * 0.05), 0.42 + 0.3 * edge);
        }`,
    });

    const surface = patch(
      new MeshStandardMaterial({
        color: new Color('#0FA3C7'),
        roughness: 0.06,
        metalness: 0,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: DoubleSide,
        envMapIntensity: 1.4,
      }),
      {
        key: 'sla-surface',
        uniforms: shared,
        fragmentHead: `${planeNormalGLSL}\n${paletteGLSL}\nuniform float uAmb; uniform float uFlash; uniform vec4 uRings[${RINGS}];
          vec2 ch6Waves(vec2 p) {
            vec2 g = vec2(0.0);
            g += 0.010 * vec2(cos(p.x * 0.11 + uAmb * 1.3), 0.0);
            g += 0.008 * vec2(0.0, cos(p.y * 0.14 - uAmb * 1.1));
            g += 0.006 * vec2(0.7, 0.7) * cos(dot(p, vec2(0.07, 0.07)) * 1.7 + uAmb * 0.9);
            for (int i = 0; i < ${RINGS}; i++) {
              vec4 r = uRings[i];
              vec2 d = p - r.xy; float dist = length(d) + 1e-3;
              float front = r.z * 70.0;
              float x = (dist - front) / 2.2;
              float w = exp(-x * x) * r.w * step(0.0, r.z);
              g += w * 0.45 * cos((dist - front) * 2.4) * d / dist;
            }
            return g;
          }`,
        color: 'vec2 ch6G = ch6Waves(vObj.xz);',
        normal: 'normal = ch6PlaneNormal(ch6G); if (!gl_FrontFacing) normal = -normal;',
        emissive: 'totalEmissiveRadiance += uFlash * PAL_RESIN * 0.05;',
        end: `{ float fr = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 4.0);
          gl_FragColor.a = clamp(gl_FragColor.a + fr * 0.6, 0.0, 0.92); }`,
      },
    );

    const resinPart = patch(
      new MeshPhysicalMaterial({
        color: new Color(0.3, 0.72, 0.86),
        roughness: 0.05,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        envMapIntensity: 0.9,
      }),
      {
        key: 'sla-part',
        uniforms: shared,
        fragmentHead: `${paletteGLSL}\nuniform float uBuilt; uniform float uFlash; uniform float uPlate;`,
        color: 'if (vObj.y > uBuilt) discard;',
        emissive: `{
          float fresh = exp(-max(uBuilt - vObj.y, 0.0) / 0.7);
          totalEmissiveRadiance += PAL_UV * fresh * (0.15 + 5.0 * uFlash) + PAL_RESIN * (0.012 + 0.04 * uFlash);
        }`,
        end: `{ float fr = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
          gl_FragColor.a = clamp(gl_FragColor.a + fr * 0.35, 0.0, 0.8); }`,
      },
    );

    const drop = patch(
      new MeshPhysicalMaterial({
        color: new Color(0.55, 0.9, 1.0),
        roughness: 0.02,
        metalness: 0,
        clearcoat: 1,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        envMapIntensity: 2.2,
      }),
      {
        key: 'sla-drip',
        uniforms: shared,
        vertexHead: `attribute vec4 aDrip; uniform float uAmb; uniform float uPlate; uniform float uActive;
          varying float vVis;`,
        vertexMain: `{
          float t = fract(uAmb / ${DRIP_PERIOD.toFixed(2)} + aDrip.w);
          float y0 = uPlate - aDrip.z;
          float on = step(float(gl_InstanceID), uActive - 0.5);
          float grow = smoothstep(0.0, ${HANG}, t);
          float ft = max(t - ${HANG}, 0.0) * ${DRIP_PERIOD.toFixed(2)};
          float y = y0 - 0.5 * ${G}.0 * ft * ft - grow * 1.6;
          float v = ${G}.0 * ft;
          float size = 0.35 + 0.4 * fract(aDrip.w * 13.7);
          float r = mix(0.12, size, grow) * on * step(${RESIN_Y}.0, y);
          float stretch = 1.0 + min(v * 0.005, 3.2) + (1.0 - step(0.001, ft)) * grow * 1.8;
          transformed = vec3(transformed.x * r, transformed.y * r * stretch, transformed.z * r) + vec3(aDrip.x, y, aDrip.y);
          vVis = r;
        }`,
        fragmentHead: 'varying float vVis;',
        color: 'if (vVis <= 0.0) discard;',
      },
    );

    return {
      shared, frame, arm, plate, screw, pane, lcd, shaft, resin, surface, resinPart, drop,
      dispose() {
        [frame, arm, plate, screw, pane, lcd, shaft, resin, surface, resinPart, drop].forEach((m) => m.dispose());
        releaseGrain();
      },
    };
  }, []);

  // Four layer masks drawn once from the cured sections (even-odd), swapped by flash index.
  const masks = useOwned(() => {
    const list = SLA_LAYER_Y.map((_, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = MASK.w;
      canvas.height = MASK.h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, MASK.w, MASK.h);
      const s = sections?.[i];
      if (s) {
        const k = MASK.w / LCD.w;
        const path = new Path2D();
        for (const l of [...s.outer, ...s.holes]) {
          for (let j = 0; j < l.length; j += 2) {
            const x = (l[j] + LCD.w / 2) * k;
            const y = (l[j + 1] + LCD.d / 2) * k;
            if (j === 0) path.moveTo(x, y);
            else path.lineTo(x, y);
          }
          path.closePath();
        }
        ctx.fillStyle = '#fff';
        ctx.fill(path, 'evenodd');
      }
      const tex = new CanvasTexture(canvas);
      tex.flipY = false;
      tex.minFilter = LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    });
    return { list, dispose: () => list.forEach((t) => t.dispose()) };
  }, [sections]);

  const placeholder = useOwned(() => box(1, 1, 1, 0, 500, 0), []);

  const dripMesh = useOwned(() => {
    const geometry = statics.drop.clone();
    const rand = seededRandom(48);
    const data = new Float32Array(drips * 4);
    for (let i = 0; i < drips; i++) {
      const front = i === 0;
      const x = front ? 6 : 18 + rand() * 25;
      const z = front ? 14 : (rand() - 0.5) * 7;
      const yPart = front ? 33 : 42 - (z * z) / 24;
      data.set([x, z, yPart, rand()], i * 4);
    }
    geometry.setAttribute('aDrip', new InstancedBufferAttribute(data, 4));
    const mesh = new InstancedMesh(geometry, mats.drop, drips);
    const dummy = new Object3D();
    for (let i = 0; i < drips; i++) mesh.setMatrixAt(i, dummy.matrix);
    mesh.frustumCulled = false;
    return { mesh, data, dispose: () => geometry.dispose() };
  }, [drips, statics, mats]);

  useCellFrame(0, (f) => {
    const flash = slaFlash(f.raw);
    const plateY = slaPlateY(f.raw);
    const sh = mats.shared;
    sh.uFlash.value = flash;
    sh.uMask.value = masks.list[slaMaskIndex(f.raw)];
    sh.uAmb.value = f.amb;
    sh.uBuilt.value = slaBuiltY(f.raw);
    sh.uPlate.value = plateY;
    carriage.current?.position.set(0, plateY, 0);
    const active = Math.round(slaDrips(f.p) * drips);
    sh.uActive.value = active;

    // Ripple rings from the first drips, same analytic schedule as the vertex shader.
    for (let i = 0; i < RINGS; i++) {
      const r = sh.uRings.value[i];
      r.set(0, 0, -1, 0);
      if (i >= active || i >= drips) continue;
      const o = i * 4;
      const t = (((f.amb / DRIP_PERIOD + dripMesh.data[o + 3]) % 1) + 1) % 1;
      const fall = Math.sqrt((2 * Math.max(0, plateY - dripMesh.data[o + 2] - 1.6 - RESIN_Y)) / G) / DRIP_PERIOD;
      const land = HANG + fall;
      if (t > land) r.set(dripMesh.data[o], dripMesh.data[o + 1], (t - land) * DRIP_PERIOD, Math.max(0, 1 - (t - land) * 2.2));
    }

    lights.a.position.set(SLA_ORIGIN, 3, 0);
    lights.a.color.setRGB(0.55, 0.45, 1);
    lights.a.intensity = flash * 2600;
    lights.b.position.set(SLA_ORIGIN, 22, 48);
    lights.b.color.setRGB(0.3, 0.85, 1);
    lights.b.intensity = 30 + flash * 900;
  });

  return (
    <>
      <mesh geometry={statics.frame} material={mats.frame} />
      <mesh geometry={statics.screw} material={mats.screw} />
      <mesh geometry={statics.lcd} material={mats.lcd} />
      <group ref={carriage}>
        <mesh geometry={statics.plate} material={mats.plate} />
        <mesh geometry={statics.arm} material={mats.arm} />
        <group scale={[1, -1, 1]}>
          <mesh geometry={part?.optimized ?? placeholder} material={mats.resinPart} renderOrder={1} dispose={null} />
        </group>
      </group>
      <primitive object={dripMesh.mesh} renderOrder={2} />
      <mesh geometry={statics.resin} material={mats.resin} renderOrder={3} />
      <mesh geometry={statics.shaft} material={mats.shaft} renderOrder={4} />
      <mesh geometry={statics.surface} material={mats.surface} renderOrder={5} />
      <mesh geometry={statics.pane} material={mats.pane} renderOrder={6} />
    </>
  );
}
