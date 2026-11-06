"""The placeholder music for version 2 of the AI productivity film, shaped from video/timeline-v2.json.

Version 1's score.py is untouched; this file borrows its plucked bass, soft kick, shaker and snap,
and adds in-tune versions of the pad, marimba and bell (no chorus voices a few cents apart, marimba
partials at the tuned 1 : 4 : 10). Every note is equal-tempered (A4 = 440 Hz) and in C major.

The grid: 120 bpm, beat n at film frame 15n (version 2 frames are 0-based), eighths between.

The shape:

- Phrase A, s01 and s02 (beats 0 to 31): sparse and a little busy, the overload. A dark pad and
  marimba eighths with a closed filter (s01); a plucked bass joins, the filter opens a little and
  the last beat of every bar fills with sixteenths (s02). Chords Am, F, C, G; the last bar is G.
- The silent beat: the first 15 frames of s03 (film frames 480 to 494, beat 32). No layer plays;
  make_mix_v2.py also zeroes every part there.
- Phrase B, from the s03 title (beat 33) on: brighter and calmer. An open pad and marimba quarter
  notes, chords C, F, G, Am, bars counted from beat 33 so the final chord lands on a downbeat.
  One gentle layer more at each feature scene: s04 bass, s05 shaker, s06 high pad, s07 soft kick
  (beats 1 and 3), s08 bell counter-melody, s09 soft snaps (2 and 4).
- s10: the drums (shaker, kick, snaps) and the bell go out; pad, high pad, bass and marimba stay.
- The final chord, C major, on s10's local frame 210 (beat 157, film frame 2355), a pad and a
  rolled marimba chord ringing into the fade.
"""

import math

import numpy as np

from dsp import SR, hz, lp, place_pan, rng, samples, taxis
from score import bass, kick, shaker, snap

BEAT_FRAMES = 15
SILENT_FRAMES = 15  # the silent beat at the head of s03
FINAL_LOCAL = 210  # the final chord's local frame in s10

LAYERS = ("pads", "arp", "bass", "shaker", "highpad", "kick", "glock", "snap")
DRUMS = ("shaker", "kick", "snap")
# the gentle layer each feature scene adds, in order
ADDED = {"s04": "bass", "s05": "shaker", "s06": "highpad", "s07": "kick", "s08": "glock", "s09": "snap"}

CHORD = {
    "C": ("C2", ["E3", "G3", "C4"], ["C5", "G4", "E4", "G4"]),
    "Am": ("A1", ["E3", "A3", "C4"], ["A4", "E4", "C5", "E4"]),
    "F": ("F2", ["F3", "A3", "C4"], ["F4", "A4", "C5", "A4"]),
    "G": ("G2", ["D3", "G3", "B3"], ["G4", "B4", "D5", "B4"]),
}
LOOP_A = ["Am", "F", "C", "G"]  # the overload: eight bars, the last on G
LOOP_B = ["C", "F", "G", "Am"]  # from the title: starts on C; bar 30 is G, the final chord C
C_MAJOR = {"C", "D", "E", "F", "G", "A", "B"}

# how loud each layer is in each scene (0..1); a layer missing from a scene does not play there
LEVEL = {
    "pads": {"s01": 0.5, "s02": 0.58, "s03": 0.72, "s04": 0.74, "s05": 0.76, "s06": 0.78, "s07": 0.8, "s08": 0.82, "s09": 0.84, "s10": 0.6},
    "arp": {"s01": 0.42, "s02": 0.5, "s03": 0.62, "s04": 0.62, "s05": 0.64, "s06": 0.64, "s07": 0.66, "s08": 0.66, "s09": 0.68, "s10": 0.45},
    "bass": {"s02": 0.5, "s04": 0.55, "s05": 0.58, "s06": 0.6, "s07": 0.6, "s08": 0.62, "s09": 0.64, "s10": 0.42},
    "shaker": {"s05": 0.4, "s06": 0.42, "s07": 0.44, "s08": 0.46, "s09": 0.5},
    "highpad": {"s06": 0.85, "s07": 0.9, "s08": 0.95, "s09": 1.0, "s10": 0.6},
    "kick": {"s07": 0.42, "s08": 0.45, "s09": 0.5},
    "glock": {"s08": 0.9, "s09": 1.0},
    "snap": {"s09": 0.8},
}


def beat_s(b):
    return b * BEAT_FRAMES / 30.0


# ── in-tune instruments ──────────────────────────────────────────────────────


