#!/usr/bin/env python3
"""Version 2's sound, from video/timeline-v2.json and video/timeline/cues-v2/*.json, mastered to
video/public/mix-v2.wav.

    python3 audio/make_mix_v2.py             # then: python3 audio/verify_mix_v2.py

Rerun it whenever a scene's cue file changes; a missing cue file is simply skipped (the run says
which were there). Version 1 (make_mix.py, mix.wav) is not touched: this borrows its voice chain,
its ducking and its room tone.

- Voice: each scene's line (video/public/voice-v2/lineNN.wav = audio/voice/lines-v2) starts on the
  timeline's voice frame, centred, through version 1's chain (80 Hz high-pass, 3:1 compressor,
  every line at the same loudness, a peak limiter).
- Sound effects: every cue in cues-v2/sNN.json, at film frame = the scene's start + the cue's local
  frame, from audio/foley/<sound>.wav. The sound's sync point (its first sample; the slap of paper,
  the close of the drawer, the shutter's click, the send's swish) lands on that frame; if its lead-in
  would fall inside the silent beat, the lead-in is cut (3 ms fade-in) so the hit stays on time. Pan -1..1
  (default centre). Gain: an offset in dB from that sound's usual level (version 1's, DEFAULT_GAIN:
  pop -20, click -16, ...), so 0, +2, -6 mean "usual", "a bit louder", "quieter"; a gain of -15 or
  below is read as version 1's absolute scale. A "type" cue whose note gives a length ("40 frames",
  "1.5 s", "until frame 120") is a typing run: the clip repeated and trimmed to that length;
  otherwise it plays once, cut short where the scene's next "type" cue takes over. A cue may also
  carry version 1's "run": {"count", "every"} for a texture run.
- Rapid repeats (the same sound in one scene, each within 10 frames of the last: the unread
  counter, the meetings landing, the buzzword ticks) are softened and thinned so they do not
  clatter over the voice: each repeat 0.3 dB quieter than the one before (at most 3 dB) with a
  little random variation, and a repeat less than 4 frames after the last one kept is dropped
  (the run's last hit is always kept). The report lists every cue dropped this way.
- Music: audio/music/score_v2.py, the placeholder pad on the 120 bpm grid (beat n at film frame 15n),
  C major, shaped to the film (see that file). It ducks 6 dB under the voice and 1 to 3 dB under each
  sound effect.
- Room tone: barely there, everywhere except the silent beat.
- The silent beat: film frames 480 to 494 (the first 15 frames of s03). Every part is exactly zero
  there, tails included; a sound placed after it never reaches back into it.
- The end: the final chord (s10 local frame 210, film frame 2355) rings into a 1.5 s fade that
  reaches zero at the start of the last frame, so the last frame is silent.
- Master: one gain to -14 LUFS integrated, then a lookahead true-peak limiter at -1.5 dBTP.

Writes video/public/mix-v2.wav (48 kHz, 16-bit stereo, exactly 2415 frames = 80.5 s), the stems at
their level in the mix in audio/mix/v2/ (voice, music, foley, room, music_unducked, one per music
layer) and audio/mix/v2/report.json. Options --cues, --out and --stems point it elsewhere (tests).
"""

import argparse
import json
import os
import re
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "music"))

from dsp import SR, db, hp, limit, lufs, peaking, place_pan, read_audio, rng, samples, taxis, to_db, true_peak_db, write_wav16, write_wav32  # noqa: E402
from make_mix import load_foley, mono_lufs, room_tone, voice_chain, voice_duck  # noqa: E402

import score_v2  # noqa: E402

TIMELINE = os.path.join(FILM, "video", "timeline-v2.json")
CUES = os.path.join(FILM, "video", "timeline", "cues-v2")
OUT_WAV = os.path.join(FILM, "video", "public", "mix-v2.wav")
STEMS = os.path.join(HERE, "mix", "v2")
VOICE_DIR = os.path.join(HERE, "voice", "lines-v2")

