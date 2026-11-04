"""Key legends for the laptop film: a white-on-transparent texture covering
the keyboard rectangle, one legend per key, US QWERTY.

Called by laptop_film.py (needs Pillow, so it runs in the system Python):
  python3 keyboard_legends.py keys.json out.png
keys.json: {"rect": [x0, y0, x1, y1] metres, "keys": [[cx, cy, w, h], ...]}
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

PX_PER_M = 14000  # 14 px per mm
FONT = "/System/Library/Fonts/HelveticaNeue.ttc"

FN = ["esc"] + ["F%d" % i for i in range(1, 13)] + [""]
NUM = [("~", "`"), ("!", "1"), ("@", "2"), ("#", "3"), ("$", "4"), ("%", "5"), ("^", "6"),
       ("&", "7"), ("*", "8"), ("(", "9"), (")", "0"), ("_", "-"), ("+", "="), "delete"]
TOP = ["tab"] + list("QWERTYUIOP") + [("{", "["), ("}", "]"), ("|", "\\")]
HOME = ["caps lock"] + list("ASDFGHJKL") + [(":", ";"), ('"', "'"), "return"]
LOW = ["shift"] + list("ZXCVBNM") + [("<", ","), (">", "."), ("?", "/"), "shift"]
BOT = ["fn", "control", "option", "cmd", "", "cmd", "option", "<L", "<U", "<D", "<R"]
LEGENDS = FN + NUM + TOP + HOME + LOW + BOT
# words sit low and to the side, like a laptop's modifier keys
LEFT_WORDS = {"tab", "caps lock", "shift", "fn", "control", "option", "cmd", "esc"}
RIGHT_WORDS = {"delete", "return"}


def font(px):
    return ImageFont.truetype(FONT, int(px), index=0)


def main():
    spec = json.load(open(sys.argv[1]))
    x0, y0, x1, y1 = spec["rect"]
    W, H = int((x1 - x0) * PX_PER_M), int((y1 - y0) * PX_PER_M)
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    keys = spec["keys"]
    assert len(keys) == len(LEGENDS), (len(keys), len(LEGENDS))
    right_shift_seen = 0
    for (cx, cy, kw, kh), lab in zip(keys, LEGENDS):
        # key rectangle in pixels (image y grows downwards, keyboard y grows backwards)
        L = (cx - kw / 2 - x0) * PX_PER_M
        R = (cx + kw / 2 - x0) * PX_PER_M
        T = (y1 - (cy + kh / 2)) * PX_PER_M
        B = (y1 - (cy - kh / 2)) * PX_PER_M
        kpx_h = B - T
        mx = kpx_h * 0.16
        fill = (255, 255, 255, 255)
        if lab == "":
            continue
        if isinstance(lab, tuple):
            f = font(kpx_h * 0.27)
            d.text(((L + R) / 2, T + kpx_h * 0.32), lab[0], font=f, fill=fill, anchor="mm")
            d.text(((L + R) / 2, T + kpx_h * 0.70), lab[1], font=f, fill=fill, anchor="mm")
        elif lab.startswith("<"):
            # arrow keys: small solid triangles
            s = kpx_h * 0.22
            ccx, ccy = (L + R) / 2, (T + B) / 2
            pts = {"<L": [(ccx - s, ccy), (ccx + s * 0.7, ccy - s * 0.8), (ccx + s * 0.7, ccy + s * 0.8)],
                   "<R": [(ccx + s, ccy), (ccx - s * 0.7, ccy - s * 0.8), (ccx - s * 0.7, ccy + s * 0.8)],
                   "<U": [(ccx, ccy - s), (ccx - s * 0.8, ccy + s * 0.7), (ccx + s * 0.8, ccy + s * 0.7)],
                   "<D": [(ccx, ccy + s), (ccx - s * 0.8, ccy - s * 0.7), (ccx + s * 0.8, ccy - s * 0.7)]}[lab]
            d.polygon(pts, fill=fill)
        elif len(lab) == 1:
            d.text(((L + R) / 2, (T + B) / 2), lab, font=font(kpx_h * 0.34), fill=fill, anchor="mm")
        elif lab.startswith("F") and lab[1:].isdigit():
            d.text(((L + R) / 2, (T + B) / 2), lab, font=font(kpx_h * 0.30), fill=fill, anchor="mm")
        else:
            f = font(kpx_h * 0.23)
            if lab in RIGHT_WORDS or (lab == "shift" and right_shift_seen):
                d.text((R - mx, B - mx), lab, font=f, fill=fill, anchor="rd")
            else:
                d.text((L + mx, B - mx), lab, font=f, fill=fill, anchor="ld")
            if lab == "shift":
                right_shift_seen += 1
    img.save(sys.argv[2])
    print("legends", W, H, sys.argv[2])


if __name__ == "__main__":
    main()
