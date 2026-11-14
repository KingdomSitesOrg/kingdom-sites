#!/usr/bin/env python3
"""One ElevenLabs music track for the cafe app ad. The key is read from XI_KEY, sent only in
the xi-api-key header, never printed. Writes raw/music_gen<k>.mp3 and keeps the prompt here as
the record of what was asked for."""
import json, os, sys, urllib.request, urllib.error
from pathlib import Path

PROMPT = (
    "A 12-second instrumental jingle for a playful stop-motion advert for a coffee shop app. "
    "Exactly 120 BPM, 4/4, major key. Bouncy plucked pizzicato strings and a bright marimba "
    "playing a catchy, cheerful hook, a warm upright bass, crisp hand claps on beats 2 and 4 and "
    "a tight snappy kick on beat 1 only. Energetic and fun from the very first beat, warm and "
    "clean. It builds in the middle and ends on its own short, clear final hit at 11.5 seconds "
    "that rings out briefly. No shaker, no hi-hat rattle, no four-on-the-floor kick, no vocals."
)
k = sys.argv[1] if len(sys.argv) > 1 else "1"
out = Path(__file__).parent / "raw" / f"music_gen{k}.mp3"
out.parent.mkdir(exist_ok=True)
req = urllib.request.Request(
    "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
    data=json.dumps({"prompt": PROMPT, "music_length_ms": 12000}).encode(),
    headers={"xi-api-key": os.environ["XI_KEY"], "content-type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=180) as r:
        out.write_bytes(r.read())
        print("wrote", out, out.stat().st_size, "bytes")
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:300].decode(errors="replace"))
    sys.exit(1)
