#!/usr/bin/env python3
"""Measure voice files: length, speech onset/offset (from the audio and from the
timestamps), pauses at punctuation, pace, and the level at the very start and end
(a click or a cut breath shows as a loud first or last 10 ms).

    python3 audio/voice/measure.py audio/voice/auditions/*.mp3
"""
import json
import subprocess
import sys
from array import array
from pathlib import Path

SR = 44100


def pcm(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    a = array("h")
    a.frombytes(raw)
    return a


def rms_db(a, i0, i1):
    seg = a[max(0, i0):max(0, i1)]
    if not seg:
        return -120.0
    import math
    m = math.sqrt(sum(x * x for x in seg) / len(seg))
    return 20 * math.log10(max(m, 1) / 32768)


def energy_bounds(a, thr_db=-45.0, win=441):
    """First and last 10 ms window above thr_db."""
    n = len(a)
    first = last = None
    for i in range(0, n - win, win):
        if rms_db(a, i, i + win) > thr_db:
            first = i
            break
    for i in range(n - win, 0, -win):
        if rms_db(a, i, i + win) > thr_db:
            last = i + win
            break
    return (first or 0) / SR, (last or n) / SR


def word_spans(al):
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur = [], None
    for c, s, e in zip(chars, st, en):
        if c.isspace():
            if cur:
                words.append(cur)
                cur = None
            continue
        if cur is None:
            cur = [c, s, e]
        else:
            cur[0] += c
            cur[2] = e
    if cur:
        words.append(cur)
    return words


def main(paths):
    rows = []
    for p in paths:
        p = Path(p)
        a = pcm(p)
        dur = len(a) / SR
        on, off = energy_bounds(a)
        meta = json.loads(p.with_suffix(".json").read_text())
        al = meta.get("alignment") or meta.get("normalized_alignment")
        words = word_spans(al)
        t_on, t_off = words[0][1], words[-1][2]
        # pauses after punctuation
        pauses = []
        for w, nxt in zip(words, words[1:]):
            gap = nxt[1] - w[2]
            if w[0][-1] in ".,?!" or gap > 0.18:
                pauses.append(f"{w[0]}|{gap:.2f}")
        speech = off - on
        wps = len(words) / speech if speech > 0 else 0
        head = rms_db(a, 0, 441)
        tail = rms_db(a, len(a) - 441, len(a))
        flagged = [w for w in words if w[0].strip(".,?!'").lower() in ("claude", "kingdom", "ai", "jargon-filled", "let's")]
        rows.append({
            "file": str(p),
            "dur": round(dur, 3),
            "audio_on": round(on, 3),
            "audio_off": round(off, 3),
            "ts_on": round(t_on, 3),
            "ts_off": round(t_off, 3),
            "tail_after_speech": round(dur - off, 3),
            "words": len(words),
            "words_per_s": round(wps, 2),
            "pauses": pauses,
            "first10ms_db": round(head, 1),
            "last10ms_db": round(tail, 1),
            "named_words": [f"{w[0]} {w[1]:.2f}-{w[2]:.2f} ({w[2]-w[1]:.2f}s)" for w in flagged],
        })
    for r in rows:
        print(json.dumps(r))


if __name__ == "__main__":
    main(sys.argv[1:])
