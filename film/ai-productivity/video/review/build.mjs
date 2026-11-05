#!/usr/bin/env node
// Builds the review page into review/dist: scans the scenes (so the page shows
// every clip, frame set and draft that exists now), bundles the page and the
// film with esbuild, and links everything in public/ (scenes, drafts, cursor,
// fonts, voice lines, the mix) into dist, so a rebuilt timeline, a new clip or
// the mix shows on the next R in the page.
//   node review/build.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as esbuild from "esbuild";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "review", "dist");
fs.mkdirSync(DIST, { recursive: true });

if (!process.env.FILM_NO_SCAN) if (!process.env.FILM_NO_SCAN) execFileSync(process.execPath, [path.join(ROOT, "tools", "scan-scenes.mjs"), "--quiet"], { stdio: "inherit" });

await esbuild.build({
  entryPoints: [path.join(ROOT, "review", "main.tsx")],
  outfile: path.join(DIST, "main.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  minify: true,
  sourcemap: false,
  logLevel: "warning",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    react: path.join(ROOT, "node_modules", "react"),
    "react-dom": path.join(ROOT, "node_modules", "react-dom"),
  },
  nodePaths: [path.join(ROOT, "node_modules")],
});

fs.copyFileSync(path.join(ROOT, "review", "index.html"), path.join(DIST, "index.html"));
// public/ entries, linked (the mix is linked even before it exists, so it appears on R once written)
const names = new Set([...fs.readdirSync(path.join(ROOT, "public")), "mix.wav"]);
for (const name of fs.readdirSync(DIST)) {
  // a link to something no longer in public/ goes
  if (!names.has(name) && fs.lstatSync(path.join(DIST, name)).isSymbolicLink()) fs.rmSync(path.join(DIST, name));
}
for (const name of names) {
  const link = path.join(DIST, name);
  fs.rmSync(link, { force: true, recursive: true });
  fs.symlinkSync(path.join("..", "..", "public", name), link);
}
console.log(`review/dist: ${fs.readdirSync(DIST).sort().join(", ")}`);
