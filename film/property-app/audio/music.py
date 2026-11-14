#!/usr/bin/env python3
"""One ElevenLabs music track for the property app ad. The key is read from XI_KEY, sent only in
the xi-api-key header, never printed. Writes raw/music_gen<k>.mp3 and keeps the prompt here as
the record of what was asked for."""
import json, os, sys, urllib.request, urllib.error
from pathlib import Path

PROMPT = (
    "A 12-second instrumental jingle for a snappy, confident stop-motion advert for a property "
    "management app. Exactly 150 BPM, 4/4, major key. A punchy funky electric bass line, muted "
    "rhythm guitar stabs, a bright glockenspiel hook, crisp finger snaps on beats 2 and 4 and a "
    "tight kick on beat 1 only. Upbeat, modern and clean, driving from the very first beat. It "
    "lifts in the middle and ends on one short, clear final hit at 10.2 seconds that rings out "
    "briefly. No shaker, no hi-hat rattle, no four-on-the-floor kick, no strings, no marimba, "
    "no vocals."
)
k = sys.argv[1] if len(sys.argv) > 1 else "1"
out = Path(__file__).parent / "raw" / f"music_gen{k}.mp3"
out.parent.mkdir(exist_ok=True)
req = urllib.request.Request(
    "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
    data=json.dumps({"prompt": PROMPT, "music_length_ms": 12400}).encode(),
    headers={"xi-api-key": os.environ["XI_KEY"], "content-type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=180) as r:
        out.write_bytes(r.read())
        print("wrote", out, out.stat().st_size, "bytes")
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:300].decode(errors="replace"))
    sys.exit(1)
