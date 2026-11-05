"""Preview renders for the look review: the component sheet, a style frame of
scene 5 (paper forms become clean records) and a short animation test.

  blender -b -P film/ai-productivity/blender/preview.py -- --palette sky --what sheet --out DIR
  blender -b -P film/ai-productivity/blender/preview.py -- --palette sky --what style --out DIR
  blender -b -P film/ai-productivity/blender/preview.py -- --palette sky --what anim  --out DIR
"""

import argparse
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import kit  # noqa: E402
from kit import (avatar, bars, bubble, button, card, chip, cloud, cursor, drawer, folder,  # noqa: E402
                 move, paper, phone, photo, pop, stack, sticky, table, token, dotted, packet, bez)


def sheet():
    stack("stack", (-6.0, 2.6), 0, seed=1)
    sticky("sticky", (-3.9, 2.9), -6)
    folder("folder", (-1.2, 2.55))
    card("card", (2.5, 2.7), w=3.4, icon_name="book-open-text", label="Handbook")
    avatar("av1", "MR", "a1", (5.5, 3.0))
    avatar("av2", "JL", "a2", (6.6, 2.4))
    phone("phone", (-6.2, -0.75), 0)
    cloud("cloud", (-3.0, 0.0), size=0.75)
    bubble("bubble", (0.1, 0.1), w=2.4)
    bars("chart", (3.3, -0.4), w=2.8, h=2.2)
    token("agent", (6.4, -0.3))
    drawer("drawer", "Admissions", "a1", (-3.4, -3.0), w=2.4)
    button("button", "Book a call", "a1", (-0.4, -3.0), w=2.4)
    for i, (ic, c) in enumerate((("envelope-simple", "a1"), ("chat-circle-dots", "a2"),
                                 ("robot", "a3"), ("lightbulb", "a2"))):
        chip(f"chip{i}", ic, c, "tint", 0.8, loc=(2.0 + i * 1.05, -3.0, 0))
    cursor("cursor", (6.7, -3.2))


def keys(ob, path, frames_vals, index=-1):
    for f, v in frames_vals:
        if path == "scale":
            ob.scale = (v, v, v)
        elif path == "location":
            ob.location = v
        else:
            setattr(ob, path, v)
        ob.keyframe_insert(path, frame=f)