def pad(f, vel, ring=2.0, bright=1500, attack=0.3, release=0.3):
    """A soft pad: one in-tune voice (harmonics 1 to 4 at 1/k; 1 to 3 below C3), low-passed, slow
    swell and release. Few harmonics, so the equal-tempered thirds of a chord barely beat."""
    n = samples(ring + release)
    t = taxis(n)
    out = np.zeros(n)
    for k in range(1, 5 if f >= hz("C3") else 4):
        if f * k > SR * 0.4:
            break
        out += np.sin(2 * np.pi * f * k * t + 0.7 * k) / k
    out = lp(out, bright)
    return out * np.clip(t / attack, 0, 1) ** 2 * np.clip(1 - (t - ring) / release, 0, 1) ** 2 * vel


def marimba(f, vel, ring=1.0):
    """A marimba bar tuned the way real bars are: partials at 1, 4 and 10 times the note."""
    tau1 = float(np.clip(0.95 * (262 / f) ** 0.7, 0.28, 1.5)) * ring
    n = samples(min(7.0, tau1 * 5))
    t = taxis(n)
    out = np.zeros(n)
    for ratio, amp, tk in ((1.0, 1.0, 1.0), (4.0, 0.26 * vel, 0.22), (10.0, 0.09 * vel * vel, 0.08)):
        if f * ratio < SR * 0.45:
            out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (tau1 * tk))
    out *= 1 - np.exp(-t / 0.0015)
    return out * vel


def bell(f, vel):
    """A small celesta-like bell: harmonic partials 1, 2, 3, the upper ones dying fast."""
    n = samples(1.6)
    t = taxis(n)
    out = np.zeros(n)
    for ratio, amp, tau in ((1.0, 1.0, 0.9), (2.0, 0.3, 0.25), (3.0, 0.1, 0.08)):
        if f * ratio < SR * 0.45:
            out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / tau)
    return out * (1 - np.exp(-t / 0.001)) * vel


def choke(x, stop_s, fade_s=0.04):
    """Damp a note at stop_s (a hand on the bar), so it never rings into the next chord."""
    a = samples(stop_s)
    if a >= len(x):
        return x
    x = x.copy()
    k = min(samples(fade_s), len(x) - a)
    x[a : a + k] *= np.linspace(1, 0, k) ** 2
    x[a + k :] = 0.0
    return x


def up(note, octaves=1):
    return note[:-1] + str(int(note[-1]) + octaves)


# ── the shape ────────────────────────────────────────────────────────────────


