'use client';

import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3,
  type Group,
  type Mesh,
} from 'three';
import { seededRandom } from '@/strata/story';
import { paletteGLSL } from '@/strata/shaders/palette';
import type { GeometryResult } from '../../geometry';
import { anodised, box, brushed, merge } from '../../lib/build';
import { acquireGrain, grainGLSL, releaseGrain } from '../../lib/grain';
import { useCellFrame, useOwned, type CellLights } from '../../lib/frame';
import { patch, planeNormalGLSL } from '../../lib/patch';
import { SLS_CAKE, SLS_DISSOLVE, slsBladeX, slsCakeY, slsFront, slsHead, SLS_BLADE, range } from '../../timeline';

export const SLS_ORIGIN = -2400;
const GALVO: [number, number, number] = [0, 520, 0];
const PUFFS = { high: 2500, medium: 1000, low: 300 } as const;
const HALF = SLS_CAKE.size / 2;

/** Noise front shared by the cake walls, the top and the cut cap (cake-local mm). */
const frontGLSL = /* glsl */ `
float ch6Front(vec2 xz, float front) {
  float n = ch6G(xz * 0.0045).x * 26.0 + ch6G(xz * 0.019 + 0.31).x * 9.0;
  return front + n - 17.5;
}
`;

const powderHead = /* glsl */ `
${grainGLSL}
${planeNormalGLSL}
${paletteGLSL}
${frontGLSL}
uniform float uBlade; uniform float uFreshOn; uniform float uFront; uniform float uDissolve; uniform vec3 uSpot; uniform float uSpotOn;
vec3 ch6Grain(vec2 p) { return ch6G(p * 0.075) * 0.65 + ch6G(p * 0.27 + 0.5) * vec3(0.35, 1.3, 1.3); }
`;

