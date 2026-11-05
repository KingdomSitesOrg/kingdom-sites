"""Scene 8 · Agent: "Send an agent out to do the legwork, and bring back what
you need."

SCRIPT.md beat sheet s08. MR (from scene 7) gives the agent its start; the
agent token rolls out of frame along a dotted line that draws itself just ahead
of it, is away for a held breath, rolls back along a second dotted line
carrying three small cards, settles home, and sets the cards down in a row one
a beat. Then everything but MR leaves and MR moves to its scene 9 place.
Every frame comes from video/timeline.json (beatsLocal, paths).

    blender/render.sh blender/s08_agent.py --mode drafts
    blender/render.sh blender/s08_agent.py --mode frames --frames 1-60
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import kit  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import avatar, bez, card, group, keys, pop, pop_out, token  # noqa: E402

HOME = (-0.6, -0.6)
MR_AT = (3.6, -2.65)
MR_TO = (-5.0, -2.45)
RIDE_Z = 0.06        # the token rides just above the dots (dots are 0.03 thick)
RIDE_LIFT = 0.2      # a gentle hop along the way
STACK_Z = 0.32       # the carried cards rest on the token's top (icon top 0.30)
STACK_DZ = 0.065     # a carried card's chip stands 0.06 above its base
CARRY = 0.35         # carried cards' scale
STAGGER = ((0.06, -0.05, 6.0), (-0.06, 0.04, -5.0), (0.02, 0.0, -1.5))   # bottom .. top
# (name, icon, accent, row place); the first one sits on top of the carried stack
FOUND = (("found1", "file-text", "a1", (-4.2, 1.9)),
         ("found2", "chart-bar", "a2", (-0.4, 1.9)),
         ("found3", "table", "a3", (3.4, 1.9)))


def smooth(t):
    return t * t * (3 - 2 * t)


def build(S):
    B = S.beat

    # MR carries over from scene 7 (handoff table)
    mr = avatar("mr", "MR", "a2", MR_AT, size=0.85)

    # the agent: a rig that travels, the token on it (spins as it rolls) and
    # the three cards it brings back (do not spin)
    rig = group("agent_rig", (*HOME, 0.0))
    tok = token("agent", (0, 0, 0), "a1", size=1.0, parent=rig)
    cards = []
    for i, (name, ic, ac, _) in enumerate(FOUND):
        c = card(name, (0, 0, 0), w=3.4, h=1.1, icon_name=ic, accent=ac, n_lines=2, parent=rig)
        cards.append(c)

    pO, pB = S.path("pathOut"), S.path("pathBack")
    PO, PB = kit.path_points(pO), kit.path_points(pB)
    dots_o = kit.dotted_path(pO)
    dots_b = kit.dotted_path(pB)

    # j1 token: the agent lands at home; MR gives a small nod as it arrives
    f = B("token")
    pop(tok, f - 7)
    kit.bump(mr, f, peak=1.06, low=0.99)

    # j2 out: the line draws two dots a frame; the token rolls along it two
    # frames behind, spinning two turns, and leaves the frame
    f = B("out")
    kit.draw_in(dots_o, pO.get("localStart", f), pO.get("every", 0.5))
    t0, t1 = f + 2, f + 19                       # SCRIPT: t 0 @33 -> 1 @50
    keys(rig, "location", ((f, (*HOME, 0.0)),))
    keys(tok, "rotation_euler", ((f, (0, 0, 0)),))
    for fr in list(range(t0, t1, 2)) + [t1]:
        t = (fr - t0) / (t1 - t0)
        x, y = bez(*PO, t)
        keys(rig, "location", ((fr, (x, y, RIDE_Z + RIDE_LIFT * math.sin(math.pi * t))),))
        tok.rotation_euler.z = -2 * math.pi * 2 * t
        tok.keyframe_insert("rotation_euler", index=2, frame=fr)
    # away (j3-j4): only MR and the out path; the rig waits off-screen at the
    # back path's start, and picks up the cards there
    xb, yb = PB[0]
    keys(rig, "location", ((t1 + 1, (xb - 0.6, yb, RIDE_Z)),))
    for i, c in enumerate(reversed(cards)):      # found3 at the bottom, found1 on top
        ox, oy, r = STAGGER[i]                   # a little askew, so it reads as a stack
        c.location = (ox, oy, STACK_Z + STACK_DZ * i)
        c.rotation_euler = (0, 0, math.radians(r))
    # the token's sparkle hides while it carries the stack (its tips poked out
    # past the cards); it pops back once the last card has hopped off
    spark = next(c for c in tok.children if c.name.startswith("icon_"))
    k = spark.scale.x
    keys(spark, "scale", ((1, k), (t1 + 1, k), (t1 + 2, 0.0001)))
    spark.scale = (k, k, k)
    pop(spark, B("card3") - 10, drop=0)
    for c in cards:
        keys(c, "scale", ((1, 0.0001), (t1 + 2, 0.0001), (t1 + 3, CARRY)))
        c.keyframe_insert("location", frame=1)
        c.keyframe_insert("rotation_euler", index=2, frame=1)

    # j5 back: the second line draws in; the token rolls back along it with the
    # cards on its top
    f = B("back")
    kit.draw_in(dots_b, pB.get("localStart", f), pB.get("every", 0.5))
    b0, b1 = f + 2, f + 24                       # SCRIPT: t 0 @78 -> 1 @100
    keys(rig, "location", ((f, (xb - 0.6, yb, RIDE_Z)),))
    tok.rotation_euler.z = -4 * math.pi
    tok.keyframe_insert("rotation_euler", index=2, frame=f)
    for fr in list(range(b0, b1, 2)) + [b1]:
        t = (fr - b0) / (b1 - b0)
        x, y = bez(*PB, t)
        keys(rig, "location", ((fr, (x, y, RIDE_Z + 0.12 * math.sin(math.pi * t))),))
        tok.rotation_euler.z = -4 * math.pi - 2 * math.pi * 2 * t
        tok.keyframe_insert("rotation_euler", index=2, frame=fr)

    # j7 home: settles at home, landing on the beat with a small overshoot
    f = B("home")
    ex, ey = PB[2]
    dx, dy = HOME[0] - ex, HOME[1] - ey
    keys(rig, "location", ((f - 2, (HOME[0] + 0.03 * dx, HOME[1] + 0.03 * dy, 0.02)),
                           (f, (*HOME, 0.0))))
    kit.bump(tok, f, peak=1.05, low=0.99)

    # j8-j10: each card hops off the token in an arc and lands in the row
    for i, (c, (name, _, _, at)) in enumerate(zip(cards, FOUND)):
        F = B(f"card{i + 1}")
        x0, y0, z0 = c.location
        r0 = c.rotation_euler.z
        tx, ty = at[0] - HOME[0], at[1] - HOME[1]
        keys(c, "rotation_euler", ((F - 13, (0, 0, r0)), (F, (0, 0, 0))))
        keys(c, "location", ((F - 13, (x0, y0, z0)),
                             (F - 6, (tx * 0.5, ty * 0.5, 0.8)),
                             (F, (tx, ty, 0.0))))
        keys(c, "scale", ((F - 13, CARRY), (F - 6, 0.75), (F, 1.0), (F + 3, 1.025), (F + 7, 1.0)))

    # j12 exit: everything but MR leaves; MR moves to its scene 9 place
    f = B("exit")
    for ob in (tok, *cards, *dots_o, *dots_b):
        pop_out(ob, f)
    m0, m1 = B("mrMove"), B("mrLand")
    sx, sy = MR_AT
    ox = MR_TO[0] + 0.01 * (MR_TO[0] - sx)
    oy = MR_TO[1] + 0.01 * (MR_TO[1] - sy)
    keys(mr, "location", ((m0, (*MR_AT, 0.0)),
                          ((m0 + m1) // 2, ((sx + MR_TO[0]) / 2, (sy + MR_TO[1]) / 2, 0.25)),
                          (m1 - 2, (ox, oy, 0.02)),
                          (m1, (*MR_TO, 0.0))))
    keys(mr, "scale", ((m1 - 1, 1.0), (m1 + 2, 1.04), (m1 + 6, 0.99), (m1 + 9, 1.0)))

    return {"latest": B("card3") + 15,
            "draft_frames": [40, 60, 90, B("card1") - 6, B("card3") + 15, B("exit") + 7, 188]}


sc.run("s08", build)
