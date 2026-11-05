"""Scene 2 · Overload: "Most teams have more work than they can handle. And
they only know AI as a sloppy, jargon-filled email drafter."

SCRIPT.md beat sheet s02. Scene 1 stays exactly where it was (same objects from
layout_s01_s03, badge on "99+"). First the to-do list: the header and three
rows land one a beat, then the surge sends rows 4 to 15 up one every 2 frames,
past the top of the frame. Then the email draft lands at the right and buzzword
chips crowd it, filler lines grow in, and the card swells. The last beat is the
film's one silence: nothing moves. Every frame number comes from
video/timeline.json.

    blender/render.sh blender/s02_overload.py --mode drafts
    blender/render.sh blender/s02_overload.py --mode frames --frames 1-60
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import layout_s01_s03 as lay  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import keys, pop  # noqa: E402

SURGE_FIRST = -6        # row 4 lands 6 frames before the surge beat (70 for a beat on 76)
SURGE_EVERY = 2         # then one row every 2 frames: row 15 on 92


def build(S):
    B = S.beat
    lay.paper_world(badge_value=len(lay.BADGE_VALUES) - 1)   # scene 1, unchanged, "99+"
    w = lay.overload_world(finished=False)
    rows, email, chips, fillers = w["rows"], w["email"], w["chips"], w["fillers"]

    # j1-j4: header, then rows 1-3, one a beat
    for i, beat in enumerate(("todoHeader", "todoRow1", "todoRow2", "todoRow3")):
        pop(rows[i], B(beat) - 7, drop=0.3)

    # j5 the surge: rows 4-15 one every 2 frames, climbing past the top edge
    f4 = B("todoSurge") + SURGE_FIRST
    for i in range(4, len(rows)):
        pop(rows[i], f4 + SURGE_EVERY * (i - 4) - 7, drop=0.3)

    # j7 the email draft lands
    pop(email, B("email") - 7)

    # j8-j10, j12: buzzword chips land on the card one a beat
    for beat, ch in chips.items():
        pop(ch, B(beat) - 7, drop=0.3)

    # j11 filler: three skel lines grow in from the left, 3 frames apart, the
    # first fully in on the beat; the card swells to 1.06
    f = B("filler")
    for i, fg in enumerate(fillers):
        land = f + 3 * i
        keys(fg, "scale", ((1, (0.0001, 1, 1)), (land - 5, (0.0001, 1, 1)), (land, (1.0, 1, 1))))
    keys(email, "scale", ((f - 6, 1.0), (f, 1.07), (f + 5, 1.06)))

    # j13 swell: 1.06 -> 1.13 -> 1.12, settled by beat + 7
    f = B("swell")
    keys(email, "scale", ((f - 6, 1.06), (f, 1.13), (f + 7, lay.EMAIL_SCALE_END)))

    # j14 hold, j15 the silence: nothing is keyed after the swell settles
    return {"latest": B("hold"), "draft_frames": [f4 + 2 * 3, f4 + 2 * 11]}


sc.run("s02", build)
