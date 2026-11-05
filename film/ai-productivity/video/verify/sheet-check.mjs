#!/usr/bin/env node
// The edit's checks on timeline.json, the cursor's motion and the scene
// sources on disk. Prints every finding; exits 1 only on a failure. Scenes
// still on drafts (or waiting for pictures) are reported, not failed.
//   node verify/sheet-check.mjs
//
//   sounds    every primary sound on a beat frame (15n + 1), at most one per
//             beat, none in the silence, none past the end
//   labels    every label held at least 0.45 s a word + 1 s (counter values
//             before the last are a UI count, one beat each: SCRIPT.md)
//   safe      every label's anchor inside title-safe (|x| ≤ 7.2, |y| ≤ 4.05
//             world units = the 90% box), with its estimated width
//   length    the film's length equals the sheet (scenes back to back from
//             film frame 1, frame 0 holding scene 1, under 90 s)
//   pointer   one pointer: only src/Cursor.tsx draws a cursor; it is hidden
//             outside its runs, enters and leaves off-screen, arrives about
//             1% past its target, is still from two frames before each press,
//             fully pressed (0.9) on the press frame with its tip on the
//             target, and back to 1 by +6
//   sources   the source each scene uses is complete on disk (frames: exactly
//             0001 … length; clip: exactly length frames); the rest listed
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cursorAt, cursorRuns, tipAt } from "../src/lib/cursor.ts";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FILM = path.dirname(ROOT);
const tl = JSON.parse(fs.readFileSync(path.join(ROOT, "timeline.json"), "utf8"));
const sprite = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "cursor.json"), "utf8"));
const fails = [];
const notes = [];
const fail = (area, msg) => fails.push(`${area}: ${msg}`);
const ok = (area, msg) => console.log(`  ok   ${area}: ${msg}`);
const FPS = tl.fps;
const BEAT = 15;

// ── sounds ───────────────────────────────────────────────────────────────────
{
  const primaries = tl.cues.filter((c) => c.primary);
  const perBeat = new Map();
  let bad = 0;
  for (const c of primaries) {
    if ((c.frame - 1) % BEAT !== 0) (bad++, fail("sounds", `${c.scene} ${c.sound} on film ${c.frame} is off the beat grid (15n + 1)`));
    if (c.frame !== c.beat * BEAT + 1) (bad++, fail("sounds", `${c.scene} ${c.sound}: beat ${c.beat} is film ${c.beat * BEAT + 1}, cue says ${c.frame}`));
    perBeat.set(c.frame, [...(perBeat.get(c.frame) ?? []), `${c.scene} ${c.sound}`]);
    if (c.frame >= tl.silence.start && c.frame <= tl.silence.end) (bad++, fail("sounds", `${c.sound} on ${c.frame} sounds in the silence`));
    if (c.frame >= tl.durationInFrames) (bad++, fail("sounds", `${c.sound} on ${c.frame} is past the end`));
  }
  for (const [f, list] of perBeat) if (list.length > 1) (bad++, fail("sounds", `two primary sounds on beat frame ${f}: ${list.join(", ")}`));
  for (const c of tl.cues.filter((x) => !x.primary)) {
    const span = c.run ? (c.run.count - 1) * c.run.every : 0;
    if (c.frame + span + 12 >= tl.silence.start && c.frame <= tl.silence.end) (bad++, fail("sounds", `texture run ${c.sound} at ${c.frame} reaches the silence`));
  }
  if (!bad) ok("sounds", `${primaries.length} primary sounds, every one on 15n + 1, one per beat at most, the silence (${tl.silence.start}–${tl.silence.end}) clear`);
}

