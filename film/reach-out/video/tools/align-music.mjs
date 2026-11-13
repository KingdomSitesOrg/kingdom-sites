// Version 4 music: the clean track (../audio/music-raw.mp3, generated once for Bend reality; no new
// generation, nothing paid), with no pitch shift or effects (v3's pitch shift sounded broken),
// re-arranged with two breaks and a click:
//   0.0 to 6.0 s     the track from its start
//   6.0 s            DEAD STOP, a beat before the tap
//   6.5 s            a small, satisfying click, alone, as the fingertip presses PUBLISH
//   7.0 to 16.0 s    the music drops back in with the track's second phrase (8 s in the file)
//   16.0 s           DEAD STOP again, a beat before the burst
//   16.5 s           the track's final hit (24.027 s in the file) on the burst, ringing out by 17.5 s
//   17.5 to 22.17 s  the track from 19 s under the end words, fading over the last 0.6 s
import { SR, read, write } from "./pcm.mjs";

const OFFSET = 0.025; // the file's beats sit 25 ms after each half second
const HIT_AT = 24.027;
const STOP1 = 6.0, TAP = 6.5, BACK = 7.0, STOP2 = 16.0, BURST = 16.5, LAND = 17.5;
const END = 665 / 30;
const EDGE = 0.005;
const raw = read("../audio/music-raw.mp3");
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
place(OFFSET, 0, STOP1, 0.012);
place(8 + OFFSET - EDGE, BACK - EDGE, STOP2 - BACK, 0.012);
place(HIT_AT - EDGE, BURST - EDGE, LAND - BURST - 0.05, 0.8);
place(19 + OFFSET - EDGE, LAND - EDGE, END - LAND + EDGE, 0.6);

// The click: a crisp tick on top of a soft low "thock" (the press), and a quieter one 90 ms later
// (the button springing back).
function click(at, level) {
  const a0 = Math.round(at * SR);
  let seed = 3;
  for (let i = 0; i < 0.08 * SR; i++) {
    const t = i / SR;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = (seed / 0x7fffffff) * 2 - 1;
    const tick = Math.sin(2 * Math.PI * 3100 * t) * Math.exp(-t / 0.0035) * 0.55 + noise * Math.exp(-t / 0.0012) * 0.35;
    const thock = Math.sin(2 * Math.PI * (190 * t - 700 * t * t)) * Math.exp(-t / 0.022) * 0.7;
    const v = (tick + thock) * level * Math.min(1, t / 0.0004);
    out[(a0 + i) * 2] += v;
    out[(a0 + i) * 2 + 1] += v;
  }
}
click(TAP, 0.55);
click(TAP + 0.09, 0.22);

write("../audio/music.wav", out);
console.log(`../audio/music.wav: ${(total / SR).toFixed(3)} s; stops at ${STOP1} and ${STOP2} s, click at ${TAP} s, back at ${BACK} s, hit at ${BURST} s`);
