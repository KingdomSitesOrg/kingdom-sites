"""Component sheet v2: every object added in phase 1, at film scale, beside the
approved ones it works with. Plus layout checks that put the new objects where
SCRIPT.md's beat sheets put them (s02, s04, s06, s07, s09, s10), so the picture agents
start from objects that are known to fit.

    blender/render.sh blender/sheet2.py --what sheet2 --out renders/style
    blender/render.sh blender/sheet2.py --what s04 --out renders/style

The project card (scene 4) is too big for the sheet at film scale: its sheet
entry is the s04 layout (layout-s04*.png), with its three cards and avatars.
--tag adds a suffix to the output name (fix rounds keep earlier renders).
"""

import argparse
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import kit  # noqa: E402
from kit import (avatar, bars, block, bubble, button, buzz_chip, card, channel, chip, counter_badge,  # noqa: E402
                 drawer, email_card, envelope, folder, mark, packet, project_card, stack, sticky,
                 survey_card, text, todo_list, token)

FAN = ((-1.6, -0.3, 16), (-0.8, 0.0, 8), (0.0, 0.1, 0), (0.8, 0.0, -8), (1.6, -0.3, -16))


def show_value(badge, i):
    """Show value i of a counter badge (for a still)."""
    kit.counter_show(badge, i)


def email_crowded(name, loc, scale=1.0):
    em = email_card(name, loc, w=3.4, h=2.6, fillers_hidden=False)
    for i, (c, (x, y)) in enumerate((("a3", (-0.9, 0.65)), ("tint", (0.55, 0.3)),
                                     ("a2", (0.9, -0.55)), ("a1", (-0.6, -0.85)))):
        buzz_chip(f"{name}_buzz{i}", c, em, (x, y, 0.07))
    em.scale = (scale, scale, scale)
    return em


def sheet2():
    # top left: the inbox with its counter (scene 1), the narrow values, pen-nib
    chip("inbox", "tray", "a1", "tint", 1.2, loc=(-6.6, 3.0))
    b = counter_badge("badge", ["3", "12", "27", "48", "99+"], loc=(-6.05, 3.45, 0.06))
    show_value(b, 4)
    for i, v in enumerate(("3", "27")):
        counter_badge(f"small{i}", [v], loc=(-7.2 + i * 0.75, 1.55, 0))
    chip("pen", "pen-nib", "a3", "tint", 0.8, loc=(-5.2, 1.6))

    # top: the crowded email draft (scene 2), the mark (scene 10)
    email_crowded("email", (-2.25, 2.45))
    mark("mark", (1.55, 2.55), size=2.3)

    # right: the team channel with a question and the answer (scene 7)
    ch = channel("channel", (5.45, 1.35), w=4.3, h=3.9)
    avatar("jl", "JL", "a1", (-1.6, 0.45, 0.08), size=0.6, parent=ch)
    bubble("q", (0.4, 0.45, 0.08), w=2.5, h=0.8, tail="left", parent=ch)
    bubble("a", (-0.05, -0.85, 0.08), w=2.6, h=0.9, color="tint", tail="right", parent=ch)
    chip("agentchip", "sparkle", "a1", "tint", 0.55, loc=(1.65, -1.0, 0.08), parent=ch)

    # bottom left: the to-do list growing up (scene 2)
    todo_list("todo", (-6.35, -3.85), rows=6)

    # bottom: survey cards fanned like a hand (scene 6)
    for i, (dx, dy, r) in enumerate(FAN):
        survey_card(f"survey{i}", (-2.1 + dx, -2.3 + dy, 0.06 * i), r, seed=i)

    # bottom: a step block with the worker token (scene 9)
    bl = block("block", (1.95, -2.35), w=2.8, h=3.0, icon_name="sparkle", accent="a1")
    token("worker", (0, -0.1, 0.08), size=0.7, parent=bl)
    kit.lines(bl, -0.95, -0.85, [1.9, 1.4], "skel", gap=0.26, h=0.1, z=0.08)

    # bottom right: an email riding its dotted line from the tray into a drawer (scene 7)
    chip("tray", "tray", "a1", "tint", 1.0, loc=(3.95, -3.35))
    pts = ((4.35, -2.75), (4.95, -1.15), (5.75, -2.55))
    kit.dotted("path", *pts)
    x, y = kit.bez(*pts, 0.55)
    envelope("env", (x, y, 0.45 + 0.35 * math.sin(math.pi * 0.55)), rot=-6)
    drawer("drawer", "Finance", "a2", (6.4, -3.35), w=2.2)


