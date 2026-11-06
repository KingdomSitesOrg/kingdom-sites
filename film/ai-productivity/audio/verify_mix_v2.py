#!/usr/bin/env python3
"""Check video/public/mix-v2.wav against video/timeline-v2.json and the cue files. Exit 1 on any failure.

    python3 audio/verify_mix_v2.py

Everything is measured from the files; nothing here is listened to.

1. Format and length: 48 kHz, stereo, exactly 2415 frames (80.5 s, 3,864,000 samples).
2. Loudness and peak, by ffmpeg's ebur128 (independent of make_mix_v2.py's own meter): integrated
   -14 LUFS (+/- 0.5), true peak at or under -1.0 dBTP. Nothing clips: no sample at full scale.
3. The silent beat: every sample of film frames 480 to 494 is exactly zero, in the mix and in every
   stem and music layer.
4. Voice: each line is found in the mix starting on its frame (cross-correlation, within 1 ms), and
   it sits on top: the music ducks about 6 dB while a line speaks, and during each line the voice is
   at least 8 LU over the (ducked) music.
5. Cues: every cue in the cue files was placed or thinned on purpose as a rapid repeat (none
   skipped: unknown sound, no frame, outside the film, inside the silent beat), and each is found in the mix (the mix minus the voice, music and
   room stems) where its sync point lands on its frame, within 1 ms: the onset for most sounds,
   the peak for paper, shutter, drawer and send, whose lead-in starts earlier.
6. The voice wins: no sound effect's peak comes within 6 dB of the voice's typical 50 ms peak.
   A note (not a failure) lists any cue likely masked by the music (over 3 dB under it in 0.8-8 kHz).
7. Music on the grid: the music's onset strength repeats at 120 bpm (eighths show as 240) and peaks
   on the eighth-note grid that starts at film frame 0 (beat n at 15n), within one frame. Every note is in C major,
   equal-tempered (from the score's note list).
8. Music shape: s01 and s02 busier than s03 (notes on the off-beat eighths, then quarter notes) and
   darker (spectral centroid); one
   more layer at each feature scene s04 to s09, and their loudness building; under s10 the drums
   are out and the music is quieter than s09; the final chord starts within one frame of s10's
   local frame 210 (film frame 2355) and still sounds when the end fade begins.
9. The last frame is silent (every sample zero).
"""

import argparse
import glob
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
sys.path.insert(0, os.path.join(HERE, "music"))
from dsp import SR, bp, hp, lufs, read_audio, samples, to_db  # noqa: E402

import score_v2  # noqa: E402

MIX = os.path.join(FILM, "video", "public", "mix-v2.wav")
STEMS = os.path.join(HERE, "mix", "v2")
CUES = os.path.join(FILM, "video", "timeline", "cues-v2")
TIMELINE = os.path.join(FILM, "video", "timeline-v2.json")

fails, notes = [], []


def check(ok, msg):
    (notes if ok else fails).append(("PASS " if ok else "FAIL ") + msg)


def info(msg):
    notes.append("INFO " + msg)


def ebur128(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    summ = err[err.rfind("Summary:"):]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
    lra = float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1))
    return i, tp, lra


def onset_strength(x, hop=48, rise=1):
    """How strongly new notes start, every hop samples (1 ms): the rise of the log spectrum (150 Hz
    to 8 kHz, 21 ms windows) over `rise` hops, averaged over the band. Returns (times in s, strength)."""
    from scipy.signal import stft

    f, t, Z = stft(x, SR, nperseg=1024, noverlap=1024 - hop, boundary=None, padded=False)
    band = (f >= 150) & (f <= 8000)
    L = np.log1p(1000 * np.abs(Z[band]))
    return t[rise:], np.maximum(0, L[:, rise:] - L[:, :-rise]).sum(axis=0) / band.sum()


def fold(ts, fl, period, origin=0.0, bins=100):
    """The onset strength folded onto one period: its average at each phase."""
    k = (np.mod(ts - origin, period) / period * bins).astype(int) % bins
    return np.bincount(k, weights=fl, minlength=bins) / np.maximum(1, np.bincount(k, minlength=bins))