// ── labels: reading time and title-safe ──────────────────────────────────────
{
  let bad = 0;
  const byScene = new Map();
  for (const l of tl.labels) byScene.set(`${l.scene}|${l.kind}`, [...(byScene.get(`${l.scene}|${l.kind}`) ?? []), l]);
  for (const l of tl.labels) {
    const words = l.text.trim().split(/\s+/).length;
    if (words !== l.words) (bad++, fail("labels", `"${l.text}" has ${words} words, the sheet says ${l.words}`));
    const need = Math.ceil((0.45 * words + 1) * FPS - 1e-9);
    const hold = l.out - l.in;
    const group = byScene.get(`${l.scene}|${l.kind}`);
    const countStep = l.kind === "counter" && group[group.length - 1] !== l; // a climbing count: one beat each
    if (countStep) {
      if (hold < BEAT) (bad++, fail("labels", `counter "${l.text}" holds ${hold} f, less than a beat`));
    } else if (hold < need) (bad++, fail("labels", `"${l.text}" (${l.scene}) holds ${(hold / FPS).toFixed(2)} s, needs ${(need / FPS).toFixed(2)} s`));
  }
  if (!bad) ok("labels", `${tl.labels.length} labels, each held at least 0.45 s a word + 1 s (counter steps one beat)`);

  // title-safe: anchor inside |x| ≤ 7.2, |y| ≤ 4.05, and the label's estimated half width (Archivo SemiBold
  // ≈ 0.56 em a character; label type 0.32 units, the address 0.5) inside it too
  let unsafe = 0;
  for (const l of tl.labels) {
    const size = l.text.includes(".") ? 0.5 : l.kind === "counter" ? 0.26 : 0.32;
    const half = (l.text.length * 0.56 * size) / 2;
    const left = l.kind === "label" && /^-1\.75$/.test(String(l.x)) ? l.x : l.x - half; // card labels are left-aligned at their anchor
    const right = left === l.x ? l.x + 2 * half : l.x + half;
    if (Math.abs(l.x) > 7.2 || Math.abs(l.y) > 4.05) (unsafe++, fail("safe", `"${l.text}" (${l.scene}) anchor (${l.x}, ${l.y}) is outside title-safe`));
    else if (left < -7.2 || right > 7.2 || Math.abs(l.y) + size / 2 > 4.05) (unsafe++, fail("safe", `"${l.text}" (${l.scene}) runs to x ${left.toFixed(2)} … ${right.toFixed(2)}, outside title-safe`));
  }
  if (!unsafe) ok("safe", `every label inside title-safe (|x| ≤ 7.2, |y| ≤ 4.05; 96 … 1824 × 54 … 1026 px)`);
}

// ── length ───────────────────────────────────────────────────────────────────
{
  let bad = 0;
  let next = 1;
  for (const s of tl.scenes) {
    if (s.start !== next) (bad++, fail("length", `${s.id} starts on ${s.start}, should follow on ${next}`));
    if ((s.start - 1) % BEAT !== 0) (bad++, fail("length", `${s.id} does not start on a beat`));
    if (s.end !== s.start + s.length - 1) (bad++, fail("length", `${s.id} end ${s.end} ≠ start + length − 1`));
    next = s.start + s.length;
  }
  if (tl.durationInFrames !== next) (bad++, fail("length", `durationInFrames ${tl.durationInFrames}, the scenes make ${next} (frame 0 + ${next - 1})`));
  if (tl.durationInFrames / FPS > 90) (bad++, fail("length", `${(tl.durationInFrames / FPS).toFixed(1)} s is over the 90 s cap`));
  const m = /Length: ([\d,]+) frames/.exec(fs.readFileSync(path.join(FILM, "SCRIPT.md"), "utf8"));
  if (m && Number(m[1].replace(/,/g, "")) !== tl.durationInFrames) (bad++, fail("length", `SCRIPT.md says ${m[1]} frames, timeline.json ${tl.durationInFrames}`));
  if (!bad) ok("length", `${tl.durationInFrames} frames = ${(tl.durationInFrames / FPS).toFixed(3)} s, the ten scenes back to back, matches SCRIPT.md`);
}

