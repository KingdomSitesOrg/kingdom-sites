#!/usr/bin/env node
// Keeps the review page current all night while the scenes render: every
// minute it rescans the scenes (tools/scan-scenes.mjs) and, when the manifest,
// timeline.json, the cursor, the mix or the film's source changed, rebuilds
// review/dist (a second or so). Thomas presses R in the page to see it.
// Started in the background with nohup by the edit agent; light: a few stat
// calls and an ffprobe per finished clip a minute.
//   node tools/review-watch.mjs [--every 60]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const every = Number(args.includes("--every") ? args[args.indexOf("--every") + 1] : 60) * 1000;
const WATCH = ["src/scenes.generated.json", "timeline.json", "public/cursor.json", "public/cursor.png", "public/mix.wav", "src", "src/lib", "review/main.tsx", "review/index.html"];

const stamp = () =>
  WATCH.map((w) => {
    const p = path.join(ROOT, w);
    if (!fs.existsSync(p)) return `${w}:-`;
    const st = fs.statSync(p);
    if (!st.isDirectory()) return `${w}:${st.mtimeMs}:${st.size}`;
    return fs
      .readdirSync(p)
      .filter((n) => /\.(tsx?|json)$/.test(n))
      .map((n) => `${n}:${fs.statSync(path.join(p, n)).mtimeMs}`)
      .join(",");
  }).join("|");

let last = "";
const tick = () => {
  const t = new Date().toTimeString().slice(0, 8);
  try {
    execFileSync(process.execPath, [path.join(ROOT, "tools", "scan-scenes.mjs"), "--quiet"], { cwd: ROOT, stdio: "inherit" });
    const now = stamp();
    if (now !== last) {
      execFileSync(process.execPath, [path.join(ROOT, "review", "build.mjs")], { cwd: ROOT, env: { ...process.env, FILM_NO_SCAN: "1" }, stdio: "ignore" });
      const m = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "scenes.generated.json"), "utf8"));
      console.log(`${t} rebuilt: ${m.scenes.map((s) => `${s.id}=${s.review}`).join(" ")} · ${m.audio.mix ? "mix" : "voice lines"}`);
      last = now;
    }
  } catch (err) {
    console.log(`${t} failed: ${String(err?.message ?? err).split("\n")[0]}`);
  }
};
tick();
setInterval(tick, every);
