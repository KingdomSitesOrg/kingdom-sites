"""Scene 3 · Sweep: "What if AI did the busywork, and your people did the
thinking?"

SCRIPT.md beat sheet s03. The turn. Frame 1 is scene 2's last frame (same
objects from layout_s01_s03). Everything on screen lifts a little, then flies in
an arc to the folder's mouth, shrinking, nearest first, then sinks onto the
white inner sheet behind the front lip and is gone (fix 2: never crosses the
front panel; fix 1: a low arc so shadows stay close); a bright raspberry folder pops up under them
and the papers fall into it; on the next beat its front gives
a closing bump. Then stillness: the folder holds at (0, 0.2), scale 1.2, for
scene 4. No dotted line: this is a sweep, not one thing passing to another.
Every frame number comes from video/timeline.json.

    blender/render.sh blender/s03_sweep.py --mode drafts
    blender/render.sh blender/s03_sweep.py --mode frames --frames 1-60
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import kit  # noqa: E402
import layout_s01_s03 as lay  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import folder, keys, pop  # noqa: E402
from mathutils import Vector  # noqa: E402

# fix 2: papers drop into the folder's mouth, never through its front. The
# folder sits at (0, 0.2), scale 1.2: its front panel's top edge is at about
# y 0.87 (z 0.108 to 0.192), the white inner sheet shows from y 0.87 to 1.38
# with its top at z 0.108. Each flyer reaches the mouth above the inner sheet
# (OPENING, scale 0.18 of its own, so even the email card's bottom edge is at
# y 0.89, above the lip) and then, over the last 3 frames of its flight, sinks
# onto the inner sheet (POCKET), shrinking to 0, behind the lip.
TARGET = Vector((0.0, 0.2, 0.6))     # the folder's centre, used only to order the flyers by distance
OPENING = Vector((0.0, 1.15, 0.35))  # the mouth of the folder, above the white inner sheet (fix 2: was y 1.0)
POCKET = Vector((0.0, 1.12, 0.115))  # on the inner sheet, behind the lip (fix 2: was under the front panel)
OPEN_S = 0.18                        # (fix 2: was 0.25) each flyer's scale (of its own) on reaching the opening
DROP = 3                             # last frames of a flight: opening -> pocket
PEAK = 0.75                          # no flyer rises above this, so its shadow stays close
FOLDER_AT = (0.0, 0.2)
FOLDER_SCALE = 1.2
LIFT_Z, LIFT_S = 0.1, 1.03           # the lift before the flight
LIFT_FRAMES = 3                      # lift over frames sweep .. sweep + 3 (1 to 4)
FLIGHT = 12                          # each flight takes 12 frames
STAGGER = 6                          # start staggered by distance, 0 to 6 frames
ARC = 0.3                            # lift at mid-flight (fix 1: was 0.8)
LANE = 0.02                          # extra mid-flight height per flyer, in start order
EARLY = {"stackA": 2, "stackD": 2, "email": 2}  # fix 2: frames earlier for the far flyers (by name)
# final pass (review notes): the highest to-do rows leave 1 frame earlier, so
# they are inside the folder's mouth on the landing beat
EARLY.update({f"todo_row{i}": 1 for i in range(12, 16)})
# phase 3 (whole-film review p03): the to-do header and the rows nearest it
# start below the folder, so they leave 3 frames earlier (first try: 2) and
# cross the front while the folder is still small (comment only; values below)
EARLY.update({f"todo_row{i}": 3 for i in range(0, 4)})
# retry 1: the two near-left stacks and the email card cross the folder's
# front too, so they leave 1 frame earlier still (stack E: 2)
EARLY.update({"stackD": 3, "stackE": 2, "email": 3})
ROW_PEAK = 0.5                       # final pass: the to-do rows fly lower, so their shadows stay small


# each sticky rides on the stack it was pressed onto, the badge on the inbox
GLUE = (("stickyA", "stackA"), ("stickyB", "stackB"), ("stickyD", "stackD"), ("stickyE", "stackE"),
        ("badge", "inbox"))


def _glue(child, parent):
    """Parent `child` to `parent` keeping its world place exactly (frame 1 is
    still scene 2's last frame), so it travels and shrinks with it."""
    bpy.context.view_layer.update()
    mw = child.matrix_world.copy()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()
    bpy.context.view_layer.update()
    assert (child.matrix_world.translation - mw.translation).length < 1e-6


def _flyers(world1, world2):
    """Every top-level thing on screen, with its parent's world offset (to-do
    rows are children of the list group). Stickies and the badge are glued to
    what they sit on."""
    objs = {**world1["stacks"], **world1["stickies"], "inbox": world1["inbox"], "badge": world1["badge"]}
    for c, p in GLUE:
        _glue(objs[c], objs[p])
    out = [(ob, Vector((0, 0, 0))) for ob in (*world1["stacks"].values(), world1["inbox"])]
    todo_off = Vector(world2["todo"].location)
    for row in world2["rows"]:
        out.append((row, todo_off))
    out.append((world2["email"], Vector((0, 0, 0))))
    return out


def build(S):
    B = S.beat
    w1 = lay.paper_world(badge_value=len(lay.BADGE_VALUES) - 1)
    w2 = lay.overload_world(finished=True)

    f0 = B("sweep")
    flyers = _flyers(w1, w2)
    dists = [(Vector(ob.location) + off - TARGET).xy.length for ob, off in flyers]
    dmax = max(dists)
    starts = [f0 + LIFT_FRAMES + int(round(STAGGER * d / dmax)) for d in dists]
    # fix 2: the flyers farthest from the centre leave a little earlier, so
    # they are small and inside the folder's mouth by the landing beat
    starts = [max(f0 + LIFT_FRAMES, s - EARLY.get(ob.name, 0)) for s, (ob, _) in zip(starts, flyers)]
    print("[s03] starts " + ", ".join(f"{ob.name}:{s}" for s, (ob, _) in zip(starts, flyers)))
    # later starters fly above earlier ones (a lane each, at its highest
    # mid-flight), so a paper passes over another instead of cutting into it
    order = sorted(range(len(flyers)), key=lambda k: (starts[k], dists[k]))
    lane = {k: LANE * r for r, k in enumerate(order)}
    peak_z = 0.0
    for k, ((ob, off), d) in enumerate(zip(flyers, dists)):
        base = ob.scale.x
        start = Vector(ob.location)
        lifted = start + Vector((0, 0, LIFT_Z))
        # held on frame 1 exactly as scene 2 ended, lifted by frame 4
        keys(ob, "location", ((f0, tuple(start)), (f0 + LIFT_FRAMES, tuple(lifted))))
        keys(ob, "scale", ((f0, base), (f0 + LIFT_FRAMES, base * LIFT_S)))
        a = starts[k]
        mouth = OPENING - off                     # targets in the parent's space
        pocket = POCKET - off
        arc = ARC + lane[k]
        # cap the arc so the highest point of the flight stays under PEAK (world)
        top = (lifted.z + off.z + OPENING.z) / 2 + arc
        cap = ROW_PEAK if ob.name.startswith("todo_row") else PEAK
        if top > cap:
            arc -= top - cap
        peak_z = max(peak_z, (lifted.z + off.z + OPENING.z) / 2 + arc)
        n1 = FLIGHT - DROP
        for i in range(1, n1 + 1):
            t = i / n1
            te = t * t * (3 - 2 * t)              # smoothstep: eases off, sweeps in
            p = lifted.lerp(mouth, te)
            p.z += arc * math.sin(math.pi * te)
            # shrinks in step with the distance left (a uniform contraction
            # towards the folder), so papers never grow into one another
            keys(ob, "location", ((a + i, tuple(p)),))
            keys(ob, "scale", ((a + i, base * LIFT_S * (1.0 - (1.0 - OPEN_S) * te)),))
        for i in range(1, DROP + 1):
            t = i / DROP
            keys(ob, "location", ((a + n1 + i, tuple(mouth.lerp(pocket, t))),))
            keys(ob, "scale", ((a + n1 + i, base * LIFT_S * OPEN_S * max(1.0 - t, 0.0001)),))
        if a + FLIGHT > f0 + 23:
            raise SystemExit(f"s03: {ob.name} still flying on {a + FLIGHT}")
    print(f"[s03] {len(flyers)} flyers, highest point z {peak_z:.2f}, last lands on {max(starts) + FLIGHT}")

    # j1 the folder lands under them (pops from beat - 8)
    fd = folder("folder", FOLDER_AT, color="a1")
    fd.scale = (FOLDER_SCALE,) * 3
    pop(fd, B("folder") - 7)

    # j2 close: the front bumps 1 -> 0.94 -> 1.01 -> 1 over 31 to 38; the folder dips
    f = B("close")
    front = bpy.data.objects["folder_front"]
    keys(front, "scale", ((f - 3, (1, 1, 1)), (f, (1, 0.94, 1)), (f + 4, (1, 1.01, 1)), (f + 7, (1, 1, 1))))
    keys(fd, "location", ((f - 3, (*FOLDER_AT, 0.0)), (f, (*FOLDER_AT, -0.04)), (f + 5, (*FOLDER_AT, 0.0))))

    # j3-j7 stillness to the last frame
    # latest.png: mid-sweep, the papers converging on the folder (the scene's idea)
    return {"latest": B("folder") - 2, "draft_frames": [4, 8, 12, 14, 19, 45]}


sc.run("s03", build)
