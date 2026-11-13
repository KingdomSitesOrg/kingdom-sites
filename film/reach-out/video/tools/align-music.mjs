// Version 7 music: the clean track (../audio/music-raw.mp3, generated once for Bend reality; no new
// generation, nothing paid), re-arranged with two breaks and two clicks:
//   0.0 to 6.0 s     the track from its start
//   6.0 s            DEAD STOP, a beat before the tap
//   6.5 s            a firm click, alone, as the fingertip presses PUBLISH
//   7.0 to 16.0 s    the music drops back in with the track's second phrase (8 to 17 s in the file),
//                    under the carousel and both parts of the message
//   16.0 to 19.5 s   the track from 19 s (its run into the loudest bar) under the end card
//   19.5 s           DEAD STOP while the pointer glides in
//   20.0 s           the pointer's firm click and the track's final hit (24.027 s in the file)
//                    together; everything explodes; the hit rings out to the end
import { SR, read, write } from "./pcm.mjs";

const OFFSET = 0.025; // the file's beats sit 25 ms after each half second
const HIT_AT = 24.027;
const STOP1 = 6.0, TAP = 6.5, BACK = 7.0, CARD = 16.0, STOP2 = 19.5, CLICK = 20.0;
const END = 635 / 30;
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
place(8 + OFFSET - EDGE, BACK - EDGE, CARD - BACK);
place(19 + OFFSET - EDGE, CARD - EDGE, STOP2 - CARD, 0.012);
place(HIT_AT - EDGE, CLICK - EDGE, END - CLICK + EDGE, 0.9);

// The click: a firm, solid press. A crisp transient (a short noise snap and a 2.6 kHz tick), a
// woody mid knock (900 Hz) for firmness, and a low body (150 Hz falling) for weight; then a
// quieter, higher one 85 ms later as the button springs back.
function click(at, level, pitch = 1) {
  const a0 = Math.round(at * SR);
  let seed = 3;
  for (let i = 0; i < 0.12 * SR; i++) {
    const t = i / SR;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = (seed / 0x7fffffff) * 2 - 1;
    const snap = noise * Math.exp(-t / 0.0016) * 0.6 + Math.sin(2 * Math.PI * 2600 * pitch * t) * Math.exp(-t / 0.004) * 0.5;
    const knock = Math.sin(2 * Math.PI * 900 * pitch * t) * Math.exp(-t / 0.009) * 0.6;
    const body = Math.sin(2 * Math.PI * (150 * t - 300 * t * t)) * Math.exp(-t / 0.035) * 0.9;
    const v = Math.tanh((snap + knock + body) * 1.4) * level * Math.min(1, t / 0.0003);
    out[(a0 + i) * 2] += v;
    out[(a0 + i) * 2 + 1] += v;
  }
}
click(TAP, 0.95);
click(TAP + 0.085, 0.4, 1.25);
click(CLICK, 0.95);

write("../audio/music.wav", out);
console.log(`../audio/music.wav: ${(total / SR).toFixed(3)} s; stops at ${STOP1} and ${STOP2} s, clicks at ${TAP} and ${CLICK} s (the second with the final hit)`);
