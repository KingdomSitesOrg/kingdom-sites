'use client';

import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DataTexture,
  DoubleSide,
  FloatType,
  HalfFloatType,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderTarget,
  type Group,
  type Texture,
} from 'three';
import { seededRandom } from '@/strata/story';
import { paletteGLSL } from '@/strata/shaders/palette';
import type { PartData } from '@/strata/part';
import type { GeometryResult } from '../../geometry';
import { CABINET, WINDOW_PARAMS, buildCabinet, createCabinetMaterials } from '@/strata/story/shared/cabinet';
import { anodised, box, brushed, cyl, merge } from '../../lib/build';
import { acquireGrain, grainGLSL, releaseGrain } from '../../lib/grain';
import { useCellFrame, useOwned, type CellLights } from '../../lib/frame';
import { heatGLSL, patch, planeNormalGLSL } from '../../lib/patch';
import {
  LPBF_DRAIN,
  LPBF_QA,
  LPBF_RISE,
  LPBF_SCAN,
  lpbfChamberLight,
  lpbfHead,
  lpbfPartTemp,
  lpbfScanY,
  lpbfOutro,
  lpbfSurface,
  range,
} from '../../timeline';
import { HALL_TOP_LIGHT, fleetBodyGLSL } from '../../../ch7-fleet/body';
import { facts } from '@/strata/story/facts';

const SPARKS = { high: 2000, medium: 800, low: 300 } as const;
const SECTION = { x: 46, z: 23, w: 512, h: 256 } as const;
/** The open chamber behind the cabinet window: inside the shared cabinet's window band (x +-254, y -120..240, back -300). */
const ROOM = { x: 250, y0: -118, y1: 236, zb: -296, zf: 400 } as const;

export type MetalState = { pool: Vector3; poolOn: number; partHeat: number };

