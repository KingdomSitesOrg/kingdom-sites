#!/usr/bin/env python3
"""The AI productivity film's sound, from video/timeline.json, mastered to video/public/mix.wav.

    python3 audio/make_mix.py

Reads timeline.json every run, so a retime only needs a rerun:

- Voice: each line's file (audio/voice/lines/lineNN.wav) starts on its `start` frame, centred,
  through a gentle chain (80 Hz high-pass, 3:1 compressor, a peak limiter) and every line set to
  the same loudness, so the master limiter only touches stray peaks.
- Sound: each cue's file (audio/foley/<sound>.wav) is placed so its sync point (the paper's slap,
  the drawer's close; the first sample for most) lands on the cue frame, panned by the cue's pan,
  at the cue's gain. Primary hits are on 15n + 1. Texture runs (the ticks of a dotted line drawing
  in) are `count` ticks `every` frames apart, each a little quieter and varied, under the cue's gain.
  The counter ticks of scene 1 (cue sound "tick" in s01) use the counter sound.
- Music: audio/music/track.wav if a real track is ever put there (cut to the film's length), else
  the placeholder bed of audio/music/score.py. It ducks 6 dB under the voice, and dips about
  3 dB for a moment under each primary hit.
- Room tone: barely audible, everywhere except the silence.
- The silence (timeline.json silence, frames 466 to 480): every part is zero there, tails
  included. Nothing placed after the silence may start inside it.
- The end: everything is gone by the last frame (the final chord's ring fades over the last 1.5 s).
- Master: one gain to -14 LUFS integrated, then a lookahead true-peak limiter at -1.5 dBTP
  (under the -1 dBTP limit with room for the encode).

Writes video/public/mix.wav (48 kHz, 16-bit stereo, exactly the film's length), the stems at
their level in the mix in audio/mix/ (voice, music, foley, room; music_unducked; the music's
layers as music_<layer>_stem.wav) and audio/mix/report.json.
Checked by audio/verify_mix.py.
"""

import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "music"))

from dsp import SR, db, hp, limit, lp, lufs, peaking, place_pan, read_audio, rng, samples, taxis, to_db, true_peak_db, write_wav16, write_wav32  # noqa: E402

TIMELINE = os.path.join(FILM, "video", "timeline.json")
OUT_WAV = os.path.join(FILM, "video", "public", "mix.wav")
MIX = os.path.join(HERE, "mix")
FOLEY = os.path.join(HERE, "foley")
TRACK = os.path.join(HERE, "music", "track.wav")

TARGET_LUFS = -14.0
CEILING_DBTP = -1.5
VOICE_LUFS = -18.0  # each line, before the master gain
MUSIC_LUFS = -25.0  # the bed's integrated loudness before ducking and the master gain
DUCK_DB = 6.0  # music under the voice
ROOM_DB = -66.0  # room tone RMS, before the master gain
END_FADE_S = 1.5
HIT_DUCK_DB = {"tick": 0, "counter": 0, "whoosh": 1.5, "grow": 1.5, "cloud": 2.0, "roll": 1.5}  # default 3 dB
RUN_STEP_DB = -0.35  # each tick of a texture run a little quieter than the one before
RUN_JITTER_DB = 1.5


def mono_lufs(x):
    return lufs(np.vstack([x, x])) - 3.01  # one channel's loudness, as if heard alone


def load_foley():
    with open(os.path.join(FOLEY, "measure.json")) as fh:
        meas = json.load(fh)
    snd = {}
    for name, m in meas.items():
        snd[name] = (read_audio(os.path.join(FOLEY, f"{name}.wav"), mono=True)[0], float(m.get("sync_s", 0.0)))
    return snd


def sound_for(cue):
    if cue["sound"] == "tick" and cue["scene"] == "s01" and cue["primary"]:
        return "counter"
    return cue["sound"]


VOICE_COMP = {"threshold_over_lufs": 0.0, "ratio": 3.0, "attack_ms": 4.0, "release_ms": 90.0, "rms_ms": 8.0}
VOICE_PLR = 10.5  # the voice's true peaks after its own limiter: this many dB over its loudness


def compress(x, lufs_now):
    """A gentle feed-forward compressor on a mono line: 8 ms RMS detector, soft 6 dB knee."""
    c = VOICE_COMP
    w = max(1, samples(c["rms_ms"] / 1000))
    env = to_db(np.sqrt(np.convolve(x**2, np.ones(w) / w, mode="same")))
    thr = lufs_now + c["threshold_over_lufs"]
    over = env - thr
    knee = 6.0
    red = np.where(over <= -knee / 2, 0.0, np.where(over >= knee / 2, over * (1 - 1 / c["ratio"]),
                   (1 - 1 / c["ratio"]) * (over + knee / 2) ** 2 / (2 * knee)))
    a = np.exp(-1 / (c["attack_ms"] / 1000 * SR))
    r = np.exp(-1 / (c["release_ms"] / 1000 * SR))
    g = np.empty_like(red)
    cur = 0.0
    for i, v in enumerate(red.tolist()):
        cur = a * cur + (1 - a) * v if v > cur else r * cur + (1 - r) * v
        g[i] = cur
    return x * db(-g)