TARGET_LUFS = -14.0
CEILING_DBTP = -1.5
MUSIC_LUFS = -25.0  # the bed's integrated loudness before ducking and the master gain (as version 1)
END_FADE_S = 1.5
MUSIC_STOP_S = 0.04  # the music's cut into the silent beat
FX_STOP_S = 0.025  # every other part's fade into it
TYPE_FADE_S = 0.012
LEAD_CUT_FADE_S = 0.003  # the fade-in where a lead-in is cut at the silent beat's end

# version 1's levels for each sound (dB on the clip, whose peak is -1 dBFS)
DEFAULT_GAIN = {"pop": -20, "paper": -20, "sticky": -22, "tick": -26, "counter": -26, "whoosh": -22, "shutter": -18, "cloud": -22,
                "row": -20, "grow": -22, "drawer": -15, "bubble": -20, "roll": -22, "type": -20, "click": -16, "send": -18}
RELATIVE_ABOVE = -14.5  # a cue gain above this is an offset from DEFAULT_GAIN; at or below, version 1's absolute dB
RUN_GAP_FRAMES = 10  # repeats of one sound this close form a run
MIN_GAP_FRAMES = 4  # inside a run, a repeat closer than this to the last kept one is dropped
REPEAT_STEP_DB = -0.3  # each repeat in a run this much quieter than the one before
REPEAT_FLOOR_DB = -3.0
REPEAT_JITTER_DB = 0.75
# how far the music dips under each sound effect (dB)
HIT_DUCK_DB = {"tick": 1.0, "counter": 1.0, "click": 2.0, "type": 2.0, "whoosh": 1.5, "grow": 1.5, "cloud": 2.0, "roll": 1.5}
HIT_DUCK_DEFAULT = 2.5
RUN_STEP_DB = -0.35
RUN_JITTER_DB = 1.5


# ── cues ─────────────────────────────────────────────────────────────────────


def _num(v):
    try:
        x = float(v)
        return x if np.isfinite(x) else None
    except (TypeError, ValueError):
        return None


def run_frames(c, fps):
    """A typing run's length in frames, from a numeric field or the note; None means play once."""
    for k in ("length", "frames", "lengthFrames", "runFrames"):
        v = _num(c.get(k))
        if v and v > 0:
            return v
    note = str(c.get("note") or "")
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:frames?|fr|f)\b", note, re.I)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b", note, re.I)
    if m:
        return float(m.group(1)) * fps
    m = re.search(r"\b(?:until|till|to|through)\s+(?:local\s+)?(?:frame\s+)?(\d+(?:\.\d+)?)", note, re.I)
    if m and _num(c.get("frame")) is not None:
        return float(m.group(1)) - float(c["frame"])
    m = re.search(r"\b(?:length|run|lasts?|for)\s*[:=]?\s*(\d+(?:\.\d+)?)", note, re.I)
    if m:
        return float(m.group(1))
    return None


def cue_gain(c, name):
    base = float(DEFAULT_GAIN.get(name, -20))
    g = _num(c.get("gain"))
    if g is None:
        return base, "default"
    if g > RELATIVE_ABOVE:
        return base + g, "offset"
    return g, "absolute"


