"""Small signal helpers shared by the foley, the music and the mix.

Copied from the Farzana v3 film (video/audio/dsp.py) on 2026-11-05 and set to 48 kHz for this film.
Pan here takes a pan value from -1 (left) to 1 (right), not a pixel x: see pan_gains_v.
"""

import numpy as np
from scipy.signal import butter, resample_poly, sosfilt

SR = 48000


def seed_of(name):
    h = 2166136261
    for ch in name.encode():
        h ^= ch
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def rng(name):
    return np.random.default_rng(seed_of(name))


def db(x):
    return 10 ** (np.asarray(x, float) / 20.0)


def to_db(x):
    return 20 * np.log10(np.maximum(np.abs(x), 1e-12))


def taxis(n):
    return np.arange(n) / SR


def samples(seconds):
    return int(round(seconds * SR))


def bp(x, lo, hi, order=2):
    hi = min(hi, SR * 0.45)
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), btype="low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="high", fs=SR, output="sos"), x)


def _biquad(x, b, a):
    return sosfilt(np.array([[b[0] / a[0], b[1] / a[0], b[2] / a[0], 1.0, a[1] / a[0], a[2] / a[0]]]), x)


def peaking(x, f0, gain_db, q):
    """A bell EQ (RBJ cookbook), cut or boost around f0."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    al = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    return _biquad(x, [1 + al * A, -2 * cw, 1 - al * A], [1 + al / A, -2 * cw, 1 - al / A])


def high_shelf(x, f0, gain_db):
    """A high shelf (RBJ cookbook, slope 1)."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    al = np.sin(w0) / 2 * np.sqrt(2)
    cw = np.cos(w0)
    sA = 2 * np.sqrt(A) * al
    b = [A * ((A + 1) + (A - 1) * cw + sA), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sA)]
    a = [(A + 1) - (A - 1) * cw + sA, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sA]
    return _biquad(x, b, a)


def rise(t, tau):
    """A soft attack: 0 at t = 0, settling to 1 with time constant tau."""
    return 1 - np.exp(-t / max(tau, 1e-6))


def modes(t, freqs, amps, taus, r=None):
    """Damped sines: the resonances of a struck object."""
    out = np.zeros_like(t)
    for f, a, tau in zip(freqs, amps, taus):
        if f <= 0 or f > SR * 0.45:
            continue
        ph = r.uniform(0, 2 * np.pi) if r is not None else 0.0
        out += a * np.sin(2 * np.pi * f * t + ph) * np.exp(-t / tau)
    return out


def burst(r, n, tau, lo=None, hi=None):
    """Noise that dies away with time constant tau, optionally band-limited."""
    t = taxis(n)
    x = r.standard_normal(n)
    if lo and hi:
        x = bp(x, lo, hi)
    elif hi:
        x = lp(x, hi)
    elif lo:
        x = hp(x, lo)
    return x * np.exp(-t / tau)


def shift(x, seconds, n=None):
    """x delayed by seconds, in a buffer of n samples (or its own length)."""
    n = n or len(x)
    a = samples(seconds)
    out = np.zeros(n)
    if a < n:
        m = min(len(x), n - a)
        out[a : a + m] = x[:m]
    return out


def tail(x, seconds):
    """A raised-cosine fade over the last seconds, so nothing ends in a click."""
    k = min(len(x), samples(seconds))
    if k > 1:
        x = x.copy()
        x[-k:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, k))
    return x


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


A4 = 440.0
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def hz(name):
    """'F#4' -> frequency (equal temperament, A4 = 440)."""
    if isinstance(name, (int, float, np.floating)):
        return float(name)
    pitch, octave = name[:-1], int(name[-1])
    return A4 * 2 ** ((NOTE[pitch] + (octave + 1) * 12 - 69) / 12)


# ── placing a mono sound in the stereo field ─────────────────────────────────


