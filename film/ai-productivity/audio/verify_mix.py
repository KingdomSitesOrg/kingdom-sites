#!/usr/bin/env python3
"""Check video/public/mix.wav against video/timeline.json. Exit 1 on any failure.

    python3 audio/verify_mix.py

1. Format and length: 48 kHz, stereo, exactly durationInFrames / fps seconds.
2. Loudness and peak, measured by ffmpeg's ebur128 (independent of make_mix.py's own meter):
   integrated -14 LUFS (+/- 0.5), true peak at or under -1 dBTP.
3. The silence: every sample in the silence's frames is zero (music, sound, voice, room tone).
4. Cues on the grid: every primary cue is on a beat frame (15n + 1), at most one per beat, and its
   sound really is in the sound stem at that frame: the sound file is found in the stem by
   cross-correlation, within 1 ms of where its sync point should land.
5. Voice: each line's speech starts on its frame (within one frame).
6. The voice wins: no sound effect's 50 ms peak comes within 6 dB of the voice's typical peak.
7. Music: its note onsets fit a 120 bpm beat (eighths at 240) and sit on the eighth-note grid
   that starts at frame 1.
8. The music's shape: louder from s01 to s03, building through s04 to s09, settling on s10.
9. The last frame is silent.
"""

import json
import os
import re
import subprocess
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import correlate

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from dsp import SR, read_audio, samples, to_db  # noqa: E402

MIX = os.path.join(FILM, "video", "public", "mix.wav")
STEMS = os.path.join(HERE, "mix")

fails, notes = [], []


def check(ok, msg):
    (notes if ok else fails).append(("PASS " if ok else "FAIL ") + msg)


def ebur128(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    summ = err[err.rfind("Summary:"):]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
    lra = float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1))
    return i, tp, lra


def stem(name):
    sr, x = wavfile.read(os.path.join(STEMS, f"{name}.wav"))
    return x.T.astype(np.float64)


def music_tempo(mus, fps):
    """Note onsets of the music (high-passed at 300 Hz, 20 ms RMS, rise over 10 ms, so the
    ripple of a pitched note does not count),
    then the beat period that best fits them (circular phase coherence), and how many sit on the
    eighth-note grid starting at frame 1."""
    from dsp import hp

    x = hp(mus, 300)
    hop = samples(0.001)
    w = samples(0.02)
    rms = np.sqrt(np.convolve(x**2, np.ones(w) / w, mode="same"))[::hop]
    lg = np.log(rms + 1e-3 * rms.max())
    flux = np.maximum(0, lg[10:] - lg[:-10])
    thr = np.percentile(flux, 99) * 0.3
    on = []
    i = 0
    while i < len(flux):
        if flux[i] > thr:
            j = i + int(np.argmax(flux[i : i + 30]))
            on.append((j + 5) * hop / SR)
            i = j + 60
        else:
            i += 1
    on = np.array(on)
    best, bestR = None, -1
    for P in np.arange(0.2, 1.0, 0.0005):
        R = abs(np.mean(np.exp(2j * np.pi * on / P)))
        if R > bestR + 1e-9:
            best, bestR = P, R
    grid = 0.25
    z = np.mean(np.exp(2j * np.pi * (on - 1 / fps) / grid))
    offset_ms = float(np.angle(z) / (2 * np.pi) * grid * 1000)
    return 60 / best, offset_ms, len(on), float(abs(z))