def s01_layout():
    for name, loc, rot, n, seed in (("stackA", (-6.1, 2.2), 6, 4, 11), ("stackB", (-3.6, 2.6), -5, 5, 12),
                                    ("stackC", (-1.2, 2.0), 4, 3, 13), ("stackD", (-5.4, -1.6), -3, 4, 14),
                                    ("stackE", (-2.6, -1.9), 7, 5, 15)):
        stack(name, loc, rot, n=n, seed=seed)
    for name, loc, rot, c in (("stickyA", (-5.75, 1.75, 0.2), -8, "a2"), ("stickyB", (-3.25, 3.05, 0.24), 7, "a3"),
                              ("stickyD", (-5.0, -2.1, 0.2), 10, "a1"), ("stickyE", (-2.3, -1.45, 0.24), -6, "a2")):
        sticky(name, loc, rot, color=c)
    chip("inbox", "tray", "a1", "tint", 1.2, loc=(5.4, 2.4))
    b = counter_badge("badge", ["3", "12", "27", "48", "99+"], loc=(5.95, 2.85, 0.06))
    show_value(b, 4)


def s02():
    s01_layout()
    todo_list("todo", (1.4, -3.5), rows=16)
    email_crowded("email", (5.2, -1.2), scale=1.12)


def s04():
    project_card("project", (0, 0.45), w=7.2, h=4.4)
    for name, y, ic, ac, lab in (("handbook", 1.2, "book-open-text", "a1", "Handbook"),
                                 ("policies", 0.05, "clipboard-text", "a2", "Policies"),
                                 ("style", -1.1, "pen-nib", "a3", "Style guide")):
        card(name, (0, y, 0.08), w=6.4, h=1.0, icon_name=ic, accent=ac, label=lab, n_lines=1)
    for name, ini, c, x in (("mr", "MR", "a2", -1.2), ("jl", "JL", "a1", 0.0), ("ak", "AK", "a3", 1.2)):
        avatar(name, ini, c, (x, -2.75), size=0.85)


def s09():
    avatar("mr", "MR", "a2", (-5.0, -2.45), size=0.85)
    block("left", (-5.0, 0.9), 3.6, 3.0, "lightbulb", "a3")
    mid = block("middle", (0, 0.9), 3.0, 3.0, "sparkle", "a1")
    block("right", (5.0, 0.9), 3.6, 3.0, "check-circle", "a2")
    bubble("idea", (-4.85, 0.6, 0.08), w=2.8, h=1.2, tail="left")
    chip("bulb", "lightbulb", "a3", "tint", 0.5, loc=(-3.85, 0.8, 0.15))
    token("worker", (0, 1.0, 0.08), size=0.7)
    # fix 1: the four work lines at block-relative y -0.55, -0.78, -1.01, -1.24
    # (under the worker's halo, 0.26 above the block's bottom edge)
    kit.lines(mid, -1.0, -0.55, [2.0, 1.6, 1.8, 1.2], "skel", gap=0.23, h=0.09, z=0.08)
    # fix 2: the paths end 0.15 outside the middle block (its edges are x +-1.5),
    # so no end dot is cut by the block; 9 dots each, as in SCRIPT
    kit.dotted("pathL", (-3.05, 0.1), (-2.35, -0.8), (-1.65, 0.1), count=9)
    kit.dotted("pathR", (1.65, 0.1), (2.35, -0.8), (3.05, 0.1), count=9)
    # fix 1: the draft sits in the block body (block_body: top at rel 0.75),
    # clear of the header strip, 0.12 above the buttons
    card("draft", (5.0, 0.95, 0.08), w=3.2, h=1.2, icon_name="envelope-simple", accent="a1", n_lines=2)
    button("approve", "Approve", "a3", (4.1, -0.1, 0.08), w=1.6, h=0.66)
    button("send", "Send", "a1", (5.95, -0.1, 0.08), w=1.4, h=0.66)


