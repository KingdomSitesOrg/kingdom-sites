"""Scene 1 · Paper: "A school has a thousand moving parts. Most of them still
run on paper."

SCRIPT.md beat sheet s01. Kraft paper stacks pop up across the left two thirds
of the table one a beat, sticky notes land on them, then the inbox lands at the
top right and its badge counts up 3, 12, 27, 48, 99+ one value a beat. The
right of the frame stays clear for scene 2. Film frame 0 holds local frame 1:
the bare ground. Every frame number comes from video/timeline.json.

    blender/render.sh blender/s01_paper.py --mode drafts
    blender/render.sh blender/s01_paper.py --mode frames --frames 1-60
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import layout_s01_s03 as lay  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import pop  # noqa: E402

# beat name for each object's landing (SCRIPT.md s01)
LANDS = (
    ("stackA", "stackA"), ("stackB", "stackB"), ("stickyA", "stickyA"), ("stackC", "stackC"),
    ("stackD", "stackD"), ("stickyB", "stickyB"), ("stackE", "stackE"), ("stickyD", "stickyD"),
    ("stickyE", "stickyE"),
)
COUNT_BEATS = ("count12", "count27", "count48", "count99")   # badge values 1..4


def build(S):
    B = S.beat
    w = lay.paper_world()
    obs = {**w["stacks"], **w["stickies"]}

    # j1-j8, j15: stacks and stickies land one a beat (fully down on the beat)
    for name, beat in LANDS:
        ob = obs[name]
        # a sticky drops less far: it is pressed down onto its stack
        pop(ob, B(beat) - 7, drop=0.35 if name.startswith("sticky") else 0.5)

    # j9 inbox lands at the top right
    pop(w["inbox"], B("inbox") - 7)

    # j10 the badge lands showing "3"; j11-j14 the count climbs one value a beat
    badge = w["badge"]
    pop(badge, B("count3") - 7, drop=0.3)
    for i, beat in enumerate(COUNT_BEATS, start=1):
        kit.counter_step(badge, i, B(beat))

    # a few in-between frames for the drafts: mid-landing and mid-swap
    extra = [B("stackA") - 4, B("count99") - 2]
    return {"latest": S.length, "draft_frames": extra}


sc.run("s01", build)