def main():
    tl = json.load(open(os.path.join(FILM, "video", "timeline.json")))
    fps = tl["fps"]
    n_want = int(round(tl["durationInFrames"] / fps * SR))
    report = json.load(open(os.path.join(STEMS, "report.json")))

    # 1
    sr, mix = wavfile.read(MIX)
    mix = mix.T.astype(np.float64) / 32768.0
    check(sr == 48000, f"sample rate {sr} Hz")
    check(mix.shape[0] == 2, f"{mix.shape[0]} channels")
    check(mix.shape[1] == n_want, f"length {mix.shape[1]} samples = {mix.shape[1] / SR:.4f} s; film {tl['durationInFrames']} frames = {n_want} samples")

    # 2
    I, tp, lra = ebur128(MIX)
    check(abs(I - (-14.0)) <= 0.5, f"integrated loudness {I} LUFS (ffmpeg ebur128; target -14)")
    check(tp <= -1.0, f"true peak {tp} dBTP (ffmpeg ebur128; limit -1)")
    notes.append(f"INFO loudness range {lra} LU")

    # 3
    sil = tl["silence"]
    a, b = samples(sil["start"] / fps), samples((sil["end"] + 1) / fps)
    m = np.max(np.abs(mix[:, a:b]))
    check(m == 0.0, f"silence frames {sil['start']}-{sil['end']} ({(b - a) / SR:.3f} s): max sample {m:.2e} (must be exactly 0)")
    for s in ("voice", "music", "foley", "room"):
        x = stem(s)
        check(np.max(np.abs(x[:, a:b])) == 0.0, f"silence in the {s} stem")

    # 4
    foley = stem("foley").sum(axis=0)
    meas = json.load(open(os.path.join(HERE, "foley", "measure.json")))
    beats = {}
    worst = 0.0
    bad = []
    for c in tl["cues"]:
        if not c["primary"]:
            continue
        beats.setdefault(c["frame"], []).append(c["sound"])
        if (c["frame"] - 1) % 15:
            bad.append(f"{c['sound']}@{c['frame']} off the grid")
    for f, ss in beats.items():
        if len(ss) > 1:
            bad.append(f"two primary sounds on frame {f}: {ss}")
    check(not bad, f"{sum(len(v) for v in beats.values())} primary cues on beat frames 15n+1, one per beat" + (": " + "; ".join(bad) if bad else ""))
    misplaced = []
    for r in report["cues"]:
        if not r["primary"]:
            continue
        x = read_audio(os.path.join(HERE, "foley", f"{r['sound']}.wav"), mono=True)[0]
        sync = samples(meas[r["sound"]]["sync_s"])
        want_start = samples(r["frame"] / fps) - sync
        if r["sync_sample"] != samples(r["frame"] / fps):
            notes.append(f"INFO {r['sound']}@{r['frame']}: started at the silence's end, not {sync / SR * 1000:.0f} ms early")
            want_start = r["start_sample"]
        lo = want_start - samples(0.02)
        seg = foley[max(0, lo) : want_start + len(x) + samples(0.02)]
        cc = correlate(seg, x, mode="valid")
        lag = int(np.argmax(np.abs(cc))) + max(0, lo) - want_start
        worst = max(worst, abs(lag) / SR * 1000)
        if abs(lag) > samples(0.001):
            misplaced.append(f"{r['sound']}@{r['frame']} off by {lag / SR * 1000:.1f} ms")
    check(not misplaced, f"every primary sound found in the sound stem on its frame (worst {worst:.2f} ms)" + (": " + "; ".join(misplaced) if misplaced else ""))

    # 5
    voice = stem("voice").max(axis=0)
    w = samples(0.01)
    venv = to_db(np.sqrt(np.convolve(voice**2, np.ones(w) / w, mode="same")))
    late = []
    for v in tl["voice"]:
        s0 = samples(v["start"] / fps)
        seg = venv[s0 : s0 + samples(1.0)]
        on = np.argmax(seg > -40) / SR
        want = v.get("speechOn") or 0.0
        if abs(on - want) > 1 / fps:
            late.append(f"line {v['line']} speech at +{on:.3f} s (file says {want})")
    check(not late, "every voice line's speech starts on its frame (within one frame)" + (": " + "; ".join(late) if late else ""))

    # 6
    win = samples(0.05)
    vpk = [np.max(np.abs(voice[i : i + win])) for i in range(0, len(voice) - win, win)]
    vpk = np.array([p for p in vpk if p > 1e-3])
    typical = to_db(np.median(vpk))
    fpk = np.abs(stem("foley")).max(axis=0)
    loud_fx = to_db(np.max(fpk))
    check(loud_fx <= typical - 6, f"loudest sound effect peak {loud_fx:.1f} dBFS vs the voice's typical 50 ms peak {typical:.1f} dBFS (must be 6 dB under)")
    from dsp import bp

    mus_b = bp(stem("music").sum(axis=0) / 2, 800, 8000)
    fx_b = np.abs(bp(stem("foley").sum(axis=0) / 2, 800, 8000))
    masked = []
    for r in report["cues"]:
        if not r["primary"]:
            continue
        # measure the hit, not its lead-in: from one frame before the sync point (a drawer's close
        # lands a few ms ahead of it; the slide before it is quiet on purpose) for 0.3 s
        s0 = max(r["start_sample"], r["sync_sample"] - samples(1 / fps))
        L = min(samples(0.3), r["start_sample"] + samples(meas[r["sound"]]["seconds"]) - s0)
        fx = to_db(np.max(fx_b[s0 : s0 + L]) + 1e-12)
        mu = to_db(np.max(np.abs(mus_b[s0 : s0 + L])) + 1e-12)
        if fx < mu - 3:
            masked.append(f"{r['sound']}@{r['frame']} ({fx:.0f} vs music {mu:.0f})")
    notes.append("INFO primary sounds more than 3 dB under the music in the 0.8-8 kHz band while they sound (may be masked): " + (", ".join(masked) or "none"))

    # 7
    bpm, offset_ms, n_on, coherence = music_tempo(stem("music_unducked").sum(axis=0) / 2, fps)
    check(abs(bpm - 120) < 1 or abs(bpm - 240) < 2, f"music tempo {bpm:.2f} bpm (period fitted to {n_on} note onsets; grid 120, eighths show as 240)")
    check(abs(offset_ms) < 1000 / fps, f"music onsets sit {offset_ms:+.1f} ms from the eighth-note grid that starts at frame 1, on average (must be under one frame; coherence {coherence:.2f})")
    from dsp import lufs as _lufs

    bed = stem("music_unducked")
    per = {}
    for sc in tl["scenes"]:
        a0, b0 = samples((sc["start"]) / fps), samples((sc["start"] + sc["length"]) / fps)
        per[sc["id"]] = round(_lufs(bed[:, a0:b0]), 1)
    feat = [per[k] for k in ("s04", "s05", "s06", "s07", "s08", "s09")]
    builds = per["s01"] < per["s02"] < per["s03"] and all(b >= a - 0.5 for a, b in zip(feat, feat[1:])) and feat[-1] > feat[0] and per["s10"] < per["s09"]
    check(builds, "music shape: rises s01 to s03, builds through the feature scenes, settles on s10 (unducked loudness per scene: " + ", ".join(f"{k} {v}" for k, v in per.items()) + ")")
    check(np.max(np.abs(mix[:, -samples(1 / fps):])) < 10 ** (-60 / 20), f"last frame quiet: {to_db(np.max(np.abs(mix[:, -samples(1 / fps):])) + 1e-12):.1f} dBFS")
    check(mix[:, -1].tolist() == [0.0, 0.0], "last sample is zero")

    for line in notes + fails:
        print(line)
    print(json.dumps({"integrated_lufs": I, "true_peak_dbtp": tp, "lra": lra, "bpm": round(bpm, 2), "music_grid_offset_ms": round(offset_ms, 1), "fails": len(fails)}))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