def pan_gains(x):
    """Constant-power pan from a picture x (0..1920), a little narrower than hard left/right."""
    pan = np.clip(np.asarray(x, float) / 1920.0 * 2 - 1, -1, 1) * 0.8
    a = (pan + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def centre_loss(x):
    gl, gr = pan_gains(x)
    return float(max(gl, gr))


def place(buf, start, mono, x):
    """Add mono into the stereo buf at sample start, panned to x (a number, or one x per sample)."""
    n = buf.shape[1]
    if start >= n:
        return
    if start < 0:
        mono = mono[-start:]
        x = x[-start:] if np.ndim(x) else x
        start = 0
    m = mono[: n - start]
    xs = x[: len(m)] if np.ndim(x) else x
    gl, gr = pan_gains(xs)
    buf[0, start : start + len(m)] += m * gl
    buf[1, start : start + len(m)] += m * gr


# ── loudness (ITU-R BS.1770-4), true peak, limiter ───────────────────────────


def k_weight(x):
    G, Q, fc = 3.99984385397, 0.7071752369554193, 1681.9744509555319
    A = 10 ** (G / 40)
    w0 = 2 * np.pi * fc / SR
    alpha = np.sin(w0) / (2 * Q)
    cw = np.cos(w0)
    b = [A * ((A + 1) + (A - 1) * cw + 2 * np.sqrt(A) * alpha), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - 2 * np.sqrt(A) * alpha)]
    a = [(A + 1) - (A - 1) * cw + 2 * np.sqrt(A) * alpha, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - 2 * np.sqrt(A) * alpha]
    s1 = np.array([b + a]) / a[0]
    fc2, Q2 = 38.13547087613982, 0.5003270373253953
    w0 = 2 * np.pi * fc2 / SR
    alpha = np.sin(w0) / (2 * Q2)
    cw = np.cos(w0)
    s2 = np.array([[1.0, -2.0, 1.0, 1 + alpha, -2 * cw, 1 - alpha]]) / (1 + alpha)
    return sosfilt(np.vstack([s1, s2]), x)


def lufs(buf):
    """Integrated loudness of a stereo buffer (gated, BS.1770-4)."""
    z = np.array([k_weight(ch) for ch in buf])
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([np.mean(z[:, s : s + blk] ** 2, axis=1).sum() for s in range(0, buf.shape[1] - blk + 1, hop)])
    if not len(ms):
        return -120.0
    lk = -0.691 + 10 * np.log10(np.maximum(ms, 1e-12))
    g1 = ms[lk > -70]
    if not len(g1):
        return -120.0
    rel = -0.691 + 10 * np.log10(g1.mean()) - 10
    g2 = ms[(lk > -70) & (lk > rel)]
    return float(-0.691 + 10 * np.log10(g2.mean()))


def true_peak_db(buf):
    up = resample_poly(buf, 4, 1, axis=1)
    return float(20 * np.log10(np.max(np.abs(up)) + 1e-12))


def limit(buf, ceiling_db, look_ms=1.5, release_ms=60.0):
    """Lookahead true-peak limiter: gain from the 4x-oversampled peaks, held over
    the lookahead, released smoothly."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d

    n1 = buf.shape[1]
    up = resample_poly(buf, 4, 1, axis=1)
    peak = np.max(np.abs(up), axis=0)[: n1 * 4].reshape(n1, 4).max(axis=1)
    need = np.minimum(1.0, db(ceiling_db) / np.maximum(peak, 1e-12))
    look = max(1, int(look_ms / 1000 * SR))
    g = minimum_filter1d(need, size=2 * look + 1, mode="nearest")
    g = uniform_filter1d(g, size=look, mode="nearest")
    rel = float(np.exp(-1.0 / (release_ms / 1000 * SR)))
    gl = g.tolist()
    cur = 1.0
    for i, v in enumerate(gl):
        cur = v if v < cur else rel * cur + (1 - rel) * v
        gl[i] = cur
    return buf * np.array(gl)[None, :]


def write_wav16(path, buf):
    import wave

    pcm = (np.clip(buf, -1, 1).T * 32767).round().astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def write_wav32(path, buf):
    from scipy.io import wavfile

    wavfile.write(path, SR, np.asarray(buf).T.astype(np.float32))


def pan_gains_v(pan):
    """Constant-power pan from a pan value -1..1 (the cue's pan), narrowed to 0.8 of hard left/right."""
    p = np.clip(np.asarray(pan, float), -1, 1) * 0.8
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def place_pan(buf, start, mono, pan):
    """Add mono into the stereo buf at sample start, panned by a pan value -1..1; the centre
    keeps the mono level in each channel (gain 1 at pan 0), so a sound's level does not depend on its pan."""
    n = buf.shape[1]
    if start >= n:
        return
    if start < 0:
        mono = mono[-start:]
        start = 0
    m = mono[: n - start]
    gl, gr = pan_gains_v(pan)
    k = 1.0 / float(np.cos(np.pi / 4))
    buf[0, start : start + len(m)] += m * gl * k
    buf[1, start : start + len(m)] += m * gr * k


def read_audio(path, sr=None, mono=False):
    """Any audio file (mp3, wav) through ffmpeg, as float64 (channels, samples) at sr (default SR)."""
    import subprocess

    sr = sr or SR
    ch = 1 if mono else 2
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(ch), "-ar", str(sr), "-"],
        check=True, capture_output=True,
    ).stdout
    x = np.frombuffer(raw, dtype="<f4").astype(np.float64)
    return x.reshape(-1, ch).T


def write_wav_mono32(path, x):
    from scipy.io import wavfile

    wavfile.write(path, SR, np.asarray(x).astype(np.float32))
