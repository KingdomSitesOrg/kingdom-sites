"""Scene 6 · Survey: "Build a survey, read every answer, and see what to fix
next."

SCRIPT.md beat sheet s06. A stack of five answered survey cards lands and fans
out like a hand of cards, one card a beat; a bar chart lands and its bars grow;
the answer lands: a card labelled "3 things to improve". MR (from scene 5)
stays at (3.6, -2.65) all scene and is the person who reads the result.

Every frame comes from video/timeline.json (scene s06 beatsLocal).

    blender/render.sh blender/s06_survey.py --mode drafts
    blender/render.sh blender/s06_survey.py --mode frames --frames 1-60
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import kit  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import avatar, bars, card, keys, pop, pop_out, survey_card  # noqa: E402

MR_AT = (3.6, -2.65)              # handoff in and out
STACK_AT = (-4.4, 0.85)
# card i: (event that fans it, target x, y, rotation); card 2 stays in the middle
FAN = (("fan0", -6.0, 0.55, 16), ("fan1", -5.2, 0.85, 8), (None, -4.4, 0.95, 0),
       ("fan3", -3.6, 0.85, -8), ("fan4", -2.8, 0.55, -16))
CHART_AT, CHART_W, CHART_H = (3.4, 1.25), 3.8, 2.8
VALUES = (0.55, 0.85, 0.4, 0.7)
DZ = 0.12


def build(S):
    B = S.beat

    avatar("mr", "MR", "a2", MR_AT, size=0.85)

    # j1 stack: five answered surveys land stacked, card i at z DZ * i.
    # SCRIPT.md says 0.06 i, but a card's chip stands 0.10 above its paper, so
    # at 0.06 the chip of the card below pokes up through the card above while
    # the hand fans out (draft 1, frame 61). At 0.12 it stays inside it.
    f = B("stack")
    cards = []
    for i in range(5):
        c = survey_card(f"survey{i}", (*STACK_AT, DZ * i), 0, seed=i)
        pop(c, f - 7)
        cards.append(c)

    # j2-j5: one card fans out per beat, moving and turning over 10 frames and
    # landing on the beat (a 1.5 degree overshoot two frames before); each keeps
    # its z, so they rest on each other like a hand of cards. Card 2 settles
    # 0.1 up to its place (-4.4, 0.95) with the first fan.
    for i, (ev, x, y, rot) in enumerate(FAN):
        c = cards[i]
        z = DZ * i
        if ev is None:
            f = B("fan0")
            keys(c, "location", ((f - 10, (*STACK_AT, z)), (f, (x, y, z))))
            continue
        f = B(ev)
        over = rot + math.copysign(1.5, rot)
        keys(c, "location", ((f - 10, (*STACK_AT, z)), (f, (x, y, z))))
        keys(c, "rotation_euler", ((f - 10, (0, 0, 0)), (f - 2, (0, 0, math.radians(over))),
                                   (f, (0, 0, math.radians(rot)))))

    # j6 chart: the chart lands with its bars at height 0; j7 bars: bar k grows
    # from its bottom edge, full on bars + 3k with a 1% overshoot
    chart = bars("chart", CHART_AT, w=CHART_W, h=CHART_H, values=VALUES)
    pop(chart, B("chart") - 7)
    bar_obs = sorted((o for o in chart.children if o.name.startswith("bar")), key=lambda o: o.location.x)
    fb = B("bars")
    for k, (ob, v) in enumerate(zip(bar_obs, VALUES)):
        bh = (CHART_H - 0.9) * v
        y_mid = ob.location.y
        bottom = y_mid - bh / 2
        fk = fb + 3 * k
        # depth (z) is hidden too until the bar starts, or a bar of height 0
        # shows its front face as a thin coloured sliver (draft 1, frame 91)
        for fr, s, sz in ((1, 0.0001, 0.0001), (fk - 8, 0.0001, 0.0001), (fk - 5, 0.4, 1.0),
                          (fk, 1.01, 1.0), (fk + 4, 1.0, 1.0)):
            ob.scale = (1.0, s, sz)
            ob.keyframe_insert("scale", frame=fr)
            ob.location.y = bottom + bh * s / 2
            ob.keyframe_insert("location", index=1, frame=fr)

    # j8 improve: the answer lands
    imp = card("improve", (0.4, -2.55), w=4.9, h=1.2, icon_name="lightbulb", accent="a1",
               label="3 things to improve", n_lines=1)
    pop(imp, B("improve") - 7)

    # j14 exit: everything but MR leaves
    f = B("exit")
    for ob in (*cards, chart, imp):
        pop_out(ob, f)

    return {"latest": B("improve") + 30, "draft_frames": [B("improve") + 30, B("bars") - 4, B("exit") + 4]}


sc.run("s06", build)
