// Measures the prompt's glyphs and rasterizes their ink, so particles can leave from the letters themselves.
// Runs on mount, resize and font load only.

const SCALE = 2;
const ALPHA_MIN = 110;

export interface PromptLayout {
  /** Caret start: x, y (CSS px, sticky-container space). */
  caret: [number, number];
  /** min x, min y, max x, max y of the prompt line. */
  rect: [number, number, number, number];
  /** Per glyph: left x and right x (CSS px) and centre xNorm. */
  glyphs: Float32Array;
  /** Ink samples: x, y, xNorm. */
  ink: Float32Array;
}

export function measurePrompt(root: HTMLElement, glyphEls: HTMLElement[]): PromptLayout | null {
  if (!glyphEls.length) return null;
  const rr = root.getBoundingClientRect();
  const n = glyphEls.length;
  const glyphs = new Float32Array(n * 3);
  const rects: DOMRect[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (let i = 0; i < n; i++) {
    const r = glyphEls[i].getBoundingClientRect();
    rects.push(r);
    minX = Math.min(minX, r.left - rr.left);
    maxX = Math.max(maxX, r.right - rr.left);
    top = Math.min(top, r.top - rr.top);
    bottom = Math.max(bottom, r.bottom - rr.top);
  }
  const width = Math.max(1, maxX - minX);
  for (let i = 0; i < n; i++) {
    const r = rects[i];
    glyphs[i * 3] = r.left - rr.left;
    glyphs[i * 3 + 1] = r.right - rr.left;
    glyphs[i * 3 + 2] = (r.left + r.width / 2 - rr.left - minX) / width;
  }
  const caret: [number, number] = [minX, (top + bottom) / 2];
  const rect: [number, number, number, number] = [minX, top, maxX, bottom];
  return { caret, rect, glyphs, ink: rasterize(glyphEls, rects, rr, minX, width, top, bottom) };
}

function rasterize(glyphEls: HTMLElement[], rects: DOMRect[], rr: DOMRect, minX: number, width: number, top: number, bottom: number) {
  const cs = getComputedStyle(glyphEls[0]);
  const size = parseFloat(cs.fontSize) || 18;
  const pad = 4;
  const w = Math.ceil((width + pad * 2) * SCALE);
  const h = Math.ceil((bottom - top + pad * 2) * SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Float32Array(0);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size * SCALE}px ${cs.fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  const m = ctx.measureText('Hg');
  const ascent = m.fontBoundingBoxAscent / SCALE;
  for (let i = 0; i < glyphEls.length; i++) {
    const ch = glyphEls[i].textContent ?? '';
    if (!ch.trim()) continue;
    const r = rects[i];
    const x = (r.left - rr.left - minX + pad) * SCALE;
    const y = (r.top - rr.top + ascent - top + pad) * SCALE;
    ctx.fillText(ch, x, y);
  }
  const data = ctx.getImageData(0, 0, w, h).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] >= ALPHA_MIN) count++;
  const ink = new Float32Array(count * 3);
  let k = 0;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (data[(py * w + px) * 4 + 3] < ALPHA_MIN) continue;
      const x = minX - pad + (px + 0.5) / SCALE;
      ink[k++] = x;
      ink[k++] = top - pad + (py + 0.5) / SCALE;
      ink[k++] = (x - minX) / width;
    }
  }
  return ink;
}
