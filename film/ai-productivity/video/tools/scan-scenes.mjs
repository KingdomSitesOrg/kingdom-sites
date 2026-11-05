#!/usr/bin/env node
// Lists, for every scene in timeline.json, which pictures exist on disk, and
// writes the answer to src/scenes.generated.json. The film reads only that
// file (never the disk at render time), so what a frame shows is decided here:
//
//   frames   renders/scenes/sNN/0001.png … (exactly the scene's length, no gaps)
//   clip     renders/scenes/sNN.mp4 with exactly the scene's length in frames
//   drafts   the newest set of draft stills in renders/drafts/sNN/ (named by
//            local frame, 0016.png or 0016_<tag>.png; sub-folders such as fix2/
//            count as sets), each held from its local frame until the next
//   latest   renders/drafts/sNN/latest.png, held for the whole scene
//   (none)   a ground-coloured placeholder
//
// The final render prefers frames (lossless); the review page prefers the clip
// (lighter), unless the frames are newer than the clip.
//   node tools/scan-scenes.mjs [--quiet]
// Writes the file only when its content changes.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // video/
const FILM = path.dirname(ROOT); // film/ai-productivity/
// FILM_SCAN_RENDERS / FILM_SCAN_SCENES_AS / FILM_SCAN_OUT: for testing the sources against a scratch
// folder (linked into public/ under another name), never needed for the film
const RENDERS = process.env.FILM_SCAN_RENDERS ? path.resolve(process.env.FILM_SCAN_RENDERS) : path.join(FILM, "renders");
const SCENES_AS = process.env.FILM_SCAN_SCENES_AS ?? "scenes";
const OUT = process.env.FILM_SCAN_OUT ? path.resolve(process.env.FILM_SCAN_OUT) : path.join(ROOT, "src", "scenes.generated.json");
const quiet = process.argv.includes("--quiet");

const tl = JSON.parse(fs.readFileSync(path.join(ROOT, "timeline.json"), "utf8"));
const pad = (n) => String(n).padStart(4, "0");
const mtime = (p) => fs.statSync(p).mtimeMs;
const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();

/** Frames in an H.264 clip, counted from its packets (exact, and fast). */
function clipFrames(file) {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets,width,height", "-of", "json", file],
      { encoding: "utf8" },
    );
    const s = JSON.parse(out).streams?.[0];
    return s ? { count: Number(s.nb_read_packets), width: s.width, height: s.height } : null;
  } catch {
    return null;
  }
}

function scanFrames(id, length) {
  const dir = path.join(RENDERS, "scenes", id);
  if (!fs.existsSync(dir)) return { count: 0, complete: false, missing: length, newest: 0 };
  const names = new Set(fs.readdirSync(dir).filter((n) => /^\d{4}\.png$/.test(n)));
  let missing = 0;
  let newest = 0;
  for (let L = 1; L <= length; L++) {
    const n = `${pad(L)}.png`;
    if (!names.has(n)) missing++;
    else newest = Math.max(newest, mtime(path.join(dir, n)));
  }
  const extra = [...names].filter((n) => Number(n.slice(0, 4)) > length).length;
  return { count: names.size, complete: missing === 0, missing, extra, newest };
}

function scanClip(id, length) {
  const file = path.join(RENDERS, "scenes", `${id}.mp4`);
  if (!isFile(file)) return null;
  const info = clipFrames(file);
  return { count: info?.count ?? 0, width: info?.width ?? 0, height: info?.height ?? 0, complete: info?.count === length, mtime: mtime(file) };
}

