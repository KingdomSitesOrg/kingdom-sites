#!/usr/bin/env python3
"""ElevenLabs Music for the AI productivity film.

    XI_KEY="$(security find-generic-password -s elevenlabs-api-key -w)" \
      python3 audio/music/music.py probe            # 5 s prompt clip: reads the credit cost
    XI_KEY=... python3 audio/music/music.py full --gen 2 [--seed N]

`full` sends a composition plan whose sections follow the film's shape, read from
video/timeline.json (scene starts, the silence, the final chord), so a retime only needs a new
generation, not new code. Writes audio/music/<name>.mp3 and appends one row to
audio/credits.jsonl. The key is read from XI_KEY (filled from the keychain inside the calling
command), sent only in the xi-api-key header, never printed or written.
"""
import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

FILM = Path(__file__).resolve().parents[2]
CREDITS = FILM / "audio" / "credits.jsonl"
HERE = FILM / "audio" / "music"

GLOBAL_POS = [
    "light warm instrumental",
    "120 BPM",
    "4/4",
    "soft marimba and felt piano",
    "gentle plucked bass",
    "soft brushed percussion",
    "playful, optimistic, calm",
    "clean modern product film underscore",
    "major key, in tune",
    "great production quality",
]
GLOBAL_NEG = ["vocals", "singing", "choir", "detuned", "out of tune", "dark", "minor key", "aggressive drums", "dubstep", "distorted", "epic orchestral", "lo-fi vinyl crackle"]


def sections_from_timeline():
    tl = json.loads((FILM / "video" / "timeline.json").read_text())
    fps = tl["fps"]
    sc = {s["id"]: s for s in tl["scenes"]}
    chord = next(m["from"] for m in tl["music"] if "final chord" in m["what"])
    total_f = tl["durationInFrames"]

    def ms(f):
        return int(round(f / fps * 1000))

    # (name, start film frame, local positive styles, local negative)
    marks = [
        ("Intro", 0, ["very sparse", "soft felt piano and marimba only", "light pulse", "quiet"], ["drums"]),
        ("Build", sc["s02"]["start"] - 1, ["same motif", "adds soft plucked bass", "builds a little", "ends with a clean full stop"], ["drums"]),
        ("Turn", sc["s03"]["start"] - 1, ["returns brighter after a stop", "warm and hopeful", "felt piano chords", "marimba motif"], []),
        ("Layer 1", sc["s04"]["start"] - 1, ["adds soft brushed shaker", "gentle groove", "warm"], []),
        ("Layer 2", sc["s05"]["start"] - 1, ["adds light kick on every beat", "playful marimba arpeggio"], []),
        ("Layer 3", sc["s06"]["start"] - 1, ["adds warm pad", "slightly fuller"], []),
        ("Layer 4", sc["s07"]["start"] - 1, ["adds light handclaps on 2 and 4", "bright and friendly"], []),
        ("Layer 5", sc["s08"]["start"] - 1, ["adds soft glockenspiel counter-melody", "curious, moving forward"], []),
        ("Layer 6", sc["s09"]["start"] - 1, ["fullest section", "all layers together", "confident and warm"], ["loud"]),
        ("Settle", sc["s10"]["start"] - 1, ["settles", "drums drop out", "felt piano and pad", "calm resolution"], ["drums"]),
        ("Final chord", chord - 1, ["one final sustained major chord", "rings out and fades into silence", "no rhythm"], ["drums", "melody"]),
    ]
    # total: the film plus about 2 s of ring for the last chord to decay into (cut in the mix)
    end_ms = ms(total_f) + 2000
    out = []
    for i, (name, f0, pos, neg) in enumerate(marks):
        t0 = ms(f0)
        t1 = ms(marks[i + 1][1]) if i + 1 < len(marks) else end_ms
        out.append({
            "section_name": name,
            "positive_local_styles": pos,
            "negative_local_styles": neg,
            "duration_ms": t1 - t0,
            "lines": [],
        })
    return out


def call(body, out, kind, detail):
    key = os.environ.get("XI_KEY", "")
    if not key:
        sys.exit("XI_KEY is empty")
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST",
    )
    hdrs = {}
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            status = r.status
            hdrs = {k.lower(): v for k, v in r.headers.items()}
            out.write_bytes(r.read())
    except urllib.error.HTTPError as e:
        print(json.dumps({"status": e.code, "error": e.read()[:600].decode("utf-8", "replace")}))
        sys.exit(1)
    cost = hdrs.get("character-cost")
    credits = float(cost) if cost not in (None, "") else -1
    row = {
        "time": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "lane": "sound",
        "kind": kind,
        "detail": f"{detail}, HTTP {status}, " + ("credits from character-cost header" if credits >= 0 else "no cost header"),
        "chars_or_seconds": body.get("music_length_ms", sum(s["duration_ms"] for s in body.get("composition_plan", {}).get("sections", []))) / 1000,
        "credits": credits,
        "file": str(out.relative_to(FILM)),
    }
    with open(CREDITS, "a") as fh:
        fh.write(json.dumps(row) + "\n")
    shown = {k: v for k, v in hdrs.items() if k in ("character-cost", "content-type", "song-id", "x-song-id", "content-length") or "song" in k}
    print(json.dumps({"status": status, "credits": credits, "bytes": out.stat().st_size, "headers": shown}))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("what", choices=["probe", "full", "plan"])
    ap.add_argument("--gen", type=int, default=2)
    ap.add_argument("--seed", type=int, default=120)
    a = ap.parse_args()
    if a.what == "plan":
        secs = sections_from_timeline()
        print(json.dumps(secs, indent=1))
        print("total s", sum(s["duration_ms"] for s in secs) / 1000)
        return
    if a.what == "probe":
        body = {
            "prompt": "Light warm instrumental underscore, 120 BPM, soft marimba and felt piano, gentle plucked bass, playful and calm, major key, no vocals.",
            "music_length_ms": 5000,
            "model_id": "music_v1",
            "force_instrumental": True,
        }
        call(body, HERE / "gen1_probe_5s.mp3", "music-probe", "music_v1 prompt, 5 s, force_instrumental, generation 1 of 3 (cost probe)")
        return
    plan = {"positive_global_styles": GLOBAL_POS, "negative_global_styles": GLOBAL_NEG, "sections": sections_from_timeline()}
    (HERE / f"gen{a.gen}_plan.json").write_text(json.dumps(plan, indent=1) + "\n")
    body = {"composition_plan": plan, "model_id": "music_v1", "respect_sections_durations": True, "seed": a.seed}
    call(body, HERE / f"gen{a.gen}_full.mp3", "music", f"music_v1 composition plan, {len(plan['sections'])} sections, seed {a.seed}, generation {a.gen} of 3")


if __name__ == "__main__":
    main()
