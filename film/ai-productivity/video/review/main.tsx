// Thomas's review page for the AI productivity film: the film itself in
// @remotion/player (the real composition: scene clips, or drafts while a scene
// is still rendering, the one pointer, the fades, and the mix or the voice
// lines standing in), and the notes from the v2 preview. Notes are saved to
// video/notes.json through the review server, in
// the v2 format {id, frame, time, scene, x, y, text, done, created}, so
// film-studio's notes.py reads them unchanged; a `reply` shows as "Claude: …".

import { Player, type PlayerRef } from "@remotion/player";
import { createRef } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

import { Film } from "../src/Film.tsx";
import { loadFilmFonts } from "../src/fonts.ts";
import { tl } from "../src/lib/timeline.ts";

type Note = { id: string; frame: number; time: number; scene: string; x: number | null; y: number | null; text: string; done: boolean; created: string; reply?: string };

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const FPS = tl.fps;
const FRAMES = tl.durationInFrames;
const PW = tl.width;
const PH = tl.height;
const q = new URLSearchParams(location.search);

async function main() {
  await loadFilmFonts();
  const ref = createRef<PlayerRef>();
  const root = createRoot($("player"));
  flushSync(() =>
    root.render(
      <Player
        ref={ref}
        component={Film}
        inputProps={{ audio: true, review: true, source: "clips" }}
        durationInFrames={FRAMES}
        compositionWidth={PW}
        compositionHeight={PH}
        fps={FPS}
        style={{ width: "100%", height: "100%" }}
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        moveToBeginningWhenEnded={false}
        acknowledgeRemotionLicense
      />,
    ),
  );
  await new Promise((r) => setTimeout(r, 0));
  const player = ref.current;
  if (!player) throw new Error("the player did not mount");

  const scrub = $("scrub") as HTMLInputElement;
  const time = $("time");
  const play = $("play");
  const shield = $("shield");
  const text = $("text") as HTMLTextAreaElement;
  scrub.max = String(FRAMES - 1);

  const sceneOf = (f: number) => (f === 0 ? tl.scenes[0].id : tl.scenes.find((s) => f >= s.start && f <= s.end)?.id ?? "");
  for (const s of tl.scenes) {
    const b = document.createElement("button");
    b.textContent = `${s.id} · ${s.name} · ${(s.start / FPS).toFixed(1)}s`;
    b.onclick = () => seek(s.start);
    $("scenes").append(b);
  }

  // ── notes ──────────────────────────────────────────────────────────────────
  let notes: Note[] = [];
  let spot: { x: number; y: number } | null = null;
  let frame = 0;
  const status = (t: string) => ($("status").textContent = t);
  const load = async () => {
    notes = await (await fetch("/api/notes", { cache: "no-store" })).json();
  };
  const save = async () => {
    status("saving…");
    const r = await fetch("/api/notes", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(notes) });
    status(r.ok ? `saved · ${notes.filter((n) => !n.done).length} open` : "could not save");
  };
  const fmt = (f: number) => `${(f / FPS).toFixed(2)}s`;
  const drawSpot = () => {
    $("spot").innerHTML = spot ? `Pointing at (${spot.x}, ${spot.y}). <button id="clear">Clear</button>` : "Not pointing at anything. Click the picture to point at a spot.";
    document.getElementById("clear")?.addEventListener("click", () => {
      spot = null;
      drawSpot();
      drawPins();
    });
    $("add").textContent = `Add note at ${fmt(frame)}`;
  };
  const addPin = (x: number, y: number, label: string, cls: string) => {
    const p = document.createElement("div");
    p.className = `pin ${cls}`;
    p.style.left = `${(x / PW) * 100}%`;
    p.style.top = `${(y / PH) * 100}%`;
    p.textContent = label;
    shield.append(p);
  };
  const drawPins = () => {
    shield.querySelectorAll(".pin").forEach((p) => p.remove());
    notes.forEach((n, i) => {
      if (n.x != null && n.y != null && Math.abs(n.frame - frame) <= FPS / 2) addPin(n.x, n.y, String(i + 1), n.done ? "done" : "");
    });
    if (spot) addPin(spot.x, spot.y, "+", "draft");
  };
  const drawList = () => {
    $("marks").innerHTML = notes.map((n) => `<i class="${n.done ? "done" : ""}" style="left:${(n.frame / (FRAMES - 1)) * 100}%"></i>`).join("");
    const list = $("list");
    list.innerHTML = "";
    notes
      .map((n, i) => [n, i] as const)
      .sort((a, b) => a[0].frame - b[0].frame)
      .forEach(([n, i]) => {
        const row = document.createElement("div");
        row.className = `note${n.done ? " done" : ""}`;
        const t = document.createElement("span");
        t.className = "t";
        t.textContent = `#${i + 1} · ${fmt(n.frame)}`;
        t.onclick = () => {
          player.pause();
          seek(n.frame);
        };
        const body = document.createElement("div");
        body.className = "body";
        body.textContent = n.text;
        const tag = document.createElement("div");
        tag.className = "tag";
        tag.textContent = `frame ${n.frame} · ${n.scene || "—"}${n.x != null ? ` · at (${n.x}, ${n.y})` : ""}${n.done ? " · done" : ""}`;
        body.append(tag);
        if (n.reply) {
          const reply = document.createElement("div");
          reply.className = "reply";
          reply.textContent = `Claude: ${n.reply}`;
          body.append(reply);
        }
        const done = document.createElement("button");
        done.textContent = n.done ? "Reopen" : "Done";
        done.onclick = async () => {
          n.done = !n.done;
          drawList();
          drawPins();
          await save();
        };
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = async () => {
          notes.splice(i, 1);
          drawList();
          drawPins();
          await save();
        };
        row.append(t, body, done, del);
        list.append(row);
      });
  };
  const addNote = async () => {
    const value = text.value.trim();
    if (!value) {
      text.focus();
      return;
    }
    notes.push({ id: Date.now().toString(36), frame, time: +(frame / FPS).toFixed(2), scene: sceneOf(frame), x: spot?.x ?? null, y: spot?.y ?? null, text: value, done: false, created: new Date().toISOString() });
    text.value = "";
    spot = null;
    drawSpot();
    drawList();
    drawPins();
    await save();
  };
  $("add").onclick = addNote;
  text.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      addNote();
    }
    if (e.key === "Escape") text.blur();
  });
  text.addEventListener("focus", () => player.pause());
  shield.addEventListener("click", (e) => {
    player.pause();
    const r = shield.getBoundingClientRect();
    spot = { x: Math.round(((e.clientX - r.left) / r.width) * PW), y: Math.round(((e.clientY - r.top) / r.height) * PH) };
    drawSpot();
    drawPins();
    text.focus();
  });

  // ── playback ───────────────────────────────────────────────────────────────
  const show = (f: number) => {
    if (f !== frame) {
      frame = f;
      drawPins();
      $("add").textContent = `Add note at ${fmt(frame)}`;
    }
    scrub.value = String(f);
    time.textContent = `${(f / FPS).toFixed(2)} s · frame ${f} / ${FRAMES - 1} · ${sceneOf(f)}`;
  };
  const seek = (f: number) => {
    const g = Math.max(0, Math.min(FRAMES - 1, Math.round(f)));
    player.seekTo(g);
    show(g);
  };
  const toggle = () => {
    if (player.isPlaying()) player.pause();
    else {
      spot = null;
      drawSpot();
      if (frame >= FRAMES - 1) seek(0);
      player.play();
    }
  };
  player.addEventListener("frameupdate", (e) => show(e.detail.frame));
  player.addEventListener("play", () => (play.textContent = "Pause"));
  player.addEventListener("pause", () => (play.textContent = "Play"));
  player.addEventListener("ended", () => (play.textContent = "Play"));
  play.onclick = toggle;
  scrub.oninput = () => seek(+scrub.value);
  addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLTextAreaElement) return;
    if (e.key === " ") {
      e.preventDefault();
      toggle();
    } else if (e.key === "ArrowRight") seek(frame + (e.shiftKey ? FPS : 1));
    else if (e.key === "ArrowLeft") seek(frame - (e.shiftKey ? FPS : 1));
    else if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      text.focus();
    } else if (e.key === "r" || e.key === "R") {
      q.set("f", String(frame));
      location.search = q.toString();
    }
  });

  await load();
  seek(+(q.get("f") ?? 0));
  drawSpot();
  drawList();
  drawPins();
  status(`${notes.filter((n) => !n.done).length} open`);
}

main().catch((e) => {
  $("err").textContent = String(e?.stack ?? e);
});
