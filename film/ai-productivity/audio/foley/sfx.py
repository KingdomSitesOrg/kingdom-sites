#!/usr/bin/env python3
"""ElevenLabs Sound Effects for the AI productivity film: one short file per sound name.

    XI_KEY="$(security find-generic-password -s elevenlabs-api-key -w)" \
      python3 audio/foley/sfx.py pop [--try 1]

Writes audio/foley/raw/<name>_try<k>.mp3 and appends one row to audio/credits.jsonl
(credits from the response's character-cost header when present). The key is read from the
XI_KEY environment variable (filled from the keychain inside the calling command), sent only in
the xi-api-key header and never printed or written. Prompts are the record of what was asked;
SOURCES.md lists which try became the sound.
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
RAW = FILM / "audio" / "foley" / "raw"

TAIL = "Close-up, dry studio recording, soft, no music, no reverb, no room echo."
PROMPTS = {
    "pop": ("A single soft rubbery pop, a small clay toy piece set down on a table.", 0.5),
    "paper": ("A short dry paper shuffle, a small stack of paper sheets set down on a desk.", 0.8),
    "sticky": ("A light single tap of a sticky note pressed down onto paper with a fingertip.", 0.5),
    "tick": ("One tiny soft tick, a small wooden bead tapped once on wood. Very short.", 0.5),
    "counter": ("One soft tick of a small plastic number counter clicking forward one step. Very short.", 0.5),
    "whoosh": ("A gentle short airy whoosh, a light object gliding past.", 0.8),
    "shutter": ("A soft phone camera shutter click, one photo.", 0.5),
    "cloud": ("A soft airy puff, a gentle breath of air into a pillow.", 0.7),
    "row": ("A light wooden click, a small wooden tile placed on a wooden table.", 0.5),
    "grow": ("A short soft rising swell, a gentle airy whoosh rising upward.", 1.0),
    "drawer": ("A small wooden drawer sliding shut and closing softly.", 0.9),
    "bubble": ("A soft rounded chat message blip, one gentle bubble pop.", 0.5),
    "roll": ("A small plastic wheel rolling briefly across a wooden table.", 1.2),
    "type": ("Four soft key taps on a quiet laptop keyboard.", 0.9),
    "click": ("A single soft computer mouse click.", 0.5),
    "send": ("A short bright soft swish, a quick airy swoosh.", 0.7),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name", choices=sorted(PROMPTS))
    ap.add_argument("--try", dest="k", type=int, default=1)
    a = ap.parse_args()
    key = os.environ.get("XI_KEY", "")
    if not key:
        sys.exit("XI_KEY is empty")
    text, secs = PROMPTS[a.name]
    prompt = f"{text} {TAIL}"
    body = {"text": prompt, "duration_seconds": secs, "prompt_influence": 0.6}
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST",
    )
    RAW.mkdir(parents=True, exist_ok=True)
    out = RAW / f"{a.name}_try{a.k}.mp3"
    status, cost, hdrs = None, None, {}
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            status = r.status
            hdrs = {k.lower(): v for k, v in r.headers.items()}
            cost = hdrs.get("character-cost")
            out.write_bytes(r.read())
    except urllib.error.HTTPError as e:
        status = e.code
        msg = e.read()[:400].decode("utf-8", "replace")
        print(json.dumps({"name": a.name, "status": status, "error": msg}))
        sys.exit(1)
    credits = float(cost) if cost not in (None, "") else None
    row = {
        "time": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "lane": "sound",
        "kind": "sfx",
        "detail": f"sound-generation '{a.name}' try {a.k}, {secs} s, prompt_influence 0.6, HTTP {status}, "
        + ("credits from character-cost header" if credits is not None else "no cost header: credits estimated"),
        "chars_or_seconds": secs,
        "credits": credits if credits is not None else -1,
        "file": str(out.relative_to(FILM)),
        "prompt": prompt,
    }
    with open(CREDITS, "a") as fh:
        fh.write(json.dumps(row) + "\n")
    safe = {k: v for k, v in hdrs.items() if k in ("character-cost", "content-type", "request-id", "x-region", "history-item-id", "content-length")}
    print(json.dumps({"name": a.name, "status": status, "credits": credits, "bytes": out.stat().st_size, "headers": safe}))


if __name__ == "__main__":
    main()
