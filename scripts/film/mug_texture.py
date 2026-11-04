"""Glaze detail for the stoneware mug in the laptop film, in cylindrical
coordinates (u = angle around the mug, v = height): the "Kingdom Sites"
print, iron speckle, one faint dried drip below the rim, and a roughness map
with faint hand smudges.

Called by laptop_film.py (needs Pillow, so it runs in the system Python):
  python3 mug_texture.py decal.png rough.png U_LOGO U_HANDLE FONT

decal.png: RGBA, colour and coverage laid over the glaze (outer wall only).
rough.png: L, 128 = the glaze's own roughness, darker = glossier.
U_LOGO:    u at the centre of the print (the side the last frame sees).
U_HANDLE:  u at the handle.
FONT:      Archivo variable font (the website's typeface), set SemiBold,
           width 72.
"""
import math
import random
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

H_M = 0.095                    # mug height (v = z / H_M)
R_M = 0.0424                   # radius at the print
W, H = 4096, 1480              # px around x px up
PX_U = W / (2 * math.pi * R_M)  # px per metre around the mug
PX_V = H / H_M                 # px per metre up
LOGO_W = H_M / 3               # the print: a third of the mug's height wide
LOGO_Z = 0.051                 # centre height of the print
INK = (40, 40, 43)

rng = random.Random(5)


def X(u):
    return (u % 1.0) * W


def Y(z):
    return (1.0 - z / H_M) * H


def wrap_paste(dst, src, x, y, mask=None):
    """Paste with horizontal wrap-around (u is periodic)."""
    for dx in (-W, 0, W):
        dst.paste(src, (int(x + dx), int(y)), mask)


def logo(decal, u, font_path):
    f = ImageFont.truetype(font_path, 400)
    try:
        f.set_variation_by_axes([600, 72])     # SemiBold, condensed
    except Exception:
        pass
    lines = ["Kingdom", "Sites"]
    widths = [f.getlength(s) for s in lines]
    asc, desc = f.getmetrics()
    lead = int(asc * 1.04)
    pad = 40
    im = Image.new("L", (int(max(widths)) + 2 * pad, lead * 2 + desc + 2 * pad), 0)
    d = ImageDraw.Draw(im)
    for i, s in enumerate(lines):
        d.text((pad + (max(widths) - widths[i]) / 2, pad + i * lead), s, font=f, fill=255)
    im = im.crop(im.getbbox())
    # scale so "Kingdom" spans LOGO_W around the mug
    sx = LOGO_W * PX_U / im.width
    sy = sx * PX_V / PX_U
    im = im.resize((max(1, int(im.width * sx)), max(1, int(im.height * sy))), Image.LANCZOS)
    # slight wear: ink thins a little here and there, a few pinholes
    wear = Image.effect_noise(im.size, 70).filter(ImageFilter.GaussianBlur(1.2))
    wear = wear.point(lambda v: 255 if v > 92 else int(200 + v * 0.6))
    im = ImageChops.multiply(im, wear)
    dd = ImageDraw.Draw(im)
    for _ in range(14):
        x, y = rng.uniform(0, im.width), rng.uniform(0, im.height)
        r = rng.uniform(0.6, 1.6)
        dd.ellipse((x - r, y - r, x + r, y + r), fill=int(rng.uniform(40, 140)))
    im = im.point(lambda v: int(v * 0.94))
    ink = Image.new("RGBA", im.size, INK + (0,))
    ink.putalpha(im)
    x = X(u) - im.width / 2
    y = Y(LOGO_Z) - im.height / 2
    for dx in (-W, 0, W):
        decal.alpha_composite(ink, (int(x + dx), int(y)))


def speckle(decal):
    d = ImageDraw.Draw(decal)
    n = 900
    for _ in range(n):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        r = abs(rng.gauss(0, 1.3)) + 0.8
        a = int(rng.uniform(60, 170))
        c = rng.choice([(78, 58, 44), (60, 48, 40), (96, 74, 52)])
        d.ellipse((x - r, y - r, x + r * rng.uniform(0.8, 1.3), y + r), fill=c + (a,))


def drip(decal, rough, u):
    """One faint dried coffee drip from the rim, about 13 mm long."""
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    x0 = X(u)
    top, bot = Y(H_M), Y(H_M - 0.013)
    wid = 0.0016 * PX_U
    steps = 60
    for i in range(steps + 1):
        t = i / steps
        y = top + (bot - top) * t
        x = x0 + 3.0 * math.sin(t * 2.6)
        w = wid * (0.55 + 0.45 * t)
        d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=int(60 + 50 * t))
    d.ellipse((x0 + 3.0 * math.sin(2.6) - wid * 0.7, bot - wid * 0.6, x0 + 3.0 * math.sin(2.6) + wid * 0.7,
               bot + wid * 0.8), fill=120)
    layer = layer.filter(ImageFilter.GaussianBlur(2.5))
    stain = Image.new("RGBA", (W, H), (120, 84, 52, 0))
    stain.putalpha(layer.point(lambda v: int(v * 0.30)))
    decal.alpha_composite(stain)
    rough.paste(ImageChops.subtract(rough, layer.point(lambda v: v // 6)))


def smudges(rough, u_handle):
    """Soft, slightly glossier patches where fingers and a thumb hold it."""
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    spots = [(u_handle + 0.09, 0.060, 0.010, 0.012), (u_handle + 0.12, 0.040, 0.008, 0.011),
             (u_handle - 0.10, 0.062, 0.010, 0.012), (u_handle - 0.13, 0.042, 0.007, 0.010),
             (u_handle + 0.30, 0.082, 0.011, 0.008)]
    for (u, z, rx, rz) in spots:
        x, y = X(u), Y(z)
        ax, ay = rx * PX_U, rz * PX_V
        for dx in (-W, 0, W):
            d.ellipse((x + dx - ax, y - ay, x + dx + ax, y + ay), fill=int(rng.uniform(26, 40)))
    layer = layer.filter(ImageFilter.GaussianBlur(28))
    grain = Image.effect_noise((W, H), 30).filter(ImageFilter.GaussianBlur(3))
    layer = ImageChops.multiply(layer, grain.point(lambda v: min(255, 120 + v)))
    rough.paste(ImageChops.subtract(rough, layer))


def main():
    out, rough_out, u_logo, u_handle, font = sys.argv[1:6]
    u_logo, u_handle = float(u_logo), float(u_handle)
    decal = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rough = Image.new("L", (W, H), 128)
    speckle(decal)
    logo(decal, u_logo, font)
    drip(decal, rough, u_logo + 0.115)
    smudges(rough, u_handle)
    decal.save(out, optimize=True)
    rough.save(rough_out, optimize=True)


if __name__ == "__main__":
    main()