def style_scene(animate=False):
    s1 = stack("stackA", (-6.4, 1.9), 4, n=4, seed=3)
    st = sticky("sticky", (-7.0, -2.9), -9)
    form = paper("form", (-4.2, -1.0, 0.0), -4, color="paper", ink="skel")
    ph = phone("phone", (-4.05, -0.75, 0.8), 6)
    cl = cloud("cloud", (0.1, 1.55))
    tb = table("table", (5.4, 0.55), rows=4, filled=4 if animate else 3)
    av = avatar("av", "MR", "a2", (3.6, -2.65), size=0.85)
    bt = button("approve", "Approve", "a3", (5.9, -2.65), w=2.3, h=0.72)
    cu = cursor("cursor", (6.95, -3.15, 0.22) if not animate else (9.2, -5.4, 0.22))
    # the connector: dotted paths phone -> cloud and cloud -> table
    A = ((-3.5, 1.25), (-2.85, 2.55), (-1.75, 1.75))
    B = ((1.5, 0.8), (2.3, -0.05), (3.25, 0.45))
    dots_a = dotted("pathA", *A)
    dots_b = dotted("pathB", *B)
    ax, ay = bez(*A, 0.4)
    bx, by = bez(*B, 0.5)
    pic = photo("photo", (ax, ay, 1.15) if not animate else (-4.05, -0.4, 1.05), 12, s=1.05)
    pk = packet("packet", (bx, by, 0.45) if not animate else (1.5, 0.8, 0.45))
    if not animate:
        return
    for i, d in enumerate(dots_a):
        pop(d, 48 + i, drop=0.12)
    for i, d in enumerate(dots_b):
        pop(d, 76 + i * 2, drop=0.12)
    pop(s1, 2)
    pop(st, 6)
    pop(form, 10, drop=0.3)
    pop(cl, 14)
    pop(tb, 18)
    for i in range(4):
        row = bpy.data.objects[f"table_row{i}"]
        keys(row, "scale", ((1, 0.0001),))
    # the phone rises into frame over the form and holds still
    keys(ph, "location", ((1, (-4.05, -7.2, 0.8)), (20, (-4.05, -7.2, 0.8)), (36, (-4.05, -0.75, 0.8))))
    # shutter: the button dips, the screen flashes white, the phone gives a tiny dip
    sh = bpy.data.objects["phone_shutter"]
    keys(sh, "scale", ((44, 1.0), (46, 0.82), (50, 1.0)))
    fl = bpy.data.objects["phone_flash"]
    keys(fl, "scale", ((45, 0.0001), (46, 1.0), (49, 1.0), (55, 0.0001)))
    keys(ph, "location", ((44, (-4.05, -0.75, 0.8)), (46, (-4.05, -0.75, 0.72)), (51, (-4.05, -0.75, 0.8))))
    # the photo lifts off the phone and arcs up into the cloud
    # the photo lifts off the phone, then rides the dotted path into the cloud
    keys(pic, "scale", ((49, 0.0001), (54, 1.08), (57, 1.0), (70, 1.0), (75, 0.0001)))
    path = [(54, 0.0), (58, 0.2), (62, 0.42), (66, 0.64), (70, 0.84), (74, 1.08)]
    keys(pic, "location", [(49, (-4.05, -0.4, 1.05))] +
         [(f, (*bez(*A, min(t, 1.0)), 1.1 + 0.35 * math.sin(math.pi * min(t, 1.0)) - (0.4 if t > 1 else 0)))
          for f, t in path])
    # one packet of data runs the second path, cloud to table
    keys(pk, "scale", ((79, 0.0001), (82, 1.0), (89, 1.0), (92, 0.0001)))
    keys(pk, "location", [(f, (*bez(*B, t), 0.45 + 0.25 * math.sin(math.pi * t)))
                          for f, t in ((80, 0.0), (83, 0.3), (86, 0.65), (90, 1.0))])
    # the cloud takes it in, then the records come down into the table
    keys(cl, "scale", ((73, 1.0), (77, 1.07), (81, 0.99), (84, 1.0)))
    for i in range(4):
        row = bpy.data.objects[f"table_row{i}"]
        row.scale = (1.0, 1.0, 1.0)
        pop(row, 90 + i * 5, drop=0.25)
    pop(av, 112)
    pop(bt, 116)
    move(cu, 118, 130, (6.95, -3.15, 0.22))
    keys(cu, "scale", ((130, 1.0), (132, 0.9), (136, 1.0)))
    keys(bt, "location", ((130, (5.9, -2.65, 0.0)), (132, (5.9, -2.65, -0.06)), (137, (5.9, -2.65, 0.0))))


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--palette", default="berry")
    ap.add_argument("--what", default="sheet")
    ap.add_argument("--out", required=True)
    ap.add_argument("--tilt", type=float, default=10.0)
    a = ap.parse_args(argv)

    kit.reset()
    kit.use_palette(a.palette)
    os.makedirs(a.out, exist_ok=True)
    if a.what == "anim":
        sc = kit.setup(960, 540, samples=24, tilt_deg=a.tilt)
        style_scene(animate=True)
        kit.ease_all()
        sc.frame_start, sc.frame_end = 1, 150
        sc.render.filepath = os.path.join(a.out, f"anim_{a.palette}_")
        bpy.ops.render.render(animation=True)
        return
    sc = kit.setup(1920, 1080, samples=64, tilt_deg=a.tilt)
    (sheet if a.what == "sheet" else style_scene)()
    sc.render.filepath = os.path.join(a.out, f"{a.what}_{a.palette}.png")
    bpy.ops.render.render(write_still=True)


main()
