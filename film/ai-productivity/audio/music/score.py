"""The placeholder music bed for the AI productivity film, on the 120 bpm grid.

Used because the night's ElevenLabs key has no music_generation permission (HTTP 401 on
2026-11-05), so per PLAN.md Fallbacks the music is "a soft placeholder pad on the grid". It is in
tune and calm, never "bad", and is shaped to the film from video/timeline.json every time it runs:

- s01 and s02 (frames 1 to the silence): felt-piano pad and a sparse marimba, a plucked bass
  joins in s02 and the marimba moves to eighths with its filter opening (builds a little).
- the silence (timeline.json silence): nothing at all; the bar into it stops short.
- s03 (the sweep): returns brighter, everything open.
- one layer more at each feature scene: s04 shaker, s05 soft kick, s06 high pad, s07 soft snaps on
  2 and 4, s08 glockenspiel counter-melody, s09 everything.
- s10: settles (drums out), then the final chord on the beat timeline.json's music table names,
  ringing into the fade.

If real music arrives (a licensed or paid-plan track in audio/music/track.wav), make_mix.py uses it
instead and cuts it to the same shape. Beat n sounds at film frame 15n + 1 (= (15n + 1) / 30 s).
Instruments come from the Farzana v3 film's score3.py.
"""

import numpy as np

from dsp import SR, bp, hz, lp, place_pan, rng, samples, taxis

FPS = 30


def beat_s(b):
    return (b * 15 + 1) / FPS


def frame_beat(f):
    """The beat a film frame falls in (frames before frame 1 are beat 0)."""
    return max(0, (f - 1) // 15)


# ── instruments ──────────────────────────────────────────────────────────────


def pad(f, vel, ring=2.0, bright=1500):
    """A soft pad: three voices a few cents apart (a gentle chorus, in tune), low-passed, slow swell."""
    hold = float(ring)
    n = samples(hold + 1.2)
    t = taxis(n)
    out = np.zeros(n)
    for cents, ph in ((-4, 0.3), (0, 1.1), (4, 2.0)):
        fd = f * 2 ** (cents / 1200)
        for k in range(1, 7):
            if fd * k > SR * 0.4:
                break
            out += np.sin(2 * np.pi * fd * k * t + ph * k) / k
    out = lp(out, bright)
    return out * np.clip(t / 0.35, 0, 1) ** 2 * np.clip(1 - (t - hold) / 1.2, 0, 1) ** 2 * vel


def marimba(f, vel, ring=1.0):
    tau1 = float(np.clip(0.95 * (262 / f) ** 0.7, 0.28, 1.5)) * ring
    n = samples(min(7.0, tau1 * 5))
    t = taxis(n)
    out = np.zeros(n)
    for ratio, amp, tk in ((1.0, 1.0, 1.0), (3.93, 0.26 * vel, 0.22), (9.2, 0.09 * vel * vel, 0.08)):
        if f * ratio < SR * 0.45:
            out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (tau1 * tk))
    out *= 1 - np.exp(-t / 0.0015)
    return out * vel


def glock(f, vel):
    n = samples(1.6)
    t = taxis(n)
    out = np.zeros(n)
    for ratio, amp, tau in ((1.0, 1.0, 0.9), (2.76, 0.35, 0.25), (5.40, 0.12, 0.08)):
        if f * ratio < SR * 0.45:
            out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / tau)
    return out * (1 - np.exp(-t / 0.001)) * vel


def bass(f, vel, length=0.9):
    """A round plucked bass: fundamental and a little second harmonic, soft attack."""
    n = samples(length + 0.1)
    t = taxis(n)
    out = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.12)
    env = (1 - np.exp(-t / 0.006)) * np.exp(-t / 0.45) * np.clip((length + 0.1 - t) / 0.1, 0, 1)
    return lp(out * env, 900) * vel


def kick(vel):
    """A soft low pulse: a sine falling from about 115 Hz to 46 Hz, no click."""
    n = samples(0.36)
    t = taxis(n)
    freq = 46 + 70 * np.exp(-t / 0.032)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.15) * (1 - np.exp(-t / 0.003)) * vel


def shaker(r, vel):
    n = samples(0.07)
    t = taxis(n)
    x = bp(r.standard_normal(n), 5000, 11000)
    return x * (1 - np.exp(-t / 0.008)) * np.exp(-t / 0.018) * vel


def snap(r, vel):
    n = samples(0.12)
    t = taxis(n)
    x = bp(r.standard_normal(n), 1200, 3500)
    return x * (1 - np.exp(-t / 0.001)) * np.exp(-t / 0.03) * vel


# C major, one chord a bar: C, Am, F, G
CHORDS = [
    ("C2", ["E3", "G3", "C4"], ["C5", "G4", "E4", "G4"]),
    ("A1", ["E3", "A3", "C4"], ["A4", "E4", "C5", "E4"]),
    ("F2", ["F3", "A3", "C4"], ["F4", "A4", "C5", "A4"]),
    ("G2", ["D3", "G3", "B3"], ["G4", "B4", "D5", "B4"]),
]
LAYERS = ("pads", "arp", "bass", "shaker", "kick", "highpad", "snap", "glock")