def voice_chain(x):
    """High-pass, compress, level to VOICE_LUFS, then hold the peaks to VOICE_PLR over it."""
    x = hp(x, 80)
    x = compress(x, mono_lufs(x))
    x = x * db(VOICE_LUFS - mono_lufs(x))
    st = limit(np.vstack([x, x]), VOICE_LUFS + VOICE_PLR, look_ms=1.5, release_ms=40.0)[0]
    return st * db(VOICE_LUFS - mono_lufs(st))


def build_voice(tl, n):
    buf = np.zeros((2, n))
    rows = []
    for v in tl["voice"]:
        raw = read_audio(os.path.join(FILM, v["file"]), mono=True)[0]
        x = voice_chain(raw)
        a = samples(v["start"] / tl["fps"])
        place_pan(buf, a, x, 0.0)
        rows.append({"line": v["line"], "start": v["start"], "sample": a, "raw_lufs": round(mono_lufs(raw), 1),
                     "peak_over_lufs_db": round(float(to_db(np.max(np.abs(x)))) - VOICE_LUFS, 1), "seconds": round(len(x) / SR, 3)})
    return buf, rows


def build_foley(tl, n, snd, sil):
    fps = tl["fps"]
    buf = np.zeros((2, n))
    rows = []
    sil_end = samples((sil["end"] + 1) / fps)
    for c in tl["cues"]:
        name = sound_for(c)
        x, sync = snd[name]
        count = c.get("run", {}).get("count", 1)
        every = c.get("run", {}).get("every", 1)
        r = rng(f"cue|{c['frame']}|{c['sound']}")
        for k in range(count):
            f = c["frame"] + k * every
            g = c["gain"]
            if count > 1:
                g += k * RUN_STEP_DB + r.uniform(-RUN_JITTER_DB, 0)
            at = samples(f / fps)
            start = at - samples(sync)
            if at >= sil_end and start < sil_end:
                start = sil_end  # never reach back into the silence
            place_pan(buf, start, x * db(g), c["pan"])
            if k == 0:
                rows.append({"frame": c["frame"], "beat": c["beat"], "scene": c["scene"], "sound": name, "primary": c["primary"],
                             "pan": c["pan"], "gain_db": c["gain"], "start_sample": int(start), "sync_sample": int(start + samples(sync)),
                             "run": count if count > 1 else None})
    return buf, rows


def build_music(tl, n):
    if os.path.exists(TRACK):
        x = read_audio(TRACK)
        mus = np.zeros((2, n))
        m = min(n, x.shape[1])
        mus[:, :m] = x[:, :m]
        source, layers = "audio/music/track.wav", {}
    else:
        import score

        layers, shape = score.build(n, tl)
        mus = sum(layers.values())
        source = "placeholder pad (audio/music/score.py): ElevenLabs Music refused the key (no music_generation permission)"
    mus = np.array([hp(ch, 35) for ch in mus])
    mus = np.array([peaking(ch, 3200.0, -4.0, 0.9) for ch in mus])  # a pocket for the voice and the clicks
    mus *= db(MUSIC_LUFS - lufs(mus))
    return mus, source, layers


def voice_duck(voice, n):
    """1 where the voice is quiet, down DUCK_DB where it speaks: 120 ms attack, 450 ms release."""
    v = np.abs(voice).max(axis=0)
    w = samples(0.03)
    env = np.sqrt(np.convolve(v**2, np.ones(w) / w, mode="same"))
    on = (to_db(env) > VOICE_LUFS - 22).astype(float)
    # a little ahead of the words, held over short gaps
    from scipy.ndimage import maximum_filter1d

    on = maximum_filter1d(on, size=samples(0.35), origin=-samples(0.1))
    tgt = 1 - (1 - db(-DUCK_DB)) * on
    a_att = np.exp(-1 / (0.12 * SR))
    a_rel = np.exp(-1 / (0.45 * SR))
    from scipy.signal import lfilter

    # smooth separately for falling and rising: use a one-pole on the target, choosing the faster one down
    down = lfilter([1 - a_att], [1, -a_att], tgt - 1, zi=[0.0])[0] + 1
    up = lfilter([1 - a_rel], [1, -a_rel], tgt - 1, zi=[0.0])[0] + 1
    return np.minimum(down, up)


def hit_duck(tl, n, frows, snd):
    """The music dips a little under each primary hit (6 ms in, held through the hit, 90 ms out),
    so the small sounds read without being made louder (from the Farzana film)."""
    g = np.ones(n)
    for r in frows:
        if not r["primary"]:
            continue
        d = HIT_DUCK_DB.get(r["sound"], 3.0)
        if not d:
            continue
        x, _ = snd[r["sound"]]
        hold = min(len(x) / SR, 0.3)
        a = r["start_sample"]
        tt = (np.arange(samples(hold + 0.6)) - samples(0.006)) / SR
        shape = np.where(tt < 0, 1 + tt / 0.006, np.where(tt < hold, 1.0, np.exp(-(tt - hold) / 0.09)))
        lo, hi = max(0, a - samples(0.006)), min(n, a - samples(0.006) + len(tt))
        seg = 1 - (1 - db(-d)) * np.clip(shape[: hi - lo], 0, 1)
        g[lo:hi] = np.minimum(g[lo:hi], seg)
    return g