export function LpbfCell({ part, geo, quality, lights, state }: {
  part: PartData | null;
  geo: GeometryResult | null;
  quality: 'high' | 'medium' | 'low';
  lights: CellLights;
  state: MetalState;
}) {
  const gl = useThree((s) => s.gl);
  const surface = useRef<Mesh>(null);
  const pool = useRef<Group>(null);
  const shell = useRef<Group>(null);
  const partMesh = useRef<Mesh>(null);
  const sheet = useRef<Mesh>(null);
  const sparkCount = SPARKS[quality];

  const statics = useOwned(() => {
    const plane = (w: number, h: number) => new PlaneGeometry(w, h);
    const W = ROOM.x * 2;
    const Hh = ROOM.y1 - ROOM.y0;
    const cy = (ROOM.y1 + ROOM.y0) / 2;
    const D = ROOM.zf - ROOM.zb;
    const cz = (ROOM.zf + ROOM.zb) / 2;
    const room = merge([
      plane(W, Hh).translate(0, cy, ROOM.zb),
      plane(D, Hh).rotateY(Math.PI / 2).translate(-ROOM.x, cy, cz),
      plane(D, Hh).rotateY(-Math.PI / 2).translate(ROOM.x, cy, cz),
      plane(W, D).rotateX(Math.PI / 2).translate(0, ROOM.y1, cz),
    ]);
    const fixtures = merge([
      box(420, 40, 12, 0, 92, ROOM.zb + 6),
      cyl(56, 22, 0, ROOM.y1 - 11, 0),
      box(14, 12, 600, -228, 46, 0),
      box(14, 12, 600, 228, 46, 0),
      box(36, 30, 40, -228, 60, -262),
      box(36, 30, 40, 228, 60, -262),
    ]);
    const slats = merge(Array.from({ length: 10 }, (_, i) => box(30, 34, 4, -189 + i * 42, 92, ROOM.zb + 12.5)));
    const recoater = merge([box(470, 22, 26, 0, 72, -258), box(440, 10, 8, 0, 56, -250)]);
    const plateGeo = box(250, 14, 250, 0, -7, 0);
    const leds = merge([box(460, 8, 8, 0, ROOM.y1 - 10, ROOM.zb + 20), box(460, 8, 8, 0, ROOM.y1 - 10, ROOM.zf - 40)]);
    const lens = cyl(40, 1, 0, ROOM.y1 - 22.6, 0, 'y', 40);
    const powder = new PlaneGeometry(ROOM.x * 2 - 4, ROOM.zf - ROOM.zb - 4, 1, 1)
      .rotateX(-Math.PI / 2)
      .translate(0, 0, (ROOM.zf + ROOM.zb) / 2);
    const poolGeo = new SphereGeometry(0.5, 16, 12);
    const halo = new PlaneGeometry(1, 1);
    const spark = new PlaneGeometry(1, 1);
    const floor = new PlaneGeometry(14000, 14000).rotateX(-Math.PI / 2).translate(0, CABINET.floorY, 0);
    const pool2 = new PlaneGeometry(900, 2400).rotateX(-Math.PI / 2).translate(0, CABINET.floorY + 0.5, CABINET.frontZ + 1150);
    const sheet = new PlaneGeometry(140, 70).rotateX(-Math.PI / 2);
    const cabinet = buildCabinet('full');
    return {
      room, fixtures, slats, recoater, plateGeo, leds, lens, powder, poolGeo, halo, spark, floor, pool2, sheet, cabinet,
      dispose() {
        [room, fixtures, slats, recoater, plateGeo, leds, lens, powder, poolGeo, halo, spark, floor, pool2, sheet].forEach((g) => g.dispose());
        [cabinet.body, cabinet.glass, cabinet.window, cabinet.lights].forEach((g) => g?.dispose());
      },
    };
  }, []);

  const lines = useOwned(() => {
    const count = geo ? geo.lpbf.count : 1;
    const data = new Float32Array(Math.max(1, count) * 4);
    if (geo) data.set(geo.lpbf.table);
    const tex = new DataTexture(data, Math.max(1, count), 1, RGBAFormat, FloatType);
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }, [geo]);

  const section = useOwned(() => {
    const rt = new WebGLRenderTarget(SECTION.w, SECTION.h, {
      type: HalfFloatType,
      depthBuffer: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      generateMipmaps: false,
    });
    const scene = new Scene();
    const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new PlaneGeometry(2, 2);
    const mat = new ShaderMaterial({
      uniforms: { uY: { value: 2 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */ `
        ${part ? part.sdfGLSL : 'float sdOptimized(vec3 p) { return 10.0; }'}
        uniform float uY; varying vec2 vUv;
        void main() {
          vec3 p = vec3(mix(-${SECTION.x}.0, ${SECTION.x}.0, vUv.x), uY, mix(-${SECTION.z}.0, ${SECTION.z}.0, vUv.y));
          gl_FragColor = vec4(sdOptimized(p), 0.0, 0.0, 1.0);
        }`,
    });
    const quadMesh = new Mesh(quad, mat);
    quadMesh.frustumCulled = false;
    scene.add(quadMesh);
    if (part) void gl.compileAsync(scene, cam).catch(() => undefined);
    return {
      rt, scene, cam, mat, ready: Boolean(part), lastY: Number.NaN,
      dispose() {
        rt.dispose();
        quad.dispose();
        mat.dispose();
      },
    };
  }, [part, gl]);

  const placeholder = useOwned(() => box(1, 1, 1, 0, -500, 0), []);

  const mats = useOwned(() => {
    const u = {
      uSection: { value: null as Texture | null },
      uSectionOn: { value: 0 },
      uLines: { value: null as DataTexture | null },
      uCount: { value: 0 },
      uU0: { value: 0 },
      uSpacing: { value: 0.55 },
      uDir: { value: [1, 0] as [number, number] },
      uHead: { value: -1 },
      uMacro: { value: 1 },
      uLapse: { value: 0 },
      uSweep: { value: 0 },
      uPool: { value: new Vector3() },
      uPoolOn: { value: 0 },
      uAmb: { value: 0 },
      uBuilt: { value: 42 },
      uHeat: { value: 1 },
      uScanY: { value: -10 },
      uSurf: { value: 45 },
      uChamber: { value: 0 },
      uGlow: { value: 0 },
      uFleet: { value: 0 },
      uScanDir: { value: new Vector3(1, 0, 0) },
      uGrain: { value: acquireGrain() },
    };

    const powder = patch(new MeshStandardMaterial({ color: new Color('#5A5D63'), metalness: 0.8, roughness: 0.55 }), {
      key: 'lpbf-powder',
      uniforms: u,
      fragmentHead: `${grainGLSL}\n${planeNormalGLSL}\n${heatGLSL}\n${paletteGLSL}
        uniform sampler2D uSection; uniform float uSectionOn; uniform sampler2D uLines; uniform float uCount; uniform float uU0;
        uniform float uSpacing; uniform vec2 uDir; uniform float uHead; uniform float uMacro; uniform float uLapse; uniform float uSweep;
        uniform vec3 uPool; uniform float uPoolOn;
        float ch6Section(vec2 p) {
          if (uSectionOn < 0.5) return 10.0;
          vec2 suv = vec2((p.x + ${SECTION.x}.0) / ${SECTION.x * 2}.0, (p.y + ${SECTION.z}.0) / ${SECTION.z * 2}.0);
          if (suv.x < 0.0 || suv.y < 0.0 || suv.x > 1.0 || suv.y > 1.0) return 10.0;
          return texture2D(uSection, suv).r;
        }
        vec3 ch6Grain(vec2 p) { return ch6G(p * 0.44) * 0.6 + ch6G(p * 1.48 + 0.5) * vec3(0.4, 1.4, 1.4); }`,
      color: `
        vec2 cp = vObj.xz;
        float sd = ch6Section(cp);
        float aa = max(fwidth(sd), 0.015);
        float inside = 1.0 - smoothstep(-aa, aa, sd);
        float cu = -cp.x * uDir.y + cp.y * uDir.x;
        float cv = dot(cp, uDir);
        float age = 1e4;
        float scanned = 0.0;
        if (uMacro > 0.5 && inside > 0.0) {
          float k = floor((uU0 - cu) / uSpacing + 0.5);
          if (k >= 0.0 && k < uCount) {
            vec4 L = texelFetch(uLines, ivec2(int(k), 0), 0);
            float tf = L.z + (L.w > 0.0 ? cv - L.x : L.y - cv);
            scanned = step(tf, uHead);
            age = uHead - tf;
          }
        }
        float solid = inside * max(scanned, uLapse);
        vec3 gg = ch6Grain(cp);
        float g = gg.x;
        diffuseColor.rgb = mix(diffuseColor.rgb * (0.84 + 0.24 * g), vec3(0.42, 0.43, 0.45), solid);`,
      roughness: 'roughnessFactor = mix(roughnessFactor + (g - 0.5) * 0.18, 0.24, solid);',
      metalness: 'metalnessFactor = mix(metalnessFactor, 1.0, solid);',
      normal: `{
        vec2 gr = gg.yz * 0.7 * (1.0 - solid);
        float ridge = cos(cu / uSpacing * 6.2831853) * 6.2831853 / uSpacing * 0.035 * solid;
        gr += ridge * vec2(-uDir.y, uDir.x);
        normal = ch6PlaneNormal(gr);
      }`,
      emissive: `{
        float heat = solid * uMacro * (exp(-age / 3.0) + 0.55 * exp(-age / 220.0));
        heat += uLapse * inside * (0.55 + 0.45 * exp(-abs(cv - uSweep) / 2.5));
        totalEmissiveRadiance += ch6Heat(clamp(heat, 0.0, 1.0)) * 0.9;
        float d = length(cp - uPool.xz);
        float spill = uPoolOn * exp(-d * d / 40.0);
        totalEmissiveRadiance += vec3(1.0, 0.5, 0.18) * uPoolOn * exp(-d * d / 5.0) * 1.6;
        vec3 V = normalize(cameraPosition - vWorld);
        float sp = step(0.985, hash13(vec3(floor(cp * 24.0), floor(dot(V, vec3(11.0, 5.0, 7.0)) * 2.0))));
        float far = 1.0 - smoothstep(0.03, 0.12, length(fwidth(cp)));
        totalEmissiveRadiance += vec3(1.0, 0.7, 0.45) * sp * far * (1.0 - solid) * (0.03 + 2.5 * spill);
      }`,
    });

    const titanium = patch(new MeshStandardMaterial({ color: new Color('#8C9096'), metalness: 1, roughness: 0.48 }), {
      key: 'lpbf-ti',
      uniforms: u,
      fragmentHead: `${grainGLSL}\n${heatGLSL}\n${paletteGLSL}\nuniform float uBuilt; uniform float uHeat; uniform float uScanY; uniform float uSurf;`,
      color: `
        if (vObj.y > uBuilt) discard;
        float micro = ch6G(vObj.xz * 0.2 + vObj.y * 0.13).x * 0.6 + ch6G(vObj.xy * 0.55 + 0.2).x * 0.4;
        float dust = smoothstep(uSurf + 5.0, uSurf, vObj.y) * 0.55;
        diffuseColor.rgb = mix(diffuseColor.rgb * (0.94 + 0.12 * micro), vec3(0.11, 0.115, 0.12), dust);`,
      roughness: 'roughnessFactor = clamp(roughnessFactor + (micro - 0.5) * 0.16 + dust * 0.2, 0.05, 1.0);',
      emissive: `{
        float t = uHeat * (0.8 + 0.2 * smoothstep(0.0, 42.0, vObj.y));
        totalEmissiveRadiance += ch6Heat(t) * 0.3;
        float s = vObj.y - uScanY;
        totalEmissiveRadiance += PAL_OK * (exp(-s * s / 0.05) * 9.0 + exp(-abs(s) / 2.5) * 0.25) * step(-5.0, uScanY);
      }`,
    });

    const plate = brushed('lpbf-plate', 'x', '#8E949C');
    // Chamber walls: unlit brushed steel with the LED bars and the melt pool baked in (a full-screen lit pass
    // here cost more than the rest of the cell and read as near-black anyway).
    const room = new ShaderMaterial({
      uniforms: u,
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        ${grainGLSL}
        uniform float uChamber; uniform float uPoolOn; uniform vec3 uPool; uniform float uHeat;
        varying vec3 vW;
        void main() {
          float wall = ch6G(vec2(vW.x + vW.z, vW.y * 30.0) * 0.002).x;
          vec3 c = vec3(0.012, 0.014, 0.018) * (0.75 + 0.5 * wall);
          float top = smoothstep(120.0, ${ROOM.y1}.0, vW.y);
          c += vec3(1.0, 0.7, 0.42) * top * (0.006 + 0.05 * uChamber) * (0.8 + 0.4 * wall);
          float low = smoothstep(140.0, -20.0, vW.y);
          float d = length(vW.xz - uPool.xz);
          c += vec3(1.0, 0.5, 0.2) * low * uPoolOn * 0.04 * exp(-d / 260.0);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const fixtures = anodised('lpbf-fixtures', '#2A2E36');
    fixtures.metalness = 0.35;
    fixtures.emissive.setRGB(0.016, 0.018, 0.024);
    const recoater = brushed('lpbf-recoater', 'x');
    recoater.metalness = 0.6;
    recoater.envMapIntensity = 1.6;
    recoater.emissive.setRGB(0.02, 0.022, 0.026);
    const ledColor = new Color(1, 0.72, 0.42);
    const leds = new MeshBasicMaterial({ color: ledColor.clone().multiplyScalar(0.4) });
    const lens = new MeshBasicMaterial({ color: new Color(0.05, 0.05, 0.12) });
    const poolMat = new MeshBasicMaterial({ color: new Color('#FFF4D6').multiplyScalar(12) });
    const halo = new ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform vec3 uPool; varying vec2 vUv;
        void main() {
          vUv = uv - 0.5;
          vec4 mv = viewMatrix * vec4(uPool, 1.0);
          mv.xy += position.xy * 7.0;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uPoolOn; varying vec2 vUv;
        void main() {
          float r = length(vUv) * 2.0;
          float c = exp(-r * r * 30.0) * 3.0 + exp(-r * r * 5.0) * 0.4;
          gl_FragColor = vec4(vec3(1.0, 0.72, 0.4) * c * uPoolOn, 1.0);
        }`,
    });
    const sparks = new ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: /* glsl */ `
        ${paletteGLSL}
        attribute vec4 aSpark;
        uniform vec3 uPool; uniform float uAmb; uniform float uPoolOn; uniform vec3 uScanDir;
        varying vec3 vColor; varying vec2 vUv;
        void main() {
          float life = 0.1 + 0.32 * aSpark.x;
          float ph = fract(uAmb / life + aSpark.y);
          float age = ph * life;
          float a = aSpark.z * 6.2831853;
          float spread = 0.35 + 0.65 * aSpark.w;
          vec3 dir = normalize(vec3(cos(a) * spread, 1.15 - spread * 0.4, sin(a) * spread) - uScanDir * 0.55);
          float fast = step(0.9, fract(aSpark.w * 3.71));
          float speed = mix(60.0 + 320.0 * fract(aSpark.w * 7.13 + aSpark.x), 600.0 + 500.0 * aSpark.x, fast);
          vec3 vel = dir * speed + vec3(0.0, -9810.0, 0.0) * age;
          vec3 p = uPool + dir * speed * age + 0.5 * vec3(0.0, -9810.0, 0.0) * age * age;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          vec3 vv = (viewMatrix * vec4(vel, 0.0)).xyz;
          vec2 sd = length(vv.xy) > 1e-3 ? normalize(vv.xy) : vec2(0.0, 1.0);
          float len = clamp(length(vel) / 90.0, 0.25, 9.0);
          float w = 0.05 + 0.04 * (1.0 - ph);
          vec2 off = sd * position.y * len + vec2(-sd.y, sd.x) * position.x * w * 2.0;
          float alive = uPoolOn * step(-2.0, p.y - uPool.y);
          mv.xy += off * alive;
          vUv = position.xy;
          float k = ph;
          vec3 c = mix(vec3(6.0, 5.2, 4.2), PAL_MOLTEN * 4.0, smoothstep(0.0, 0.45, k));
          c = mix(c, vec3(0.35, 0.1, 0.03), smoothstep(0.45, 1.0, k));
          vColor = c * (1.0 - k) * alive;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor; varying vec2 vUv;
        void main() {
          float a = (1.0 - smoothstep(0.0, 0.5, abs(vUv.x))) * (1.0 - smoothstep(0.2, 0.5, abs(vUv.y)));
          gl_FragColor = vec4(vColor * a, 1.0);
        }`,
    });
    const sheet = new ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        ${paletteGLSL}
        uniform float uScanY; varying vec2 vUv;
        void main() {
          vec2 d = abs(vUv - 0.5) * 2.0;
          float a = (1.0 - smoothstep(0.6, 1.0, d.x)) * (1.0 - smoothstep(0.5, 1.0, d.y));
          gl_FragColor = vec4(PAL_OK * a * 0.025 * step(-5.0, uScanY), 1.0);
        }`,
    });

    // The shared hero cabinet's own materials; its window glows over the open chamber as the camera leaves.
    const cab = createCabinetMaterials();
    // It fades over the open chamber as the camera leaves and is opaque at A7, exactly Ch7's hero window.
    cab.window.transparent = true;
    cab.window.depthWrite = false;
    cab.window.uniforms.uIntensity.value = 0;
    cab.window.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('gl_FragColor = vec4(c, 1.0);', 'gl_FragColor = vec4(c, uIntensity);');
    };
    cab.window.customProgramCacheKey = () => 'ch6-cabinet-window-fade';
    // At A7 the body is lit exactly as Ch7 lights its hero (same function, same window), so the crossfade is one cabinet.
    const win = WINDOW_PARAMS.color.map((c) => (c * WINDOW_PARAMS.intensity * 0.62).toFixed(5)).join(', ');
    cab.body.onBeforeCompile = (shader) => {
      shader.uniforms.uFleet = u.uFleet;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vFleetPos;\nvarying vec3 vFleetN;')
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\n  vFleetPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vFleetN = normalize(mat3(modelMatrix) * objectNormal);',
        );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${fleetBodyGLSL}\nuniform float uFleet;\nvarying vec3 vFleetPos;\nvarying vec3 vFleetN;`)
        .replace(
          '#include <opaque_fragment>',
          `#include <opaque_fragment>
          if (uFleet > 0.0) {
            vec3 fleet = fleetBody(vColor.rgb, normalize(vFleetN), normalize(cameraPosition - vFleetPos), vFleetPos, vec3(${win}), ${HALL_TOP_LIGHT.toFixed(2)}, 0.0);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, fleet, uFleet);
          }`,
        );
    };
    cab.body.customProgramCacheKey = () => 'ch6-cabinet-body-fleet';
    const floor = new MeshStandardMaterial({ color: new Color('#0A0D14'), roughness: 0.35, metalness: 0 });
    const floorPool = new ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform float uGlow; varying vec2 vUv;
        void main() {
          vec2 d = (vUv - vec2(0.5, 0.95)) * vec2(2.2, 1.0);
          float a = exp(-dot(d, d) * 3.0);
          gl_FragColor = vec4(vec3(${WINDOW_PARAMS.color.join(', ')}) * a * 0.25 * uGlow, 1.0);
        }`,
    });

    const all = [
      powder, titanium, plate, room, fixtures, recoater, leds, lens, poolMat, halo, sparks, sheet, floor, floorPool,
    ];
    return {
      u, powder, titanium, plate, room, fixtures, recoater, leds, ledColor, lens, poolMat, halo, sparks, sheet, cab, floor, floorPool,
      dispose() {
        all.forEach((m) => m.dispose());
        cab.dispose();
        releaseGrain();
      },
    };
  }, []);

  const sparkMesh = useOwned(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', statics.spark.getAttribute('position'));
    g.setAttribute('uv', statics.spark.getAttribute('uv'));
    g.setIndex(statics.spark.getIndex());
    const rand = seededRandom(1940);
    const a = new Float32Array(sparkCount * 4);
    for (let i = 0; i < a.length; i++) a[i] = rand();
    g.setAttribute('aSpark', new InstancedBufferAttribute(a, 4));
    const mesh = new InstancedMesh(g, mats.sparks, sparkCount);
    mesh.frustumCulled = false;
    return { mesh, dispose: () => g.dispose() };
  }, [sparkCount, statics, mats]);

  useCellFrame(2, (f) => {
    const u = mats.u;
    const p = f.p;
    const surf = lpbfSurface(p);
    u.uSection.value = section.rt.texture;
    u.uLines.value = lines;
    if (geo) {
      u.uCount.value = geo.lpbf.count;
      u.uU0.value = geo.lpbf.u0;
      u.uSpacing.value = geo.lpbf.spacing;
      u.uDir.value[0] = Math.cos(geo.lpbf.angle);
      u.uDir.value[1] = Math.sin(geo.lpbf.angle);
    }
    if (surface.current) surface.current.position.y = surf;
    u.uAmb.value = f.amb;

    // The section under the powder: rendered from the part's SDF whenever the surface height changes.
    const macro = p < LPBF_RISE[0];
    const secY = macro ? 2 : Math.min(41.6, Math.max(2, surf));
    u.uSectionOn.value = section.ready && p < LPBF_DRAIN[0] ? 1 : 0;
    if (section.ready && p < LPBF_DRAIN[0] && !(Math.abs(section.lastY - secY) <= 0.2)) {
      section.mat.uniforms.uY.value = secY;
      const prev = gl.getRenderTarget();
      gl.setRenderTarget(section.rt);
      gl.render(section.scene, section.cam);
      gl.setRenderTarget(prev);
      section.lastY = secY;
    }
    u.uMacro.value = macro ? 1 : 0;
    u.uLapse.value = macro ? 0 : 1 - range(p, LPBF_DRAIN[0] - 0.004, LPBF_DRAIN[0] + 0.004);
    const layerPhase = (range(p, LPBF_RISE[0], LPBF_RISE[1]) * 46) % 1;
    u.uSweep.value = -60 + 120 * layerPhase;

    // Melt pool along the serpentine hatch.
    let on = 0;
    if (geo && macro) {
      const L = geo.lpbf;
      const T = lpbfHead(p) * L.total;
      u.uHead.value = p < LPBF_SCAN[0] ? -1 : T;
      let lo = 0;
      let hi = L.count - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (L.table[mid * 4 + 2] <= T) lo = mid;
        else hi = mid;
      }
      const k = L.table[hi * 4 + 2] <= T ? hi : lo;
      const vmin = L.table[k * 4];
      const vmax = L.table[k * 4 + 1];
      const dir = L.table[k * 4 + 3];
      const t = T - L.table[k * 4 + 2];
      const v = dir > 0 ? Math.min(vmax, vmin + t) : Math.max(vmin, vmax - t);
      const uu = L.u0 - k * L.spacing;
      const dx = Math.cos(L.angle);
      const dz = Math.sin(L.angle);
      state.pool.set(-uu * dz + v * dx, surf + 0.3, uu * dx + v * dz);
      // The pool stays lit across the short jumps over holes, so every frame of the scan has its light source.
      on = p > LPBF_SCAN[0] && p < LPBF_SCAN[1] && L.count > 0 ? 1 : 0;
      u.uScanDir.value.set(dx * dir, 0, dz * dir);
    }
    state.poolOn = on;
    u.uPool.value.copy(state.pool);
    u.uPoolOn.value = on;
    if (pool.current) {
      pool.current.position.copy(state.pool);
      pool.current.visible = on > 0;
    }
    sparkMesh.mesh.visible = on > 0;

    // Cool-down, QA, chamber lights and the window glow for the pull-back.
    const temp = lpbfPartTemp(p);
    const { from: hot, to: cold } = facts.lpbf.partCoolC;
    const heat = (temp - cold) / (hot - cold);
    state.partHeat = heat;
    u.uHeat.value = heat;
    u.uBuilt.value = 42.5;
    u.uSurf.value = surf;
    u.uScanY.value = lpbfScanY(p);
    if (partMesh.current) partMesh.current.visible = Boolean(part) && p >= LPBF_DRAIN[0] - 0.003;
    if (sheet.current) {
      sheet.current.visible = u.uScanY.value > -5;
      sheet.current.position.y = Math.max(0, u.uScanY.value);
    }
    const chamber = lpbfChamberLight(p);
    u.uChamber.value = chamber;
    mats.leds.color.copy(mats.ledColor).multiplyScalar(0.35 + 4.5 * chamber);
    if (shell.current) shell.current.visible = p >= 0.88;
    u.uGlow.value = range(p, 0.9, 0.97);
    mats.cab.window.uniforms.uIntensity.value = range(p, 0.92, 1) ** 1.6;
    mats.cab.window.uniforms.uTime.value = f.time;
    u.uFleet.value = lpbfOutro(f.raw);

    const pa = lights.a;
    const qa = p >= LPBF_QA[0] && p < LPBF_QA[1] + 0.02;
    if (qa) {
      pa.position.set(0, Math.max(0, lpbfScanY(p)) + 20, 60);
      pa.color.setRGB(0.37, 0.95, 0.65);
      pa.intensity = 110;
    } else {
      pa.position.set(state.pool.x, state.pool.y + 3, state.pool.z);
      pa.color.setRGB(1, 0.62, 0.3);
      pa.intensity = on * (650 + 120 * Math.sin(f.amb * 63) * (f.capture ? 0 : 1));
    }
    const pb = lights.b;
    pb.position.set(0, 8 + 210 * chamber, 70 + 10 * chamber);
    pb.color.setRGB(1, 0.42 + 0.3 * chamber, 0.16 + 0.3 * chamber);
    pb.intensity = (p >= LPBF_DRAIN[0] ? heat * heat * 1600 : 0) + chamber * 9000;
  });

  return (
    <>
      <mesh geometry={statics.room} material={mats.room} />
      <mesh geometry={statics.fixtures} material={mats.fixtures} />
      <mesh geometry={statics.slats} material={mats.fixtures} />
      <mesh geometry={statics.recoater} material={mats.recoater} />
      <mesh geometry={statics.leds} material={mats.leds} />
      <mesh geometry={statics.lens} material={mats.lens} />
      <mesh geometry={statics.plateGeo} material={mats.plate} />
      <mesh ref={surface} geometry={statics.powder} material={mats.powder} position={[0, 2, 0]} />
      <mesh ref={partMesh} geometry={part?.optimized ?? placeholder} material={mats.titanium} dispose={null} visible={false} />
      <group ref={pool} visible={false}>
        <mesh geometry={statics.poolGeo} material={mats.poolMat} />
      </group>
      <mesh geometry={statics.halo} material={mats.halo} renderOrder={4} frustumCulled={false} />
      <primitive object={sparkMesh.mesh} renderOrder={5} />
      <mesh ref={sheet} geometry={statics.sheet} material={mats.sheet} visible={false} renderOrder={6} />
      <group ref={shell} visible={false}>
        <mesh geometry={statics.cabinet.body} material={mats.cab.body} />
        {statics.cabinet.lights ? <mesh geometry={statics.cabinet.lights} material={mats.cab.lights} /> : null}
        <mesh geometry={statics.cabinet.window} material={mats.cab.window} renderOrder={7} />
        {statics.cabinet.glass ? <mesh geometry={statics.cabinet.glass} material={mats.cab.glass} renderOrder={8} /> : null}
        <mesh geometry={statics.floor} material={mats.floor} />
        <mesh geometry={statics.pool2} material={mats.floorPool} renderOrder={7} />
      </group>
    </>
  );
}

