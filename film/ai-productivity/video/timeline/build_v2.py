#!/usr/bin/env python3
"""Version 2 timeline: scene starts and lengths, and each voice line's frames and
word timings, from the v2 voice lines (audio/voice/lines-v2/lineNN.mp3 + .json).

    python3 video/timeline/build_v2.py

Writes video/timeline-v2.json and audio/voice/lines-v2/lineNN.wav (48 kHz mono,
8 ms fade in, the same treatment as v1). Every scene is a multiple of 15 frames
(the 120 bpm beat grid), so cuts land on beats. A scene's voice starts LEAD frames
in. Scene builders key their actions to the word frames given here. Frames are
0-based: inside a scene, local frame = film frame - scene start (what
useCurrentFrame() returns inside the scene's <Sequence>).
"""
import json
import subprocess
from pathlib import Path

FILM = Path(__file__).resolve().parents[2]
LINES = FILM / "audio" / "voice" / "lines-v2"
OUT = FILM / "video" / "timeline-v2.json"
FPS = 30
LEAD = 15

# (id, name, length in frames, the words on screen in one line)
SCENES = [
    ("s01", "Overload", 225, "An overflowing inbox, a to-do list running off the screen, a pile of paper forms"),
    ("s02", "Stiff AI email", 255, "An email full of stiff, buzzword-filled lines, written by AI"),
    ("s03", "The turn", 150, "Half a second of silence, then the serif title: What if AI did the busywork?"),
    ("s04", "Meet Claude", 255, "A shared Claude project: handbook, policies and style guide drop in; shared with 14 people"),
    ("s05", "Paper to spreadsheet", 180, "A phone photo of a paper sign-up form; its rows fill a spreadsheet"),
    ("s06", "Survey", 285, "Claude drafts a survey; answers stream in; Claude's card: 3 steps to improve"),
    ("s07", "Slack", 270, "The Slack thread: someone tags @Claude, Claude answers in the thread, citing the handbook"),
    ("s08", "Search", 225, "Find three venues within an hour for our team day; Claude searches; three result cards"),
    ("s09", "The final send", 300, "Claude chat: Send it; Claude declines (guideline); the person fixes the line and clicks Send"),
    ("s10", "End card", 270, "Kingdom Sites mark, kingdom-sites.com, Book a call (pressed, with an after state); fade to white, then black"),
]


def words_of(al, voice_start_film):
    chars = al["characters"]
    st = al["character_start_times_seconds"]
    en = al["character_end_times_seconds"]
    words, cur, t0 = [], "", None
    for c, a, b in zip(chars, st, en):
        if c.isspace():
            if cur:
                words.append((cur, t0, last))
            cur, t0 = "", None
            continue
        if t0 is None:
            t0 = a
        cur += c
        last = b
    if cur:
        words.append((cur, t0, last))
    return [
        {"text": w, "start": voice_start_film + round(a * FPS), "end": voice_start_film + round(b * FPS)}
        for w, a, b in words
    ]


def main():
    scenes, start = [], 0
    for i, (sid, name, length, picture) in enumerate(SCENES, 1):
        n = f"{i:02d}"
        mp3 = LINES / f"line{n}.mp3"
        wav = LINES / f"line{n}.wav"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", "48000", "-ac", "1", "-af", "afade=t=in:d=0.008", str(wav)],
            check=True,
        )
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)]).decode())
        al = json.loads((LINES / f"line{n}.json").read_text())
        al = al.get("alignment") or al.get("normalized_alignment") or al
        v0 = start + LEAD  # film frame where the line starts (local frame LEAD)
        vlen = round(dur * FPS)
        if LEAD + vlen > length:
            raise SystemExit(f"{sid}: voice ({vlen} f) does not fit in {length} f")
        scenes.append({
            "id": sid,
            "name": name,
            "start": start,
            "length": length,
            "picture": picture,
            "voice": {
                "file": f"voice-v2/line{n}.wav",
                "start": v0,
                "localStart": LEAD,
                "frames": vlen,
                "text": "".join(al["characters"]).strip(),
                "words": words_of(al, v0),
            },
        })
        start += length
    tl = {"version": 2, "fps": FPS, "width": 1920, "height": 1080, "durationInFrames": start, "seconds": round(start / FPS, 3), "scenes": scenes}
    OUT.write_text(json.dumps(tl, indent=1) + "\n")
    print(f"timeline-v2.json: {start} frames, {start / FPS:.2f} s")
    for s in scenes:
        print(f"  {s['id']} {s['name']:<22} {s['start']:>5}+{s['length']:<4} voice {s['voice']['start']}..{s['voice']['start'] + s['voice']['frames']}")


if __name__ == "__main__":
    main()