def room_tone(n):
    r = rng("room")
    x = lp(hp(r.standard_normal(n), 60), 1800)
    x = x / np.sqrt(np.mean(x**2)) * db(ROOM_DB)
    return np.vstack([x, np.roll(x, samples(0.013))])


def silence_mask(n, sil, fps):
    """0 over the silence (with a 25 ms fade into it and a 4 ms fade out of it), 1 elsewhere."""
    g = np.ones(n)
    a, b = samples(sil["start"] / fps), samples((sil["end"] + 1) / fps)
    g[a:b] = 0.0
    k = samples(0.025)
    g[a - k : a] = np.linspace(1, 0, k) ** 2
    k2 = samples(0.004)
    g[b : b + k2] = np.minimum(g[b : b + k2], np.linspace(0, 1, k2))
    return g, a, b


def main():
    with open(TIMELINE) as fh:
        tl = json.load(fh)
    fps = tl["fps"]
    frames = tl["durationInFrames"]
    n = int(round(frames / fps * SR))
    sil = tl["silence"]
    os.makedirs(MIX, exist_ok=True)

    voice, vrows = build_voice(tl, n)
    snd = load_foley()
    foley, frows = build_foley(tl, n, snd, sil)
    mus, music_source, layers = build_music(tl, n)
    duck = voice_duck(voice, n)
    bed = mus.copy()  # before ducking: for the tempo check and for a later re-balance
    mus = mus * (duck * hit_duck(tl, n, frows, snd))[None, :]
    room = room_tone(n)
    t = taxis(n)
    fade_in = np.clip(t / 0.5, 0, 1) ** 2
    room *= fade_in[None, :]

    mask, sa, sb = silence_mask(n, sil, fps)
    end_n = samples(END_FADE_S)
    end = np.ones(n)
    end[-end_n:] = np.cos(np.linspace(0, np.pi / 2, end_n)) ** 2
    shaping = mask * end
    parts = {"voice": voice * mask[None, :], "foley": foley * shaping[None, :], "music": mus * shaping[None, :], "room": room * shaping[None, :]}

    def master(gm):
        mix = sum(parts.values()) * gm
        out = limit(mix, CEILING_DBTP) * mask[None, :]
        return mix, out, lufs(out)

    gm = db(TARGET_LUFS - lufs(sum(parts.values())))
    for _ in range(8):
        mix, out, L = master(gm)
        if abs(L - TARGET_LUFS) < 0.03:
            break
        gm *= db(TARGET_LUFS - L)
    mix, out, L = master(gm)
    out[:, -1] = 0.0
    tp = true_peak_db(out)

    os.makedirs(os.path.dirname(OUT_WAV), exist_ok=True)
    write_wav16(OUT_WAV, out)
    for k, v in parts.items():
        write_wav32(os.path.join(MIX, f"{k}.wav"), v * gm)
    write_wav32(os.path.join(MIX, "music_unducked.wav"), bed * shaping[None, :] * gm)
    write_wav32(os.path.join(MIX, "duck_gain.wav"), duck[None, :].astype(np.float32))
    for k, v in layers.items():
        write_wav32(os.path.join(MIX, f"music_{k}_stem.wav"), v * db(MUSIC_LUFS - lufs(sum(layers.values()))) * gm)

    # the limiter's work, measured where the mix is not shaped by the silence or the end fade
    lim = limit(mix, CEILING_DBTP)
    live = (shaping > 0.999) & (np.abs(mix).max(axis=0) > 1e-4)
    reduction = to_db(np.maximum(np.abs(lim).max(axis=0)[live], 1e-9) / np.abs(mix).max(axis=0)[live])
    work = {"max_db": round(float(reduction.min()), 2), "ms_over_1db": round(float((reduction < -1).sum() / SR * 1000), 1),
            "ms_over_3db": round(float((reduction < -3).sum() / SR * 1000), 1)}
    report = {
        "film_frames": frames,
        "samples": n,
        "seconds": round(n / SR, 4),
        "sample_rate": SR,
        "music": music_source,
        "mix_lufs": round(L, 2),
        "true_peak_dbtp": round(tp, 2),
        "master_gain_db": round(float(to_db(gm)), 2),
        "limiter": work,
        "silence_samples": [sa, sb],
        "levels_in_mix": {k: round(lufs(v * gm), 1) if np.any(v) else None for k, v in parts.items()},
        "voice": vrows,
        "cues": frows,
    }
    with open(os.path.join(MIX, "report.json"), "w") as fh:
        json.dump(report, fh, indent=1)
    print(json.dumps({k: v for k, v in report.items() if k not in ("voice", "cues")}, indent=1))


if __name__ == "__main__":
    main()
