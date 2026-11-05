#!/usr/bin/env node
// The exposure sheet → timeline.json, for the AI productivity film.
//
// timeline/sheet.mjs is the hand-edited source of every frame. This file lays
// it out in film frames, checks it, and writes ../timeline.json. If any rule
// breaks it prints why and writes NOTHING:
//   - a primary sound off beat frame 15n + 1, or two primary sounds on one beat;
//   - a scene that does not start on a beat frame (15k + 1);
//   - a label held less than 0.45 s per word + 1 s;
//   - two voice lines overlapping;
//   - the silence beat before scene 3 containing any voice or sound (texture
//     runs and tails included), or not sitting right before scene 3;
//   - a film longer than 90 s;
//   - a voice line that differs from the locked words in SCRIPT.md;
//   - a press without a click on its beat, or a Blender target file whose
//     press frame differs from the sheet.
//
//   node timeline/build.mjs            build, check, write timeline.json and
//                                      refresh the generated tables in SCRIPT.md
//   node timeline/build.mjs --check    build and check only, write nothing
//
// Blender press targets: timeline/targets/sNN.json, written by the scene's
// render script: {"scene":"s05","presses":[{"name":"approve","localFrame":211,"x":1693.2,"y":861.4}]}
// (1920×1080 pixels, origin top-left, y down). When present they replace the
// first-estimate pixel computed from the sheet's world point.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// TIMELINE_SHEET lets a test point the build at a broken copy of the sheet.
const S = await import(process.env.TIMELINE_SHEET ? path.resolve(process.env.TIMELINE_SHEET) : "./sheet.mjs");
const VIDEO = path.dirname(HERE);
const FILM = path.dirname(VIDEO);
const SCRIPT_MD = path.join(FILM, "SCRIPT.md");
const OUT = path.join(VIDEO, "timeline.json");
const CHECK_ONLY = process.argv.includes("--check");

const BEAT = (S.FPS * 60) / S.BPM; // 15 frames
if (BEAT !== 15) throw new Error(`sheet: expected 15 frames a beat, got ${BEAT}`);
const onGrid = (f) => Number.isInteger(f) && f >= 1 && (f - 1) % BEAT === 0;
const localBeat = (j) => BEAT * j + 1;
const holdFor = (words) => Math.ceil((0.45 * words + 1) * S.FPS);

const problems = [];
const warnings = [];
const fail = (m) => problems.push(m);
const warn = (m) => warnings.push(m);

// ── scenes: starts follow from lengths ───────────────────────────────────────
let cursorStart = 1; // scene 1 starts on beat 0 = film frame 1; film frame 0 holds its local frame 1
const scenes = S.SCENES.map((sc) => {
  if (!Number.isInteger(sc.beats) || sc.beats < 1) fail(`${sc.id}: beats must be a whole number, got ${sc.beats}`);
  const start = cursorStart;
  const length = sc.beats * BEAT;
  cursorStart = start + length;
  if (!onGrid(start)) fail(`${sc.id}: starts on film frame ${start}, not on a beat frame 15k+1`);
  return { src: sc, id: sc.id, name: sc.name, start, length, end: start + length - 1 };
});
const byId = Object.fromEntries(scenes.map((s) => [s.id, s]));
const lastFrame = scenes[scenes.length - 1].end;
const durationInFrames = lastFrame + 1; // frames 0 … lastFrame
if (durationInFrames > S.MAX_SECONDS * S.FPS) {
  fail(`film is ${(durationInFrames / S.FPS).toFixed(2)} s (${durationInFrames} frames), over the ${S.MAX_SECONDS} s cap`);
}

const film = (sc, L) => sc.start + L - 1; // local frame → film frame
/** A beat reference: a number j in this scene, or {scene, j} in another. */
const refFrame = (sc, r) => {
  if (typeof r === "number") return film(sc, localBeat(r));
  const other = byId[r.scene];
  if (!other) {
    fail(`${sc.id}: reference to unknown scene ${r.scene}`);
    return 0;
  }
  return film(other, localBeat(r.j));
};
const checkJ = (sc, j, what) => {
  if (!Number.isInteger(j) || j < 0 || j >= sc.src.beats) fail(`${sc.id}: ${what} on beat ${j}, outside the scene's beats 0…${sc.src.beats - 1}`);
};

