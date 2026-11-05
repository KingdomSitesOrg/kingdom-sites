#!/usr/bin/env python3
"""ElevenLabs text to speech with character timestamps, for the AI productivity film.

One call = one line of the script. Writes <out>.mp3 and <out>.json (the alignment) and
appends one row to audio/credits.jsonl. The API key comes from the environment variable
XI_KEY, which the calling shell fills from the keychain inside the same command:

    XI_KEY="$(security find-generic-password -s elevenlabs-api-key -w)" \
      python3 audio/voice/tts.py --voice XrExE9yKIg1WjnnlVkGX --name Matilda \
      --text "..." --out audio/voice/lines/line01 --kind tts-line

The key is sent only in the xi-api-key header; it is never printed or written anywhere.
Voice settings are fixed here so every line (and a later paid-plan regeneration) matches.
"""
import argparse
import base64
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

FILM = Path(__file__).resolve().parents[2]  # film/ai-productivity
CREDITS = FILM / "audio" / "credits.jsonl"

MODEL = "eleven_multilingual_v2"
OUTPUT_FORMAT = "mp3_44100_128"
SEED = 4711
# Identical for every line. Stability a little above default for an even, unhurried read;
# no style exaggeration (style 0 keeps it from sounding like an announcer).
VOICE_SETTINGS = {
    "stability": 0.55,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True,
    "speed": 0.88,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--out", required=True, help="path without extension")
    ap.add_argument("--kind", default="tts")
    ap.add_argument("--lane", default="voice")
    ap.add_argument("--seed", type=int, default=SEED, help="only to re-roll a take that came back wrong")
    a = ap.parse_args()

    key = os.environ.get("XI_KEY", "")
    if not key:
        sys.exit("XI_KEY is empty")

    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{a.voice}/with-timestamps"
        f"?output_format={OUTPUT_FORMAT}"
    )
    body = json.dumps(
        {"text": a.text, "model_id": MODEL, "voice_settings": VOICE_SETTINGS, "seed": a.seed}
    ).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    out = Path(a.out)
    if not out.is_absolute():
        out = FILM / out
    out.parent.mkdir(parents=True, exist_ok=True)
    status, cost = None, None
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            status = r.status
            cost = r.headers.get("character-cost")
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        status = e.code
        msg = e.read().decode(errors="replace")[:400]
        log(a, out, status, None, f"HTTP {status}: {msg}")
        sys.exit(f"HTTP {status}: {msg}")

    (out.with_suffix(".mp3")).write_bytes(base64.b64decode(data["audio_base64"]))
    meta = {
        "voice_id": a.voice,
        "voice_name": a.name,
        "model_id": MODEL,
        "output_format": OUTPUT_FORMAT,
        "seed": a.seed,
        "voice_settings": VOICE_SETTINGS,
        "text": a.text,
        "alignment": data.get("alignment"),
        "normalized_alignment": data.get("normalized_alignment"),
    }
    out.with_suffix(".json").write_text(json.dumps(meta, indent=1) + "\n")
    log(a, out, status, cost, "ok")
    print(json.dumps({"status": status, "credits": cost, "file": str(out.with_suffix(".mp3"))}))


def log(a, out, status, cost, note):
    credits = int(cost) if cost and str(cost).isdigit() else (len(a.text) if status == 200 else 0)
    row = {
        "time": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "lane": a.lane,
        "kind": a.kind,
        "detail": f"voice {a.voice} ({a.name}), {MODEL}, seed {a.seed}, HTTP {status}, "
        + ("credits from character-cost header" if cost else "credits = characters sent")
        + ("" if note == "ok" else f"; {note}"),
        "chars_or_seconds": len(a.text),
        "credits": credits,
        "file": str(out.with_suffix(".mp3").relative_to(FILM)) if status == 200 else "",
    }
    with CREDITS.open("a") as f:
        f.write(json.dumps(row) + "\n")


if __name__ == "__main__":
    main()