def shape(tl):
    """Beats where each part of the film begins, from timeline.json."""
    sc = {s["id"]: s for s in tl["scenes"]}
    chord = next(m["from"] for m in tl["music"] if "final chord" in m["what"])
    return {
        "s02": frame_beat(sc["s02"]["start"]),
        "silence": (frame_beat(tl["silence"]["start"]), frame_beat(tl["silence"]["end"])),
        "s03": frame_beat(sc["s03"]["start"]),
        "s04": frame_beat(sc["s04"]["start"]),
        "s05": frame_beat(sc["s05"]["start"]),
        "s06": frame_beat(sc["s06"]["start"]),
        "s07": frame_beat(sc["s07"]["start"]),
        "s08": frame_beat(sc["s08"]["start"]),
        "s09": frame_beat(sc["s09"]["start"]),
        "s10": frame_beat(sc["s10"]["start"]),
        "final": frame_beat(chord),
    }


def gain(S, b, layer):
    """How loud a layer is at beat b (0..1)."""
    s0, s1 = S["silence"]
    if s0 <= b <= s1 or b >= S["final"]:
        return 0.0
    before = b < S["s03"]
    settle = b >= S["s10"]
    if layer == "pads":
        return 0.55 if b < S["s02"] else 0.65 if before else 0.6 if settle else 0.8
    if layer == "arp":
        if b < S["s02"]:
            return 0.45
        if before:
            return 0.5 + 0.3 * (b - S["s02"]) / max(1, s0 - S["s02"])
        return 0.55 if settle else 0.85
    if layer == "bass":
        return 0.0 if b < S["s02"] else 0.6 if before else 0.5 if settle else 0.8
    if settle or before:
        return 0.0
    entry = {"shaker": "s04", "kick": "s05", "highpad": "s06", "snap": "s07", "glock": "s08"}[layer]
    return 0.0 if b < S[entry] else (1.0 if b >= S["s09"] else 0.8)


def arp_cutoff(S, b):
    """The marimba's low-pass: closed at the start, opening across s02, open from the sweep."""
    if b < S["s02"]:
        return 1400.0
    if b < S["s03"]:
        s0 = S["silence"][0]
        return 1400.0 * (7000.0 / 1400.0) ** ((b - S["s02"]) / max(1, s0 - S["s02"]))
    return 9000.0


def build(n, tl):
    """The placeholder as stems {layer: stereo (2, n)} and the shape it used."""
    S = shape(tl)
    s0, s1 = S["silence"]
    final = S["final"]
    st = {k: np.zeros((2, n)) for k in LAYERS}
    r = rng("score")
    for bar in range(0, final, 4):
        root, triad, arp = CHORDS[(bar // 4) % 4]
        into_silence = bar < s0 <= bar + 4
        ring = (beat_s(s0) - beat_s(bar) - 0.05 - 1.2) if into_silence else 1.9
        g = gain(S, bar, "pads")
        if g > 0:
            for note in [root] + triad:
                place_pan(st["pads"], samples(beat_s(bar)), pad(hz(note), 0.2 * g, ring=max(0.3, ring)), 0.0)
        gh = gain(S, bar, "highpad")
        if gh > 0:
            for i, note in enumerate(triad):
                up = note[:-1] + str(int(note[-1]) + 1)
                place_pan(st["highpad"], samples(beat_s(bar)), pad(hz(up), 0.07 * gh, ring=1.9, bright=3200), -0.3 + 0.3 * i)
        for k in range(8):  # eighths
            b = bar + k / 2
            bi = int(b)
            if b >= final or s0 <= bi <= s1:
                continue
            ga = gain(S, bi, "arp")
            eighths = bi >= S["s02"]
            if ga > 0 and (eighths or k % 2 == 0):
                tone = lp(marimba(hz(arp[(k if eighths else k // 2) % 4]), 0.45 * ga, ring=0.8), arp_cutoff(S, b))
                place_pan(st["arp"], samples(beat_s(b)), tone, -0.25 if k % 2 == 0 else 0.25)
            gs = gain(S, bi, "shaker")
            if gs > 0:
                place_pan(st["shaker"], samples(beat_s(b)), shaker(r, (0.5 if k % 2 else 0.3) * gs), 0.35)
        for k in range(4):
            b = bar + k
            if b >= final or s0 <= b <= s1:
                continue
            gb = gain(S, b, "bass")
            if gb > 0 and k in (0, 2):
                place_pan(st["bass"], samples(beat_s(b)), bass(hz(root) * (2 if root.endswith("1") else 1), 0.5 * gb, length=0.9), 0.0)
            gk = gain(S, b, "kick")
            if gk > 0:
                place_pan(st["kick"], samples(beat_s(b)), kick(0.55 * gk), 0.0)
            gn = gain(S, b, "snap")
            if gn > 0 and k in (1, 3):
                place_pan(st["snap"], samples(beat_s(b)), snap(r, 0.25 * gn), 0.1)
            gg = gain(S, b, "glock")
            if gg > 0 and k in (0, 2):
                note = arp[(k + bar // 4) % 4]
                up = note[:-1] + str(int(note[-1]) + 1)
                place_pan(st["glock"], samples(beat_s(b + (0.5 if k == 2 else 0))), glock(hz(up), 0.12 * gg), 0.45)
    # the final chord: a C major pad and a rolled marimba chord ringing to the end
    t_end = tl["durationInFrames"] / FPS
    hold = max(1.0, t_end - beat_s(final) - 0.6)
    for note in ["C2", "G2", "C3", "E3", "G3", "C4"]:
        place_pan(st["pads"], samples(beat_s(final)), pad(hz(note), 0.2, ring=hold, bright=2200), 0.0)
    for i, note in enumerate(["C4", "E4", "G4", "C5", "E5"]):
        place_pan(st["arp"], samples(beat_s(final) + 0.035 * i), marimba(hz(note), 0.4, ring=3.0), -0.3 + 0.15 * i)
    return st, S