// ── one pointer ──────────────────────────────────────────────────────────────
{
  let bad = 0;
  const srcFiles = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|mjs)$/.test(e.name)) srcFiles.push(p);
    }
  };
  walk(path.join(ROOT, "src"));
  walk(path.join(ROOT, "review"));
  const drawers = srcFiles.filter((p) => !p.includes(`${path.sep}dist${path.sep}`) && /cursor(@2x)?\.png|data-pointer=/.test(fs.readFileSync(p, "utf8")));
  const rel = drawers.map((p) => path.relative(ROOT, p));
  if (rel.length !== 1 || rel[0] !== path.join("src", "Cursor.tsx")) (bad++, fail("pointer", `the cursor is drawn by ${rel.join(", ") || "nothing"}; only src/Cursor.tsx may`));

  const keys = tl.cursor;
  const W = tl.width;
  const H = tl.height;
  const offFrame = (k) => k.x - sprite.tipX >= W || k.y - sprite.tipY >= H || k.x + (sprite.width - sprite.tipX) <= 0 || k.y + (sprite.height - sprite.tipY) <= 0;
  const runs = cursorRuns(keys);
  for (const run of runs) {
    const first = run[0];
    const last = run[run.length - 1];
    if (!offFrame(first)) (bad++, fail("pointer", `${first.scene}: enters on screen at (${first.x}, ${first.y})`));
    if (!offFrame(last) || last.show !== false) (bad++, fail("pointer", `${last.scene}: does not leave off-screen`));
  }
  // hidden outside its runs, never two runs at once
  let shown = 0;
  for (let f = 0; f < tl.durationInFrames; f++) {
    const c = cursorAt(keys, sprite, W, H, f);
    const inRun = runs.some((r) => f >= r[0].frame && f <= r[r.length - 1].frame);
    if (c.visible && !inRun) (bad++, fail("pointer", `shown on ${f}, outside every run`));
    if (c.visible) {
      shown++;
      if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) (bad++, fail("pointer", `no position on ${f}`));
    }
  }
  // presses
  const presses = tl.scenes.flatMap((s) => s.presses);
  for (const p of presses) {
    const at = cursorAt(keys, sprite, W, H, p.frame);
    const err = Math.hypot(at.x - p.x, at.y - p.y);
    if (!at.visible || err > 0.75) (bad++, fail("pointer", `${p.name} on ${p.frame}: tip ${err.toFixed(3)} px from the target`));
    if (Math.abs(at.scale - 0.9) > 1e-6) (bad++, fail("pointer", `${p.name} on ${p.frame}: scale ${at.scale}, should be 0.9`));
    for (const f of [p.frame - 2, p.frame - 1]) {
      const t = tipAt(keys, f);
      if (Math.hypot(t.x - p.x, t.y - p.y) > 0.01) (bad++, fail("pointer", `${p.name}: still moving on ${f} (should settle by ${p.frame - 2})`));
    }
    const back = cursorAt(keys, sprite, W, H, p.frame + 6);
    if (Math.abs(back.scale - 1) > 1e-6) (bad++, fail("pointer", `${p.name}: not back to 1 by ${p.frame + 6} (scale ${back.scale})`));
    // the arrival runs about 1% past the target
    const before = keys.filter((k) => k.frame < p.frame - 2 && (k.x !== p.x || k.y !== p.y)).pop();
    if (before) {
      const dist = Math.hypot(p.x - before.x, p.y - before.y);
      let past = 0;
      for (let f = before.frame; f <= p.frame - 2; f += 0.25) {
        const t = tipAt(keys, f);
        // signed distance beyond the target along the arrival direction
        const ux = (p.x - before.x) / dist;
        const uy = (p.y - before.y) / dist;
        past = Math.max(past, (t.x - p.x) * ux + (t.y - p.y) * uy);
      }
      const pct = (100 * past) / dist;
      if (pct < 0.4 || pct > 2) (bad++, fail("pointer", `${p.name}: arrives ${pct.toFixed(2)}% past its target (want about 1%)`));
      else notes.push(`${p.name} (${p.scene ?? ""}f${p.frame}): arrives ${pct.toFixed(2)}% past, ${dist.toFixed(0)} px move`);
    }
    if (p.source !== "blender") notes.push(`${p.name} on ${p.frame}: target is the build's first estimate (no Blender targets file yet)`);
  }
  if (!bad) ok("pointer", `one pointer (src/Cursor.tsx), ${runs.length} visits, ${presses.length} presses on target, shown ${shown} frames, hidden otherwise`);
}

