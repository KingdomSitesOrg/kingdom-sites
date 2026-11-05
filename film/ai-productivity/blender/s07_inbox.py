"""Scene 7 · Inbox: "Sort the inbox. Answer questions where your team already
talks."

SCRIPT.md beat sheet s07. An inbox tray and three labelled drawers land; three
emails each ride their own dotted line from the tray into a drawer, which bumps
as it takes the email in. Then the team channel lands with JL's question in it,
and the answer appears with the small agent chip beside it. MR (from scene 6)
stays at (3.6, -2.65) all scene, under the channel, and hands over to scene 8
in the same place.

Every frame comes from video/timeline.json (scene s07 beatsLocal and paths).

    blender/render.sh blender/s07_inbox.py --mode drafts
    blender/render.sh blender/s07_inbox.py --mode frames --frames 1-60
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import avatar, bubble, channel, chip, drawer, envelope, keys, pop, pop_out  # noqa: E402

MR_AT = (3.6, -2.65)              # handoff in and out
TRAY_AT = (-6.0, 1.1)
DRAWERS = (("d1", "Admissions", "a1", (-2.0, 2.4)),
           ("d2", "Finance", "a2", (-2.0, 1.0)),
           ("d3", "Events", "a3", (-2.0, -0.4)))
# (path, email event, drawer-lands event); the ride starts 2 frames after the
# path's first dot and ends with its last dot (SCRIPT.md)
EMAILS = (("path1", "email1", "land1"), ("path2", "email2", "land2"), ("path3", "email3", "land3"))
CHANNEL_AT = (4.6, 0.95)
DRAWER_TOP = 0.3                   # kit.drawer body depth


def build(S):
    B = S.beat

    avatar("mr", "MR", "a2", MR_AT, size=0.85)

    # j1 trayDrawers: the inbox tray and the three drawers land together
    f = B("trayDrawers")
    tray = chip("tray", "tray", "a1", "tint", 1.2, loc=TRAY_AT)
    pop(tray, f - 7)
    drawers = []
    for name, lab, colr, loc in DRAWERS:
        # fix 1: ink labels on all three tags (white on butter "Events" was 1.56:1)
        d = drawer(name, lab, colr, loc, w=2.4, label_color="ink")
        pop(d, f - 7)
        drawers.append(d)

    # j2-j7: each email grows off the tray two frames before its line starts,
    # rides the line as it draws, then drops into its drawer (shrinking, down
    # to the drawer's top) by the land beat, where the drawer bumps
    all_dots = []
    for k, ((pname, ev, land), d) in enumerate(zip(EMAILS, drawers)):
        p = S.path(pname)
        pts = kit.path_points(p)
        dots = kit.dotted_path(p)
        start = p.get("localStart", B(ev))
        drawn = kit.draw_in(dots, start, p.get("every", 1))
        all_dots.extend(dots)

        env = envelope(f"env{k + 1}", (*pts[0], 0.45))
        f0 = start - 2
        keys(env, "scale", ((1, 0.0001), (f0, 0.0001), (f0 + 3, 1.06), (f0 + 5, 1.0)))
        kit.ride_span(env, pts, start + 2, drawn, z=0.45, lift=0.35, step=1)
        fl = B(land)
        # into the drawer at its handle, below the label tag, so the word stays clear
        into = (d.location.x, d.location.y - 0.3, DRAWER_TOP)
        keys(env, "location", ((fl, into),))
        keys(env, "scale", ((drawn, 1.0), (fl, 0.0001)))

        # the drawer takes it in: body bump, scale y 1 -> 0.96 -> 1 over land .. land + 6
        for fr, sy in ((fl, 1.0), (fl + 2, 0.96), (fl + 6, 1.0)):
            d.scale = (1.0, sy, 1.0)
            d.keyframe_insert("scale", frame=fr)
        d.scale = (1.0, 1.0, 1.0)

    # j8 channel: the team channel lands with JL's question already in it
    ch = channel("channel", CHANNEL_AT, w=4.6, h=4.0)
    cx, cy = CHANNEL_AT
    avatar("jl", "JL", "a1", (2.95 - cx, 1.45 - cy, 0.08), size=0.6, parent=ch)
    bubble("question", (4.65 - cx, 1.45 - cy, 0.08), w=2.6, h=0.8, tail="left", parent=ch)
    pop(ch, B("channel") - 7)

    # j9 answer: the answer bubble and the small agent chip land together
    f = B("answer")
    ans = bubble("answer", (4.45 - cx, -0.15 - cy, 0.08), color="tint", w=2.8, h=0.9, tail="right", parent=ch)
    agent = chip("agentchip", "sparkle", "a1", "tint", 0.55, parent=ch, loc=(6.3 - cx, -0.25 - cy, 0.08))
    pop(ans, f - 7)
    pop(agent, f - 7)

    # j12 exit: everything but MR leaves
    f = B("exit")
    for ob in (tray, *drawers, *all_dots, ch):
        pop_out(ob, f)

    return {"latest": B("answer") + 20,
            "draft_frames": [B("answer") + 20, B("land1") - 3, B("exit") + 4,
                             *(S.path(p)["localStart"] + 6 for p, _, _ in EMAILS)]}


sc.run("s07", build)