export function SlsCell({ geo, quality, lights }: {
  geo: GeometryResult | null;
  quality: 'high' | 'medium' | 'low';
  lights: CellLights;
}) {
  const cake = useRef<Group>(null);
  const bladeRef = useRef<Group>(null);
  const mound = useRef<Mesh>(null);
  const puffCount = PUFFS[quality];

  const statics = useOwned(() => {
    // The deck stands 0.5 mm proud and overlaps the bed by 3 mm, so no seam opens between it and the powder.
    const deck = merge([
      box(664, 25, 124, 0, -12, 209),
      box(664, 25, 124, 0, -12, -209),
      box(184, 25, 300, -239, -12, 0),
      box(184, 25, 300, 239, -12, 0),
      box(130, 50, 130, GALVO[0], GALVO[1] + 25, GALVO[2]),
    ]);
    const rails = merge([box(640, 7, 10, 0, 3.5, 176), box(640, 7, 10, 0, 3.5, -176)]);
    const blade = merge([box(14, 18, 334, 0, 13, 0), box(30, 26, 26, 0, 13, 176), box(30, 26, 26, 0, 13, -176)]);
    const lip = box(5, 6, 300, -6, 3, 0);
    const top = new PlaneGeometry(SLS_CAKE.size, SLS_CAKE.size, 1, 1).rotateX(-Math.PI / 2);
    const walls = merge([
      new PlaneGeometry(SLS_CAKE.size, SLS_CAKE.depth).translate(0, -SLS_CAKE.depth / 2, HALF),
      new PlaneGeometry(SLS_CAKE.size, SLS_CAKE.depth).rotateY(Math.PI).translate(0, -SLS_CAKE.depth / 2, -HALF),
      new PlaneGeometry(SLS_CAKE.size, SLS_CAKE.depth).rotateY(Math.PI / 2).translate(HALF, -SLS_CAKE.depth / 2, 0),
      new PlaneGeometry(SLS_CAKE.size, SLS_CAKE.depth).rotateY(-Math.PI / 2).translate(-HALF, -SLS_CAKE.depth / 2, 0),
    ]);
    const cap = new PlaneGeometry(SLS_CAKE.size, SLS_CAKE.size, 72, 72).rotateX(-Math.PI / 2);
    // Half-cylinder ridge pushed ahead of the blade: axis along z (the blade), bulging up.
    const moundGeo = new CylinderGeometry(7, 7, 300, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2);
    const beam = new BufferGeometry();
    beam.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, -1, 0, 0, 1, 1, 0, -1, 1, 0, 1]), 3));
    beam.setIndex([0, 1, 2, 2, 1, 3]);
    const spot = new PlaneGeometry(1, 1);
    const puff = new PlaneGeometry(1, 1);
    return {
      deck, rails, blade, lip, top, walls, cap, moundGeo, beam, spot, puff,
      dispose() {
        [deck, rails, blade, lip, top, walls, cap, moundGeo, beam, spot, puff].forEach((g) => g.dispose());
      },
    };
  }, []);

  const mats = useOwned(() => {
    const u = {
      uBlade: { value: -1e4 },
      uFreshOn: { value: 0 },
      uFront: { value: 10 },
      uDissolve: { value: 0 },
      uHead: { value: 0 },
      uCover: { value: -1e4 },
      uSpot: { value: new Vector3() },
      uSpotOn: { value: 0 },
      uFrom: { value: new Vector3(...GALVO) },
      uTo: { value: new Vector3() },
      uBeam: { value: 0 },
      uP: { value: 0 },
      uAmb: { value: 0 },
      uGrain: { value: acquireGrain() },
    };
    const powderColor = new Color('#EDEBE6').multiplyScalar(0.6);
    const powderBody = (cap: boolean) =>
      patch(new MeshStandardMaterial({ color: powderColor, roughness: 0.95, metalness: 0, envMapIntensity: 0.12 }), {
        key: cap ? 'sls-cap' : 'sls-powder',
        uniforms: u,
        vertexHead: `${grainGLSL}\n${frontGLSL}\nuniform float uFront;\nvarying float vCapCut;`,
        vertexMain: cap
          ? `{ float h = ch6Front(transformed.xz, uFront); vCapCut = h; transformed.y = clamp(h, -${SLS_CAKE.depth}.0, 0.0); }`
          : 'vCapCut = -1.0;',
        fragmentHead: `${powderHead}\nvarying float vCapCut;`,
        color: `
          ${cap ? 'if (vCapCut > -0.05 || vCapCut < -' + SLS_CAKE.depth + '.0) discard;' : 'if (uDissolve > 0.5 && vObj.y > ch6Front(vObj.xz, uFront)) discard;'}
          float fresh = uFreshOn * step(vObj.x, uBlade);
          vec3 gg = ch6Grain(vObj.xz + vObj.y * 0.7);
          float g = gg.x;
          diffuseColor.rgb *= 0.84 + 0.2 * g * (0.9 + 0.2 * ch6G(vObj.xz * 0.012).x);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.0, 0.985, 0.95), 1.0 - fresh);
          float rim = length(max(abs(vObj.xz) - vec2(40.0), 0.0));
          diffuseColor.rgb *= 1.0 - 0.8 * smoothstep(0.0, 120.0, rim);`,
        normal: `{
          if (abs(vObj.y) < 0.01) normal = ch6PlaneNormal(gg.yz * 0.9);
        }`,
        emissive: `{
          float fresh = uFreshOn * step(vObj.x, uBlade);
          float bed = 1.0 - smoothstep(60.0, 150.0, length(vObj.xz));
          totalEmissiveRadiance += vec3(1.0, 0.32, 0.07) * 0.075 * bed * (1.0 - 0.6 * fresh);
          vec3 V = normalize(cameraPosition - vWorld);
          float sp = step(0.992, hash13(floor(vObj * 4.0) + floor(dot(V, vec3(13.0, 7.0, 5.0)) * 3.0)));
          float far = 1.0 - smoothstep(0.15, 0.6, length(fwidth(vObj.xz)));
          totalEmissiveRadiance += vec3(0.9) * sp * far * 0.6;
          float d = length(vWorld.xz - uSpot.xz);
          totalEmissiveRadiance += vec3(1.0, 0.55, 0.25) * uSpotOn * exp(-d * d / 18.0) * 0.9;
        }`,
      });
    const powder = powderBody(false);
    const cap = powderBody(true);
    cap.polygonOffset = true;
    cap.polygonOffsetFactor = 1;
    cap.polygonOffsetUnits = 2;

    const tracks = patch(new MeshStandardMaterial({ color: new Color('#FFD9B0'), roughness: 0.55, metalness: 0 }), {
      key: 'sls-tracks',
      uniforms: u,
      vertexHead: 'attribute float aT; varying float vT;',
      vertexMain: 'vT = aT;',
      fragmentHead: `${paletteGLSL}\nuniform float uHead; uniform float uCover; varying float vT;`,
      color: 'if (vT > uHead || vObj.x < uCover) discard;',
      emissive: `{
        float age = max(uHead - vT, 0.0);
        float hot = exp(-age / 60.0);
        float warm = exp(-age / 320.0);
        totalEmissiveRadiance += mix(PAL_MOLTEN * 1.6, vec3(5.0, 4.4, 6.0), hot * hot) * hot * 2.2 + PAL_MOLTEN * 0.22 * warm
          + vec3(1.0, 0.69, 0.43) * 0.42;
      }`,
    });

    const nested = patch(new MeshStandardMaterial({ color: new Color('#D8D4CB'), roughness: 0.85, metalness: 0 }), {
      key: 'sls-nested',
      uniforms: u,
      fragmentHead: grainGLSL,
      color: 'float dust = ch6G(vObj.xz * 0.05 + vObj.y * 0.03).x; diffuseColor.rgb *= 0.9 + 0.18 * dust;',
      roughness: 'roughnessFactor = clamp(roughnessFactor + dust * 0.1, 0.0, 1.0);',
    });

    const beam = new ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      vertexShader: /* glsl */ `
        uniform vec3 uFrom; uniform vec3 uTo;
        varying float vSide; varying float vAlong;
        void main() {
          vec3 a = (modelMatrix * vec4(uFrom, 1.0)).xyz;
          vec3 b = (modelMatrix * vec4(uTo, 1.0)).xyz;
          vec3 p = mix(a, b, position.x);
          vec3 dir = normalize(b - a);
          vec3 side = normalize(cross(dir, normalize(cameraPosition - p)));
          float w = mix(1.6, 0.9, position.x);
          p += side * position.z * w;
          vSide = position.z; vAlong = position.x;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uBeam; varying float vSide; varying float vAlong;
        void main() {
          float core = exp(-vSide * vSide * 60.0);
          float halo = exp(-vSide * vSide * 5.0) * 0.18;
          float fade = smoothstep(0.0, 0.25, vAlong);
          gl_FragColor = vec4(vec3(0.85, 0.78, 1.0) * (core * 3.2 + halo) * uBeam * fade, 1.0);
        }`,
    });

    const spot = new ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform vec3 uSpot; varying vec2 vUv;
        void main() {
          vUv = uv - 0.5;
          vec4 mv = viewMatrix * modelMatrix * vec4(uSpot + vec3(0.0, 0.6, 0.0), 1.0);
          mv.xy += position.xy * 6.0;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uSpotOn; varying vec2 vUv;
        void main() {
          float r = length(vUv) * 2.0;
          float c = exp(-r * r * 60.0) * 4.0 + exp(-r * r * 8.0) * 0.22;
          gl_FragColor = vec4(vec3(1.0, 0.92, 1.0) * c * uSpotOn, 1.0);
        }`,
    });

    const puff = new ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        ${grainGLSL}
        attribute vec4 aPuff; attribute vec2 aPuffXZ;
        uniform float uP; uniform float uAmb;
        varying vec2 vUv; varying float vA;
        void main() {
          vUv = uv - 0.5;
          float age = (uP - aPuff.y) * 34.0;
          float life = 1.3 + aPuff.w * 1.4;
          float k = clamp(age / life, 0.0, 1.0);
          float alive = step(0.0, age) * step(age, life);
          vec3 c = vec3(aPuffXZ.x, aPuff.x, aPuffXZ.y);
          vec3 drift = vec3(ch6G(c.xz * 0.002 + vec2(uAmb * 0.01, 0.0)).x - 0.5, 0.0, ch6G(c.zx * 0.002 + vec2(0.4, uAmb * 0.01)).x - 0.5);
          c += vec3(normalize(c.xz + 1e-3).x, 0.0, normalize(c.xz + 1e-3).y) * age * 22.0 + vec3(0.0, age * (26.0 + aPuff.z * 30.0), 0.0) + drift * age * 60.0;
          vec4 mv = modelViewMatrix * vec4(c, 1.0);
          mv.xy += position.xy * (2.5 + 11.0 * k) * (0.5 + aPuff.z) * alive;
          vA = alive * (1.0 - k) * smoothstep(0.0, 0.12, k) * (0.05 + 0.08 * aPuff.w);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv; varying float vA;
        void main() {
          float r = length(vUv) * 2.0;
          float a = smoothstep(1.0, 0.0, r);
          a *= a * vA;
          if (a < 0.004) discard;
          gl_FragColor = vec4(vec3(0.4, 0.39, 0.37), a);
        }`,
    });

    const deck = anodised('sls-deck', '#202329');
    const rail = brushed('sls-rail', 'x');
    const blade = brushed('sls-blade', 'z');
    blade.metalness = 0.55;
    blade.envMapIntensity = 1.8;
    const lip = anodised('sls-lip', '#0E0F12');
    return {
      u, powder, cap, tracks, nested, beam, spot, puff, deck, rail, blade, lip,
      dispose() {
        [powder, cap, tracks, nested, beam, spot, puff, deck, rail, blade, lip].forEach((m) => m.dispose());
        releaseGrain();
      },
    };
  }, []);

  const tracks = useOwned(() => {
    const g = new BufferGeometry();
    if (geo) {
      const xz = geo.sls.position;
      const pos = new Float32Array((xz.length / 2) * 3);
      for (let i = 0, j = 0; i < xz.length; i += 2, j += 3) {
        pos[j] = xz[i];
        pos[j + 1] = 0.08;
        pos[j + 2] = xz[i + 1];
      }
      const nrm = new Float32Array(pos.length);
      for (let j = 1; j < nrm.length; j += 3) nrm[j] = 1;
      g.setAttribute('position', new BufferAttribute(pos, 3));
      g.setAttribute('normal', new BufferAttribute(nrm, 3));
      g.setAttribute('aT', new BufferAttribute(geo.sls.time, 1));
      g.setIndex(new BufferAttribute(geo.sls.index, 1));
      g.computeBoundingSphere();
    }
    return g;
  }, [geo]);

  const nested = useOwned(() => {
    const g = new BufferGeometry();
    if (geo) {
      g.setAttribute('position', new BufferAttribute(geo.nested.positions, 3));
      g.setAttribute('normal', new BufferAttribute(geo.nested.normals, 3));
      g.setIndex(new BufferAttribute(geo.nested.index, 1));
    }
    const mesh = new InstancedMesh(g, mats.nested, 12);
    const rand = seededRandom(1212);
    const m = new Matrix4();
    const q = new Quaternion();
    const e = new Euler();
    const s = new Vector3(0.5, 0.5, 0.5);
    const t = new Vector3();
    for (let i = 0; i < 12; i++) {
      const tier = Math.floor(i / 4);
      const k = i % 4;
      const ang = (k / 4) * Math.PI * 2 + tier * 0.8 + (rand() - 0.5) * 0.5;
      const rad = 42 + rand() * 16;
      const flip = (i + tier) % 3 === 0;
      e.set(flip ? Math.PI : 0, rand() * Math.PI * 2, 0);
      q.setFromEuler(e);
      t.set(Math.cos(ang) * rad, -112 + tier * 34 + (flip ? 21 : 0) + rand() * 5, Math.sin(ang) * rad);
      m.compose(t, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.computeBoundingSphere();
    return { mesh, dispose: () => g.dispose() };
  }, [geo, mats]);

  const puffs = useOwned(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', statics.puff.getAttribute('position'));
    g.setAttribute('uv', statics.puff.getAttribute('uv'));
    g.setIndex(statics.puff.getIndex());
    const rand = seededRandom(77);
    const a = new Float32Array(puffCount * 4);
    const xz = new Float32Array(puffCount * 2);
    const span = SLS_DISSOLVE[1] - SLS_DISSOLVE[0];
    for (let i = 0; i < puffCount; i++) {
      const y = -rand() * SLS_CAKE.depth;
      const f = Math.pow(Math.min(1, Math.max(0, (6 - y) / (SLS_CAKE.depth + 18))), 1 / 0.85);
      a.set([y, SLS_DISSOLVE[0] + span * f - 0.004, rand(), rand()], i * 4);
      xz.set([(rand() - 0.5) * SLS_CAKE.size * 0.96, (rand() - 0.5) * SLS_CAKE.size * 0.96], i * 2);
    }
    g.setAttribute('aPuff', new InstancedBufferAttribute(a, 4));
    g.setAttribute('aPuffXZ', new InstancedBufferAttribute(xz, 2));
    const mesh = new InstancedMesh(g, mats.puff, puffCount);
    mesh.frustumCulled = false;
    return { mesh, dispose: () => g.dispose() };
  }, [puffCount, statics, mats]);

  const head = useMemo(() => ({ x: 0, z: 0, on: 0 }), []);

  useCellFrame(1, (f) => {
    const u = mats.u;
    const p = f.p;
    const bladeX = slsBladeX(p);
    const sweeping = p >= SLS_BLADE[0] && p <= SLS_BLADE[1] + 0.01;
    u.uBlade.value = p >= SLS_BLADE[0] ? bladeX : -1e4;
    u.uFreshOn.value = p >= SLS_BLADE[0] ? 1 : 0;
    u.uCover.value = p >= SLS_BLADE[0] ? bladeX : -1e4;
    u.uFront.value = slsFront(p);
    u.uDissolve.value = p >= SLS_DISSOLVE[0] ? 1 : 0;
    u.uP.value = p;
    u.uAmb.value = f.amb;

    if (bladeRef.current) bladeRef.current.position.x = p < SLS_BLADE[0] ? -200 : Math.min(bladeX, 200);
    if (mound.current) {
      const env = range(p, SLS_BLADE[0], SLS_BLADE[0] + 0.012) * (1 - range(p, SLS_BLADE[1] - 0.01, SLS_BLADE[1]));
      mound.current.visible = sweeping && env > 0.01;
      mound.current.scale.set(1, Math.max(0.01, env), 1);
    }
    if (cake.current) cake.current.position.y = slsCakeY(p);
    nested.mesh.visible = p > SLS_DISSOLVE[0] - 0.004;
    puffs.mesh.visible = p > SLS_DISSOLVE[0] - 0.004 && p < SLS_DISSOLVE[1] + 0.06;

    // Laser head along the scan path (laser time T), off during travel and outside the scan window.
    let on = 0;
    if (geo) {
      const T = slsHead(p) * geo.sls.total;
      u.uHead.value = p < 0.3 ? -1 : T;
      locate(geo.sls.head, T, head);
      on = head.on * (p > 0.334 && p < 0.459 ? 1 : 0);
    }
    u.uSpot.value.set(head.x, 0.2, head.z);
    u.uTo.value.set(head.x, 0.2, head.z);
    u.uSpotOn.value = on;
    u.uBeam.value = on;
    lights.a.position.set(SLS_ORIGIN + head.x, 6, head.z);
    lights.a.color.setRGB(0.95, 0.85, 1);
    lights.a.intensity = on * 900;
    lights.b.position.set(SLS_ORIGIN, 300, 40);
    lights.b.color.setRGB(1, 0.6, 0.29);
    lights.b.intensity = 17000;
  });

  return (
    <>
      <mesh geometry={statics.deck} material={mats.deck} />
      <mesh geometry={statics.rails} material={mats.rail} />
      <group ref={bladeRef} position={[-200, 0, 0]}>
        <mesh geometry={statics.blade} material={mats.blade} />
        <mesh geometry={statics.lip} material={mats.lip} />
        <mesh ref={mound} geometry={statics.moundGeo} material={mats.powder} position={[12, 0, 0]} visible={false} />
      </group>
      <group ref={cake}>
        <mesh geometry={statics.top} material={mats.powder} />
        <mesh geometry={statics.walls} material={mats.powder} />
        <mesh geometry={statics.cap} material={mats.cap} />
        <mesh geometry={tracks} material={mats.tracks} />
        <primitive object={nested.mesh} />
        <primitive object={puffs.mesh} renderOrder={3} />
      </group>
      <mesh geometry={statics.beam} material={mats.beam} renderOrder={4} frustumCulled={false} />
      <mesh geometry={statics.spot} material={mats.spot} renderOrder={5} frustumCulled={false} />
    </>
  );
}

/** Interpolates the head path (x, z, T, on) at laser time T. */
function locate(path: Float32Array, T: number, out: { x: number; z: number; on: number }) {
  const n = path.length / 4;
  if (n === 0) return out;
  let lo = 0;
  let hi = n - 1;
  if (T <= path[2]) {
    out.x = path[0];
    out.z = path[1];
    out.on = 0;
    return out;
  }
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (path[mid * 4 + 2] <= T) lo = mid;
    else hi = mid;
  }
  const a = lo * 4;
  const b = hi * 4;
  const span = path[b + 2] - path[a + 2];
  const k = span > 0 ? Math.min(1, (T - path[a + 2]) / span) : 1;
  out.x = path[a] + (path[b] - path[a]) * k;
  out.z = path[a + 1] + (path[b + 1] - path[a + 1]) * k;
  out.on = path[b + 3];
  return out;
}
