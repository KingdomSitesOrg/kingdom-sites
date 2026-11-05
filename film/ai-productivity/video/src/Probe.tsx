// The press probe, for verify/press-check.mjs only (inputProps.probe): on
// every frame it is drawn, it measures where the cursor's tip actually is on
// the rendered page and logs it with the press target from timeline.json, and
// counts the pointers on the page. timeline/build.mjs checks the sheet's
// arithmetic; this checks the layout the film really draws.

import { useLayoutEffect } from "react";
import { useCurrentFrame } from "remotion";

import { PRESSES, cursorState } from "./lib/timeline.ts";

export function Probe() {
  const f = useCurrentFrame();
  useLayoutEffect(() => {
    const root = document.querySelector("[data-film-root]")?.getBoundingClientRect();
    if (!root) return;
    const pointers = document.querySelectorAll("[data-pointer]").length;
    const tipEl = document.querySelector("[data-tip]");
    const r = tipEl?.getBoundingClientRect();
    const tip = r ? { x: r.left - root.left, y: r.top - root.top } : null;
    const press = PRESSES.find((p) => p.frame === f) ?? null;
    const c = cursorState(f);
    console.log(
      `PROBE ${JSON.stringify({ f, pointers, tip, scale: c.scale, press: press ? { scene: press.scene, name: press.name, x: press.x, y: press.y, source: press.source } : null, rootW: root.width, rootH: root.height })}`,
    );
  }, [f]);
  return null;
}
