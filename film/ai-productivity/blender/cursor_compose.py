"""Step 2 of the cursor sprite (see cursor_sprite.py): compose the passes in
renders/style/cursor/ into video/public/cursor.png, cursor@2x.png and
cursor.json. Plain python3 (Pillow + numpy), no Blender.

    python3 film/ai-productivity/blender/cursor_compose.py

cursor.json: {"tipX", "tipY", "width", "height"} in film pixels at 1080p (the
sprite is drawn 1:1 at 1080p, 2:1 from cursor@2x.png at 4K): place the sprite's
top-left corner at (x - tipX, y - tipY) to put the pointer's tip on (x, y).
"""

import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
SRC = os.path.join(FILM, "renders", "style", "cursor")
PUB = os.path.join(FILM, "video", "public")


def load(name, scale):
    return np.asarray(Image.open(os.path.join(SRC, f"{name}@{scale}x.png")).convert("RGBA")).astype(np.float64) / 255.0


def compose(scale, tip):
    A = load("A_cursor_on_ground", scale)[..., :3]
    B = load("B_cursor_alone", scale)
    C = load("C_ground", scale)[..., :3]
    lum = lambda x: x @ np.array([0.2126, 0.7152, 0.0722])  # noqa: E731
    shadow = np.clip(1.0 - lum(A) / np.maximum(lum(C), 1e-4), 0.0, 1.0)
    shadow[shadow < 0.012] = 0.0   # 8-bit noise between the passes
    ac = B[..., 3]
    # the shadow only where the cursor is not (its pixels come from B)
    sa = shadow * (1.0 - ac)
    alpha = ac + sa
    rgb = np.where(alpha[..., None] > 0, (B[..., :3] * ac[..., None]) / np.maximum(alpha[..., None], 1e-6), 0.0)
    out = np.dstack([rgb, alpha])
    # crop to the drawn pixels plus a small margin
    ys, xs = np.nonzero(alpha > 0.012)
    m = 2 * scale
    y0, y1 = max(ys.min() - m, 0), min(ys.max() + m + 1, alpha.shape[0])
    x0, x1 = max(xs.min() - m, 0), min(xs.max() + m + 1, alpha.shape[1])
    out = out[y0:y1, x0:x1]
    img = Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA")
    return img, (tip[0] - x0, tip[1] - y0)


def main():
    info = json.load(open(os.path.join(SRC, "tip.json")))
    os.makedirs(PUB, exist_ok=True)
    img1, t1 = compose(1, info["1x"]["tip"])
    img2, t2 = compose(2, info["2x"]["tip"])
    img1.save(os.path.join(PUB, "cursor.png"))
    img2.save(os.path.join(PUB, "cursor@2x.png"))
    meta = {
        "tipX": round(t1[0], 1), "tipY": round(t1[1], 1),
        "width": img1.width, "height": img1.height,
        "at2x": {"file": "cursor@2x.png", "tipX": round(t2[0], 1), "tipY": round(t2[1], 1),
                 "width": img2.width, "height": img2.height},
        "note": "Drawn 1:1 at 1080p. Top-left = (x - tipX, y - tipY) puts the pointer's tip on (x, y). "
                "Soft contact shadow baked in (cursor floating at z 0.22, as in the approved scene 5 still). "
                "Rendered from kit.cursor() by blender/cursor_sprite.py + cursor_compose.py.",
    }
    with open(os.path.join(PUB, "cursor.json"), "w") as fh:
        json.dump(meta, fh, indent=2)
        fh.write("\n")
    print(json.dumps(meta))


main()