def load_cues(tl, cues_dir, snd, sil):
    """Every cue in cues_dir/sNN.json, in film frames. Returns (cues, files, skipped). A cue inside
    the silent beat (film frames sil[0] to sil[1] - 1) is skipped: nothing may sound there."""
    fps, total = tl["fps"], tl["durationInFrames"]
    cues, files, skipped = [], {}, []
    for s in tl["scenes"]:
        sid = s["id"]
        path = os.path.join(cues_dir, f"{sid}.json")
        if not os.path.exists(path):
            files[sid] = None
            continue
        try:
            with open(path) as fh:
                data = json.load(fh)
        except (OSError, ValueError) as e:
            files[sid] = "unreadable"
            skipped.append({"scene": sid, "why": f"{sid}.json does not read as JSON: {e}"})
            continue
        if isinstance(data, dict):
            data = data.get("cues", [])
        if not isinstance(data, list):
            files[sid] = "unreadable"
            skipped.append({"scene": sid, "why": f"{sid}.json is not a list of cues"})
            continue
        files[sid] = len(data)
        for i, c in enumerate(data):
            where = f"{sid} cue {i + 1}"
            if not isinstance(c, dict):
                skipped.append({"scene": sid, "index": i, "why": f"{where} is not an object"})
                continue
            name = str(c.get("sound", "")).strip()
            local = _num(c.get("frame"))
            if name not in snd:
                skipped.append({"scene": sid, "index": i, "sound": name, "why": f"{where}: no sound called '{name}' in audio/foley"})
                continue
            if local is None:
                skipped.append({"scene": sid, "index": i, "sound": name, "why": f"{where} ({name}): no frame"})
                continue
            film = s["start"] + local
            if not 0 <= film < total:
                skipped.append({"scene": sid, "index": i, "sound": name, "frame": local, "why": f"{where} ({name}): film frame {film:g} is outside the film"})
                continue
            if sil[0] <= film < sil[1]:
                skipped.append({"scene": sid, "index": i, "sound": name, "frame": local,
                                "why": f"{where} ({name}): film frame {film:g} is inside the silent beat ({sil[0]} to {sil[1] - 1})"})
                continue
            gain, how = cue_gain(c, name)
            pan = _num(c.get("pan"))
            pan = 0.0 if pan is None else float(np.clip(pan, -1, 1))
            run = c.get("run") if isinstance(c.get("run"), dict) else None
            length = run_frames(c, fps) if name == "type" else None
            cues.append({"scene": sid, "index": i, "local": local, "frame": film, "sound": name, "gain_db": round(gain, 2), "gain_from": how,
                         "pan": pan, "note": c.get("note"), "type_frames": round(length, 2) if length and length > 0 else None,
                         "run": {"count": int(run.get("count", 1)), "every": float(run.get("every", 1))} if run else None})
    cues.sort(key=lambda c: (c["frame"], c["scene"], c["index"]))
    cues, thinned = thin_repeats(cues)
    for c in cues:  # a typing clip with no length stops where the scene's next typing cue starts
        if c["sound"] == "type" and not c["type_frames"]:
            nxt = [d["frame"] for d in cues if d["scene"] == c["scene"] and d["sound"] == "type" and d["frame"] > c["frame"]]
            c["type_until"] = round(min(nxt) - c["frame"], 2) if nxt else None
    return cues, files, skipped, thinned


def thin_repeats(cues):
    """Soften and thin rapid repeats of one sound in one scene (see the module note)."""
    keep, thinned = [], []
    groups = {}
    for c in cues:
        if c["sound"] != "type" and not c["run"]:
            groups.setdefault((c["scene"], c["sound"]), []).append(c)
    for c in cues:
        c["repeat"] = 0
        c["soften_db"] = 0.0
    for (sid, name), cs in groups.items():
        runs, cur = [], [cs[0]]
        for a, b in zip(cs, cs[1:]):
            if b["frame"] - a["frame"] <= RUN_GAP_FRAMES:
                cur.append(b)
            else:
                runs.append(cur)
                cur = [b]
        runs.append(cur)
        for run in runs:
            if len(run) < 2:
                continue
            r = rng(f"repeat|{sid}|{name}|{run[0]['frame']}")
            last, k = None, 0
            for i, c in enumerate(run):
                if last is not None and c["frame"] - last < MIN_GAP_FRAMES and i < len(run) - 1:
                    c["thinned"] = True
                    thinned.append({"scene": sid, "index": c["index"], "local": c["local"], "sound": name,
                                    "why": f"{sid} {name}@{c['local']:g}: {c['frame'] - last:g} frames after the last {name} kept"})
                    continue
                c["repeat"] = k
                c["soften_db"] = round(max(REPEAT_FLOOR_DB, REPEAT_STEP_DB * k) + (r.uniform(-REPEAT_JITTER_DB, REPEAT_JITTER_DB) if k else 0.0), 2)
                last, k = c["frame"], k + 1
    for c in cues:
        if not c.pop("thinned", False):
            c["gain_db"] = round(c["gain_db"] + c["soften_db"], 2)
            keep.append(c)
    return keep, thinned


