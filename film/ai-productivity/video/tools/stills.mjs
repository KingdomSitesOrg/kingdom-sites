#!/usr/bin/env node
// Stills for checking the picture, without a film render: scans the scenes,
// bundles the film once and draws the frames asked for, two at a time at most
// (this Mac is short on memory and other agents share it).
//   node tools/stills.mjs 1081,1966 [--scale 1] [--out out/stills] [--probe] [--source frames|clips]
// With --probe the film logs what verify/press-check.mjs measures (PROBE …).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const opt = (name, d) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : d);
const frames = (args.find((a) => /^\d/.test(a)) ?? "1081").split(",").map(Number);
const scale = Number(opt("scale", 1));
const out = path.resolve(ROOT, opt("out", "out/stills"));
const source = opt("source", "frames");
const CONCURRENCY = 2;
fs.mkdirSync(out, { recursive: true });

if (!args.includes("--no-scan")) execFileSync(process.execPath, [path.join(ROOT, "tools", "scan-scenes.mjs"), "--quiet"], { stdio: "inherit" });
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public"), symlinkPublicDir: true });
const browser = await openBrowser("chrome");
const inputProps = { audio: false, review: false, probe: args.includes("--probe"), source };
const composition = await selectComposition({ serveUrl, id: "Film", inputProps, puppeteerInstance: browser });
console.log(`COMPOSITION ${JSON.stringify({ id: composition.id, durationInFrames: composition.durationInFrames, fps: composition.fps, width: composition.width, height: composition.height })}`);
const queue = [...frames];
const logs = [];
async function worker() {
  while (queue.length) {
    const frame = queue.shift();
    const file = path.join(out, `f${String(frame).padStart(4, "0")}.png`);
    await renderStill({
      serveUrl,
      composition,
      frame,
      output: file,
      scale,
      inputProps,
      puppeteerInstance: browser,
      onBrowserLog: (l) => logs.push(`f${frame}: ${l.text}`),
    });
    console.log(file);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, frames.length) }, worker));
await browser.close({ silent: true });
for (const l of logs) if (/PROBE|error|warn/i.test(l)) console.log(l);
if (process.env.FILM_LOGS) fs.writeFileSync(process.env.FILM_LOGS, logs.join("\n") + "\n");
