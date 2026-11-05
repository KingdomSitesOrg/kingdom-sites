"""Scene 9 · Idea to send: "Your people bring the idea. AI does the work in
between. Your people check it before anything goes out."

SCRIPT.md beat sheet s09: the film's one idea in miniature. Three blocks in a
row (person, AI, person). MR types the idea into a bubble on the left block, a
lightbulb lands on it, the idea rides a dotted line into the middle block,
whose agent token works while four lines fill in, a draft rides the second
dotted line into the right block and lands as an email card, Approve and Send
land, Approve is pressed (a check pops onto the draft), Send is pressed and the
draft flies out past the right edge. Then everything but MR leaves.

No cursor in Blender: Remotion draws the one pointer; the buttons dip on their
press frames and their pixels go to video/timeline/targets/s09.json. Every
frame comes from video/timeline.json (beatsLocal, paths, presses).

    blender/render.sh blender/s09_idea_to_send.py --mode drafts
    blender/render.sh blender/s09_idea_to_send.py --mode frames --frames 1-60
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import kit  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import (avatar, block, bubble, button, card, chip, group, icon, keys, packet,  # noqa: E402
                 pop, pop_out, slab, token)

MR_AT = (-5.0, -2.45)
LEFT = ((-5.0, 0.9), 3.6, 3.0, "lightbulb", "a3")
MID = ((0.0, 0.9), 3.0, 3.0, "sparkle", "a1")
RIGHT = ((5.0, 0.9), 3.6, 3.0, "check-circle", "a2")
ON = 0.08                       # things placed on a block sit at z 0.08
IDEA_AT = (-4.85, 0.6, ON)
BULB_AT = (-3.85, 0.8, ON + 0.07)   # on the bubble's top (bubble d 0.07)
DRAFT_AT = (5.0, 0.95, ON)
PK_Z = 0.45


def grow_line(name, parent, x0, y, w, z, h=0.1):
    """A skel line in a group whose origin is its left end, so scale x 0 -> 1
    grows it from the left (typing). Same bar as kit.lines()."""
    g = group(name, (x0, y, z), 0, parent)
    slab(name + "_bar", w, h, 0.02, h / 2, "skel", g, (w / 2, 0, 0), bevel=0.008)
    return g


def type_in(g, f0, f1):
    keys(g, "scale", ((1, (0.0001, 1, 1)), (f0, (0.0001, 1, 1)), (f1, (1, 1, 1))))


def build(S):
    B = S.beat

    # MR carries over from scene 8 (handoff table)
    mr = avatar("mr", "MR", "a2", MR_AT, size=0.85)

    # the three steps: person, AI, person
    left = block("left", (*LEFT[0], 0), LEFT[1], LEFT[2], LEFT[3], LEFT[4])
    mid = block("middle", (*MID[0], 0), MID[1], MID[2], MID[3], MID[4])
    right = block("right", (*RIGHT[0], 0), RIGHT[1], RIGHT[2], RIGHT[3], RIGHT[4])

    # the idea bubble: kit.bubble without its two fixed lines; three lines type in
    idea = bubble("idea", IDEA_AT, w=2.8, h=1.2, tail="left")
    for c in list(idea.children):
        if c.name.startswith("line"):
            bpy.data.objects.remove(c, do_unlink=True)
    typed = [grow_line(f"idea_type{i}", idea, -1.1, y, w, 0.07)
             for i, (y, w) in enumerate(((0.28, 1.6), (0.02, 1.25), (-0.24, 1.45)))]
    bulb = chip("bulb", "lightbulb", "a3", "tint", 0.5, loc=BULB_AT)

    # the worker in the middle block, and its four work lines (block-relative,
    # under the worker's halo: sheet2 s09 fix 1)
    worker = token("worker", (0, 0.1, ON), size=0.7, parent=mid)
    work = [grow_line(f"work{i}", mid, -1.0, -0.55 - 0.23 * i, w, ON, h=0.09)
            for i, w in enumerate((2.0, 1.6, 1.8, 1.2))]

    # the draft and the two buttons on the right block
    draft = card("draft", DRAFT_AT, w=3.2, h=1.2, icon_name="envelope-simple", accent="a1", n_lines=2)
    # the approval check (final-render polish, review of 2026-11-05): a teal
    # disc with a paper-coloured check on it, so it reads at phone size.
    # Phosphor "check" in bold weight: its fill weight is a filled square.
    check = group("check", (1.3, 0.38, 0.07), 0, draft)
    slab("check_disc", 0.42, 0.42, 0.06, 0.21, "a2", check)
    icon("check", 0.24, "paper", check, (0, 0, 0.065), d=0.03)
    appr = button("approve", "Approve", "a3", (4.1, -0.1, ON), w=1.6, h=0.66)
    send = button("send", "Send", "a1", (5.95, -0.1, ON), w=1.4, h=0.66)

    pL, pR = S.path("pathL"), S.path("pathR")
    PL, PR = kit.path_points(pL), kit.path_points(pR)
    dots_l = kit.dotted_path(pL)
    dots_r = kit.dotted_path(pR)
    pk_idea = packet("pk_idea", (*PL[0], PK_Z), color="a3")
    pk_draft = packet("pk_draft", (*PR[0], PK_Z), color="a2")

    # j1 blocks: the three steps land together (the worker rides in with its block)
    f = B("blocks")
    for ob in (left, mid, right):
        pop(ob, f - 7)
    for g in work:
        keys(g, "scale", ((1, (0.0001, 1, 1)),))

    # j2 type: MR types the idea; the bubble pops in by the beat and three lines
    # type in from the left, 31 to 44
    f = B("type")
    pop(idea, f - 7, drop=0.3)
    for g in typed:
        keys(g, "scale", ((1, (0.0001, 1, 1)),))
    type_in(typed[0], f, f + 4)
    type_in(typed[1], f + 4, f + 8)
    type_in(typed[2], f + 9, f + 13)
    keys(mr, "scale", ((f - 2, 1.0), (f + 1, 1.05), (f + 4, 1.0), (f + 7, 1.04), (f + 10, 1.0)))

    # j3 idea: the lightbulb lands on the bubble's right end
    pop(bulb, B("idea") - 7, drop=0.3)

    # j4 pathL: the line draws dot by dot; the idea rides it two frames behind
    # and is taken into the middle block (the worker takes it in)
    f = B("pathL")
    kit.draw_in(dots_l, pL.get("localStart", f), pL.get("every", 1))
    keys(pk_idea, "scale", ((1, 0.0001), (f - 1, 0.0001), (f + 2, 1.0), (f + 10, 1.0), (f + 13, 0.0001)))
    kit.ride_span(pk_idea, PL, f + 2, f + 10, z=PK_Z, lift=0.25)
    keys(pk_idea, "location", ((f + 13, (-0.45, 0.95, 0.35)),))
    kit.bump(worker, f + 13, peak=1.08, low=0.99)

    # j5 work: the worker spins one turn while four lines fill in (soft ticks)
    f = B("work")
    keys(worker, "rotation_euler", ((f, (0, 0, 0)), (f + 44, (0, 0, -2 * math.pi))))
    for g, fr in zip(work, (f + 2, f + 11, f + 20, f + 29)):
        type_in(g, fr - 4, fr)

    # j7 pathR: the second line draws; the draft rides it into the right block
    f = B("pathR")
    kit.draw_in(dots_r, pR.get("localStart", f), pR.get("every", 1))
    keys(pk_draft, "scale", ((1, 0.0001), (f - 2, 0.0001), (f + 1, 1.0), (f + 10, 1.0), (f + 13, 0.0001)))
    kit.ride_span(pk_draft, PR, f + 2, f + 10, z=PK_Z, lift=0.25)
    keys(pk_draft, "location", ((f + 13, (3.7, 0.7, 0.35)),))

    # j8 draft: the email card lands in the right block's body
    pop(draft, B("draft") - 7, drop=0.3)

    # j9 buttons: Approve and Send land together
    f = B("buttons")
    pop(appr, f - 7)
    pop(send, f - 7)

    # j11 approve: press (dip on the beat); a check pops onto the draft
    fa = S.press_frame("approve")
    kit.press(appr, fa)
    pop(check, fa, drop=0.2)
    kit.bump(mr, fa, peak=1.05, low=0.99)

    # j13 send: press
    fs = S.press_frame("send")
    kit.press(send, fs)

    # j14 sendOff: the draft lifts and flies out past the right edge
    f = B("sendOff")
    x0, y0, z0 = DRAFT_AT
    keys(draft, "location", ((f, (x0, y0, z0)),
                             (f + 4, (x0 - 0.15, y0 + 0.05, z0 + 0.3)),
                             (f + 9, (x0 + 2.6, y0 + 0.35, z0 + 0.45)),
                             (f + 13, (10.5, y0 + 0.3, z0 + 0.3))))

    # j17 exit (phase 3 fix p05: one beat later, was j16): everything but MR leaves
    f = B("exit")
    for ob in (left, mid, right, idea, bulb, appr, send, *dots_l, *dots_r):
        pop_out(ob, f)

    return {"presses": [sc.Press("approve", appr, w=1.6), sc.Press("send", send, w=1.4)],
            "latest": 181,
            "draft_frames": [24, 40, 66, 98, 112, 173, 181, 216, 226]}


sc.run("s09", build)
