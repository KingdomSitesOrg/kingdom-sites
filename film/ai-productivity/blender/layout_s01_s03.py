"""The paper world of scenes 1 to 3, built once here so the three scenes carry
it byte for byte (SCRIPT.md handoff table: s01 -> s02 -> s03).

Every scene that shows these objects calls the same functions with the same
arguments, so the geometry, rotations and seeds are identical on both sides of
each cut. The scenes only add motion.

    paper_world()      scene 1's stacks, stickies, the inbox and its badge
    overload_world()   scene 2's to-do list and the crowded email draft
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import kit  # noqa: E402
from kit import buzz_chip, chip, counter_badge, email_card, stack, sticky, todo_list  # noqa: E402

# (name, (x, y), rot, n, seed): SCRIPT.md s01 beat sheet
STACKS = (
    ("stackA", (-6.1, 2.2), 6, 4, 11),
    ("stackB", (-3.6, 2.6), -5, 5, 12),
    ("stackC", (-1.2, 2.0), 4, 3, 13),
    ("stackD", (-5.4, -1.6), -3, 4, 14),
    ("stackE", (-2.6, -1.9), 7, 5, 15),
)

# (name, (x, y, z), rot, colour): z = the stack's top (n x 0.04 + 0.035) + 0.005
STICKIES = (
    ("stickyA", (-5.75, 1.75, 0.2), -8, "a2"),
    ("stickyB", (-3.25, 3.05, 0.24), 7, "a3"),
    ("stickyD", (-5.0, -2.1, 0.2), 10, "a1"),
    ("stickyE", (-2.3, -1.45, 0.24), -6, "a2"),
)

INBOX_AT = (5.4, 2.4)
BADGE_AT = (5.95, 2.85, 0.06)
BADGE_VALUES = ["3", "12", "27", "48", "99+"]
# final pass (review note): digits 1.25x the kit default (0.26), pill 1.2x (0.42),
# so the count reads on a phone; the badge's place is unchanged
# phase 3 (whole-film review p01): digits 0.45, pill 0.66, so "99+" is about as
# tall as the film's other labels; same place (BADGE_AT)
BADGE_SIZE, BADGE_H = 0.45, 0.66

TODO_AT = (1.4, -3.5)
TODO_ROWS = 16
EMAIL_AT = (5.2, -1.2)
EMAIL_W, EMAIL_H = 3.4, 2.6
EMAIL_SCALE_END = 1.12          # the card's size after the swell (s02 j13), carried into s03
# (beat name, colour, card-relative (x, y)): SCRIPT.md s02 j8-j10, j12
BUZZ = (
    ("chip1", "a3", (-0.9, 0.65)),
    ("chip2", "tint", (0.55, 0.3)),
    ("chip3", "a2", (0.9, -0.55)),
    ("chip4", "a1", (-0.6, -0.85)),
)
BUZZ_Z = 0.07                   # on the card's top surface (the card is 0.07 thick)


def paper_world(badge_value=None):
    """Scene 1's objects at their resting places. Returns a dict of the groups.
    badge_value: show that value index for a held frame (scenes 2 and 3 show
    the last one, "99+"); None leaves the badge as built (value 0 showing)."""
    stacks = {name: stack(name, loc, rot, n=n, seed=seed) for name, loc, rot, n, seed in STACKS}
    stickies = {name: sticky(name, loc, rot, color=c) for name, loc, rot, c in STICKIES}
    inbox = chip("inbox", "tray", "a1", "tint", 1.2, loc=INBOX_AT)
    badge = counter_badge("badge", BADGE_VALUES, loc=BADGE_AT, h=BADGE_H, size=BADGE_SIZE)
    if badge_value is not None:
        kit.counter_show(badge, badge_value)
    return dict(stacks=stacks, stickies=stickies, inbox=inbox, badge=badge)


def overload_world(finished=False):
    """Scene 2's to-do list and email draft. finished=True builds them as they
    are at the end of scene 2 (every row, every chip, the filler lines shown,
    the card at 1.12) for scene 3; otherwise the fillers are hidden and the
    card is at 1, for scene 2 to animate."""
    todo = todo_list("todo", loc=TODO_AT, rows=TODO_ROWS)
    rows = [bpy.data.objects[f"todo_row{i}"] for i in range(TODO_ROWS)]
    email = email_card("email", loc=EMAIL_AT, w=EMAIL_W, h=EMAIL_H, fillers_hidden=not finished)
    chips = {}
    for beat, c, (x, y) in BUZZ:
        chips[beat] = buzz_chip(f"email_{beat}", c, email, (x, y, BUZZ_Z))
    fillers = [bpy.data.objects[f"email_filler{i}"] for i in range(3)]
    if finished:
        email.scale = (EMAIL_SCALE_END,) * 3
    return dict(todo=todo, rows=rows, email=email, chips=chips, fillers=fillers)