def tempo(ts, fl):
    """The period the onsets repeat at (the strongest fold), and where in the eighth-note grid that
    starts at frame 0 they land: (bpm, offset ms, contrast of the eighth-note fold)."""
    best, bc = None, -1.0
    for P in np.arange(0.2, 1.0, 0.0005):
        h = fold(ts, fl, P, bins=50)
        c = h.max() / h.mean()
        if c > bc + 1e-9:
            best, bc = P, c
    h = fold(ts, fl, 0.25)
    k = int(np.argmax(h))
    off = (k + 0.5) / len(h) * 250.0
    off = off - 250.0 if off > 125.0 else off
    return 60 / best, off, float(h.max() / np.median(h))


def offbeat_share(ts, fl, a, b):
    """How much the off-beat eighths carry compared with the beats, between a and b seconds:
    about 1 where the music moves in eighths, near 0 where it moves in quarter notes."""
    m = (ts >= a) & (ts < b)
    t, f = ts[m], fl[m]
    ph = np.mod(t, 0.5)
    bg = np.median(f)
    on = f[(ph < 0.015)].mean() - bg
    off = f[np.abs(ph - 0.25) < 0.015].mean() - bg
    return round(float(off / max(on, 1e-9)), 2)


def centroid(x):
    sp = np.abs(np.fft.rfft(x * np.hanning(len(x))))
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return float((sp * f).sum() / max(sp.sum(), 1e-12))


def find(seg, tmpl, lo):
    """Where tmpl best matches inside seg (seg starts at sample lo): (sample, normalised correlation)."""
    cc = correlate(seg, tmpl, mode="valid")
    k = int(np.argmax(np.abs(cc)))
    e = np.sqrt(np.convolve(seg**2, np.ones(len(tmpl)), mode="valid")[k] * np.sum(tmpl**2))
    return lo + k, float(abs(cc[k]) / max(e, 1e-12))


