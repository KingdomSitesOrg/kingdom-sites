// The one pointer: the kit's cursor rendered once in Blender
// (public/cursor.png, drawn 1:1 at 1080p with its soft contact shadow baked
// in, the same size as in the approved scene 5 still), placed in frame pixels
// so its tip sits exactly on the point timeline.json gives, and scaled about
// the tip when it presses. Drawn above every scene, under the end fades.
// Blender scenes never contain a cursor; this is the only pointer in the film.

import { Img, staticFile, useCurrentFrame } from "remotion";

import { SPRITE, cursorState } from "./lib/timeline.ts";

export function Cursor() {
  const f = useCurrentFrame();
  const c = cursorState(f);
  if (!c.visible) return null;
  return (
    <div
      data-pointer="the-one"
      style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `translate(${c.x}px, ${c.y}px)`, pointerEvents: "none" }}
    >
      <div
        style={{
          position: "absolute",
          left: -SPRITE.tipX,
          top: -SPRITE.tipY,
          width: SPRITE.width,
          height: SPRITE.height,
          transformOrigin: `${SPRITE.tipX}px ${SPRITE.tipY}px`,
          transform: `scale(${c.scale})`,
        }}
      >
        <Img src={staticFile("cursor.png")} style={{ width: SPRITE.width, height: SPRITE.height, display: "block" }} />
        {/* the tip, for the press check (verify/press-check.mjs): scales with the sprite */}
        <div data-tip="" style={{ position: "absolute", left: SPRITE.tipX, top: SPRITE.tipY, width: 0, height: 0 }} />
      </div>
    </div>
  );
}
