// Version 2 music: a variation of the Bend reality track (../audio/music-raw.mp3, generated once
// for that film; no new generation, nothing paid), so it has the same tempo and hits but does not
// sound like a copy:
//   - key: two semitones higher, tempo unchanged (the beat grid stays where it was);
//   - colour: warmer low-mids, softer top, a light chorus;
//   - a new layer: a shaker on every sixteenth note and a clap on beats 2 and 4.
// Then cut to the picture, on beats:
//   0.0 to 5.5 s    the track from its start
//   5.5 to 6.5 s    the track's break (7 to 8 s in the file), the laptop resting
//   6.5 to 9.5 s    the track's second phrase (8 s in the file), dropping in on the PUBLISH tap
//   9.5 s           the track's final hit (24.027 s in the file) on the burst, ringing out by 11 s
//   11.0 to 15.67 s the track from 19 s (the run into its loudest bar) under the words, fading
//                   over the last 0.6 s
import { execFileSync } from "node:child_process";
import { SR, read, write } from "./pcm.mjs";

const SEMI = 2;
const k = Math.pow(2, SEMI / 12);
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", "../audio/music-raw.mp3", "-af",
  `aresample=${SR},asetrate=${SR * k},aresample=${SR},atempo=${(1 / k).toFixed(6)},equalizer=f=280:t=q:w=1:g=3,equalizer=f=4500:t=q:w=1:g=-4,chorus=0.7:0.85:45:0.3:0.25:2`,
  "-ar", String(SR), "-ac", "2", "build/music-varied.wav"]);

const OFFSET = 0.025;
const HIT_AT = 24.027;
const LAPTOP = 5.5, TAP = 6.5, BURST = 9.5, LAND = 11.0;
const END = 470 / 30;
const EDGE = 0.005;
const raw = read("build/music-varied.wav");
const frames = raw.length / 2;
const total = Math.round(END * SR);
const out = new Float32Array(total * 2);

function place(from, at, len, tailFade = EDGE) {
  const n = Math.round(len * SR);
  const f0 = Math.round(from * SR);
  const a0 = Math.round(at * SR);
  const fin = Math.round(EDGE * SR);
  const fout = Math.round(tailFade * SR);
  for (let i = 0; i < n; i++) {
    const s = f0 + i;
    const d = a0 + i;
    if (s < 0 || s >= frames || d < 0 || d >= total) continue;
    let g = 1;
    if (i < fin && from > 0.01) g = i / fin;
    if (i > n - fout) g *= Math.pow((n - i) / fout, 2);
    out[d * 2] += raw[s * 2] * g;
    out[d * 2 + 1] += raw[s * 2 + 1] * g;
  }
}
place(OFFSET, 0, LAPTOP);
place(7 + OFFSET - EDGE, LAPTOP - EDGE, TAP - LAPTOP);
place(8 + OFFSET - EDGE, TAP - EDGE, BURST - TAP);
place(HIT_AT - EDGE, BURST - EDGE, LAND - BURST - 0.05, 1.2);
place(19 + OFFSET - EDGE, LAND - EDGE, END - LAND + EDGE, 0.6);

// The new layer, on the film's own beat grid (a beat every 0.5 s, bars on the even seconds).
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
function hitAt(t, len, level, shape, pan) {
  const a0 = Math.round(t * SR);
  let prev = 0;
  for (let i = 0; i < len * SR; i++) {
    const d = a0 + i;
    if (d >= total) break;
    const n = rnd();
    const hp = n - prev; // brighter noise
    prev = n;
    const v = hp * level * shape(i / SR);
    out[d * 2] += v * (1 - pan);
    out[d * 2 + 1] += v * (1 + pan);
  }
}
const shaker = (t) => Math.exp(-t / 0.018) * Math.min(1, t / 0.002);
const clap = (t) => (t < 0.006 || (t > 0.011 && t < 0.017) ? 1 : 0) * 0.8 + (t > 0.022 ? Math.exp(-(t - 0.022) / 0.09) : 0);
const playing = (t) => (t < BURST - 0.01 || t >= LAND - 0.01) && t < END - 0.6;
for (let t = 0; t < END; t += 0.125) {
  if (!playing(t)) continue;
  const inBreak = t >= LAPTOP && t < TAP;
  const sub = Math.round(t / 0.125) % 4;
  hitAt(t, 0.08, (sub === 2 ? 0.07 : 0.04) * (inBreak ? 0.5 : 1), shaker, sub % 2 ? 0.3 : -0.3);
  const beatInBar = Math.round(t / 0.5) % 4;
  if (sub === 0 && (beatInBar === 1 || beatInBar === 3) && !inBreak) hitAt(t, 0.35, 0.16, clap, 0);
}

write("../audio/music.wav", out);
console.log(`../audio/music.wav: ${(total / SR).toFixed(3)} s; +${SEMI} semitones, shaker and clap layer; tap ${TAP} s, hit ${BURST} s, words ${LAND} s`);
