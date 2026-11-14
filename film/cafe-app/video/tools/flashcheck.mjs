// Photosensitivity check for a finished render. Reads every frame, and for every small patch of
// the picture counts how often its brightness swings up and down inside any one second.
//
//   node tools/flashcheck.mjs video/out/film.mp4
//
// The rules it applies (the WCAG 2.3.1 / broadcast "three flashes" test, kept a little stricter):
//   - a swing   = brightness (relative luminance) going up or down by 10% of full white or more,
//                 where the darker side is under 80% (general), or a saturated red changing a lot (red);
//   - a flash   = two opposite swings;
//   - it FAILS  if any region a third of the frame wide and a third tall has a quarter or more of
//                 its area flashing MORE than 3 times inside any one second;
//   - it also reports the biggest whole-frame brightness jump between two frames in a row.
// Exit code 0 = pass, 1 = fail.
import { spawn } from "node:child_process";

const file = process.argv[2];
if (!file) { console.error("usage: node flashcheck.mjs <video>"); process.exit(2); }
const GW = 90, GH = 160, N = GW * GH;            // the picture is averaged down to this grid
const WW = Math.round(GW / 3), WH = Math.round(GH / 3);   // the region the area rule is judged in
const AREA = 0.25;                               // a quarter of that region
const LIMIT = 3;                                 // flashes allowed in one second

const probe = await new Promise((res) => {
  const p = spawn("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", file]);
  let s = ""; p.stdout.on("data", (d) => (s += d)); p.on("close", () => res(s.trim()));
});
const [fn, fd] = probe.split("/").map(Number);
const FPS = Math.round(fn / (fd || 1));

const lin = new Float32Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; lin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }

// One swing detector per patch, for brightness and for red.
const mk = () => ({ dir: new Int8Array(N), lo: new Float32Array(N).fill(Infinity), hi: new Float32Array(N).fill(-Infinity), ext: new Float32Array(N), sat: new Uint8Array(N), count: new Uint8Array(N), ring: [] });
const lum = mk(), red = mk();
const val = new Float32Array(N), rv = new Float32Array(N), rsat = new Uint8Array(N);

/** Feeds one frame of values to a detector; returns the mask of patches that completed a swing. */
const step = (d, v, thr, ok, sat) => {
  const m = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const x = v[i];
    let hit = 0;
    if (d.dir[i] === 0) {
      if (x < d.lo[i]) d.lo[i] = x;
      if (x > d.hi[i]) d.hi[i] = x;
      if (sat && sat[i]) d.sat[i] = 1;
      if (x - d.lo[i] >= thr && ok(d.lo[i], x, i, d)) hit = 1;
      else if (d.hi[i] - x >= thr && ok(x, d.hi[i], i, d)) hit = -1;
    } else if (d.dir[i] === 1) {
      if (x > d.ext[i]) { d.ext[i] = x; if (sat) d.sat[i] = sat[i]; }
      if (d.ext[i] - x >= thr && ok(x, d.ext[i], i, d)) hit = -1;
    } else {
      if (x < d.ext[i]) { d.ext[i] = x; if (sat) d.sat[i] = sat[i]; }
      if (x - d.ext[i] >= thr && ok(d.ext[i], x, i, d)) hit = 1;
    }
    if (hit) { d.dir[i] = hit; d.ext[i] = x; if (sat) d.sat[i] = sat[i]; m[i] = 1; }
  }
  d.ring.push(m);
  for (let i = 0; i < N; i++) d.count[i] += m[i];
  if (d.ring.length > FPS) { const old = d.ring.shift(); for (let i = 0; i < N; i++) d.count[i] -= old[i]; }
  return m;
};

/** The fullest region: the largest share of any WW by WH region whose patches pass `test`. */
const integ = new Int32Array((GW + 1) * (GH + 1));
const worstRegion = (test) => {
  for (let y = 0; y < GH; y++) {
    let row = 0;
    for (let x = 0; x < GW; x++) {
      row += test(y * GW + x) ? 1 : 0;
      integ[(y + 1) * (GW + 1) + x + 1] = integ[y * (GW + 1) + x + 1] + row;
    }
  }
  let best = 0;
  for (let y = 0; y + WH <= GH; y++) for (let x = 0; x + WW <= GW; x++) {
    const s = integ[(y + WH) * (GW + 1) + x + WW] - integ[y * (GW + 1) + x + WW] - integ[(y + WH) * (GW + 1) + x] + integ[y * (GW + 1) + x];
    if (s > best) best = s;
  }
  return best / (WW * WH);
};

