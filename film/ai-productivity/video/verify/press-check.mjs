#!/usr/bin/env node
// Measures the film as Remotion really draws it: renders small stills with the
// probe on (src/Probe.tsx) at every press frame and at a frame in every scene
// and every cursor visit, and fails if
//   - the composition's length is not the sheet's,
//   - there is ever more than one pointer on the page, or none on a press,
//   - the cursor's tip is more than 0.75 px from its target on a press frame.
//   node verify/press-check.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tl = JSON.parse(fs.readFileSync(path.join(ROOT, "timeline.json"), "utf8"));
const presses = tl.scenes.flatMap((s) => s.presses.map((p) => ({ ...p, scene: s.id })));
const frames = new Set(presses.map((p) => p.frame));
for (const s of tl.scenes) frames.add(s.start + Math.floor(s.length / 2));
for (const k of tl.cursor) frames.add(Math.min(tl.durationInFrames - 1, k.frame + (k.show ? 4 : -4)));
frames.add(0);
frames.add(tl.durationInFrames - 1);
const list = [...frames].sort((a, b) => a - b);

const logs = path.join(ROOT, "build", "probe-logs.txt");
fs.mkdirSync(path.dirname(logs), { recursive: true });
const out = execFileSync(process.execPath, [path.join(ROOT, "tools", "stills.mjs"), list.join(","), "--probe", "--scale", "0.25", "--out", "build/probe"], {
  cwd: ROOT,
  env: { ...process.env, FILM_LOGS: logs },
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});
const comp = JSON.parse(/COMPOSITION (\{.*\})/.exec(out)?.[1] ?? "null");
const got = fs
  .readFileSync(logs, "utf8")
  .split("\n")
  .map((l) => /PROBE (\{.*\})/.exec(l)?.[1])
  .filter(Boolean)
  .map((j) => JSON.parse(j));

const problems = [];
if (!comp || comp.durationInFrames !== tl.durationInFrames || comp.fps !== tl.fps || comp.width !== tl.width || comp.height !== tl.height) {
  problems.push(`composition ${JSON.stringify(comp)} does not match the sheet (${tl.durationInFrames} frames, ${tl.fps} fps, ${tl.width}×${tl.height})`);
}
for (const f of list) if (!got.some((g) => g.f === f)) problems.push(`f${f}: nothing measured`);
let worst = 0;
for (const g of got) {
  if (g.pointers > 1) problems.push(`f${g.f}: ${g.pointers} pointers on the page`);
  const p = presses.find((q) => q.frame === g.f);
  if (!p) continue;
  if (g.pointers !== 1 || !g.tip) {
    problems.push(`f${g.f} ${p.scene} ${p.name}: no pointer on the press frame`);
    continue;
  }
  const err = Math.hypot(g.tip.x - p.x, g.tip.y - p.y);
  worst = Math.max(worst, err);
  if (err > 0.75) problems.push(`f${g.f} ${p.scene} ${p.name}: tip ${err.toFixed(2)} px from its target (dx ${(g.tip.x - p.x).toFixed(2)}, dy ${(g.tip.y - p.y).toFixed(2)})`);
  if (Math.abs(g.scale - 0.9) > 1e-6) problems.push(`f${g.f} ${p.scene} ${p.name}: scale ${g.scale}, not fully pressed (0.9)`);
  console.log(`  ${p.scene} ${p.name.padEnd(9)} f${g.f}: tip (${g.tip.x.toFixed(2)}, ${g.tip.y.toFixed(2)}) target (${p.x}, ${p.y}) ${err.toFixed(3)} px · target from ${p.source}`);
}
console.log(`press: composition ${comp?.durationInFrames} frames; ${got.length} frames measured on the rendered page, ${presses.length} presses, worst ${worst.toFixed(3)} px; never more than one pointer`);
if (problems.length) {
  console.log("press-check FAILED:");
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
}
console.log("press-check ok");
