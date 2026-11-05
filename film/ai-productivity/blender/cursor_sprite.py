"""The Remotion cursor sprite: kit.cursor() alone, top-down, rendered in the
film's light at film scale (120 px a unit at 1080p, the size it has in the
approved scene 5 still), with its soft contact shadow baked in as alpha.

Step 1 (Blender, through the queue) renders three passes per scale into
renders/style/cursor/: the cursor on the ground (A), the cursor alone on a
transparent background (B) and the ground alone (C), and writes where the
pointer's tip lands in those frames (tip.json).

    blender/render.sh blender/cursor_sprite.py

Step 2 (plain python3 with Pillow and numpy, no Blender) composes the sprite:
cursor pixels from B, shadow alpha = 1 - A / C wherever the cursor is not,
crops to the drawn pixels and writes video/public/cursor.png (1080p scale),
video/public/cursor@2x.png (for a 4K render) and video/public/cursor.json.

    python3 blender/cursor_compose.py
"""

import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402
import kit  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "renders", "style", "cursor")
PX_PER_UNIT = 1920 / 16.0
SPAN = 2.0                 # units covered by the render (square)
CENTRE = (0.18, -0.2)      # the shadow falls down and right
Z = 0.22                   # the cursor floats above what it rests on (preview lessons)


def tip_world(root):
    """The pointer's tip: the vertex furthest up and left on the ink arrow."""
    dg = bpy.context.evaluated_depsgraph_get()
    best = None
    for ob in root.children_recursive:
        if ob.type != "CURVE":
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            w = ob.matrix_world @ v.co
            score = -w.x + w.y
            if best is None or score > best[0]:
                best = (score, w.copy())
        ev.to_mesh_clear()
    return best[1]


def main():
    os.makedirs(OUT, exist_ok=True)
    info = {}
    for scale in (1, 2):
        px = int(round(SPAN * PX_PER_UNIT * scale))
        kit.reset()
        sc = kit.setup(px, px, samples=64, tilt_deg=0.0)
        cam = sc.camera
        cam.data.ortho_scale = SPAN
        cam.location = (CENTRE[0], CENTRE[1], 30.0)
        cam.rotation_euler = (0.0, 0.0, 0.0)
        cur = kit.cursor("cursor", (0, 0, Z))
        ink = [c for c in cur.children if c.name.startswith("icon_cursor")]
        # the ink arrow is the second (smaller) icon; the first is its paper rim
        ink_root = min(ink, key=lambda r: r.scale.x)
        rim_root = max(ink, key=lambda r: r.scale.x)
        bpy.context.view_layer.update()
        tips = {}
        for label, root in (("ink", ink_root), ("rim", rim_root)):
            w = tip_world(root)
            u, v, _ = world_to_camera_view(sc, cam, w)
            tips[label] = [u * px, (1 - v) * px]
        ground = bpy.data.objects["ground"]
        parts = [o for o in bpy.data.objects if o.name != "ground" and o.type in ("CURVE", "FONT", "MESH")]

        def shot(name, show_ground, show_cursor, transparent):
            ground.hide_render = not show_ground
            for o in parts:
                o.hide_render = not show_cursor
            sc.render.film_transparent = transparent
            sc.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
            sc.render.filepath = os.path.join(OUT, f"{name}@{scale}x.png")
            bpy.ops.render.render(write_still=True)

        shot("A_cursor_on_ground", True, True, False)
        shot("B_cursor_alone", False, True, True)
        shot("C_ground", True, False, False)
        info[f"{scale}x"] = {"size": px, "tip": tips["ink"], "rimTip": tips["rim"],
                             "pxPerUnit": PX_PER_UNIT * scale, "z": Z, "cursorSize": 0.7}
    with open(os.path.join(OUT, "tip.json"), "w") as fh:
        json.dump(info, fh, indent=2)
    print("cursor passes ->", OUT, json.dumps(info))


main()
