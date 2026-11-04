/**
 * Screen-space signals (STORYBOARD 3.7). The Scene writes them after its camera update; the HUD readers
 * (Leader, BBoxBrackets) read them on the gsap ticker. CSS px are canvas px, which are viewport px.
 *
 *   anchors[key] = Float32Array(3) [x, y, visible 0|1]
 *   bbox         = Float32Array(4) [minX, minY, maxX, maxY], NaN in slot 0 while hidden
 */
export type ScreenAnchor = Float32Array;
export type ScreenAnchors = Record<string, ScreenAnchor>;
export type ScreenBBox = Float32Array;

// One implementation for writers and readers: the story owns the format.
export { createAnchors, createBBox } from "@/strata/story/screen";

/** Leaders and anchors hide this close to the copy column (px). */
export const COPY_COLUMN_MARGIN = 24;

/**
 * The story's copy column (STORYBOARD 6): desktop x 6vw .. 6vw + min(34vw, 520px) over the full height;
 * below 768 px the top band 10..34 svh across the full width. Written into `out` as [x0, y0, x1, y1].
 */
export function copyColumn(width: number, height: number, out: Float32Array) {
  if (width >= 768) {
    out[0] = width * 0.06;
    out[1] = 0;
    out[2] = out[0] + Math.min(width * 0.34, 520);
    out[3] = height;
  } else {
    out[0] = 0;
    out[1] = height * 0.1;
    out[2] = width;
    out[3] = height * 0.34;
  }
  return out;
}

/** True when (x, y) lies within `margin` px of the rect [x0, y0, x1, y1]. */
export function nearRect(x: number, y: number, rect: Float32Array, margin = COPY_COLUMN_MARGIN) {
  return x > rect[0] - margin && x < rect[2] + margin && y > rect[1] - margin && y < rect[3] + margin;
}