def shape(tl):
    """Beats where each part of the film begins, from timeline-v2.json."""
    sc = {s["id"]: s for s in tl["scenes"]}
    entry = {sid: -(-s["start"] // BEAT_FRAMES) for sid, s in sc.items()}  # first beat at or after the cut
    sil = (sc["s03"]["start"], sc["s03"]["start"] + SILENT_FRAMES)  # film frames [a, b)
    final_frame = sc["s10"]["start"] + FINAL_LOCAL
    if final_frame % BEAT_FRAMES or sil[0] % BEAT_FRAMES or sil[1] % BEAT_FRAMES:
        raise SystemExit("timeline-v2: the silent beat and the final chord must fall on the 15-frame grid")
    return {
        "entry": entry,
        "order": [s["id"] for s in tl["scenes"]],
        "silence_frames": sil,
        "silence_beats": (sil[0] // BEAT_FRAMES, sil[1] // BEAT_FRAMES - 1),
        "back": sil[1] // BEAT_FRAMES,  # the title beat: phrase B starts here
        "final": final_frame // BEAT_FRAMES,
        "final_frame": final_frame,
    }


def scene_of(S, b):
    cur = S["order"][0]
    for sid in S["order"]:
        if S["entry"][sid] <= b:
            cur = sid
    return cur


def level(layer, sid):
    return LEVEL[layer].get(sid, 0.0)


def build(n, tl):
    """The placeholder as stems {layer: stereo (2, n)}, the shape it used, every note it played
    (pitched layers) and every event (all layers, drums included)."""
    S = shape(tl)
    s0, s1 = S["silence_beats"]
    back, final = S["back"], S["final"]
    end_s = tl["durationInFrames"] / tl["fps"]
    st = {k: np.zeros((2, n)) for k in LAYERS}
    notes, events = [], []
    r = rng("score-v2")

    def put(layer, b, x, pan, note=None):
        place_pan(st[layer], samples(beat_s(b)), x, pan)
        events.append({"layer": layer, "beat": round(b, 3), "s": round(beat_s(b), 4)})
        if note is not None:
            notes.append({"layer": layer, "beat": round(b, 3), "frame": round(b * BEAT_FRAMES, 2), "note": note, "hz": round(hz(note), 3)})

    for b in range(final):
        if s0 <= b <= s1:
            continue  # the silent beat
        A = b < s0
        idx, pos = (b // 4, b % 4) if A else ((b - back) // 4, (b - back) % 4)
        name = LOOP_A[idx % 4] if A else LOOP_B[idx % 4]
        root, triad, arp = CHORD[name]
        sid = scene_of(S, b)
        to_bar = beat_s(4 - pos)  # seconds from this beat to the next chord

        # pads: one chord a bar; the last bar before the silence holds right up to it (cut there)
        g = level("pads", sid)
        if g > 0 and pos == 0:
            ring = (beat_s(s0) - beat_s(b)) if (A and b + 4 >= s0) else 2.0  # releases from the next downbeat, 0.3 s crossfade
            for i, note in enumerate([root] + triad):
                put("pads", b, pad(hz(note), 0.2 * g, ring=ring, bright=1100 if A else 2600), (-0.15 + 0.1 * i) if i else 0.0, note)
        g = level("highpad", sid)
        if g > 0 and pos == 0:
            for i, note in enumerate(triad):
                put("highpad", b, pad(hz(up(note)), 0.07 * g, ring=2.0, bright=3200), -0.3 + 0.3 * i, up(note))

        # marimba: eighths (and a sixteenth fill on beat 4 of each s02 bar) in the overload, quarters after
        g = level("arp", sid)
        if g > 0:
            if A:
                cutoff = 1400.0
                if sid == "s02":
                    a0 = S["entry"]["s02"]
                    cutoff = 1400.0 * (3500.0 / 1400.0) ** ((b - a0) / max(1, s0 - a0))
                steps = [0.0, 0.25, 0.5, 0.75] if (sid == "s02" and pos == 3) else [0.0, 0.5]
                for j, d in enumerate(steps):
                    e = pos * 2 + int(d * 2)
                    note = arp[(e + (1 if d in (0.25, 0.75) else 0)) % 4]
                    vel = 0.45 * g * (0.8 if d in (0.25, 0.75) else 1.0)
                    put("arp", b + d, choke(lp(marimba(hz(note), vel, ring=0.7), cutoff), to_bar - d * 0.5), -0.25 if j % 2 == 0 else 0.25, note)
            else:
                note = arp[pos % 4]
                put("arp", b, choke(marimba(hz(note), 0.45 * g, ring=1.3), to_bar), -0.2 if pos % 2 == 0 else 0.2, note)

        g = level("bass", sid)
        if g > 0 and pos in (0, 2):
            note = up(root) if root.endswith("1") else root
            put("bass", b, bass(hz(note), 0.5 * g, length=0.9), 0.0, note)
        g = level("shaker", sid)
        if g > 0:
            put("shaker", b, shaker(r, 0.3 * g), 0.35)
            put("shaker", b + 0.5, shaker(r, 0.5 * g), 0.35)
        g = level("kick", sid)
        if g > 0 and pos in (0, 2):
            put("kick", b, kick(0.55 * g), 0.0)
        g = level("snap", sid)
        if g > 0 and pos in (1, 3):
            put("snap", b, snap(r, 0.22 * g), 0.1)
        g = level("glock", sid)
        if g > 0 and pos in (0, 2):
            note = up(arp[(pos + idx) % 4])
            d = 0.5 if pos == 2 else 0.0
            put("glock", b + d, choke(bell(hz(note), 0.12 * g), to_bar - d * 0.5), 0.45, note)

    # the final chord: a C major pad and a rolled marimba chord ringing into the fade
    hold = max(1.0, end_s - beat_s(final) - 0.3)
    for i, note in enumerate(["C2", "G2", "C3", "E3", "G3", "C4"]):
        put("pads", final, pad(hz(note), 0.2, ring=hold, bright=2200, attack=0.12), 0.0, note)
    for i, note in enumerate(["C4", "E4", "G4", "C5", "E5"]):
        put("arp", final + 0.07 * i, marimba(hz(note), 0.4, ring=3.0), -0.3 + 0.15 * i, note)

    layers_by_scene = {sid: [k for k in LAYERS if level(k, sid) > 0] for sid in S["order"]}
    return st, S, notes, events, layers_by_scene


def in_c_major(note):
    return note[:-1] in C_MAJOR


def equal_tempered(note, f):
    return math.isclose(hz(note), f, rel_tol=0, abs_tol=0.001)
