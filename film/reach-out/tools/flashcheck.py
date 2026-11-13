"""Photosensitivity check on a finished video. Reads every frame and measures brightness, it does not guess.

  .venv/bin/python tools/flashcheck.py out/kingdom-sites-story-vertical-1080x1920.mp4

Rules (the "three flashes" test used for broadcast and WCAG 2.3.1, kept a little stricter):
  - a swing = a patch's relative luminance going up or down by 0.10 or more (10% of full white),
    with the darker side under 0.80; a red swing = the same for saturated red;
  - a flash = two opposite swings;
  - FAIL if, inside any one second, more than 3 flashes happen over a quarter or more of any region
    a third of the frame wide and a third tall;
  - it also reports the largest whole-picture brightness jump between two frames in a row, and FAILS
    if the whole picture swings by 0.10 or more over 3 times in a second (full-screen strobing).
Exit code 0 = pass, 1 = fail. Prints the numbers either way.
"""
import sys, subprocess, json
import numpy as np

path = sys.argv[1]
GW, GH = 54, 96
pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate,nb_frames,width,height",
                     "-of", "json", path], capture_output=True, text=True)
st = json.loads(pr.stdout)["streams"][0]
num, den = (int(x) for x in st["r_frame_rate"].split("/"))
fps = num / den
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"scale={GW}:{GH}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, GH, GW, 3).astype(np.float32) / 255.0
n = fr.shape[0]
lin = np.where(fr <= 0.04045, fr / 12.92, ((fr + 0.055) / 1.055) ** 2.4)
L = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]            # relative luminance per patch
s = fr.sum(-1) + 1e-6
redness = np.where((fr[..., 0] / s) >= 0.8, (fr[..., 0] - fr[..., 1] - fr[..., 2]) * 320.0, 0.0)   # WCAG red measure


def swings(x, thr, dark_ok=None):
    """For each patch, the frames on which it completes a swing of at least thr, and its direction."""
    n_ = x.shape[0]
    ev = np.zeros(x.shape, np.int8)
    lo = x[0].copy(); hi = x[0].copy(); d = np.zeros(x.shape[1:], np.int8)
    for i in range(1, n_):
        v = x[i]
        lo = np.minimum(lo, v); hi = np.maximum(hi, v)
        up = (v - lo >= thr) & (d <= 0)
        dn = (hi - v >= thr) & (d >= 0)
        if dark_ok is not None:
            up &= lo < dark_ok
            dn &= v < dark_ok
        ev[i][up] = 1; ev[i][dn] = -1
        d[up] = 1; d[dn] = -1
        hi[up] = v[up]; lo[dn] = v[dn]
        lo[up] = v[up]; hi[dn] = v[dn]
    return ev


def worst(ev):
    """Most flashes in any one second over a quarter of any third-by-third region; and where."""
    win = int(round(fps))
    a = np.abs(ev).astype(np.int32)
    c = np.cumsum(a, 0)
    best, when = 0.0, 0
    rh, rw = GH // 3, GW // 3
    for i in range(0, n):
        j = min(n - 1, i + win - 1)
        cnt = (c[j] - (c[i - 1] if i > 0 else 0)) / 2.0               # swings -> flashes
        for y in range(0, GH - rh + 1, max(1, rh // 2)):
            for x_ in range(0, GW - rw + 1, max(1, rw // 2)):
                reg = np.sort(cnt[y:y + rh, x_:x_ + rw].ravel())
                q = reg[int(len(reg) * 0.75)]                          # the level a quarter of the region reaches
                if q > best:
                    best, when = float(q), i
    return best, when


ev = swings(L, 0.10, 0.80)
flashes, at = worst(ev)
evr = swings(redness, 20.0)
rflashes, rat = worst(evr)
mean = L.mean((1, 2))
jump = np.abs(np.diff(mean))
gi = int(jump.argmax())
gev = swings(mean.reshape(-1, 1, 1), 0.10, 0.80)
win = int(round(fps))
gc = np.cumsum(np.abs(gev[:, 0, 0]).astype(int))
gworst = max((gc[min(n - 1, i + win - 1)] - (gc[i - 1] if i else 0)) / 2.0 for i in range(n))
red_area = float((redness > 20).mean(axis=(1, 2)).max())
ok = flashes <= 3 and rflashes <= 3 and gworst <= 3
print(f"video: {n} frames at {fps:.0f} a second ({n / fps:.2f} s), {st['width']}x{st['height']}")
print(f"general flashes: at most {flashes:.1f} in any one second (limit 3), worst at {at / fps:.2f} s")
print(f"red flashes:     at most {rflashes:.1f} in any one second (limit 3), worst at {rat / fps:.2f} s; saturated red never covers more than {red_area * 100:.1f}% of the picture")
print(f"whole picture:   largest brightness jump between two frames {jump.max():.3f} (of 1.0) at {gi / fps:.2f} s; at most {gworst:.1f} full-screen flashes a second (limit 3)")
print("RESULT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
