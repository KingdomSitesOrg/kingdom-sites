// Cuts the Bend reality music (../audio/music-raw.mp3, 120 BPM, generated once; no new generation,
// no API call) to this film, on beats:
//   0.000 to 12.000 s   the track as generated (its break at 7 to 8 s falls before the tap; its
//                       second phrase drops in on the tap at 8 s)
//   12.000 s            the track's final hit (24.027 s in the file) on the burst, ringing out
//                       and gone by 14 s while the tiles gather
//   14.000 to 18.667 s  the track from 19 s (the run into its loudest bar) under the words,
//                       fading over the last 0.6 s
// The file's beats sit 25 ms after each half second, so every piece is taken 25 ms later.
import { SR, read, write } from "./pcm.mjs";

const OFFSET = 0.025;
const HIT_AT = 24.027;
const BURST = 12.0; // step 144, the first frame of the burst
const LAND = 14.0; // step 168, the words land
const END = 560 / 30;
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

place(OFFSET, 0, BURST - EDGE);
place(HIT_AT - EDGE, BURST - EDGE, LAND - BURST - 0.05, 1.2);
place(19 + OFFSET - EDGE, LAND - EDGE, END - LAND + EDGE, 0.6);

write("../audio/music.wav", out);
console.log(`../audio/music.wav: ${(total / SR).toFixed(3)} s; hit at ${BURST.toFixed(3)} s, words' music from ${LAND.toFixed(3)} s`);
