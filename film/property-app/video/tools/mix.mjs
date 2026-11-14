// The soundtrack: this ad's own track (../audio/raw/music_gen2.mp3, 150 BPM, its first beat at
// 0.245 s, so it is trimmed by that much to put its beats on the film's 12-frame grid; its big hit
// then lands with the end card; it is slowed to 128.6 BPM with the picture, with the end card) as the bed, and a small dry sound only where something
// real happens. Cue times are in scene units (see SPEED in src/lib.ts) and converted here. One
// plain gain to about -14 LUFS; lowered if the true peak passes -1 dBTP. Writes public/mix.wav.
import { execFileSync } from "node:child_process";
import { SR, measure, write } from "./pcm.mjs";

const FPS = 30;
const SPEED = 15 / 14;
const LEN = 427 / FPS;
/** The track is slowed with the picture, 150 to 128.6 BPM, pitch kept. */
const TEMPO = 6 / 7;
const TARGET = -14;
const CEILING = -1;
const db = (v) => Math.pow(10, v / 20);

function load(path, af = "anull", start = 0) {
  const raw = execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-ss", String(start), "-i", path, "-af", af, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4).slice();
}

const SFX = {
  pop: load("../audio/sfx/pop.mp3", "lowpass=f=5000"),
  land: load("../audio/sfx/slam.mp3", "lowpass=f=900,volume=0.8"),
  thump: load("../audio/sfx/slam.mp3", "lowpass=f=1400,atrim=0:0.25,afade=t=out:st=0.12:d=0.13"),
  tick: load("../audio/sfx/tick.mp3", "lowpass=f=4000"),
  tap: load("../audio/sfx/click.mp3", "lowpass=f=2200"),
  bubble: load("../audio/sfx/bubble.mp3"),
  click: load("../audio/sfx/click.mp3", "lowpass=f=3000"),
};

// [scene unit, sound, dB, pan -1..1]
const CUES = [
  [15, "land", -11, 0],
  [45, "pop", -15, -0.4], [50, "pop", -15, 0.4], [55, "pop", -15, -0.4], [60, "pop", -15, 0.4], [65, "pop", -15, -0.2],
  [90, "land", -11, 0], [105, "pop", -10, 0],
  [150, "tap", -10, 0], [167.5, "click", -9, 0.1], [180, "bubble", -11, 0],
  [207.5, "tap", -9, 0], [225, "pop", -13, -0.4], [232.5, "pop", -13, 0], [240, "thump", -10, 0.3], [240, "bubble", -11, 0.3],
  [270, "bubble", -10, 0], [272.5, "tick", -18, -0.4], [277.5, "tick", -18, 0.4], [282.5, "tick", -18, -0.4], [287.5, "tick", -18, 0.4],
  [315, "pop", -10, 0], [330, "land", -10, 0],
  [435, "click", -7, 0.2],
];

const n = Math.round(LEN * SR);
const out = new Float32Array(n * 2);
const music = load("../audio/raw/music_gen2.mp3", `atempo=${TEMPO}`, 0.245);
for (let k = 0; k < n * 2 && k < music.length; k++) out[k] = music[k] * db(-4);

for (const [frame, name, gain, pan] of CUES) {
  const s = SFX[name];
  const at = Math.round(((frame / SPEED + 1) / FPS) * SR) * 2;
  const g = db(gain);
  const l = g * Math.min(1, 1 - pan), r = g * Math.min(1, 1 + pan);
  for (let i = 0; i < s.length && at + i + 1 < out.length; i += 2) {
    out[at + i] += s[i] * l;
    out[at + i + 1] += s[i + 1] * r;
  }
}
// A short fade on the very end so the music never stops on a cut.
const fade = Math.round(0.3 * SR);
for (let k = 0; k < fade; k++) {
  const g = k / fade;
  out[(n - 1 - k) * 2] *= g;
  out[(n - 1 - k) * 2 + 1] *= g;
}

write("build/pre.wav", out);
let gain = TARGET - measure("build/pre.wav").integrated;
let level;
for (let tries = 0; tries < 4; tries++) {
  const k = db(gain);
  write("public/mix.wav", out.map((v) => v * k));
  level = measure("public/mix.wav");
  if (level.truePeak <= CEILING) break;
  gain -= level.truePeak - CEILING + 0.2;
}
const f = (v) => v.toFixed(1);
console.log(`mix: gain ${f(gain)} dB, overall ${f(level.integrated)} LUFS, true peak ${f(level.truePeak)} dBTP -> public/mix.wav`);
