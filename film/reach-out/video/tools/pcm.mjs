// Small helpers shared by the music tools: read any audio file as 48 kHz stereo samples, write a
// WAV file, and measure loudness. All the decoding and measuring is done by ffmpeg.
import { execFileSync, spawnSync } from "node:child_process";

export const SR = 48000;

/** The file's audio as interleaved stereo samples (left, right, left, ...), 48 kHz, -1..1. */
export function read(path) {
  const raw = execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-i", path, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4).slice();
}

/** Writes interleaved stereo samples as a 32-bit float WAV file. */
export function write(path, samples) {
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", path], { input: Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength), maxBuffer: 1 << 30 });
}

/** Loudness of a file by the EBU R128 method: integrated loudness (LUFS), the loudest momentary
    (400 ms) window (LUFS), and the true peak (dBTP). */
export function measure(path) {
  const r = spawnSync("ffmpeg", ["-nostdin", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true:framelog=info", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 28 });
  const err = r.stderr;
  let maxM = -Infinity;
  for (const m of err.matchAll(/\bM:\s*(-?[\d.]+|-inf)/g)) if (m[1] !== "-inf") maxM = Math.max(maxM, parseFloat(m[1]));
  const summary = err.slice(err.lastIndexOf("Summary:"));
  const I = parseFloat(/I:\s*(-?[\d.]+) LUFS/.exec(summary)?.[1] ?? "NaN");
  const tp = parseFloat(/True peak:\s*Peak:\s*(-?[\d.]+|-inf) dBFS/.exec(summary)?.[1] ?? "NaN");
  return { integrated: I, loudestMomentary: maxM, truePeak: tp };
}
