"""Scene 5 · Photo: "Scan a stack of paper forms, and get clean records instead
of retyping."

The approved scene (preview.py style_scene(animate=True), Thomas: "this is what
I want"): same layout and order of events, retimed so every landing is on a
beat from video/timeline.json (SCRIPT.md beat sheet s05). No scanner. No cursor
in Blender: Remotion draws the one pointer; the Approve button dips on the
press frame and its pixel goes to video/timeline/targets/s05.json.

    blender/render.sh blender/s05_photo.py --mode drafts
    blender/render.sh blender/s05_photo.py --mode frames --frames 1-60
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import kit  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import (avatar, bez, button, cloud, keys, packet, paper, phone, photo, pop,  # noqa: E402
                 pop_out, stack, sticky, table)

PHONE_AT = (-4.05, -0.75, 0.8)
PHONE_FROM = (-4.05, -7.2, 0.8)
PHOTO_FROM = (-4.05, -0.4, 1.05)
CLOUD_AT = (0.1, 1.55)


def build(S):
    B = S.beat

    # MR carries over from scene 4 and stays to the end (handoff table)
    mr = avatar("mr", "MR", "a2", (3.6, -2.65), size=0.85)

    s1 = stack("stackA", (-6.4, 1.9), 4, n=4, seed=3)
    st = sticky("sticky", (-7.0, -2.9), -9)
    form = paper("form", (-4.2, -1.0, 0.0), -4, color="paper", ink="skel")
    ph = phone("phone", PHONE_AT, 6)
    cl = cloud("cloud", CLOUD_AT)
    tb = table("table", (5.4, 0.55), rows=4, filled=4)
    bt = button("approve", "Approve", "a3", (5.9, -2.65), w=2.3, h=0.72)

    pA, pB = S.path("pathA"), S.path("pathB")
    A, Bp = kit.path_points(pA), kit.path_points(pB)
    dots_a = kit.dotted_path(pA)
    dots_b = kit.dotted_path(pB)
    pic = photo("photo", PHOTO_FROM, 12, s=1.05)
    pk = packet("packet", (*Bp[0], 0.45))

    # j1 paperIn: stack, sticky and form land together (one hit)
    for ob in (s1, st):
        pop(ob, B("paperIn") - 7)
    pop(form, B("paperIn") - 7, drop=0.3)

    # j2 cloudTable: cloud and table land together, the rows wait at scale 0
    pop(cl, B("cloudTable") - 7)
    pop(tb, B("cloudTable") - 7)
    rows = [bpy.data.objects[f"table_row{i}"] for i in range(4)]
    for row in rows:
        keys(row, "scale", ((1, 0.0001),))

    # j3 phone: rises from below the frame and lands over the form
    f = B("phone")
    keys(ph, "location", ((1, PHONE_FROM), (f - 16, PHONE_FROM), (f, PHONE_AT)))

    # j4 shutter: button dips, the screen flashes, the phone gives a tiny dip;
    # the photo grows off the phone
    f = B("shutter")
    keys(bpy.data.objects["phone_shutter"], "scale", ((f - 2, 1.0), (f, 0.82), (f + 4, 1.0)))
    keys(bpy.data.objects["phone_flash"], "scale", ((f - 1, 0.0001), (f, 1.0), (f + 3, 1.0), (f + 9, 0.0001)))
    keys(ph, "location", ((f - 2, PHONE_AT), (f, (PHONE_AT[0], PHONE_AT[1], 0.72)), (f + 5, PHONE_AT)))
    keys(pic, "scale", ((1, 0.0001), (f + 3, 0.0001), (f + 8, 1.08), (f + 11, 1.0)))
    keys(pic, "location", ((f + 3, PHOTO_FROM),))

    # j5 pathA: the dotted line draws dot by dot; the photo rides it two frames
    # behind, then drops into the cloud's centre
    f = B("pathA")
    kit.draw_in(dots_a, pA.get("localStart", f), pA.get("every", 1))
    ride = [(f + 2, 0.0), (f + 4, 0.2), (f + 6, 0.42), (f + 8, 0.64), (f + 10, 0.84), (f + 12, 1.0)]
    kit.ride(pic, A, ride, z=1.1, lift=0.35)
    keys(pic, "location", ((f + 15, (*CLOUD_AT, 0.9)),))
    keys(pic, "scale", ((f + 12, 1.0), (f + 15, 0.0001)))

    # j6 cloudIn: the cloud takes it in
    f = B("cloudIn")
    keys(cl, "scale", ((f - 3, 1.0), (f, 1.07), (f + 4, 0.99), (f + 7, 1.0)))

    # j7 pathB: second line draws; one packet of data rides it into the table
    f = B("pathB")
    kit.draw_in(dots_b, pB.get("localStart", f), pB.get("every", 1))
    keys(pk, "scale", ((1, 0.0001), (f - 2, 0.0001), (f + 1, 1.0), (f + 9, 1.0), (f + 12, 0.0001)))
    kit.ride(pk, Bp, [(f + 2, 0.0), (f + 4, 0.3), (f + 6, 0.65), (f + 9, 1.0)], z=0.45, lift=0.25)
    keys(pk, "location", ((f + 12, (Bp[2][0] + 0.35, Bp[2][1], 0.3)),))

    # j8-j11: the records come down into the table, one a beat
    for i, row in enumerate(rows):
        row.scale = (1.0, 1.0, 1.0)
        pop(row, B(f"row{i}") - 7, drop=0.25)

    # j12 approve lands; j14 press (Remotion's cursor is fully pressed on it)
    pop(bt, B("approve") - 7)
    kit.press(bt, S.press_frame("approve"))

    # j17 exit (phase 3 fix p04: one beat later, was j16): everything but MR leaves
    f = B("exit")
    for ob in (s1, st, form, ph, cl, tb, bt, *dots_a, *dots_b):
        pop_out(ob, f)

    return {"presses": [sc.Press("approve", bt, w=2.3)], "latest": B("press")}


sc.run("s05", build)