def type_run(x, n_out, seed):
    """The typing clip back to back to fill n_out samples, each repeat a little varied in level,
    cut at the quietest point in the last 80 ms with a short fade."""
    out = np.zeros(n_out)
    r = rng(seed)
    pos, k = 0, 0
    while pos < n_out:
        seg = x * (db(r.uniform(-1.0, 0.5)) if k else 1.0)
        m = min(len(seg), n_out - pos)
        out[pos : pos + m] += seg[:m]
        pos += len(x)
        k += 1
    w = samples(0.005)
    env = np.sqrt(np.convolve(out**2, np.ones(w) / w, mode="same"))
    lo = max(samples(TYPE_FADE_S), n_out - samples(0.08))
    cut = lo + int(np.argmin(env[lo:n_out])) if n_out > lo else n_out
    f = samples(TYPE_FADE_S)
    out[cut:] = 0.0
    out[max(0, cut - f) : cut] *= np.linspace(1, 0, cut - max(0, cut - f)) ** 2
    return out, k


def build_foley(cues, n, snd, fps, sil):
    buf = np.zeros((2, n))
    rows = []
    sil_end = samples(sil[1] / fps)
    for c in cues:
        x, sync = snd[c["sound"]]
        count, every = (c["run"]["count"], c["run"]["every"]) if c["run"] else (1, 1)
        r = rng(f"cue|{c['scene']}|{c['index']}|{c['sound']}")
        placed = None
        for k in range(count):
            f = c["frame"] + k * every
            g = c["gain_db"] + ((k * RUN_STEP_DB + r.uniform(-RUN_JITTER_DB, 0)) if count > 1 else 0.0)
            at = samples(f / fps)
            start = at - samples(sync)
            clip, repeats = x, 1
            if c["type_frames"] and k == 0:
                clip, repeats = type_run(x, samples(c["type_frames"] / fps), f"type|{c['scene']}|{c['index']}")
            elif c.get("type_until") and samples(c["type_until"] / fps) < len(x):
                clip, repeats = type_run(x, samples(c["type_until"] / fps), f"type|{c['scene']}|{c['index']}")
            offset = 0
            if at >= sil_end and start < sil_end:
                # its lead-in would sound inside the silent beat: cut the lead-in, keep the hit on its frame
                offset = sil_end - start
                clip = clip[offset:].copy()
                f_in = min(len(clip), samples(LEAD_CUT_FADE_S))
                clip[:f_in] *= np.linspace(0, 1, f_in)
                start = sil_end
            place_pan(buf, start, clip * db(g), c["pan"])
            if k == 0:
                placed = {"start_sample": int(start), "sync_sample": int(at), "clip_offset_samples": int(offset), "length_samples": int(len(clip)),
                          "lead_in_cut_ms": round(offset / SR * 1000, 1) if offset else None, "type_repeats": repeats if (c["type_frames"] or c.get("type_until")) else None}
        rows.append({**c, **placed})
    return buf, rows


# ── voice, music, ducking ────────────────────────────────────────────────────


def voice_file(rel):
    p = os.path.join(FILM, "video", "public", rel)
    return p if os.path.exists(p) else os.path.join(VOICE_DIR, os.path.basename(rel))


