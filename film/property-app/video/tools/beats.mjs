// Finds a music file's tempo, beat phase, loud hits and where it falls silent, from a 10 ms
// energy envelope. Usage: node tools/beats.mjs ../audio/raw/music_gen2.mp3
import { read, SR } from "./pcm.mjs";
const x = read(process.argv[2]);
const hop = SR / 100, n = Math.floor(x.length / 2 / hop);
const e = new Float64Array(n);
for (let i = 0; i < n; i++) { let s = 0; for (let k = 0; k < hop; k++) { const v = x[(i * hop + k) * 2]; s += v * v; } e[i] = Math.sqrt(s / hop); }
const on = new Float64Array(n);
for (let i = 1; i < n; i++) on[i] = Math.max(0, e[i] - e[i - 1]);
console.log(`length ${(n / 100).toFixed(2)} s`);
let best = [0, 0];
for (let p = 30; p <= 70; p++) { let s = 0; for (let i = 0; i + p < n; i++) s += on[i] * on[i + p]; if (s > best[1]) best = [p, s]; }
console.log(`beat period ~${best[0] * 10} ms (${(6000 / best[0]).toFixed(1)} BPM)`);
const per = Number(process.argv[3] ?? best[0] * 10) / 10;
let ph = [0, 0];
for (let o = 0; o < per; o += 0.5) { let s = 0; for (let t = o; t < n - 1; t += per) s += on[Math.round(t)]; if (s > ph[1]) ph = [o, s]; }
console.log(`phase: first beat at ${(ph[0] / 100).toFixed(3)} s with a ${per * 10} ms beat`);
const hits = [...on].map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 12).map(([v, i]) => `${(i / 100).toFixed(2)}s`).sort();
console.log("biggest onsets:", hits.join(" "));
const env = []; for (let s = 0; s < n / 100; s += 0.5) { let m = 0; for (let i = s * 100; i < Math.min(n, (s + 0.5) * 100); i++) m = Math.max(m, e[i]); env.push(`${s.toFixed(1)}:${(20 * Math.log10(m + 1e-9)).toFixed(0)}`); }
console.log("level by half second (dBFS):", env.join(" "));