const stat = (d) => ({ d, rate: 0, rateAt: 0, over: 0, overAt: 0, overFrames: 0, perSec: new Map() });
const S = { lum: stat(lum), red: stat(red) };
let frame = 0, prevMean = null, jump = 0, jumpAt = 0, sweep = 0, sweepAt = 0;
const fail = [];

const onFrame = (buf) => {
  let mean = 0;
  for (let i = 0; i < N; i++) {
    const r = buf[i * 3], g = buf[i * 3 + 1], b = buf[i * 3 + 2];
    const L = 0.2126 * lin[r] + 0.7152 * lin[g] + 0.0722 * lin[b];
    val[i] = L; mean += L;
    rsat[i] = r + g + b > 0 && r / (r + g + b) >= 0.8 ? 1 : 0;
    rv[i] = Math.max(0, (r - g - b) / 255) * 320;
  }
  mean /= N;
  if (prevMean !== null && Math.abs(mean - prevMean) > jump) { jump = Math.abs(mean - prevMean); jumpAt = frame; }
  prevMean = mean;
  const m = step(lum, val, 0.1, (lo) => lo < 0.8, null);
  step(red, rv, 20, (_lo, _hi, i, d) => rsat[i] === 1 || d.sat[i] === 1, rsat);
  let sw = 0; for (let i = 0; i < N; i++) sw += m[i];
  if (sw / N > sweep) { sweep = sw / N; sweepAt = frame; }
  for (const [name, s] of Object.entries(S)) {
    // The highest flash rate that a quarter of some region reaches in the second ending here.
    let k = 0;
    while (worstRegion((i) => s.d.count[i] >= (k + 1) * 2) >= AREA) k++;
    if (k > s.rate) { s.rate = k; s.rateAt = frame; }
    const sec = Math.floor(frame / FPS);
    s.perSec.set(sec, Math.max(s.perSec.get(sec) ?? 0, k));
    const over = worstRegion((i) => s.d.count[i] >= LIMIT * 2 + 1);
    if (over > s.over) { s.over = over; s.overAt = frame; }
    if (over >= AREA) {
      s.overFrames++;
      // One line per unbroken run of failing frames.
      const last = fail[fail.length - 1];
      if (last && last.name === name && last.to === frame - 1) { last.to = frame; last.peak = Math.max(last.peak, over); }
      else fail.push({ name, from: frame, to: frame, peak: over });
    }
  }
  frame++;
};

const ff = spawn("ffmpeg", ["-v", "error", "-i", file, "-vf", `scale=${GW}:${GH}:flags=area`, "-pix_fmt", "rgb24", "-f", "rawvideo", "-"]);
let pend = Buffer.alloc(0);
ff.stdout.on("data", (d) => {
  pend = pend.length ? Buffer.concat([pend, d]) : d;
  while (pend.length >= N * 3) { onFrame(pend.subarray(0, N * 3)); pend = pend.subarray(N * 3); }
});
ff.stderr.on("data", (d) => process.stderr.write(d));
ff.on("close", (code) => {
  if (code !== 0 || frame === 0) { console.error("could not read the video"); process.exit(2); }
  const t = (f) => `${(f / FPS).toFixed(2)} s (frame ${f})`;
  const pass = fail.length === 0;
  console.log(`${file}\n${frame} frames at ${FPS} a second (${(frame / FPS).toFixed(1)} s)`);
  for (const [name, s] of Object.entries(S)) {
    const label = name === "lum" ? "Brightness flashes" : "Red flashes";
    console.log(`${label}: worst ${s.rate} a second, in the second ending ${t(s.rateAt)}. Limit ${LIMIT}. Frames over the limit: ${s.overFrames}. Largest share of a region over the limit: ${(s.over * 100).toFixed(1)}%${s.over ? ` at ${t(s.overAt)}` : ""} (fails at ${AREA * 100}%).`);
    const busy = [...s.perSec].filter(([, k]) => k > 0).map(([sec, k]) => `${sec}s:${k}`).join(" ");
    console.log(`  by second (flashes): ${busy || "none"}`);
  }
  console.log(`Biggest whole-frame brightness jump between two frames: ${(jump * 100).toFixed(1)}% of full white, at ${t(jumpAt)}.`);
  console.log(`Most of the frame swinging on one frame: ${(sweep * 100).toFixed(1)}%, at ${t(sweepAt)}.`);
  for (const r of fail) console.log(`  FAIL ${r.name === "lum" ? "brightness" : "red"}: ${t(r.from)} to ${t(r.to)}, up to ${(r.peak * 100).toFixed(0)}% of a region over ${LIMIT} flashes a second`);
  console.log(pass ? "RESULT: PASS" : "RESULT: FAIL");
  process.exit(pass ? 0 : 1);
});
