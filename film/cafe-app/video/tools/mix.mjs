// The soundtrack: the music (../audio/raw/music_gen1.mp3, trimmed 40 ms so its beats sit on the
// film's 15-frame grid; draft 2 plays its 6-9 s section twice, from 9 s, so the film can run 3 s
// longer and the track's last hit still lands on the end card at 12.75 s) as the bed, and a small dry sound only where something real happens: a
// cut-out lands, a finger taps, a stamp thumps, a notification arrives, the last click. Effects
// sit under the music. One plain gain to about -14 LUFS; lowered if the true peak passes -1 dBTP.
// Writes public/mix.wav.
import { execFileSync } from "node:child_process";
import { SR, measure, write } from "./pcm.mjs";

const FPS = 30;
const LEN = 435 / FPS;
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
  tap: load("../audio/sfx/click.mp3", "lowpass=f=2200"),
  bubble: load("../audio/sfx/bubble.mp3"),
  click: load("../audio/sfx/click.mp3", "lowpass=f=3000"),
};

// [frame, sound, dB, pan -1..1]
const CUES = [
  [15, "pop", -12, -0.4], [45, "pop", -12, 0.4],
  [90, "land", -10, 0], [105, "pop", -11, -0.1], [120, "tap", -9, -0.1],
  [150, "tap", -9, 0], [165, "bubble", -11, 0],
  [187.5, "thump", -9, -0.3], [195, "thump", -10, 0], [202.5, "thump", -9, 0.3],
  [210, "thump", -10, -0.3], [217.5, "thump", -9, 0], [225, "bubble", -9, 0.3],
  [255, "bubble", -10, 0], [262.5, "pop", -15, -0.6], [270, "pop", -15, 0.6], [277.5, "pop", -15, -0.6],
  [360, "pop", -11, 0], [412.5, "click", -7, 0.2],
];

const n = Math.round(LEN * SR);
const out = new Float32Array(n * 2);
const music = load("../audio/raw/music_gen1.mp3", "anull", 0.04);
// Film time t plays music time t before 9 s and t - 3 after it, with a 10 ms crossfade at the joint.
const JOIN = 9 * SR, BACK = 3 * SR, XF = Math.round(0.01 * SR);
const m = (k) => (k * 2 + 1 < music.length ? k : -1);
for (let k = 0; k < n; k++) {
  const a = m(k), b = k - BACK >= 0 ? m(k - BACK) : -1;
  const w = k < JOIN - XF ? 0 : k >= JOIN ? 1 : (k - (JOIN - XF)) / XF;
  for (let c = 0; c < 2; c++) {
    const va = a >= 0 && w < 1 ? music[a * 2 + c] : 0;
    const vb = b >= 0 && w > 0 ? music[b * 2 + c] : 0;
    out[k * 2 + c] = (va * (1 - w) + vb * w) * db(-4);
  }
}

for (const [frame, name, gain, pan] of CUES) {
  const s = SFX[name];
  const at = Math.round(((frame + 1) / FPS) * SR) * 2;
  const g = db(gain);
  const l = g * Math.min(1, 1 - pan), r = g * Math.min(1, 1 + pan);
  for (let i = 0; i < s.length && at + i + 1 < out.length; i += 2) {
    out[at + i] += s[i] * l;
    out[at + i + 1] += s[i + 1] * r;
  }
}
// A short fade on the very end so the file never stops on a click.
const fade = Math.round(0.05 * SR);
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
