"""Scene 4 · Project: "Give Claude your handbook, your policies, your voice,
once. Then share it with your whole team."

SCRIPT.md beat sheet s04. The folder from scene 3 (handoff: (0, 0.2, 0), scale
1.2) becomes the shared project card; the handbook, policies and style guide
cards slide in from the right into its wells; MR starts it, JL and AK join it
(the team). On the exit beat everything but MR leaves, and MR walks over to
(3.6, -2.65), where scene 5 picks it up.

Every frame comes from video/timeline.json (scene s04 beatsLocal).

    blender/render.sh blender/s04_project.py --mode drafts
    blender/render.sh blender/s04_project.py --mode frames --frames 1-60
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import scene_common as sc  # noqa: E402
from kit import avatar, card, folder, keys, pop, pop_out, project_card  # noqa: E402

FOLDER_AT = (0.0, 0.2, 0.0)       # handoff from scene 3
FOLDER_SCALE = 1.2
PROJECT_AT = (0.0, 0.45)
MR_FROM = (-1.2, -2.75, 0.0)
MR_TO = (3.6, -2.65, 0.0)          # handoff to scene 5
# The cards are 6.4 wide: their left edge must start past x = +9 (PLAN.md lesson),
# so they start at x 12.5 (SCRIPT.md said 10.5, which leaves the left 1.3 units
# of the card in frame at x 7.3 before it moves).
CARD_FROM_X = 12.5
CARDS = (  # name, event, y, icon, accent, label
    ("handbook", "handbook", 1.2, "book-open-text", "a1", "Handbook"),
    ("policies", "policies", 0.05, "clipboard-text", "a2", "Policies"),
    ("style", "styleGuide", -1.1, "pen-nib", "a3", "Style guide"),
)


def build(S):
    B = S.beat

    # j0: the folder from scene 3, exactly as it ended there
    fd = folder("folder", FOLDER_AT, color="a1")
    fd.scale = (FOLDER_SCALE,) * 3

    # j1 mr: the person starts it
    mr = avatar("mr", "MR", "a2", MR_FROM[:2], size=0.85)
    pop(mr, B("mr") - 7)

    # j2 project: the folder shrinks away while the project card lands on it
    f = B("project")
    keys(fd, "scale", ((f - 7, FOLDER_SCALE), (f - 3, FOLDER_SCALE * 0.55), (f, 0.0001)))
    proj = project_card("project", PROJECT_AT, w=7.2, h=4.4)
    pop(proj, f - 7)

    # j3, j5, j6: each card slides in from the right into its well, landing on
    # its beat with a small overshoot two frames before
    cards = []
    for name, ev, y, ic, ac, lab in CARDS:
        c = card(name, (CARD_FROM_X, y, 0.08), w=6.4, h=1.0, icon_name=ic, accent=ac, label=lab, n_lines=1)
        f = B(ev)
        keys(c, "location", ((f - 14, (CARD_FROM_X, y, 0.08)), (f - 2, (-0.12, y, 0.08)), (f, (0.0, y, 0.08))))
        cards.append(c)

    # j10 jl, j11 ak: the team joins
    jl = avatar("jl", "JL", "a1", (0.0, -2.75), size=0.85)
    pop(jl, B("jl") - 7)
    ak = avatar("ak", "AK", "a3", (1.2, -2.75), size=0.85)
    pop(ak, B("ak") - 7)

    # j15 exit: the project, its cards, JL and AK leave; MR stays
    # (the cards shrink towards the project's centre with it, so they never hang
    # off its edges while it goes)
    f = B("exit")
    for ob in (proj, jl, ak):
        pop_out(ob, f)
    px, py = PROJECT_AT
    for c, (_, _, y, *_r) in zip(cards, CARDS):
        pop_out(c, f)
        keys(c, "location", ((f, (0.0, y, 0.08)), (f + 2, (0.0, py + 1.04 * (y - py), 0.08)),
                             (f + 8, (px, py, 0.08))))

    # j16 mrMove -> j17 mrLand: MR hops over to where scene 5 needs it,
    # a 1% overshoot two frames before landing, then a soft settle
    f0, f1 = B("mrMove"), B("mrLand")
    mid = ((MR_FROM[0] + MR_TO[0]) / 2, (MR_FROM[1] + MR_TO[1]) / 2, 0.25)
    keys(mr, "location", ((f0, MR_FROM), ((f0 + f1) // 2, mid),
                          (f1 - 2, (MR_TO[0] + 0.05, MR_TO[1], 0.0)), (f1, MR_TO)))
    keys(mr, "scale", ((f1 - 3, 1.0), (f1, 1.04), (f1 + 3, 0.99), (f1 + 6, 1.0)))

    return {"latest": B("ak") + 15,
            "draft_frames": [B("ak") + 15, B("project") - 3, B("handbook") - 6, B("exit") + 4, (f0 + f1) // 2]}


sc.run("s04", build)