def separated_level(resid, report, r, clips, a, L):
    """Fit every cue sounding in [a, a + L) to the residual at once (least squares) and return how
    far this cue's fitted level is from the level the report says it was placed at (dB)."""
    from dsp import pan_gains_v

    rows = [q for q in report["cues"] if q["start_sample"] < a + L and q["start_sample"] + q["length_samples"] > a]
    cols, me = [], None
    for q in rows:
        x = clips.get(q["sound"])
        if x is None:
            x = clips[q["sound"]] = read_audio(os.path.join(HERE, "foley", f"{q['sound']}.wav"), mono=True)[0]
        x = x[q["clip_offset_samples"] :][: q["length_samples"]]
        col = np.zeros(L)
        lo, hi = max(a, q["start_sample"]), min(a + L, q["start_sample"] + len(x))
        if hi > lo:
            col[lo - a : hi - a] = x[lo - q["start_sample"] : hi - q["start_sample"]]
        if q is r:
            me = len(cols)
        cols.append(col)
    if me is None:
        return None
    coef = np.linalg.lstsq(np.array(cols).T, resid[a : a + L], rcond=None)[0][me]
    gl, gr = pan_gains_v(r["pan"])
    want = 10 ** ((r["gain_db"] + report["master_gain_db"]) / 20) * float(gl + gr) / (2 * np.cos(np.pi / 4))
    return float(20 * np.log10(max(coef, 1e-9) / want))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--mix", default=MIX)
    ap.add_argument("--stems", default=STEMS)
    ap.add_argument("--cues", default=CUES)
    args = ap.parse_args()

    tl = json.load(open(TIMELINE))
    fps = tl["fps"]
    frames = tl["durationInFrames"]
    n_want = int(round(frames / fps * SR))
    report = json.load(open(os.path.join(args.stems, "report.json")))
    S = score_v2.shape(tl)
    sc = {s["id"]: s for s in tl["scenes"]}

    def stem(name):
        _, x = wavfile.read(os.path.join(args.stems, f"{name}.wav"))
        return x.T.astype(np.float64)

    def span(a_frame, b_frame):
        return slice(samples(a_frame / fps), samples(b_frame / fps))

    # 1 format
    sr, raw = wavfile.read(args.mix)
    mix = raw.T.astype(np.float64) / 32768.0
    check(sr == SR, f"sample rate {sr} Hz")
    check(mix.shape[0] == 2, f"{mix.shape[0]} channels")
    check(mix.shape[1] == n_want, f"length {mix.shape[1]} samples = {mix.shape[1] / SR * fps:.2f} frames; film {frames} frames = {n_want} samples")

    # 2 loudness, peak, clipping
    I, tp, lra = ebur128(args.mix)
    check(abs(I + 14.0) <= 0.5, f"integrated loudness {I} LUFS (ffmpeg ebur128; target -14)")
    check(tp <= -1.0, f"true peak {tp} dBTP (ffmpeg ebur128; limit -1.0)")
    full = int(np.sum(np.abs(raw.astype(np.int32)) >= 32767))
    check(full == 0, f"nothing clips: {full} samples at full scale; highest sample {to_db(np.max(np.abs(mix)) + 1e-12):.1f} dBFS")
    info(f"loudness range {lra} LU")

    # 3 the silent beat
    s0, s1 = S["silence_frames"]
    sl = span(s0, s1)
    m = np.max(np.abs(mix[:, sl]))
    check(m == 0.0, f"silent beat, film frames {s0}-{s1 - 1} ({(s1 - s0) / fps:.2f} s): max sample {m:.1e} (must be exactly 0)")
    layer_names = sorted(os.path.basename(p)[6:-9] for p in glob.glob(os.path.join(args.stems, "music_*_stem.wav")))
    loud = [s for s in ["voice", "music", "foley", "room", "music_unducked"] + [f"music_{k}_stem" for k in layer_names] if np.max(np.abs(stem(s)[:, sl])) != 0.0]
    check(not loud, f"silent beat zero in every stem and music layer ({4 + 1 + len(layer_names)} checked)" + (": not zero in " + ", ".join(loud) if loud else ""))

    # 4 voice on its frames, and on top
    mono = mix.sum(axis=0) / 2
    vst = stem("voice")
    mst = stem("music")
    vmono = vst.max(axis=0)
    w = samples(0.01)
    venv = to_db(np.sqrt(np.convolve(vmono**2, np.ones(w) / w, mode="same")))
    off, lag_info, under = [], [], []
    for v in report["voice"]:
        want = samples(v["frame"] / fps)
        line = hp(read_audio(os.path.join(FILM, "video", "public", v["file"]), mono=True)[0], 80)[: samples(1.5)]
        lo = want - samples(0.05)
        at, r = find(mono[lo : want + len(line) + samples(0.05)], line, lo)
        if abs(at - want) > samples(0.001) or r < 0.5:
            off.append(f"{v['scene']} found at {(at - want) / SR * 1000:+.1f} ms (match {r:.2f})")
        seg = venv[want : want + samples(1.0)]
        lag_info.append(f"{v['scene']} +{np.argmax(seg > np.max(venv[want:v['end_sample']]) - 40) / SR * 1000:.0f} ms")
        a, b = want, v["end_sample"]
        dv = lufs(vst[:, a:b]) - lufs(mst[:, a:b])
        under.append((v["scene"], round(dv, 1)))
    check(not off, f"every voice line found in the mix starting on its frame, within 1 ms ({len(report['voice'])} lines)" + (": " + "; ".join(off) if off else ""))
    info("speech is audible this long after each line's frame (the lead-in inside the voice files): " + ", ".join(lag_info))
    ud = stem("music_unducked")
    duck = []
    for v in report["voice"]:
        a, b = samples(v["frame"] / fps) + samples(0.3), v["end_sample"] - samples(0.3)
        g = to_db(np.sqrt(np.mean(mst[:, a:b] ** 2)) / max(np.sqrt(np.mean(ud[:, a:b] ** 2)), 1e-12))
        duck.append(float(g))
    check(all(-8.5 <= g <= -4.5 for g in duck), f"the music ducks under the voice: {min(duck):.1f} to {max(duck):.1f} dB while each line speaks (about -6)")
    worst = min(under, key=lambda t: t[1])
    check(worst[1] >= 8.0, f"voice on top: during each line the voice is {worst[1]} to {max(u[1] for u in under)} LU over the ducked music (must be 8+; lowest {worst[0]})")

    # 5 cues
    expected = 0
    present = {}
    for s in tl["scenes"]:
        p = os.path.join(args.cues, f"{s['id']}.json")
        if os.path.exists(p):
            try:
                d = json.load(open(p))
                d = d.get("cues", []) if isinstance(d, dict) else d
                present[s["id"]] = len(d)
                expected += len(d)
            except ValueError:
                present[s["id"]] = "unreadable"
    info("cue files: " + (", ".join(f"{k} ({v})" for k, v in present.items()) or "none") + "; missing: " + (", ".join(s["id"] for s in tl["scenes"] if s["id"] not in present) or "none"))
    stale = {k: v for k, v in report["cue_files"].items() if v is not None} != present
    check(not stale, "the mix was built from the cue files as they are now" + (" (they changed since: rerun make_mix_v2.py)" if stale else ""))
    thinned = report.get("thinned", [])
    accounted = len(report["cues"]) + len(thinned) == expected
    check(not report["skipped"] and accounted, f"every cue placed ({len(report['cues'])} placed, {len(thinned)} rapid repeats thinned on purpose, of {expected})"
          + (": " + "; ".join(s["why"] for s in report["skipped"]) if report["skipped"] else ""))
    if thinned:
        info("rapid repeats thinned (the same sound under 4 frames after the last one kept): " + ", ".join(f"{t['scene']} {t['sound']}@{t['local']:g}" for t in thinned))
    soft = [r for r in report["cues"] if r.get("repeat")]
    if soft:
        info(f"{len(soft)} repeats softened by {min(r['soften_db'] for r in soft):.1f} to {max(r['soften_db'] for r in soft):.1f} dB")
    resid = mono - (stem("voice") + stem("music") + stem("room")).sum(axis=0) / 2
    meas = json.load(open(os.path.join(HERE, "foley", "measure.json")))
    clips = {}
    misplaced, separated, worst_ms, weakest = [], [], 0.0, 1.0
    for r in report["cues"]:
        if r["sound"] not in clips:
            clips[r["sound"]] = read_audio(os.path.join(HERE, "foley", f"{r['sound']}.wav"), mono=True)[0]
        x = clips[r["sound"]][r["clip_offset_samples"] :][: min(r["length_samples"], samples(0.5))]
        want_sync = samples(r["frame"] / fps)
        want_start = r["start_sample"]
        if not r["clip_offset_samples"] and want_start + samples(meas[r["sound"]]["sync_s"]) != want_sync:
            misplaced.append(f"{r['scene']} {r['sound']}@{r['local']:g}: sync point not on its frame in the report")
        lo = max(0, want_start - samples(0.02))
        at, cor = find(resid[lo : want_start + len(x) + samples(0.02)], x, lo)
        ms = (at - want_start) / SR * 1000
        worst_ms = max(worst_ms, abs(ms))
        weakest = min(weakest, cor)
        if abs(ms) <= 1.0 and cor < 0.3:
            # a quiet sound under a louder one (the same frame, or a long swell): separate the
            # overlapping sounds by least squares and check this one is there at its own level
            err = separated_level(resid, report, r, clips, want_start, len(x))
            if err is not None and abs(err) <= 2.0:
                separated.append(f"{r['scene']} {r['sound']}@{r['local']:g} ({err:+.1f} dB)")
                continue
            misplaced.append(f"{r['scene']} {r['sound']}@{r['local']:g} on time but not separable (match {cor:.2f}, level {err if err is None else round(err, 1)} dB)")
        elif abs(ms) > 1.0:
            misplaced.append(f"{r['scene']} {r['sound']}@{r['local']:g} found at {ms:+.1f} ms (match {cor:.2f})")
        if r["lead_in_cut_ms"]:
            info(f"{r['scene']} {r['sound']}@{r['local']:g}: its {r['lead_in_cut_ms']:.0f} ms lead-in fell in the silent beat and was cut; the hit is on its frame")
    if separated:
        info("cues under a louder sound, confirmed by separating the overlapping sounds (level vs the report): " + ", ".join(separated))
    if report["cues"]:
        check(not misplaced, f"every cue found in the mix with its sync point on its frame ({len(report['cues'])} cues; worst {worst_ms:.2f} ms, weakest match {weakest:.2f})"
              + (": " + "; ".join(misplaced) if misplaced else ""))
    else:
        info("no cues to find in the mix yet")
    types = [f"{r['scene']}@{r['local']:g} {r['type_frames']:g} frames" for r in report["cues"] if r["sound"] == "type" and r["type_frames"]]
    if types:
        info("typing runs (repeated or trimmed to the note's length): " + ", ".join(types))

    # 6 the voice wins; masking note
    win = samples(0.05)
    vpk = np.array([np.max(np.abs(vmono[i : i + win])) for i in range(0, len(vmono) - win, win)])
    typical = to_db(np.median(vpk[vpk > 1e-3]))
    fst = stem("foley")
    if report["cues"]:
        loud_fx = to_db(np.max(np.abs(fst)) + 1e-12)
        check(loud_fx <= typical - 6, f"loudest sound effect peak {loud_fx:.1f} dBFS vs the voice's typical 50 ms peak {typical:.1f} dBFS (must be 6 dB under)")
        mus_b = bp(mst.sum(axis=0) / 2, 800, 8000)
        fx_b = np.abs(bp(fst.sum(axis=0) / 2, 800, 8000))
        masked = []
        for r in report["cues"]:
            s_ = max(r["start_sample"], r["sync_sample"] - samples(1 / fps))
            L = max(1, min(samples(0.3), r["start_sample"] + r["length_samples"] - s_))
            fx = to_db(np.max(fx_b[s_ : s_ + L]) + 1e-12)
            mu = to_db(np.max(np.abs(mus_b[s_ : s_ + L])) + 1e-12)
            if fx < mu - 3:
                masked.append(f"{r['scene']} {r['sound']}@{r['local']:g} ({fx:.0f} vs music {mu:.0f} dB)")
        info("cues likely masked by the music (over 3 dB under it in 0.8-8 kHz while they sound): " + (", ".join(masked) or "none"))

    # 7 music on the grid, in key
    bed = stem("music_unducked")
    bmono = bed.sum(axis=0) / 2
    ts, fl = onset_strength(bmono)
    bpm, offset_ms, contrast = tempo(ts, fl)
    check(abs(bpm - 120) < 1 or abs(bpm - 240) < 2, f"music tempo {bpm:.2f} bpm (the period its note onsets repeat at; grid 120, eighths show as 240)")
    check(abs(offset_ms) < 1000 / fps and contrast > 1.5, f"music onsets land {offset_ms:+.1f} ms from the eighth-note grid that starts at frame 0 (under one frame; on-grid strength {contrast:.1f}x the average)")
    bad = [n["note"] for n in report["notes"] if not score_v2.in_c_major(n["note"]) or not score_v2.equal_tempered(n["note"], n["hz"])]
    check(not bad, f"all {len(report['notes'])} notes in C major and equal-tempered (A4 = 440 Hz), no detuned voices" + (": " + ", ".join(sorted(set(bad))) if bad else ""))

    # 8 music shape
    back_f = s1
    win_of = {sid: (sc[sid]["start"], sc[sid]["start"] + sc[sid]["length"]) for sid in sc}
    win_of["s03"] = (back_f, win_of["s03"][1])
    rate = {sid: offbeat_share(ts, fl, a / fps, b / fps) for sid, (a, b) in win_of.items()}
    cen = {sid: round(centroid(bmono[span(a, b)])) for sid, (a, b) in win_of.items()}
    calm = min(rate["s01"], rate["s02"]) > 0.6 and rate["s03"] < 0.4
    bright = cen["s03"] > cen["s01"] and cen["s03"] > cen["s02"]
    check(calm, f"busy, then calm: off-beat eighths carry {rate['s01']} (s01) and {rate['s02']} (s02) of the beats' onset strength, {rate['s03']} in s03 from the title (eighths, then quarter notes)")
    info("off-beat eighths share per scene: " + ", ".join(f"{k} {v}" for k, v in rate.items()))
    check(bright, f"darker, then brighter: music spectral centroid s01 {cen['s01']} Hz, s02 {cen['s02']} Hz, s03 from the title {cen['s03']} Hz")
    guard = samples(1.6)  # past the longest tail of the scene before (the bell's ring)
    lv = {k: stem(f"music_{k}_stem") for k in layer_names}
    rms = {k: {sid: float(np.sqrt(np.mean(x[:, span(a, b)][:, guard:] ** 2))) for sid, (a, b) in win_of.items()} for k, x in lv.items()}
    playing = {sid: [k for k in layer_names if rms[k][sid] > max(rms[k].values()) * 10 ** (-20 / 20) and rms[k][sid] > 1e-5] for sid in win_of}
    counts = {sid: len(v) for sid, v in playing.items()}
    feats = ["s03", "s04", "s05", "s06", "s07", "s08", "s09"]
    step = all(counts[b] == counts[a] + 1 for a, b in zip(feats, feats[1:]))
    check(step, "one more music layer at each feature scene (layers measured playing: " + ", ".join(f"{k} {v}" for k, v in counts.items()) + ")")
    info("layers playing per scene: " + "; ".join(f"{sid} {'+'.join(v)}" for sid, v in playing.items()))
    per = {sid: round(lufs(bed[:, span(a, b)]), 1) for sid, (a, b) in win_of.items()}
    feat_lufs = [per[k] for k in feats[1:]]
    builds = all(b >= a - 0.5 for a, b in zip(feat_lufs, feat_lufs[1:])) and feat_lufs[-1] > feat_lufs[0]
    check(builds, "music builds through s04 to s09 (unducked loudness per scene: " + ", ".join(f"{k} {v}" for k, v in per.items()) + ")")
    drums = [k for k in score_v2.DRUMS if k in lv and rms[k]["s10"] > 1e-6]
    check(not drums and per["s10"] < per["s09"], f"s10 settles: drums out ({', '.join(drums) or 'none'} playing), music {per['s10']} LUFS vs s09 {per['s09']}")
    ff = S["final_frame"]
    t20, r20 = onset_strength(bmono, rise=20)
    before = np.median(r20[(t20 > ff / fps - 0.5) & (t20 < ff / fps - 0.05)])
    m = np.abs(t20 - ff / fps) < 0.15
    hit = np.nonzero(r20[m] > 4 * before)[0]
    d_ms = (t20[m][hit[0]] - ff / fps) * 1000 if len(hit) else None
    check(d_ms is not None and abs(d_ms) < 1000 / fps, f"final chord starts on film frame {ff} (s10 local 210): its first onset is at {d_ms:+.1f} ms" if d_ms is not None
          else f"final chord: no music onset near film frame {ff}")
    fade_at = n_want - samples(1 / fps) - samples(1.5)
    ring = to_db(np.sqrt(np.mean(bed[:, fade_at - samples(0.1) : fade_at] ** 2)) + 1e-12)
    check(ring > -50, f"the final chord still rings when the end fade begins ({ring:.1f} dBFS RMS at {fade_at / SR:.2f} s)")

    # 9 last frame
    last = mix[:, -samples(1 / fps):]
    check(np.max(np.abs(last)) == 0.0, f"last frame silent (max sample {np.max(np.abs(last)):.1e})")

    for line in notes + fails:
        print(line)
    print(json.dumps({"integrated_lufs": I, "true_peak_dbtp": tp, "lra": lra, "bpm": round(bpm, 2), "music_grid_offset_ms": round(offset_ms, 1),
                      "cues": len(report["cues"]), "fails": len(fails)}))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
