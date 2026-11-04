"""Whiteboard texture for the laptop film: a used, white glossy board with a
software person's marker work on it: a wireframe of an app screen (sidebar
plus cards), a small flow diagram, a short hand-lettered list and a few
sticky notes. Mostly black and blue marker, a little red.

Called by laptop_film.py (needs Pillow, so it runs in the system Python):
  python3 whiteboard_texture.py desktop|phone out.png mask.png

The board is 1.20 m x 0.80 m and the texture 4800 x 3200 px (4 px per mm).
The two cameras see different parts of it: the desktop camera only the
bottom quarter (the band above the laptop), the portrait phone camera the
whole board, so each has its own layout. Coordinates below are metres from
the board's bottom-left corner.

mask.png marks what is not bare board (sticky paper = white, ink = grey),
so the shader can make those parts matte while the board stays glossy.
"""
import math
import random
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

BW, BH = 1.20, 0.80
OUT_W, OUT_H = 4800, 3200
SS = 2                                   # supersampling while drawing
S = OUT_W * SS / BW                      # px per metre while drawing

BOARD = (243, 244, 242)
INK = {"black": (30, 32, 38), "blue": (28, 70, 160), "red": (182, 40, 38)}
STICKY = {"yellow": (232, 216, 140), "pink": (226, 182, 172), "sage": (186, 208, 190)}
HAND = ("/System/Library/Fonts/Noteworthy.ttc", 1)      # Noteworthy Bold
HAND_THIN = ("/System/Library/Fonts/MarkerFelt.ttc", 0)  # Marker Felt Thin

rng = random.Random(11)


def P(x, y):
    return (x * S, (BH - y) * S)