// ── sources ──────────────────────────────────────────────────────────────────
{
  execFileSync(process.execPath, [path.join(ROOT, "tools", "scan-scenes.mjs"), "--quiet"], { stdio: "inherit" });
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "scenes.generated.json"), "utf8"));
  const R = path.join(FILM, "renders", "scenes");
  let bad = 0;
  const final = [];
  const waiting = [];
  for (const s of tl.scenes) {
    const m = man.scenes.find((x) => x.id === s.id);
    if (!m) (bad++, fail("sources", `${s.id} missing from scenes.generated.json`));
    else {
      // recount independently of the manifest
      for (const [mode, kind] of [["render", m.render], ["review", m.review]]) {
        if (kind === "frames") {
          const dir = path.join(R, s.id);
          const have = fs.readdirSync(dir).filter((n) => /^\d{4}\.png$/.test(n)).map((n) => Number(n.slice(0, 4))).sort((a, b) => a - b);
          const exact = have.length === s.length && have.every((n, i) => n === i + 1);
          if (!exact) (bad++, fail("sources", `${s.id} ${mode} uses frames but ${dir} has ${have.length} (want 0001 … ${String(s.length).padStart(4, "0")})`));
        } else if (kind === "clip") {
          const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", path.join(R, `${s.id}.mp4`)], { encoding: "utf8" });
          if (Number(out.trim()) !== s.length) (bad++, fail("sources", `${s.id} ${mode} uses the clip but it has ${out.trim()} frames, not ${s.length}`));
        }
      }
      if (m.render === "frames" || m.render === "clip") final.push(`${s.id} ${m.render}${m.clip?.complete ? "+clip" : ""}`);
      else waiting.push(`${s.id} ${m.render === "drafts" ? `drafts (${m.drafts.stills.length} stills, ${m.drafts.set})` : m.render === "latest" ? "latest.png" : "placeholder"}`);
      if (m.frames.count > 0 && !m.frames.complete) notes.push(`${s.id}: frames in progress, ${m.frames.count}/${s.length}`);
      if (m.clip && !m.clip.complete) notes.push(`${s.id}: clip has ${m.clip.frames} frames, needs ${s.length} (not used)`);
      if (m.frames.complete && !m.clip) notes.push(`${s.id}: frames complete, no clip yet (the review page plays the frames)`);
    }
  }
  if (!bad) ok("sources", `${final.length}/10 scenes on final pictures${final.length ? ` (${final.join(", ")})` : ""}, each complete`);
  if (waiting.length) console.log(`  info sources: still on drafts or waiting: ${waiting.join("; ")}`);
  const mix = path.join(ROOT, "public", "mix.wav");
  if (fs.existsSync(mix)) {
    const d = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mix], { encoding: "utf8" }).trim());
    const film = tl.durationInFrames / FPS;
    console.log(`  info sound: mix.wav ${d.toFixed(3)} s, film ${film.toFixed(3)} s${Math.abs(d - film) > 1 / FPS ? " (lengths differ by more than a frame)" : ""}`);
  } else console.log(`  info sound: no public/mix.wav yet; the voice lines stand in at their frames`);
}

for (const n of notes) console.log(`  info ${n}`);
if (fails.length) {
  console.log("sheet-check FAILED:");
  for (const f of fails) console.log("  - " + f);
  process.exit(1);
}
console.log("sheet-check ok");
