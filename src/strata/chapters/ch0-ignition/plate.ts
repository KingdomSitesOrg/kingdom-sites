import { CanvasTexture, DataTexture, LinearFilter, LinearMipmapLinearFilter, RedFormat, RepeatWrapping, UnsignedByteType } from 'three';
import { seededRandom } from '@/strata/story';
import type { StrokeLayout } from './strokes';

/**
 * Contact shadow under the headline, baked once: the strokes drawn into a canvas and blurred twice (a tight
 * contact line in red, a soft key-light shadow in green). Returns the texture and its plate rect (x, z, w, h).
 */
export function bakeContact(layout: StrokeLayout, pxPerMM = 9) {
  const margin = 10;
  const { minX, maxX, minZ, maxZ } = layout.bounds;
  const rect = [minX - margin, minZ - margin, maxX - minX + 2 * margin, maxZ - minZ + 2 * margin] as const;
  const w = Math.min(2048, Math.ceil(rect[2] * pxPerMM));
  const h = Math.ceil((rect[3] / rect[2]) * w);
  const s = w / rect[2];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  const pass = (color: string, width: number, blur: number, nudgeZ: number) => {
    ctx.save();
    ctx.filter = `blur(${(blur * s).toFixed(1)}px)`;
    ctx.setTransform(s, 0, 0, s, -rect[0] * s, (-rect[1] + nudgeZ) * s);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width;
    for (const st of layout.strokes) {
      if (st.kind === 'pen') ctx.stroke(new Path2D(st.d));
      else {
        ctx.beginPath();
        ctx.arc(st.center[0], st.center[1], st.radius + (width - 2) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };
  pass('rgb(255,0,0)', 2.6, 0.7, 0);
  pass('rgb(0,150,0)', 5, 2.4, 1.2);
  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 4;
  tex.flipY = false;
  return { texture: tex, rect };
}

/** Tileable value-noise fbm, 256^2, for the plate's satin roughness. */
export function bakeGrain(seed = 7, size = 256) {
  const rand = seededRandom(seed);
  const octaves = [8, 16, 32, 64];
  const lattices = octaves.map((n) => Float32Array.from({ length: n * n }, () => rand()));
  const data = new Uint8Array(size * size);
  const fade = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      let amp = 0.5;
      let norm = 0;
      octaves.forEach((n, o) => {
        const fx = (x / size) * n;
        const fy = (y / size) * n;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fade(fx - x0);
        const ty = fade(fy - y0);
        const L = lattices[o];
        const at = (i: number, j: number) => L[((j + n) % n) * n + ((i + n) % n)];
        const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
        const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
        v += amp * (a + (b - a) * ty);
        norm += amp;
        amp *= 0.5;
      });
      data[y * size + x] = Math.round((v / norm) * 255);
    }
  }
  const tex = new DataTexture(data, size, size, RedFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
