"""Scene 10 · End card: "Let's help you save time, money and stress by letting
AI do the heavy lifting."

SCRIPT.md beat sheet s10. MR (from scene 9) leaves so the ground is clear on
the first beat; the Kingdom Sites mark lands (its own colours, kit.mark()), the
address under it, then the Book a call button. Everything holds still. The
button dips on the press frame (Remotion's cursor is fully pressed on it; its
pixel goes to video/timeline/targets/s10.json); after the press the picture
holds still to the last frame for Remotion's fade to white, then black.
Every frame comes from video/timeline.json (beatsLocal, presses).

    blender/render.sh blender/s10_end_card.py --mode drafts
    blender/render.sh blender/s10_end_card.py --mode frames --frames 1-60
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import avatar, button, mark, pop, pop_out, text  # noqa: E402

MR_AT = (-5.0, -2.45)


def build(S):
    B = S.beat

    # MR carries over from scene 9 (handoff table) and leaves first: the exit
    # ends on the clear beat, so the ground is empty when the voice starts
    mr = avatar("mr", "MR", "a2", MR_AT, size=0.85)
    pop_out(mr, B("clear") - 8)

    # j2 mark, j3 address, j4 button: each lands on its beat
    mk = mark("mark", (0, 1.15, 0), size=2.6)
    pop(mk, B("mark") - 7)
    addr = text("kingdom-sites.com", 0.5, "ink", loc=(0, -0.75, 0), d=0.06)
    pop(addr, B("address") - 7, drop=0.3)
    book = button("book", "Book a call", "a1", (0, -2.2, 0), w=3.2, h=0.85)
    pop(book, B("button") - 7)

    # j13 press: Book a call dips on the beat; then everything holds still
    kit.press(book, S.press_frame("bookACall"))

    return {"presses": [sc.Press("bookACall", book, w=3.2)],
            "latest": B("cursorIn"),
            "draft_frames": [10, 24, 194, 202]}


sc.run("s10", build)