def s06():
    """Scene 6 at its beat-sheet places (fix 2): the five survey cards fanned to
    their j2-j5 places (card 2 at (-4.4, 0.95), z 0.06 i), the chart with full
    bars, the "3 things to improve" card and MR from scene 5."""
    fan = ((-6.0, 0.55, 16), (-5.2, 0.85, 8), (-4.4, 0.95, 0), (-3.6, 0.85, -8), (-2.8, 0.55, -16))
    for i, (x, y, r) in enumerate(fan):
        survey_card(f"survey{i}", (x, y, 0.06 * i), r, seed=i)
    bars("chart", (3.4, 1.25), w=3.8, h=2.8, values=(0.55, 0.85, 0.4, 0.7))
    card("improve", (0.4, -2.55), w=4.9, h=1.2, icon_name="lightbulb", accent="a1",
         label="3 things to improve", n_lines=1)
    avatar("mr", "MR", "a2", (3.6, -2.65), size=0.85)


def s07():
    """Scene 7 at its beat-sheet places, with the question bubble at x 4.65
    (0.1 clear of the JL avatar; at 4.55 they touch) and the answer and agent chip on the channel."""
    chip("tray", "tray", "a1", "tint", 1.2, loc=(-6.0, 1.1))
    for name, lab, c, y in (("d1", "Admissions", "a1", 2.4), ("d2", "Finance", "a2", 1.0),
                            ("d3", "Events", "a3", -0.4)):
        drawer(name, lab, c, (-2.0, y), w=2.4)
    kit.dotted("path1", (-5.3, 1.55), (-4.4, 2.9), (-3.3, 2.4), count=11)
    kit.dotted("path2", (-5.25, 1.1), (-4.3, 1.45), (-3.3, 1.0), count=9)
    kit.dotted("path3", (-5.3, 0.65), (-4.4, -0.6), (-3.3, -0.4), count=10)
    channel("channel", (4.6, 0.95), w=4.6, h=4.0)
    avatar("jl", "JL", "a1", (2.95, 1.45, 0.08), size=0.6)
    bubble("q", (4.65, 1.45, 0.08), w=2.6, h=0.8, tail="left")   # 0.1 clear of JL
    bubble("a", (4.45, -0.15, 0.08), w=2.8, h=0.9, color="tint", tail="right")
    chip("agentchip", "sparkle", "a1", "tint", 0.55, loc=(6.3, -0.25, 0.08))
    avatar("mr", "MR", "a2", (3.6, -2.65), size=0.85)


def s10():
    mark("mark", (0, 1.15), size=2.6)
    text("kingdom-sites.com", 0.5, "ink", loc=(0, -0.75), d=0.06)
    button("book", "Book a call", "a1", (0, -2.2), w=3.2, h=0.85)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--what", default="sheet2")
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default=None)
    ap.add_argument("--tag", default="")
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--samples", type=int, default=64)
    a = ap.parse_args(argv)
    kit.reset()
    sc = kit.setup(int(1920 * a.scale), int(1080 * a.scale), samples=a.samples)
    {"sheet2": sheet2, "s02": s02, "s04": s04, "s06": s06, "s07": s07, "s09": s09, "s10": s10}[a.what]()
    os.makedirs(a.out, exist_ok=True)
    name = a.name or (("component-sheet-v2" if a.what == "sheet2" else f"layout-{a.what}") + a.tag)
    sc.render.filepath = os.path.join(os.path.abspath(a.out), name + ".png")
    bpy.ops.render.render(write_still=True)


main()