class Board:
    def __init__(self):
        self.size = (int(BW * S), int(BH * S))
        self.ink = {k: Image.new("L", self.size, 0) for k in INK}
        self.paper = Image.new("RGB", self.size, BOARD)
        self.shadow = Image.new("L", self.size, 0)
        self.paper_mask = Image.new("L", self.size, 0)
        self.d = {k: ImageDraw.Draw(v) for k, v in self.ink.items()}

    # ------------------------------------------------------------ strokes
    def stroke(self, pts, col, w, wobble=0.0006, step=0.004):
        """A hand-drawn marker stroke through points given in metres."""
        dense = []
        for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
            n = max(2, int(math.hypot(x1 - x0, y1 - y0) / step))
            ph = rng.uniform(0, 6.28)
            fr = rng.uniform(0.6, 1.4)
            nx, ny = -(y1 - y0), (x1 - x0)
            ln = math.hypot(nx, ny) or 1.0
            nx, ny = nx / ln, ny / ln
            for i in range(n):
                t = i / n
                off = wobble * math.sin(ph + t * 6.28 * fr) * math.sin(t * math.pi)
                dense.append((x0 + (x1 - x0) * t + nx * off, y0 + (y1 - y0) * t + ny * off))
        dense.append(pts[-1])
        px = [P(*p) for p in dense]
        wp = max(1, int(w * S))
        self.d[col].line(px, fill=255, width=wp, joint="curve")
        r = wp / 2
        for (x, y) in (px[0], px[-1]):
            self.d[col].ellipse((x - r, y - r, x + r, y + r), fill=255)

    def line(self, a, b, col, w, wobble=0.0006):
        self.stroke([a, b], col, w, wobble)

    def box(self, x0, y0, x1, y1, col, w, over=0.004):
        j = lambda: rng.uniform(-0.0015, 0.0015)
        o = lambda: rng.uniform(0.0, over)
        self.line((x0 - o(), y1 + j()), (x1 + o(), y1 + j()), col, w)
        self.line((x1 + j(), y1 + o()), (x1 + j(), y0 - o()), col, w)
        self.line((x1 + o(), y0 + j()), (x0 - o(), y0 + j()), col, w)
        self.line((x0 + j(), y0 - o()), (x0 + j(), y1 + o()), col, w)

    def arrow(self, a, b, col, w, head=None, bend=0.0):
        head = head or w * 4.5
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        nx, ny = -(b[1] - a[1]), (b[0] - a[0])
        ln = math.hypot(nx, ny) or 1.0
        c = (mx + nx / ln * bend, my + ny / ln * bend)
        pts = []
        for i in range(17):
            t = i / 16
            pts.append(((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
                        (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]))
        self.stroke(pts, col, w, wobble=0.0003)
        ang = math.atan2(b[1] - pts[-3][1], b[0] - pts[-3][0])
        for s in (-1, 1):
            a2 = ang + math.pi + s * 0.5
            self.line(b, (b[0] + head * math.cos(a2), b[1] + head * math.sin(a2)), col, w, 0.0002)

    def squiggle(self, x0, y, length, col, w, amp=None):
        """Handwriting-like wave standing in for a line of small text."""
        amp = amp if amp is not None else w * 1.4
        pts = []
        n = max(4, int(length / (w * 2.2)))
        ph = rng.uniform(0, 6.28)
        for i in range(n + 1):
            x = x0 + length * i / n
            pts.append((x, y + amp * math.sin(ph + i * rng.uniform(1.6, 2.4)) * rng.uniform(0.5, 1.0)))
        self.stroke(pts, col, w * 0.8, wobble=0.0)

    def circle(self, cx, cy, rx, ry, col, w, turns=1.08):
        pts = []
        a0 = rng.uniform(0, 6.28)
        n = 48
        for i in range(int(n * turns) + 1):
            a = a0 + 6.2832 * i / n
            k = 1.0 + 0.04 * math.sin(a * 3 + a0)
            pts.append((cx + rx * k * math.cos(a), cy + ry * k * math.sin(a)))
        self.stroke(pts, col, w, wobble=0.0)

    def measure(self, s, cap, font=HAND):
        f = ImageFont.truetype(font[0], int(cap * S / 0.70), index=font[1])
        return f.getlength(s) / S

    def text(self, x, y, s, cap, col, font=HAND, angle=None):
        """Hand lettering, left end of the baseline at (x, y), cap height in metres."""
        px = int(cap * S / 0.70)
        f = ImageFont.truetype(font[0], px, index=font[1])
        l, t, r, b = f.getbbox(s)
        pad = px // 2
        im = Image.new("L", (r - l + 2 * pad, b - t + 2 * pad), 0)
        ImageDraw.Draw(im).text((pad - l, pad - t), s, font=f, fill=255)
        angle = rng.uniform(-1.8, 1.8) if angle is None else angle
        im = im.rotate(angle, resample=Image.BICUBIC, expand=True)
        asc = f.getmetrics()[0]
        bx, by = P(x, y)
        ox, oy = int(bx - pad), int(by - (asc - t) - pad)
        layer = self.ink[col]
        region = layer.crop((ox, oy, ox + im.width, oy + im.height))
        layer.paste(ImageChops.lighter(region, im), (ox, oy))
        return f.getlength(s) / S

    # ---------------------------------------------------------- stickies
    def sticky(self, x, y, size, colour, angle):
        """Square sticky note, bottom-left corner near (x, y)."""
        n = int(size * S)
        note = Image.new("L", (n, n), 255)
        note = note.rotate(angle, resample=Image.BICUBIC, expand=True)
        cx, cy = P(x + size / 2, y + size / 2)
        ox, oy = int(cx - note.width / 2), int(cy - note.height / 2)
        sh = note.filter(ImageFilter.GaussianBlur(n * 0.035))
        sh = sh.point(lambda v: int(v * 0.30))
        sd = int(n * 0.025)
        reg = self.shadow.crop((ox + sd, oy + sd * 2, ox + sd + sh.width, oy + sd * 2 + sh.height))
        self.shadow.paste(ImageChops.lighter(reg, sh), (ox + sd, oy + sd * 2))
        # paper: a touch darker towards the free (bottom) edge, which lifts
        grad = Image.linear_gradient("L").resize((note.width, note.height))
        base = Image.new("RGB", note.size, STICKY[colour])
        dark = Image.new("RGB", note.size, tuple(int(c * 0.93) for c in STICKY[colour]))
        paper = Image.composite(dark, base, grad.point(lambda v: int(max(0, v - 150) * 1.5)))
        self.paper.paste(paper, (ox, oy), note)
        self.paper_mask.paste(255, (ox, oy), note)
        # remove any ink already under the note
        for layer in self.ink.values():
            layer.paste(0, (ox, oy), note)

    # ----------------------------------------------------------- compose
    def save(self, path, mask_path):
        shadow = self.shadow.resize((OUT_W, OUT_H), Image.LANCZOS)
        paper = self.paper.resize((OUT_W, OUT_H), Image.LANCZOS)
        pmask = self.paper_mask.resize((OUT_W, OUT_H), Image.LANCZOS)
        # faint ghosts of earlier, erased work and a little uneven sheen
        ghost = Image.effect_noise((OUT_W // 64, OUT_H // 64), 60).resize((OUT_W, OUT_H), Image.BICUBIC)
        ghost = ghost.point(lambda v: max(0, v - 150) // 10)
        base = Image.new("RGB", (OUT_W, OUT_H), BOARD)
        board = Image.composite(Image.new("RGB", base.size, (150, 152, 158)), base, ghost)
        board = Image.composite(paper, board, pmask)
        board = Image.composite(Image.new("RGB", base.size, (80, 76, 70)), board, shadow)
        # marker streaks: ink coverage varies a little along the strokes
        streak = Image.effect_noise((OUT_W // 6, OUT_H // 6), 40).resize((OUT_W, OUT_H), Image.BICUBIC)
        streak = streak.point(lambda v: 210 + min(45, max(0, v - 100) // 2))
        ink_all = Image.new("L", (OUT_W, OUT_H), 0)
        for k in ("blue", "black", "red"):
            m = self.ink[k].resize((OUT_W, OUT_H), Image.LANCZOS)
            m = ImageChops.multiply(m, streak)
            board = Image.composite(Image.new("RGB", base.size, INK[k]), board, m)
            ink_all = ImageChops.lighter(ink_all, m)
        board.save(path, optimize=True)
        mask = ImageChops.lighter(pmask, ink_all.point(lambda v: v // 2))
        mask.save(mask_path, optimize=True)


# ----------------------------------------------------------------- pieces
def wireframe(B, x0, y0, x1, y1, w):
    """An app screen: window, top bar, sidebar with nav items, stat cards,
    one big card with an image and a column of small cards."""
    W, H = x1 - x0, y1 - y0
    B.box(x0, y0, x1, y1, "black", w * 1.15)
    bar = y1 - H * 0.12
    B.line((x0 + 0.002, bar), (x1 - 0.002, bar), "black", w)
    for i in range(3):
        cx = x0 + W * (0.03 + 0.03 * i)
        B.circle(cx, (y1 + bar) / 2, W * 0.008, W * 0.008, "black", w * 0.7)
    side = x0 + W * 0.22
    B.line((side, bar), (side, y0 + 0.002), "black", w)
    # nav: a filled pill for the current item, then short words
    ny = bar - H * 0.10
    B.stroke([(x0 + W * 0.03, ny), (side - W * 0.03, ny)], "blue", w * 3.2, wobble=0.0)
    for i in range(1, 6):
        yy = ny - i * H * 0.10
        B.circle(x0 + W * 0.045, yy, W * 0.007, W * 0.007, "black", w * 0.6)
        B.squiggle(x0 + W * 0.07, yy, W * rng.uniform(0.07, 0.11), "black", w * 0.75)
    # stat cards
    mx0, mx1 = side + W * 0.04, x1 - W * 0.04
    cw = (mx1 - mx0 - W * 0.04) / 3
    sy1 = bar - H * 0.07
    sy0 = sy1 - H * 0.15
    for i in range(3):
        cx0 = mx0 + i * (cw + W * 0.02)
        B.box(cx0, sy0, cx0 + cw, sy1, "black", w * 0.85, over=0.002)
        B.squiggle(cx0 + cw * 0.12, sy1 - (sy1 - sy0) * 0.38, cw * 0.38, "blue", w * 1.1, amp=w * 2.2)
        B.squiggle(cx0 + cw * 0.12, sy0 + (sy1 - sy0) * 0.25, cw * 0.55, "black", w * 0.6)
    # big card with an image placeholder
    by1 = sy0 - H * 0.08
    by0 = y0 + H * 0.07
    bx1 = mx0 + (mx1 - mx0) * 0.62
    B.box(mx0, by0, bx1, by1, "black", w * 0.9, over=0.002)
    iy0 = by0 + (by1 - by0) * 0.38
    B.box(mx0 + W * 0.015, iy0, bx1 - W * 0.015, by1 - H * 0.025, "black", w * 0.7, over=0.0)
    B.line((mx0 + W * 0.015, iy0), (bx1 - W * 0.015, by1 - H * 0.025), "black", w * 0.6)
    B.line((mx0 + W * 0.015, by1 - H * 0.025), (bx1 - W * 0.015, iy0), "black", w * 0.6)
    B.squiggle(mx0 + W * 0.02, by0 + (iy0 - by0) * 0.62, (bx1 - mx0) * 0.45, "blue", w * 0.9)
    B.squiggle(mx0 + W * 0.02, by0 + (iy0 - by0) * 0.28, (bx1 - mx0) * 0.65, "black", w * 0.6)
    # small cards
    sx0 = bx1 + W * 0.03
    ch = (by1 - by0 - H * 0.04) / 3
    for i in range(3):
        cy1 = by1 - i * (ch + H * 0.02)
        B.box(sx0, cy1 - ch, mx1, cy1, "black", w * 0.8, over=0.0015)
        B.squiggle(sx0 + W * 0.012, cy1 - ch * 0.35, (mx1 - sx0) * 0.6, "blue", w * 0.7)
        B.squiggle(sx0 + W * 0.012, cy1 - ch * 0.70, (mx1 - sx0) * 0.45, "black", w * 0.55)
    return (sx0, by0, mx1, by1)


def flow(B, x0, y0, bw, bh, gap, w, cap, labels):
    """Three boxes left to right, a decision below the last, a red loop back."""
    boxes = []
    for i, lab in enumerate(labels[:3]):
        bx = x0 + i * (bw + gap)
        B.box(bx, y0, bx + bw, y0 + bh, "black", w)
        c = min(cap, cap * bw * 0.74 / B.measure(lab, cap))
        tw = B.measure(lab, c)
        B.text(bx + (bw - tw) / 2, y0 + (bh - c) / 2, lab, c, "blue")
        boxes.append((bx, y0, bx + bw, y0 + bh))
    for a, b in zip(boxes[:-1], boxes[1:]):
        B.arrow((a[2] + gap * 0.15, y0 + bh / 2), (b[0] - gap * 0.12, y0 + bh / 2 + rng.uniform(-0.002, 0.002)),
                "black", w, head=min(w * 4.5, gap * 0.38))
    # decision diamond under the last box
    lx = (boxes[-1][0] + boxes[-1][2]) / 2
    dy = y0 - bh * 1.25
    dw, dh = bw * 0.42, bh * 0.62
    B.stroke([(lx, dy + dh), (lx + dw, dy), (lx, dy - dh), (lx - dw, dy), (lx, dy + dh + 0.002)], "black", w)
    B.text(lx - dw * 0.35, dy - dh * 0.25, "?", cap * 1.1, "blue", angle=0)
    B.arrow((lx, y0 - gap * 0.1), (lx, dy + dh + gap * 0.12), "black", w)
    # red: back to the start
    fx = (boxes[0][0] + boxes[0][2]) / 2
    B.stroke([(lx - dw - gap * 0.1, dy), (fx + bw * 0.1, dy - dh * 0.15), (fx, y0 - gap * 0.35)], "red", w)
    B.arrow((fx + 0.002, y0 - gap * 0.3), (fx, y0 - gap * 0.05), "red", w, head=w * 4)


def todo(B, x, y, step, cap, w, words, heading=None):
    if heading:
        tw = B.text(x, y, heading, cap * 1.1, "black", angle=0.6)
        B.line((x - 0.003, y - cap * 0.45), (x + tw + 0.004, y - cap * 0.40), "black", w * 0.9)
        y -= step * 1.15
    for i, wd in enumerate(words):
        yy = y - i * step
        bs = cap * 0.95
        B.box(x, yy - bs * 0.05, x + bs, yy + bs * 0.95, "black", w * 0.8, over=0.001)
        if i < 2:   # done: blue ticks
            B.stroke([(x + bs * 0.15, yy + bs * 0.45), (x + bs * 0.45, yy + bs * 0.12),
                      (x + bs * 1.15, yy + bs * 1.25)], "blue", w * 1.1, wobble=0.0)
        tw = B.text(x + bs * 1.6, yy, wd, cap, "black" if i < len(words) - 1 else "red")
        if i == len(words) - 1:
            B.circle(x + bs * 1.6 + tw / 2, yy + cap * 0.45, tw * 0.62, cap * 0.95, "red", w * 0.9)


def note(B, x, y, size, colour, angle, lines, cap, w):
    B.sticky(x, y, size, colour, angle)
    for i, s in enumerate(lines):
        if s == "~":
            B.squiggle(x + size * 0.14, y + size * (0.62 - 0.22 * i), size * 0.62, "black", w * 0.75)
        else:
            B.text(x + size * 0.13, y + size * (0.60 - 0.24 * i), s, cap, "black", font=HAND_THIN,
                   angle=angle * 0.9)


# ---------------------------------------------------------------- layouts
def layout_desktop(B):
    # the camera sees only y < ~0.19 m; the lid hides the middle below ~0.05 m
    w, cap = 0.0042, 0.021
    wireframe(B, 0.035, 0.022, 0.290, 0.182, w)
    note(B, 0.305, 0.098, 0.074, "yellow", 4.0, ["icons", "~"], cap * 0.9, w)
    todo(B, 0.415, 0.160, 0.031, cap, w, ["Classes", "Lessons", "Students", "Launch"])
    flow(B, 0.640, 0.125, 0.092, 0.050, 0.036, w, cap * 0.95, ["Sign up", "Class", "Lesson"])
    note(B, 1.010, 0.108, 0.074, "pink", -5.0, ["copy", "~"], cap * 0.9, w)
    note(B, 1.095, 0.036, 0.074, "sage", 3.0, ["test", "~"], cap * 0.9, w)
    B.arrow((0.268, 0.150), (0.300, 0.172), "red", w * 0.9, bend=0.006)


def layout_phone(B):
    # the portrait camera sees the whole board; the lid hides y < ~0.10 m
    # drawn bolder than the desktop board: the phone sees it at half the size
    w, cap = 0.0082, 0.042
    wireframe(B, 0.055, 0.330, 0.560, 0.740, w)
    flow(B, 0.630, 0.640, 0.140, 0.080, 0.050, w, cap * 0.9, ["Sign up", "Class", "Lesson"])
    todo(B, 0.640, 0.350, 0.060, cap, w, ["Classes", "Lessons", "Students", "Launch"], heading="This week")
    note(B, 0.990, 0.300, 0.100, "yellow", -4.0, ["icons", "~"], cap * 0.75, w)
    note(B, 1.065, 0.150, 0.100, "pink", 5.0, ["copy", "~"], cap * 0.75, w)
    note(B, 0.075, 0.130, 0.100, "sage", -3.0, ["test", "~"], cap * 0.75, w)
    # a small bar chart under the wireframe
    bx, by = 0.250, 0.140
    B.line((bx, by), (bx + 0.22, by), "black", w)
    B.line((bx, by), (bx, by + 0.15), "black", w)
    for i, hgt in enumerate((0.05, 0.08, 0.065, 0.11, 0.13)):
        x = bx + 0.025 + i * 0.04
        B.box(x, by + 0.004, x + 0.022, by + hgt, "blue", w * 0.85, over=0.0)
    B.arrow((bx + 0.02, by + 0.06), (bx + 0.20, by + 0.155), "red", w, bend=0.01)
    B.circle(0.242, 0.630, 0.068, 0.040, "red", w * 0.9)


def main():
    which, out, mask = sys.argv[1], sys.argv[2], sys.argv[3]
    B = Board()
    {"desktop": layout_desktop, "phone": layout_phone}[which](B)
    B.save(out, mask)


if __name__ == "__main__":
    main()
