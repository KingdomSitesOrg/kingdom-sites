#!/usr/bin/env python3
"""Turn the chosen raw sound effects into the mix's files, and measure them.

    python3 audio/foley/process.py            # every sound in CHOSEN
    python3 audio/foley/process.py --measure  # also print measurements of every raw try

For each sound: decode to 48 kHz mono, take its window, start 2 ms before the first transient,
cut the tail where it falls 50 dB under the peak, fade the last 30 ms, remove DC and rumble, and
normalise the peak to -1 dBFS. Writes audio/foley/<name>.wav (32-bit float) and
audio/foley/measure.json (with each sound's sync point, which make_mix.py reads).
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from dsp import SR, hp, read_audio, samples, tail, to_db, write_wav_mono32  # noqa: E402

# name -> (raw file, window start s, window end s, sync). The window cuts one clean action out of
# the raw file (click, counter and bubble came back with two or three hits; one is kept). sync is
# where the sound's moment is: "onset" = the file's first sample (whooshes, swells, rolls start on
# the cue), "peak" = the loudest 10 ms (the paper's slap, the drawer's close, the shutter): the mix
# starts the file early so that point lands on the cue frame, never inside the silence.
CHOSEN = {
    # Paid-plan takes (try 2, 2026-11-06). Short hits keep a window around their loudest point;
    # longer sounds keep the whole take and are trimmed by process().
    "pop": ("pop_try2.mp3", 0.0, 0.17, "onset"),
    "paper": ("paper_try2.mp3", 0.0, 0.8, "peak"),
    "sticky": ("sticky_try2.mp3", 0.02, 0.22, "onset"),
    "tick": ("tick_try2.mp3", 0.0, 0.17, "onset"),
    "counter": ("counter_try2.mp3", 0.27, 0.365, "onset"),
    "whoosh": ("whoosh_try2.mp3", 0.0, 0.8, "onset"),
    "shutter": ("shutter_try2.mp3", 0.03, 0.33, "peak"),
    "cloud": ("cloud_try2.mp3", 0.0, 0.68, "onset"),
    "row": ("row_try2.mp3", 0.0, 0.16, "onset"),
    "grow": ("grow_try2.mp3", 0.0, 1.0, "onset"),
    "drawer": ("drawer_try2.mp3", 0.0, 0.88, "peak"),
    "bubble": ("bubble_try2.mp3", 0.05, 0.2, "onset"),
    "roll": ("roll_try2.mp3", 0.0, 1.2, "onset"),
    "type": ("type_try2.mp3", 0.0, 0.88, "onset"),
    "click": ("click_try2.mp3", 0.16, 0.28, "onset"),
    "send": ("send_try2.mp3", 0.0, 0.68, "peak"),
}


def envelope_db(x, win_ms=5):
    w = max(1, samples(win_ms / 1000))
    e = np.sqrt(np.convolve(x**2, np.ones(w) / w, mode="same"))
    return to_db(e)


def measure(x):
    """Plain numbers for a sound nobody here can hear."""
    peak = float(np.max(np.abs(x))) + 1e-12
    env = envelope_db(x / peak)
    i_peak = int(np.argmax(env))
    above = np.where(env > -20)[0]
    on = int(above[0]) if len(above) else 0
    # attack: from -20 dB to the envelope peak
    attack_ms = (i_peak - on) / SR * 1000
    # how long it stays within 30 dB of its peak
    loud = np.where(env > -30)[0]
    body_s = (loud[-1] - loud[0]) / SR if len(loud) else 0.0
    # separate hits: envelope crossings upward through -12 dB with 40 ms between them
    up = np.where((env[1:] > -12) & (env[:-1] <= -12))[0]
    hits = 0
    last = -1e9
    for u in up:
        if u - last > samples(0.04):
            hits += 1
        last = u
    spec = np.abs(np.fft.rfft(x * np.hanning(len(x)))) + 1e-12
    f = np.fft.rfftfreq(len(x), 1 / SR)
    centroid = float(np.sum(f * spec) / np.sum(spec))
    flat = float(np.exp(np.mean(np.log(spec))) / np.mean(spec))
    # strongest narrow peak against its neighbourhood: a tone (music, a beep) shows up high
    sm = np.convolve(spec, np.ones(51) / 51, mode="same")
    tonal_db = float(np.max(to_db(spec / sm)))
    rms_db = float(to_db(np.sqrt(np.mean(x**2)) / peak))
    return {
        "seconds": round(len(x) / SR, 3),
        "attack_ms": round(attack_ms, 1),
        "body_s": round(body_s, 3),
        "hits": hits,
        "centroid_hz": round(centroid),
        "flatness": round(flat, 3),
        "tonal_peak_db": round(tonal_db, 1),
        "crest_db": round(-rms_db, 1),
        "onset_s": round(on / SR, 3),
    }


def process(raw, w0, w1, sync):
    x = read_audio(raw, mono=True)[0]
    x = hp(x - np.mean(x), 40)
    x = x[samples(w0) : samples(w1)]
    peak = np.max(np.abs(x))
    env = envelope_db(x / peak, 2)
    on = int(np.where(env > -30)[0][0])
    start = max(0, on - samples(0.002))
    x = x[start:]
    env = env[start:]
    loud = np.where(env > -50)[0]
    end = min(len(x), int(loud[-1]) + samples(0.01))
    x = x[:end].copy()
    k = samples(0.0015)
    x[:k] *= np.linspace(0, 1, k)
    x = tail(x, min(0.03, len(x) / SR / 3))
    x = x / np.max(np.abs(x)) * 10 ** (-1 / 20)
    e10 = envelope_db(x, 10)
    sync_s = 0.0 if sync == "onset" else float(np.argmax(e10)) / SR
    return x, w0 + start / SR, sync_s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--measure", action="store_true")
    a = ap.parse_args()
    if a.measure:
        for raw in sorted((HERE / "raw").glob("*.mp3")):
            x = read_audio(raw, mono=True)[0]
            print(raw.name, json.dumps(measure(x)))
    report = {}
    for name, (raw, w0, w1, sync) in CHOSEN.items():
        x, cut, sync_s = process(HERE / "raw" / raw, w0, w1, sync)
        write_wav_mono32(str(HERE / f"{name}.wav"), x)
        m = measure(x)
        m["raw"] = raw
        m["cut_from_raw_s"] = round(cut, 3)
        m["sync_s"] = round(sync_s, 3)
        report[name] = m
        print(f"{name:8s}", json.dumps(m))
    (HERE / "measure.json").write_text(json.dumps(report, indent=1) + "\n")


if __name__ == "__main__":
    main()