def build_voice(tl, n):
    buf = np.zeros((2, n))
    rows = []
    for s in tl["scenes"]:
        v = s["voice"]
        raw = read_audio(voice_file(v["file"]), mono=True)[0]
        x = voice_chain(raw)
        a = samples(v["start"] / tl["fps"])
        place_pan(buf, a, x, 0.0)
        rows.append({"scene": s["id"], "file": v["file"], "frame": v["start"], "sample": a, "frames": v["frames"], "seconds": round(len(x) / SR, 3),
                     "raw_lufs": round(mono_lufs(raw), 1), "end_sample": a + len(x)})
    return buf, rows


def build_music(tl, n):
    layers, S, notes, events, by_scene = score_v2.build(n, tl)
    mus = sum(layers.values())
    eq = lambda st: np.array([peaking(hp(ch, 35), 3200.0, -4.0, 0.9) for ch in st])  # a pocket for the voice and the clicks
    g = db(MUSIC_LUFS - lufs(eq(mus)))
    layers = {k: eq(v) * g for k, v in layers.items()}  # the filters are linear: the layers still sum to the bed
    return sum(layers.values()), layers, S, notes, events, by_scene


def hit_duck(rows, n):
    """The music dips a little under each sound effect: 6 ms in, held through the hit (the whole run
    for typing), 90 ms out."""
    g = np.ones(n)
    for r in rows:
        d = HIT_DUCK_DB.get(r["sound"], HIT_DUCK_DEFAULT)
        hold = r["length_samples"] / SR if r["sound"] == "type" else min(r["length_samples"] / SR, 0.3)
        tt = (np.arange(samples(hold + 0.6)) - samples(0.006)) / SR
        shape = np.where(tt < 0, 1 + tt / 0.006, np.where(tt < hold, 1.0, np.exp(-(tt - hold) / 0.09)))
        lo = r["start_sample"] - samples(0.006)
        a, b = max(0, lo), min(n, lo + len(tt))
        if b <= a:
            continue
        seg = 1 - (1 - db(-d)) * np.clip(shape[a - lo : b - lo], 0, 1)
        g[a:b] = np.minimum(g[a:b], seg)
    return g


def silence_mask(n, a, b, fade_s):
    """0 over samples [a, b), a squared fade of fade_s into it, a 4 ms fade out of it, 1 elsewhere."""
    g = np.ones(n)
    g[a:b] = 0.0
    k = samples(fade_s)
    g[a - k : a] = np.linspace(1, 0, k) ** 2
    k2 = samples(0.004)
    g[b : b + k2] = np.minimum(g[b : b + k2], np.linspace(0, 1, k2))
    return g


def end_fade(n, fps):
    """A cos^2 fade over END_FADE_S that reaches zero at the start of the last frame."""
    g = np.ones(n)
    last = n - samples(1 / fps)
    k = samples(END_FADE_S)
    g[last - k : last] = np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    g[last:] = 0.0
    return g