/** Every set of numbered drafts under renders/drafts/sNN (top level and one folder down), newest first. */
function scanDrafts(id, length) {
  const top = path.join(RENDERS, "drafts", id);
  if (!fs.existsSync(top)) return { sets: [], latest: null };
  const dirs = [top, ...fs.readdirSync(top).map((n) => path.join(top, n)).filter((p) => fs.statSync(p).isDirectory())];
  const sets = new Map(); // "dir|tag" → { dir, tag, stills: [{localFrame, file}], newest }
  for (const dir of dirs) {
    for (const n of fs.readdirSync(dir)) {
      const m = /^(\d{4})(?:_(.+))?\.png$/.exec(n);
      if (!m) continue;
      const L = Number(m[1]);
      if (L < 1 || L > length) continue;
      const key = `${dir}|${m[2] ?? ""}`;
      if (!sets.has(key)) sets.set(key, { dir, tag: m[2] ?? "", stills: [], newest: 0 });
      const s = sets.get(key);
      const abs = path.join(dir, n);
      s.stills.push({ localFrame: L, file: path.relative(path.join(RENDERS, "drafts"), abs).split(path.sep).join("/") });
      s.newest = Math.max(s.newest, mtime(abs));
    }
  }
  const list = [...sets.values()]
    .map((s) => ({ ...s, stills: s.stills.sort((a, b) => a.localFrame - b.localFrame) }))
    .sort((a, b) => b.newest - a.newest);
  const latest = isFile(path.join(top, "latest.png")) ? `${id}/latest.png` : null;
  return { sets: list, latest };
}

const scenes = tl.scenes.map((s) => {
  const frames = scanFrames(s.id, s.length);
  const clip = scanClip(s.id, s.length);
  const drafts = scanDrafts(s.id, s.length);
  const best = drafts.sets[0] ?? null;
  const clipFresh = !!clip?.complete && (!frames.complete || clip.mtime >= frames.newest);

  // the final render: lossless frames first
  const render = frames.complete ? "frames" : clip?.complete ? "clip" : best ? "drafts" : drafts.latest ? "latest" : "placeholder";
  // the review page: the clip first (light), unless the frames are newer
  const review = clipFresh ? "clip" : frames.complete ? "frames" : clip?.complete ? "clip" : best ? "drafts" : drafts.latest ? "latest" : "placeholder";

  return {
    id: s.id,
    name: s.name,
    start: s.start,
    length: s.length,
    render,
    review,
    frames: { dir: `${SCENES_AS}/${s.id}/`, count: frames.count, complete: frames.complete, missing: frames.missing },
    clip: clip ? { file: `${SCENES_AS}/${s.id}.mp4`, frames: clip.count, complete: clip.complete, fresh: clipFresh } : null,
    drafts: best
      ? {
          set: path.relative(path.join(RENDERS, "drafts"), best.dir).split(path.sep).join("/") + (best.tag ? ` (tag ${best.tag})` : ""),
          stills: best.stills.map((d) => ({ localFrame: d.localFrame, file: `drafts/${d.file}` })),
        }
      : null,
    latest: drafts.latest ? `drafts/${drafts.latest}` : null,
  };
});

const audio = {
  mix: isFile(path.join(ROOT, "public", "mix.wav")),
  voice: tl.voice.map((v) => ({ line: v.line, start: v.start, file: `voice/${path.basename(v.file)}`, exists: isFile(path.join(FILM, v.file)) })),
};

const manifest = { durationInFrames: tl.durationInFrames, scenes, audio };
const text = JSON.stringify(manifest, null, 1) + "\n";
const before = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
if (text !== before) fs.writeFileSync(OUT, text);

if (!quiet) {
  for (const s of scenes) {
    const what =
      s.render === "frames" ? `frames ${s.frames.count}/${s.length}` :
      s.render === "clip" ? `clip ${s.clip.frames}/${s.length}` :
      s.render === "drafts" ? `drafts (${s.drafts.stills.length} stills, ${s.drafts.set})` :
      s.render === "latest" ? "latest.png only" : "placeholder";
    const partial = !s.frames.complete && s.frames.count > 0 ? ` · frames in progress ${s.frames.count}/${s.length}` : "";
    const badClip = s.clip && !s.clip.complete ? ` · clip has ${s.clip.frames} frames, needs ${s.length}` : "";
    console.log(`${s.id} ${s.name.padEnd(13)} render: ${what} · review: ${s.review}${partial}${badClip}`);
  }
  console.log(`audio: ${audio.mix ? "mix.wav" : `no mix yet; ${audio.voice.filter((v) => v.exists).length}/${audio.voice.length} voice lines stand in`}`);
  console.log(text === before ? "scenes.generated.json unchanged" : "scenes.generated.json written");
}
