// The film's soundtrack: music only. Reads ../audio/music.wav (npm run music), rises 3 dB from the
// start to the words landing (17.5 s), one plain gain to about -16 LUFS, no limiter; if the true
// peak would pass -1 dBTP the gain is lowered. Writes build/mix.wav.
import { rmSync } from "node:fs";
import { SR, measure, read, write } from "./pcm.mjs";

const TARGET = -16;
const RISE = 3;
const LAND = 16.5;
const CEILING = -1;
const db = (v) => Math.pow(10, v / 20);
const music = read("../audio/music.wav");
const n = music.length;
const shaped = new Float32Array(n);
for (let i = 0; i < n; i += 2) {
  const g = db(-RISE + RISE * Math.min(1, i / 2 / SR / LAND));
  shaped[i] = music[i] * g;
  shaped[i + 1] = music[i + 1] * g;
}
write("build/music-shaped.wav", shaped);
const lvl = measure("build/music-shaped.wav");
rmSync("build/music-shaped.wav");
let gain = TARGET - lvl.integrated;
function mixWith(g) {
  const out = new Float32Array(n);
  const k = db(g);
  for (let i = 0; i < n; i++) out[i] = shaped[i] * k;
  write("build/mix.wav", out);
  return measure("build/mix.wav");
}
let level = mixWith(gain);
for (let tries = 0; level.truePeak > CEILING && tries < 3; tries++) {
  gain -= level.truePeak - CEILING + 0.2;
  level = mixWith(gain);
}
if (level.truePeak > CEILING) throw new Error(`true peak ${level.truePeak} dBTP is over ${CEILING}`);
const f = (v) => v.toFixed(1);
console.log(`mix: gain ${f(gain)} dB, overall ${f(level.integrated)} LUFS, loudest moment ${f(level.loudestMomentary)} LUFS, true peak ${f(level.truePeak)} dBTP -> build/mix.wav`);