# ── the master ───────────────────────────────────────────────────────────────


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cues", default=CUES, help="folder of sNN.json cue files")
    ap.add_argument("--out", default=OUT_WAV, help="the mastered mix")
    ap.add_argument("--stems", default=STEMS, help="where the stems and report.json go")
    args = ap.parse_args()

    with open(TIMELINE) as fh:
        tl = json.load(fh)
    fps = tl["fps"]
    frames = tl["durationInFrames"]
    n = int(round(frames / fps * SR))
    os.makedirs(args.stems, exist_ok=True)

    snd = load_foley()
    mus, layers, S, notes, events, by_scene = build_music(tl, n)
    sil = S["silence_frames"]
    cues, files, skipped, thinned = load_cues(tl, args.cues, snd, sil)
    sa, sb = samples(sil[0] / fps), samples(sil[1] / fps)

    voice, vrows = build_voice(tl, n)
    foley, frows = build_foley(cues, n, snd, fps, sil)
    duck = voice_duck(voice, n)
    hduck = hit_duck(frows, n)
    bed = mus.copy()
    mus = mus * (duck * hduck)[None, :]
    room = room_tone(n) * (np.clip(taxis(n) / 0.5, 0, 1) ** 2)[None, :]

    end = end_fade(n, fps)
    m_fx = silence_mask(n, sa, sb, FX_STOP_S) * end
    m_mus = silence_mask(n, sa, sb, MUSIC_STOP_S) * end
    parts = {"voice": voice * m_fx[None, :], "foley": foley * m_fx[None, :], "music": mus * m_mus[None, :], "room": room * m_fx[None, :]}
    hard = np.ones(n)
    hard[sa:sb] = 0.0
    hard[n - samples(1 / fps) :] = 0.0

    def master(gm):
        mix = sum(parts.values()) * gm
        out = limit(mix, CEILING_DBTP) * hard[None, :]
        return mix, out, lufs(out)

    gm = db(TARGET_LUFS - lufs(sum(parts.values())))
    for _ in range(8):
        mix, out, L = master(gm)
        if abs(L - TARGET_LUFS) < 0.03:
            break
        gm *= db(TARGET_LUFS - L)
    mix, out, L = master(gm)
    tp = true_peak_db(out)

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    write_wav16(args.out, out)
    for k, v in parts.items():
        write_wav32(os.path.join(args.stems, f"{k}.wav"), v * gm)
    write_wav32(os.path.join(args.stems, "music_unducked.wav"), bed * m_mus[None, :] * gm)
    for k, v in layers.items():
        write_wav32(os.path.join(args.stems, f"music_{k}_stem.wav"), v * m_mus[None, :] * gm)

    lim = limit(mix, CEILING_DBTP)
    live = (hard > 0) & (np.abs(mix).max(axis=0) > 1e-4)
    reduction = to_db(np.maximum(np.abs(lim).max(axis=0)[live], 1e-9) / np.abs(mix).max(axis=0)[live])
    report = {
        "film_frames": frames,
        "fps": fps,
        "samples": n,
        "seconds": round(n / SR, 4),
        "sample_rate": SR,
        "cues_dir": os.path.relpath(os.path.abspath(args.cues), FILM),
        "cue_files": files,
        "music": "placeholder pad (audio/music/score_v2.py): the ElevenLabs key has no music permission",
        "music_shape": {"silence_frames": list(sil), "silence_samples": [sa, sb], "back_beat": S["back"], "final_beat": S["final"],
                        "final_frame": S["final_frame"], "entry_beats": S["entry"], "layers_by_scene": by_scene},
        "mix_lufs": round(L, 2),
        "true_peak_dbtp": round(tp, 2),
        "master_gain_db": round(float(to_db(gm)), 2),
        "limiter": {"max_db": round(float(reduction.min()), 2) if len(reduction) else 0.0,
                    "ms_over_1db": round(float((reduction < -1).sum() / SR * 1000), 1)},
        "levels_in_mix": {k: round(lufs(v * gm), 1) if np.any(v) else None for k, v in parts.items()},
        "voice": vrows,
        "cues": frows,
        "skipped": skipped,
        "thinned": thinned,
        "notes": notes,
        "music_events": events,
    }
    with open(os.path.join(args.stems, "report.json"), "w") as fh:
        json.dump(report, fh, indent=1)
    present = [k for k, v in files.items() if isinstance(v, int)]
    print(json.dumps({k: report[k] for k in ("seconds", "mix_lufs", "true_peak_dbtp", "master_gain_db", "limiter", "levels_in_mix")}, indent=1))
    print(f"cue files: {', '.join(present) or 'none'} ({len(cues)} cues placed, {len(thinned)} rapid repeats thinned); missing: {', '.join(k for k, v in files.items() if v is None) or 'none'}")
    for s in skipped:
        print("SKIPPED", s["why"])
    print(f"wrote {os.path.abspath(args.out)}")


if __name__ == "__main__":
    main()