// ── dotted paths: the same dot count as kit.dotted() ─────────────────────────
const bez = (p0, c, p1, t) => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
};
function dotCount(p0, c, p1, spacing = 0.24) {
  let length = 0;
  let prev = bez(p0, c, p1, 0);
  for (let i = 1; i <= 200; i++) {
    const p = bez(p0, c, p1, i / 200);
    length += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  const n = Math.max(2, Math.floor(length / spacing));
  return { dots: n + 1, length };
}

// ── projection: world point → 1920×1080 pixel (first estimate for presses) ──
const tilt = (S.TILT_DEG * Math.PI) / 180;
const toPixel = ([x, y, z]) => ({
  x: +(S.WIDTH / 2 + (x * S.WIDTH) / 16).toFixed(1),
  y: +(S.HEIGHT / 2 - ((y * Math.cos(tilt) + z * Math.sin(tilt)) * S.WIDTH) / 16).toFixed(1),
});
const pan = (x) => +Math.max(-0.8, Math.min(0.8, (x / 8) * 0.8)).toFixed(2);

// ── the silence ──────────────────────────────────────────────────────────────
const silScene = byId[S.SILENCE.scene];
const silence = { start: film(silScene, localBeat(S.SILENCE.j)), end: film(silScene, localBeat(S.SILENCE.j)) + BEAT - 1 };
if (!byId.s03 || silence.end + 1 !== byId.s03.start) {
  fail(`the silence (film ${silence.start}–${silence.end}) must be the beat right before scene 3 (starts ${byId.s03?.start})`);
}

// ── per scene ────────────────────────────────────────────────────────────────
const voice = [];
const allCues = [];
const allLabels = [];
const cursor = [];
const OFF = { x: 2040, y: 1170 }; // off-screen, bottom right

const outScenes = scenes.map((sc) => {
  const src = sc.src;

  // voice
  const v = src.voice;
  const vStart = film(sc, v.at);
  const vEnd = vStart + Math.round(v.seconds * S.FPS) - 1;
  const line = S.VOICE[v.line - 1];
  if (v.estimate === false && (v.at - 1) % BEAT !== 0) fail(`${sc.id}: voice line ${v.line} starts on local ${v.at}, not on a beat frame 15j+1`);
  const vo = {
    line: v.line, text: line, start: vStart, end: vEnd, localStart: v.at,
    localEnd: v.at + (vEnd - vStart), seconds: v.seconds,
    file: v.file ?? `audio/voice/line${String(v.line).padStart(2, "0")}.mp3`, estimate: v.estimate !== false,
  };
  // real voice (phase 1): the whole file, silent tail included, and the character timestamps
  if (v.fileSeconds != null) vo.fileSeconds = v.fileSeconds;
  if (v.fileSeconds != null) vo.fileEnd = vStart + Math.ceil(v.fileSeconds * S.FPS) - 1;
  if (v.speechOn != null) vo.speechOn = v.speechOn;
  if (v.timestamps) vo.timestamps = v.timestamps;
  voice.push({ scene: sc.id, ...vo });

  // events: name → local frame
  const beats = {};
  for (const [name, j] of Object.entries(src.events ?? {})) {
    checkJ(sc, j, `event ${name}`);
    beats[name] = localBeat(j);
  }

  // cues
  const cues = [];
  for (const [sound, j, x, opt = {}] of src.cues ?? []) {
    checkJ(sc, j, `cue ${sound}`);
    const L = localBeat(j);
    const c = {
      sound, frame: film(sc, L), localFrame: L, beat: (film(sc, L) - 1) / BEAT, pan: pan(x),
      gain: opt.gain ?? S.SOUND_GAIN[sound] ?? -22, primary: opt.primary !== false,
    };
    if (!(sound in S.SOUND_GAIN)) fail(`${sc.id}: cue "${sound}" is not a sound in the cue list`);
    if (opt.run) c.run = { count: opt.run.count, every: opt.run.every };
    cues.push(c);
  }
  // dotted paths add their tick runs (texture)
  const paths = (src.paths ?? []).map((p) => {
    checkJ(sc, p.j, `path ${p.name}`);
    const { dots, length } = dotCount(p.p0, p.c, p.p1);
    const L = localBeat(p.j);
    const drawFrames = Math.ceil(dots * p.every);
    const run = { count: Math.max(1, Math.round(drawFrames / Math.max(1, Math.round(p.every)))), every: Math.max(1, Math.round(p.every)) };
    cues.push({
      sound: "tick", frame: film(sc, L), localFrame: L, beat: (film(sc, L) - 1) / BEAT,
      pan: pan((p.p0[0] + p.p1[0]) / 2), gain: S.SOUND_GAIN.tick - 4, primary: false, run, path: p.name,
    });
    return {
      name: p.name, p0: p.p0, c: p.c, p1: p.p1, dots, length: +length.toFixed(3), every: p.every,
      localStart: L, localDrawn: L + drawFrames - 1, start: film(sc, L), drawn: film(sc, L) + drawFrames - 1,
    };
  });
  cues.sort((a, b) => a.frame - b.frame);
  for (const c of cues) {
    if (c.primary && !onGrid(c.frame)) fail(`${sc.id}: primary ${c.sound} at film ${c.frame} is off the beat grid`);
    if (!c.primary && !onGrid(c.frame)) fail(`${sc.id}: texture run ${c.sound} at film ${c.frame} does not start on a beat`);
    allCues.push({ scene: sc.id, ...c });
  }

  // labels
  const labels = (src.labels ?? []).map((l) => {
    const inF = refFrame(sc, l.in);
    const outF = refFrame(sc, l.out);
    if (typeof l.in === "number") checkJ(sc, l.in, `label "${l.text}" in`);
    const lab = {
      text: l.text, words: l.words, kind: l.kind ?? "label", in: inF, out: outF,
      localIn: inF - sc.start + 1, localOut: outF - sc.start + 1, hold: outF - inF,
      minHold: holdFor(l.words), x: l.x, y: l.y,
    };
    const realWords = l.text.split(/\s+/).filter(Boolean).length;
    if (realWords !== l.words) fail(`${sc.id}: label "${l.text}" says ${l.words} words, has ${realWords}`);
    return lab;
  });
  for (const [i, l] of labels.entries()) {
    const nextIsCounter = l.kind === "counter" && labels[i + 1]?.kind === "counter";
    if (!nextIsCounter && l.hold < l.minHold) {
      fail(`${sc.id}: label "${l.text}" is held ${l.hold} frames (${(l.hold / S.FPS).toFixed(2)} s); it needs ${l.minHold} (0.45 s × ${l.words} + 1 s)`);
    }
    if (Math.abs(l.x) > 7.2 || Math.abs(l.y) > 4.05) fail(`${sc.id}: label "${l.text}" at (${l.x}, ${l.y}) is outside title-safe`);
    allLabels.push({ scene: sc.id, ...l });
  }

  // presses: target pixel from Blender if measured, else the first estimate
  let measured = null;
  const tf = path.join(HERE, "targets", `${sc.id}.json`);
  if (fs.existsSync(tf)) {
    try {
      measured = JSON.parse(fs.readFileSync(tf, "utf8"));
    } catch (e) {
      fail(`${sc.id}: ${path.relative(VIDEO, tf)} is not valid JSON (${e.message})`);
    }
  }
  const presses = (src.presses ?? []).map((p) => {
    checkJ(sc, p.j, `press ${p.name}`);
    const L = localBeat(p.j);
    const est = toPixel(p.world);
    const m = measured?.presses?.find((q) => q.name === p.name);
    if (m && m.localFrame !== L) fail(`${sc.id}: targets file has ${p.name} on local frame ${m.localFrame}, the sheet says ${L}`);
    if (!cues.some((c) => c.primary && c.sound === "click" && c.localFrame === L)) fail(`${sc.id}: press ${p.name} on local ${L} has no click cue on that beat`);
    const at = m ? { x: m.x, y: m.y } : est;
    if (at.x < 0 || at.x > S.WIDTH || at.y < 0 || at.y > S.HEIGHT) fail(`${sc.id}: press ${p.name} at (${at.x}, ${at.y}) is off the frame`);
    return { name: p.name, target: p.target, localFrame: L, frame: film(sc, L), world: p.world, x: at.x, y: at.y, source: m ? "blender" : "estimate" };
  });

  // cursor keys for this scene (the one pointer, frame coordinates)
  if (presses.length) {
    const enter = film(sc, localBeat(src.cursor.enter));
    const exit = film(sc, localBeat(src.cursor.exit));
    cursor.push({ frame: enter, x: OFF.x, y: OFF.y, press: false, show: true, scene: sc.id, note: "enters from bottom right" });
    for (const p of presses) {
      cursor.push({ frame: p.frame - 2, x: p.x, y: p.y, press: false, show: true, scene: sc.id, note: `settled on ${p.name}` });
      cursor.push({ frame: p.frame, x: p.x, y: p.y, press: true, show: true, scene: sc.id, note: `press ${p.name}` });
      cursor.push({ frame: p.frame + 6, x: p.x, y: p.y, press: false, show: true, scene: sc.id, note: "released" });
    }
    const lastP = presses[presses.length - 1];
    if (exit > lastP.frame + 6) cursor.push({ frame: exit, x: lastP.x, y: lastP.y, press: false, show: true, scene: sc.id, note: "rests" });
    cursor.push({ frame: Math.min(exit + 12, sc.end), x: OFF.x, y: OFF.y, press: false, show: false, scene: sc.id, note: "leaves" });
  }

  const outSc = {
    id: sc.id, name: sc.name, start: sc.start, length: sc.length, end: sc.end, beats: src.beats,
    voice: vo, beatsLocal: beats, presses, labels, cues, paths,
    handoffIn: src.handoffIn ?? [], handoffOut: src.handoffOut ?? [],
    clip: `scenes/${sc.id}.mp4`, frames: `scenes/${sc.id}/`, draft: `drafts/${sc.id}/latest.png`,
  };
  if (src.fade) {
    outSc.fade = {
      whiteFrom: refFrame(sc, src.fade.whiteFrom), whiteFull: refFrame(sc, src.fade.whiteFull),
      blackFull: src.fade.blackFull === "end" ? sc.end : refFrame(sc, src.fade.blackFull),
    };
  }
  if (src.cursor) outSc.cursor = { enter: film(sc, localBeat(src.cursor.enter)), exit: film(sc, localBeat(src.cursor.exit)) };
  return outSc;
});

// ── cross-scene checks ───────────────────────────────────────────────────────
// two primary sounds on one beat
const primaryAt = new Map();
for (const c of allCues.filter((c) => c.primary)) {
  if (primaryAt.has(c.frame)) fail(`two primary sounds on film frame ${c.frame}: ${primaryAt.get(c.frame)} and ${c.sound} (${c.scene})`);
  else primaryAt.set(c.frame, `${c.sound} (${c.scene})`);
}
// voice lines overlapping, air between them, voice inside the film
voice.sort((a, b) => a.start - b.start);
for (let i = 0; i < voice.length; i++) {
  const v = voice[i];
  if (v.end > lastFrame) fail(`voice line ${v.line} ends at film ${v.end}, after the film's last frame ${lastFrame}`);
  const n = voice[i + 1];
  if (n && v.end >= n.start) fail(`voice lines ${v.line} and ${n.line} overlap (${v.end} ≥ ${n.start})`);
  else if (n && n.start - v.end - 1 < 9) warn(`only ${n.start - v.end - 1} frames of air between lines ${v.line} and ${n.line} (0.3 s is 9)`);
}
// the silence holds nothing: no voice, no cue, no texture run, no sound tail
const SOUND_TAIL = 12; // frames a short effect may ring after its start
for (const v of voice) if (v.start <= silence.end && (v.fileEnd ?? v.end) >= silence.start) fail(`voice line ${v.line} (${v.start}–${v.end}) runs into the silence ${silence.start}–${silence.end}`);
for (const c of allCues) {
  const runEnd = c.run ? c.frame + (c.run.count - 1) * c.run.every : c.frame;
  if (c.frame <= silence.end && runEnd + SOUND_TAIL >= silence.start) fail(`${c.sound} at film ${c.frame} (${c.scene}) sounds inside the silence ${silence.start}–${silence.end}`);
}
// locked words: the sheet's lines must equal SCRIPT.md's voice table
if (fs.existsSync(SCRIPT_MD)) {
  const md = fs.readFileSync(SCRIPT_MD, "utf8");
  const at = md.indexOf("## Voice (locked)");
  if (at < 0) fail("SCRIPT.md has no '## Voice (locked)' section");
  else {
    const rows = [];
    for (const line of md.slice(at).split("\n").slice(1)) {
      if (line.startsWith("|")) {
        const cells = line.split("|").slice(1, -1).map((c) => c.trim());
        if (/^\d+$/.test(cells[0])) rows.push(cells[cells.length - 1].replace(/^"|"$/g, ""));
      } else if (rows.length) break;
    }
    S.VOICE.forEach((t, i) => {
      if (rows[i] !== t) fail(`voice line ${i + 1} differs from SCRIPT.md's locked words:\n    sheet:  ${t}\n    SCRIPT: ${rows[i]}`);
    });
    if (rows.length !== S.VOICE.length) fail(`SCRIPT.md lists ${rows.length} voice lines, the sheet ${S.VOICE.length}`);
  }
} else warn("SCRIPT.md not found: the locked words were not compared");

// music shape in film frames
const music = S.MUSIC.map((m) => ({
  from: refFrame(byId[m.from[0]], m.from[1]),
  to: refFrame(byId[m.to[0]], m.to[1]) + BEAT - 1,
  what: m.what,
}));

if (problems.length) {
  console.error(`timeline: ${problems.length} problem(s), nothing written:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
for (const w of warnings) console.warn(`  note: ${w}`);

const timeline = {
  fps: S.FPS, bpm: S.BPM, width: S.WIDTH, height: S.HEIGHT, durationInFrames,
  seconds: +(durationInFrames / S.FPS).toFixed(3),
  frameConvention: "film frames are 0-based at 30 fps; beat n is film frame 15n+1; scene local frame L = film frame start+L-1; local beat j = local frame 15j+1; film frame 0 holds scene 1's local frame 1",
  silence, music, voice, scenes: outScenes, cursor,
  cues: allCues, labels: allLabels,
};

const summary = outScenes.map((s) => `${s.id} ${s.start}+${s.length}`).join(", ");
if (CHECK_ONLY) {
  console.log(`timeline ok (check only): ${durationInFrames} frames, ${timeline.seconds} s; ${summary}`);
  process.exit(0);
}
fs.writeFileSync(OUT, JSON.stringify(timeline, null, 1) + "\n");

// ── refresh the generated tables in SCRIPT.md (between markers) ──────────────
if (fs.existsSync(SCRIPT_MD)) {
  let md = fs.readFileSync(SCRIPT_MD, "utf8");
  const sec = (s) => (s / S.FPS).toFixed(2);
  const tables = {
    scenes: [
      "| Scene | Name | Film start | Length (f) | Film end | Start (s) | Beats |",
      "|---|---|---|---|---|---|---|",
      ...outScenes.map((s) => `| ${s.id} | ${s.name} | ${s.start} | ${s.length} | ${s.end} | ${sec(s.start)} | ${s.beats} |`),
      `| | **Total** | | | ${lastFrame} | | ${durationInFrames} frames = ${timeline.seconds} s |`,
    ],
    voice: [
      "| Line | Scene | Local start | Film start | Film end | Seconds | Source |",
      "|---|---|---|---|---|---|---|",
      ...voice.map((v) => `| ${v.line} | ${v.scene} | ${v.localStart} | ${v.start} | ${v.end} | ${v.seconds} | ${v.estimate ? "estimate" : "real voice"} |`),
      `| silence | s02 | | ${silence.start} | ${silence.end} | 0.5 | one full beat, nothing sounds |`,
    ],
    words: [
      "| # | Scene | On screen | Kind | Words | In (film) | Out (film) | Local in–out | Held | Needs |",
      "|---|---|---|---|---|---|---|---|---|---|",
      ...allLabels.map((l, i) => `| ${i + 1} | ${l.scene} | ${l.text} | ${l.kind} | ${l.words} | ${l.in} | ${l.out} | ${l.localIn}–${l.localOut} | ${sec(l.hold)} s | ${sec(l.minHold)} s |`),
    ],
    cues: [
      "| Film frame | Beat | Scene | Local | Sound | Primary | Pan | Gain dB | Run |",
      "|---|---|---|---|---|---|---|---|---|",
      ...allCues.map((c) => `| ${c.frame} | ${c.beat} | ${c.scene} | ${c.localFrame} | ${c.sound} | ${c.primary ? "yes" : "texture"} | ${c.pan} | ${c.gain} | ${c.run ? `${c.run.count} × every ${c.run.every} f${c.path ? ` (${c.path})` : ""}` : ""} |`),
      `| ${silence.start}–${silence.end} | ${(silence.start - 1) / BEAT} | s02 | ${silence.start - byId.s02.start + 1} | **silence** | | | | music and sound stop |`,
    ],
    cursor: [
      "| Film frame | Scene | x px | y px | Press | Shown | Note |",
      "|---|---|---|---|---|---|---|",
      ...cursor.map((c) => `| ${c.frame} | ${c.scene} | ${c.x} | ${c.y} | ${c.press ? "press" : ""} | ${c.show ? "yes" : "no"} | ${c.note} |`),
    ],
  };
  for (const [name, rows] of Object.entries(tables)) {
    const re = new RegExp(`(<!-- timeline:${name} -->)[\\s\\S]*?(<!-- /timeline:${name} -->)`);
    if (re.test(md)) md = md.replace(re, `$1\n${rows.join("\n")}\n$2`);
  }
  fs.writeFileSync(SCRIPT_MD, md);
}
console.log(`timeline.json written: ${durationInFrames} frames, ${timeline.seconds} s; ${summary}`);
