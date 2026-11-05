"""Shared kit for the AI productivity film: palette, light rig, camera and the
soft 2.5D objects every scene is built from.

Everything is made from two primitives so the film has one look:
  slab()  a rounded-rectangle shape extruded with a rounded edge (cards, paper,
          buttons, avatars, the phone)
  icon()  a Phosphor icon (MIT) imported from SVG, extruded with a rounded edge
Text uses Archivo SemiBold, the site's typeface. Never italics.

Units: the camera frame is 16 units wide and 9 tall. Z is up; the camera looks
down at the table with a small tilt so bevels catch the light.
"""

import math
import os

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(HERE, "assets", "icons")
FONT = os.path.join(HERE, "assets", "fonts", "Archivo-SemiBold.ttf")

# Each palette: one warm ground, ink, white paper, kraft tones for the "before"
# paper chaos, and three accents for the "after". Navy with gold is not allowed.
PALETTES = {
    "sky": dict(ground="#F6F2EA", ink="#262A44", paper="#FFFFFF", kraft="#E8DCC6",
                kraft2="#D6C6AA", a1="#4D8EF7", a2="#FFC53D", a3="#35C795", tint="#E4EDFD", skel="#CDD5E4"),
    "garden": dict(ground="#F3F3EC", ink="#1E3330", paper="#FFFFFF", kraft="#E8DCC4",
                   kraft2="#D5C5A6", a1="#23A971", a2="#FF8A3D", a3="#5AAEFF", tint="#DFF3E9", skel="#C9D8D2"),
    "berry": dict(ground="#F7F1EE", ink="#2B2440", paper="#FFFFFF", kraft="#E9DBC9",
                  kraft2="#D7C4AC", a1="#EE4F6E", a2="#1FAFAC", a3="#FFC64A", tint="#FCE4EA", skel="#DCCDD3"),
}
P = dict(PALETTES["berry"])   # locked by Thomas, 2026-11-05


def use_palette(name):
    P.clear()
    P.update(PALETTES[name])


def lin(hexstr):
    h = hexstr.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


# ------------------------------------------------------------------ scene

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _MATS.clear()   # cached materials die with the old file


def setup(width=1920, height=1080, samples=64, tilt_deg=10.0):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = width, height
    sc.render.resolution_percentage = 100
    sc.render.fps = 30
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = -0.2
    ee = sc.eevee
    for attr, val in (("taa_render_samples", samples), ("use_raytracing", True),
                      ("use_shadows", True), ("shadow_ray_count", 2),
                      ("shadow_step_count", 8), ("use_gtao", True), ("gtao_distance", 1.2),
                      ("fast_gi_method", "GLOBAL_ILLUMINATION")):
        try:
            setattr(ee, attr, val)
        except (AttributeError, TypeError):
            pass

    # world: a soft warm fill so shadows never go grey-dark
    w = bpy.data.worlds.new("world")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = lin("#FFFDF8")
    bg.inputs["Strength"].default_value = 0.62

    # key: a soft sun from top left, shadows fall down and right
    sun_d = bpy.data.lights.new("key", "SUN")
    sun_d.energy = 2.1
    sun_d.angle = math.radians(14)
    sun_d.color = (1.0, 0.985, 0.96)
    for attr, val in (("use_shadow_jitter", True), ("shadow_jitter_overblur", 10.0)):
        try:
            setattr(sun_d, attr, val)
        except AttributeError:
            pass
    sun = bpy.data.objects.new("key", sun_d)
    sun.rotation_euler = (math.radians(-34), 0.0, math.radians(32))
    sc.collection.objects.link(sun)

    # ground
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
    g = bpy.context.active_object
    g.name = "ground"
    g.data.materials.append(mat("ground", P["ground"], rough=0.9, spec=0.1))

    # camera: orthographic, 16 units across, small tilt
    cam_d = bpy.data.cameras.new("cam")
    cam_d.type = "ORTHO"
    cam_d.ortho_scale = 16.0
    cam = bpy.data.objects.new("cam", cam_d)
    t = math.radians(tilt_deg)
    dist = 30.0
    cam.location = (0.0, -dist * math.sin(t), dist * math.cos(t))
    cam.rotation_euler = (t, 0.0, 0.0)
    sc.collection.objects.link(cam)
    sc.camera = cam
    return sc


_MATS = {}


def mat(name, hexcol, rough=0.55, spec=0.25, emit=0.0):
    key = (name, hexcol, rough, spec, emit)
    if key in _MATS:
        return _MATS[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(hexcol)
    b.inputs["Roughness"].default_value = rough
    for k in ("Specular IOR Level",):
        if k in b.inputs:
            b.inputs[k].default_value = spec
    if emit:
        b.inputs["Emission Color"].default_value = lin(hexcol)
        b.inputs["Emission Strength"].default_value = emit
    _MATS[key] = m
    return m


def col(key):
    """Palette colour by key, or a literal hex."""
    return P.get(key, key)


# ------------------------------------------------------------------ primitives

def v3(loc):
    return tuple(loc) + (0.0,) * (3 - len(loc))


def group(name, loc=(0, 0, 0), rot=0.0, parent=None):
    loc = v3(loc)
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.2
    bpy.context.scene.collection.objects.link(e)
    if parent:
        e.parent = parent
    e.location = loc
    e.rotation_euler = (0, 0, math.radians(rot))
    return e


def _rrect(w, h, r, seg=10):
    r = max(0.0, min(r, w / 2, h / 2))
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90),
                       (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def slab(name, w, h, d, r, color, parent=None, loc=(0, 0, 0), rot=0.0, bevel=None,
         rough=0.55, emit=0.0):
    """Rounded-rectangle slab sitting on z=loc.z (its bottom), centred on x, y."""
    loc = v3(loc)
    b = bevel if bevel is not None else min(d * 0.45, 0.07, w / 4, h / 4)
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    sp = cu.splines.new("POLY")
    pts = _rrect(w - 2 * b, h - 2 * b, max(r - b, 0.0))
    sp.points.add(len(pts) - 1)
    for p, (x, y) in zip(sp.points, pts):
        p.co = (x, y, 0.0, 1.0)
    sp.use_cyclic_u = True
    cu.extrude = max(d / 2 - b, 0.0005)
    cu.bevel_depth = b
    cu.bevel_resolution = 5
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat(name, col(color), rough=rough, emit=emit))
    if parent:
        ob.parent = parent
    ob.location = (loc[0], loc[1], loc[2] + d / 2)
    ob.rotation_euler = (0, 0, math.radians(rot))
    return ob


_ICON_CACHE = {}
# The icon's rounded edge grows its outline by the bevel. A fixed 0.012 swallows
# the small sparks of an icon under about 0.35 units across (the sparkle turns
# into a blob), so small icons get a bevel in proportion to their size. Every
# icon at 0.48 units or more keeps the approved 0.012 exactly.
ICON_BEVEL = 0.012
ICON_BEVEL_PER_SIZE = 0.025


def icon_bevel(size):
    return min(ICON_BEVEL, ICON_BEVEL_PER_SIZE * size)


def icon(name, size, color, parent=None, loc=(0, 0, 0), d=0.06, rot=0.0):
    """Phosphor icon, `size` units across, extruded `d`, bottom at loc.z."""
    loc = v3(loc)
    bv = icon_bevel(size)
    path = os.path.join(ICONS, name + ".svg")
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=path)
    new = [o for o in bpy.data.objects if o not in before and o.type == "CURVE"]
    # bounding box of the imported shapes
    xs, ys = [], []
    for o in new:
        for sp in o.data.splines:
            for bp in sp.bezier_points:
                v = o.matrix_world @ bp.co
                xs.append(v.x)
                ys.append(v.y)
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    span = max(max(xs) - min(xs), max(ys) - min(ys))
    k = size / span
    root = group(f"icon_{name}", loc=(loc[0], loc[1], loc[2] + d / 2), rot=rot, parent=parent)
    root.scale = (k, k, k)
    m = mat("icon_" + color, col(color), rough=0.45)
    for o in new:
        o.data.dimensions = "2D"
        o.data.fill_mode = "BOTH"
        o.data.extrude = max(d / 2 - bv, 0.002) / k
        o.data.bevel_depth = bv / k
        o.data.bevel_resolution = 3
        o.data.materials.clear()
        o.data.materials.append(m)
        mw = o.matrix_world.copy()
        for c in list(o.users_collection):
            c.objects.unlink(o)
        bpy.context.scene.collection.objects.link(o)
        o.parent = root
        o.matrix_parent_inverse.identity()
        o.location = (mw.translation.x - cx, mw.translation.y - cy, 0.0)
        o.scale = (mw.to_scale().x, mw.to_scale().y, 1.0)
    for c in list(bpy.data.collections):
        if not c.objects and not c.children:
            bpy.data.collections.remove(c)
    return root


def text(body, size, color, parent=None, loc=(0, 0, 0), d=0.03, align="CENTER", rot=0.0):
    loc = v3(loc)
    cu = bpy.data.curves.new("txt", "FONT")
    cu.body = body
    cu.font = bpy.data.fonts.load(FONT, check_existing=True)
    cu.size = size
    cu.align_x = align
    cu.align_y = "CENTER"
    cu.extrude = d / 2
    cu.bevel_depth = min(0.0025, d / 6)
    cu.space_character = 1.04
    ob = bpy.data.objects.new("txt", cu)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat("txt_" + color, col(color), rough=0.5))
    if parent:
        ob.parent = parent
    ob.location = (loc[0], loc[1], loc[2] + d / 2)
    ob.rotation_euler = (0, 0, math.radians(rot))
    return ob


# ------------------------------------------------------------------ components

def lines(parent, x0, y0, widths, color, gap=0.2, h=0.085, z=0.04):
    """Skeleton text: rows of rounded bars, left-aligned at x0."""
    for i, w in enumerate(widths):
        slab("line", w, h, 0.02, h / 2, color, parent, (x0 + w / 2, y0 - i * gap, z), bevel=0.008)


def paper(name="paper", loc=(0, 0, 0), rot=0.0, w=1.7, h=2.2, color="paper", ink="kraft2",
          parent=None, heading=True):
    g = group(name, loc, rot, parent)
    slab(name + "_sheet", w, h, 0.035, 0.06, color, g)
    x0 = -w / 2 + 0.22
    if heading:
        slab("head", w * 0.42, 0.13, 0.02, 0.065, ink, g, (x0 + w * 0.21, h / 2 - 0.32, 0.035), bevel=0.008)
    lines(g, x0, h / 2 - 0.62, [w * 0.68, w * 0.6, w * 0.7, w * 0.45, w * 0.62, w * 0.5][: int(h / 0.38)],
          ink, z=0.035)
    return g


def stack(name="stack", loc=(0, 0, 0), rot=0.0, n=4, color="kraft", ink="kraft2", parent=None, seed=0):
    g = group(name, loc, rot, parent)
    import random
    rnd = random.Random(seed)
    for i in range(n):
        p = paper(f"{name}_{i}", (rnd.uniform(-0.12, 0.12), rnd.uniform(-0.1, 0.1), i * 0.04),
                  rnd.uniform(-7, 7), color=color if i < n - 1 else "paper", ink=ink, parent=g,
                  heading=i == n - 1)
    return g


def sticky(name="sticky", loc=(0, 0, 0), rot=0.0, color="a2", parent=None):
    g = group(name, loc, rot, parent)
    slab(name, 0.95, 0.95, 0.03, 0.04, color, g)
    lines(g, -0.3, 0.12, [0.55, 0.4], "ink", gap=0.2, h=0.06, z=0.03)
    return g


def folder(name="folder", loc=(0, 0, 0), rot=0.0, color="a1", parent=None, w=2.6, h=2.0):
    g = group(name, loc, rot, parent)
    slab(name + "_back", w, h, 0.06, 0.12, color, g)
    slab(name + "_tab", w * 0.38, 0.5, 0.06, 0.12, color, g, (-w / 2 + w * 0.19, h / 2 - 0.05, 0))
    slab(name + "_paper", w * 0.86, h * 0.8, 0.03, 0.06, "paper", g, (0, 0.18, 0.06))
    slab(name + "_front", w, h * 0.78, 0.07, 0.12, color, g, (0, -h * 0.11, 0.09), rough=0.5)
    return g


def chip(name, icon_name, color, bg="tint", size=0.7, parent=None, loc=(0, 0, 0)):
    g = group(name, loc, 0, parent)
    slab(name + "_bg", size, size, 0.05, size * 0.28, bg, g)
    icon(icon_name, size * 0.58, color, g, (0, 0, 0.05), d=0.05)
    return g


def card(name="card", loc=(0, 0, 0), rot=0.0, w=3.0, h=1.6, icon_name="file-text", accent="a1",
         label=None, parent=None, n_lines=2):
    g = group(name, loc, rot, parent)
    slab(name + "_bg", w, h, 0.07, 0.16, "paper", g)
    chip(name + "_chip", icon_name, accent, "tint", 0.72, g, (-w / 2 + 0.6, 0, 0.07))
    x0 = -w / 2 + 1.12
    if label:
        text(label, 0.26, "ink", g, (x0, 0.22 if n_lines else 0, 0.07), align="LEFT")
        lines(g, x0, -0.18, [w * 0.42, w * 0.3][:n_lines], "skel", h=0.09, z=0.07)
    else:
        lines(g, x0, 0.18, [w * 0.45, w * 0.32, w * 0.38][:n_lines + 1], "skel", h=0.1, z=0.07)
    return g


def avatar(name="avatar", initials="MR", color="a1", loc=(0, 0, 0), size=0.9, parent=None):
    g = group(name, loc, 0, parent)
    slab(name + "_ring", size, size, 0.08, size / 2, "paper", g)
    slab(name + "_disc", size * 0.84, size * 0.84, 0.1, size * 0.42, color, g, (0, 0, 0.0))
    # never below 0.24 units, so two letters still read on a phone (fix 1);
    # every avatar at size 0.71 or more keeps the approved size * 0.34
    text(initials, max(size * 0.34, 0.24), "paper", g, (0, 0, 0.1))
    return g


def button(name="button", label="Book a call", color="a1", loc=(0, 0, 0), w=2.6, h=0.75, parent=None):
    g = group(name, loc, 0, parent)
    slab(name + "_bg", w, h, 0.12, h / 2, color, g)
    text(label, h * 0.36, "paper", g, (0, 0, 0.12))
    return g


def bubble(name="bubble", loc=(0, 0, 0), color="paper", w=2.8, h=1.1, parent=None, ink="skel",
           tail="left"):
    g = group(name, loc, 0, parent)
    sx = -1 if tail == "left" else 1
    slab(name + "_tail", 0.45, 0.45, 0.06, 0.08, color, g, (sx * (w / 2 - 0.35), -h / 2 + 0.12, 0), rot=45)
    slab(name + "_bg", w, h, 0.07, h * 0.42, color, g)
    lines(g, -w / 2 + 0.3, 0.14, [w * 0.62, w * 0.42], ink, gap=0.26, h=0.1, z=0.07)
    return g


VIEWFINDER = "#2E3350"   # the phone screen while the camera is open


def phone(name="phone", loc=(0, 0, 0), rot=0.0, w=1.7, h=3.3, parent=None):
    """A phone with its camera open on a paper form: dark viewfinder, the form
    inside a focus frame, a shutter button. Its `_flash` child is a white
    glowing panel kept at zero scale; animate its scale for the shutter flash."""
    g = group(name, loc, rot, parent)
    d = 0.16
    slab(name + "_body", w, h, d, 0.3, "ink", g, rough=0.35)
    sw, sh = w - 0.16, h - 0.2
    slab(name + "_screen", sw, sh, 0.02, 0.24, VIEWFINDER, g, (0, 0, d), bevel=0.008, rough=0.3)
    slab(name + "_island", 0.42, 0.11, 0.02, 0.055, "ink", g, (0, h / 2 - 0.24, d + 0.02), bevel=0.008)
    # the form, seen through the camera
    pg = group(name + "_view", (0, 0.2, d + 0.02), 3.0, g)
    slab("vf_paper", 1.0, 1.3, 0.015, 0.04, "paper", pg, bevel=0.006)
    slab("vf_head", 0.42, 0.08, 0.01, 0.04, "skel", pg, (-0.17, 0.45, 0.015), bevel=0.004)
    for i, lw in enumerate((0.7, 0.6, 0.72, 0.5, 0.64)):
        slab("vf_line", lw, 0.055, 0.01, 0.027, "skel", pg, (-0.36 + lw / 2, 0.24 - i * 0.15, 0.015), bevel=0.004)
    # focus brackets: four rounded L corners around the form
    fw, fh, arm, t = 1.32, 1.62, 0.34, 0.09
    for sx in (-1, 1):
        for sy in (-1, 1):
            cx, cy = sx * fw / 2, 0.2 + sy * fh / 2
            slab("bk_h", arm, t, 0.03, t / 2, "a2", g, (cx - sx * (arm / 2 - t / 2), cy, d + 0.05), bevel=0.012)
            slab("bk_v", t, arm, 0.03, t / 2, "a2", g, (cx, cy - sy * (arm / 2 - t / 2), d + 0.05), bevel=0.012)
    # shutter
    slab(name + "_shutter_ring", 0.5, 0.5, 0.03, 0.25, "paper", g, (0, -h / 2 + 0.5, d + 0.02), bevel=0.01)
    slab(name + "_shutter", 0.38, 0.38, 0.05, 0.19, "paper", g, (0, -h / 2 + 0.5, d + 0.02), bevel=0.015)
    fl = slab(name + "_flash", sw, sh, 0.02, 0.24, "#FFFFFF", g, (0, 0, d + 0.09), bevel=0.006, emit=2.5)
    fl.scale = (0.0001, 0.0001, 0.0001)
    return g


def cloud(name="cloud", loc=(0, 0, 0), size=1.0, parent=None, accent="a1"):
    """A soft puffy cloud made of round slabs, with an upload arrow chip."""
    g = group(name, loc, 0, parent)
    k = size
    for i, (x, y, r) in enumerate(((-1.05, -0.15, 0.62), (-0.25, 0.32, 0.92), (0.8, 0.12, 0.72))):
        slab(f"{name}_puff{i}", 2 * r * k, 2 * r * k, 0.3 * k, r * k, "paper", g, (x * k, y * k, 0), rough=0.6)
    slab(name + "_base", 3.3 * k, 1.05 * k, 0.3 * k, 0.52 * k, "paper", g, (0, -0.42 * k, 0), rough=0.6)
    chip(name + "_chip", "cloud-arrow-up", accent, "tint", 0.8 * k, g, (0, -0.12 * k, 0.3 * k))
    return g


def photo(name="photo", loc=(0, 0, 0), rot=0.0, parent=None, s=0.75):
    """The snapshot of the form: a small white card with a thin frame."""
    g = group(name, loc, rot, parent)
    slab(name + "_frame", 0.8 * s, 1.0 * s, 0.04, 0.06 * s, "paper", g)
    slab(name + "_img", 0.66 * s, 0.86 * s, 0.01, 0.04 * s, "tint", g, (0, 0, 0.04), bevel=0.004)
    for i, lw in enumerate((0.42, 0.36, 0.44)):
        slab("ph_line", lw * s, 0.05 * s, 0.01, 0.025 * s, "skel", g, (-0.2 * s + lw * s / 2, 0.18 * s - i * 0.13 * s, 0.05), bevel=0.003)
    return g


def table(name="table", loc=(0, 0, 0), rows=4, filled=4, w=4.2, parent=None, row_cols=None):
    row_h = 0.52
    h = 0.75 + rows * row_h + 0.2
    g = group(name, loc, 0, parent)
    slab(name + "_bg", w, h, 0.07, 0.18, "paper", g)
    slab(name + "_head", w - 0.3, 0.45, 0.02, 0.12, "tint", g, (0, h / 2 - 0.42, 0.07), bevel=0.01)
    for i in range(rows):
        y = h / 2 - 0.95 - i * row_h
        cols = row_cols or ("a1", "a2", "a3", "a1")
        rg = group(f"{name}_row{i}", (0, y, 0.07), 0, g)
        slab("cell", w * 0.3, 0.13, 0.025, 0.065, "ink" if i < filled else "tint", rg, (-w / 2 + 0.3 + w * 0.15, 0, 0), bevel=0.008)
        slab("cell", w * 0.22, 0.13, 0.025, 0.065, cols[i % len(cols)] if i < filled else "tint", rg,
             (-w / 2 + 0.3 + w * 0.3 + 0.25 + w * 0.11, 0, 0), bevel=0.008)
        if i < filled:
            icon("check-circle", 0.36, "a3", rg, (w / 2 - 0.45, 0, 0), d=0.04)
    return g


def bars(name="chart", loc=(0, 0, 0), w=3.6, h=2.6, values=(0.55, 0.85, 0.4, 0.7), parent=None):
    g = group(name, loc, 0, parent)
    slab(name + "_bg", w, h, 0.07, 0.18, "paper", g)
    cols = ("a1", "a2", "a3", "a1")
    n = len(values)
    bw = (w - 0.9) / n
    for i, v in enumerate(values):
        bh = (h - 0.9) * v
        slab("bar", bw * 0.62, bh, 0.12, 0.08, cols[i % 4], g,
             (-w / 2 + 0.45 + bw * (i + 0.5), -h / 2 + 0.45 + bh / 2, 0.07))
    return g


def drawer(name="drawer", label="Admissions", color="a1", loc=(0, 0, 0), w=2.6, h=1.1, parent=None,
           label_color="paper"):
    g = group(name, loc, 0, parent)
    slab(name + "_body", w, h, 0.3, 0.16, "paper", g)
    # fix 1: the label reads at phone size (0.24, was 0.19); the tag grows to
    # fit it and the handle sits a little lower so the two never touch
    # label_color: "paper" is the approved default; s07 passes "ink" so the
    # word reads on every tag colour at phone size (ink on butter is 9.4:1)
    t = text(label, 0.24, label_color, g, (0, 0.18, 0.33))
    tw = max(w * 0.62, _text_width(t) + 0.4)
    slab(name + "_tag", tw, 0.4, 0.03, 0.2, color, g, (0, 0.18, 0.3))
    slab(name + "_handle", w * 0.3, 0.12, 0.05, 0.06, "ink", g, (0, -0.28, 0.3))
    return g


def token(name="agent", loc=(0, 0, 0), color="a1", size=1.0, parent=None):
    g = group(name, loc, 0, parent)
    slab(name + "_halo", size * 1.35, size * 1.35, 0.03, size * 0.675, "tint", g)
    slab(name + "_disc", size, size, 0.22, size / 2, color, g, (0, 0, 0.03))
    icon("sparkle", size * 0.55, "paper", g, (0, 0, 0.25), d=0.05)
    return g


def cursor(name="cursor", loc=(0, 0, 0), size=0.7, parent=None):
    g = group(name, loc, 0, parent)
    icon("cursor", size * 1.18, "paper", g, (0, 0, 0.0), d=0.04)
    icon("cursor", size, "ink", g, (0.0, 0.0, 0.04), d=0.05)
    return g


# ------------------------------------------------------------------ motion

def _key_all(ob, frame, scale=None, z=None):
    if scale is not None:
        ob.scale = (scale, scale, scale)
        ob.keyframe_insert("scale", frame=frame)
    if z is not None:
        ob.location.z = z
        ob.keyframe_insert("location", index=2, frame=frame)


def pop(ob, f, drop=0.5):
    """Pop in at frame f: from nothing, slight overshoot, settle by f+14."""
    z = ob.location.z
    base = ob.scale.x
    _key_all(ob, f - 1, scale=0.0001, z=z + drop)
    _key_all(ob, f + 7, scale=base * 1.07, z=z)
    _key_all(ob, f + 11, scale=base * 0.985)
    _key_all(ob, f + 14, scale=base)


def move(ob, f0, f1, to):
    """Eased move from the current location (held until f0) to `to` at f1."""
    ob.keyframe_insert("location", frame=f0)
    ob.location = to
    ob.keyframe_insert("location", frame=f1)


def ease_all():
    for a in bpy.data.actions:
        try:
            curves = a.fcurves
        except AttributeError:
            curves = [fc for layer in a.layers for strip in layer.strips
                      for bag in strip.channelbags for fc in bag.fcurves]
        for fc in curves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"


# ------------------------------------------------------------------ connector

def bez(p0, c, p1, t):
    """Point on a quadratic curve from p0 through control c to p1 (x, y)."""
    u = 1.0 - t
    return (u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
            u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1])


def dotted(name, p0, c, p1, color="a1", spacing=0.24, dot=0.15, z=0.0, count=None, avoid=None):
    """The film's connector: a dotted line lying on the table between two
    things that pass something to each other. Returns the dots in order, so a
    scene can pop them in one after another along the way. `count` fixes the
    number of dots (timeline.json's `dots`); without it the spacing decides.
    `avoid` (optional, fix 2) is a list of footprints (xmin, xmax, ymin, ymax):
    a dot within dot/2 + 0.05 of one is not made, so a path never runs under
    the object it starts or ends at. Prefer moving the end points; this is the
    guard. Dropped dots are reported on stdout."""
    samples = [bez(p0, c, p1, i / 200) for i in range(201)]
    length = sum(math.dist(samples[i], samples[i + 1]) for i in range(200))
    n = max(2, int(length / spacing)) if not count else max(1, int(count) - 1)
    pad = dot / 2 + 0.05
    dots = []
    for i in range(n + 1):
        x, y = bez(p0, c, p1, i / n)
        if avoid and any(x0 - pad < x < x1 + pad and y0 - pad < y < y1 + pad
                         for x0, x1, y0, y1 in avoid):
            print(f"dotted({name}): dot {i} at ({x:.2f}, {y:.2f}) dropped, it is under an object")
            continue
        dots.append(slab(f"{name}_{i:02d}", dot, dot, 0.03, dot / 2, color, None, (x, y, z), bevel=0.012))
    return dots


def packet(name="packet", loc=(0, 0, 0), color="a2", parent=None):
    """A small rounded pill: a piece of data on its way somewhere."""
    g = group(name, loc, 0, parent)
    slab(name + "_bg", 0.62, 0.24, 0.08, 0.12, color, g)
    return g


# ================================================================== phase 1 additions
# Everything below was added in phase 1 (2026-11-05) for scenes 1 to 10. Every
# object is built only from slab(), icon(), text(), dotted() and packet(), in the
# Berry palette, with the same bevels and light as the approved objects above.
# Nothing above this line changed its look.

# ------------------------------------------------------------------ motion helpers

def fcurves(ob):
    """The object's animation curves (works with Blender 5's layered actions)."""
    ad = ob.animation_data
    if not ad or not ad.action:
        return []
    a = ad.action
    try:
        return list(a.fcurves)
    except AttributeError:
        return [fc for layer in a.layers for strip in layer.strips
                for bag in strip.channelbags for fc in bag.fcurves]


def value_at(ob, path, index, f, default):
    """The animated value of ob.path[index] at frame f, or `default` if unkeyed."""
    for fc in fcurves(ob):
        if fc.data_path == path and fc.array_index == index:
            return fc.evaluate(f)
    return default


def keys(ob, path, frames_vals):
    """Key `path` at each (frame, value). scale takes a number (uniform) or a
    3-tuple; location and rotation_euler take a 3-tuple."""
    for f, v in frames_vals:
        if path == "scale":
            ob.scale = (v, v, v) if isinstance(v, (int, float)) else v
        elif path == "location":
            ob.location = v
        elif path == "rotation_euler":
            ob.rotation_euler = v
        else:
            setattr(ob, path, v)
        ob.keyframe_insert(path, frame=f)


def hide_until(ob, f=1):
    """Keep an object hidden (scale ~0) from frame f until a later pop()."""
    base = ob.scale.x
    keys(ob, "scale", ((f, 0.0001),))
    ob.scale = (base, base, base)   # pop() scales to the current scale


def pop_out(ob, f, base=None):
    """Exit on f: scale 1 -> 1.04 at f+2 -> 0 at f+8, no drop."""
    if base is None:
        base = value_at(ob, "scale", 0, f, ob.scale.x)
    _key_all(ob, f, scale=base)
    _key_all(ob, f + 2, scale=base * 1.04)
    _key_all(ob, f + 8, scale=0.0001)


def press(ob, f, depth=0.06):
    """A button press on f: the group starts down at f-2, is fully down
    (z - depth) on f and back by f+6."""
    z0 = value_at(ob, "location", 2, f - 2, ob.location.z)
    for fr, z in ((f - 2, z0), (f, z0 - depth), (f + 6, z0)):
        ob.location.z = z
        ob.keyframe_insert("location", index=2, frame=fr)
    ob.location.z = z0


def bump(ob, f, peak=1.07, low=0.99, base=None):
    """A soft take-in bounce that peaks on f (the cloud taking the photo in)."""
    if base is None:
        base = value_at(ob, "scale", 0, f - 3, ob.scale.x)
    keys(ob, "scale", ((f - 3, base), (f, base * peak), (f + 4, base * low), (f + 7, base)))


def path_points(p):
    """(p0, c, p1) from a timeline.json path record."""
    return tuple(p["p0"]), tuple(p["c"]), tuple(p["p1"])


def dotted_path(p, color="a1", z=0.0):
    """The dotted line for a timeline.json path record, with its exact dot count."""
    return dotted(p["name"], *path_points(p), color=color, z=z, count=p.get("dots"))


def draw_in(dots, start, every=1.0, drop=0.12):
    """Draw a dotted line dot by dot: dot i lands at start + floor(i * every)."""
    for i, d in enumerate(dots):
        land = start + int(math.floor(i * every))
        pop(d, land - 7, drop=drop)
    return start + int(math.floor((len(dots) - 1) * every))


def ride(ob, pts, frames_t, z=0.45, lift=0.35, spin=0.0, rot0=None):
    """Key `ob` along the quadratic path `pts` = (p0, c, p1) at each (frame, t),
    lifted z + lift*sin(pi*t). `spin` turns about z over t = 0..1 (the agent
    token rolling)."""
    if rot0 is None:
        rot0 = ob.rotation_euler.z
    for f, t in frames_t:
        tt = min(max(t, 0.0), 1.0)
        x, y = bez(*pts, tt)
        ob.location = (x, y, z + lift * math.sin(math.pi * tt))
        ob.keyframe_insert("location", frame=f)
        if spin:
            ob.rotation_euler.z = rot0 - 2 * math.pi * spin * tt
            ob.keyframe_insert("rotation_euler", index=2, frame=f)


def ride_span(ob, pts, f0, f1, z=0.45, lift=0.35, spin=0.0, step=2, ease=False):
    """ride() from t=0 on f0 to t=1 on f1, keyed every `step` frames so the
    motion follows the curve. ease=True softens the start and end."""
    frames = list(range(f0, f1, step)) + [f1]
    out = []
    for f in frames:
        t = (f - f0) / max(f1 - f0, 1)
        if ease:
            t = t * t * (3 - 2 * t)
        out.append((f, t))
    ride(ob, pts, out, z=z, lift=lift, spin=spin)


# ------------------------------------------------------------------ objects (scene 1)

def _text_width(ob):
    bpy.context.view_layer.update()
    return ob.dimensions.x


def counter_badge(name="badge", values=("3",), loc=(0, 0, 0), color="a1", parent=None, h=0.42,
                  size=0.26):
    """The inbox's count: a raspberry pill with paper digits. One text child per
    value (`{name}_v{i}`) and one whole pill per value (`{name}_pill{i}`, a
    single slab as wide as that value needs), all but the first at scale 0.
    counter_step() swaps text and pill together. Widths per value are kept in
    the group's "widths" property.
    Fix 2: the pill was two round caps and a stretched middle, which left a dark
    notch where the cap arcs met; one whole slab per value has no join."""
    g = group(name, loc, 0, parent)
    d = 0.08
    txts = []
    for i, v in enumerate(values):
        t = text(v, size, "paper", g, (0, -0.005, d), d=0.025)
        t.name = f"{name}_v{i}"
        txts.append(t)
    widths = [max(h, _text_width(t) + 0.24) for t in txts]
    for i, w in enumerate(widths):
        pill = slab(f"{name}_pill{i}", w, h, d, h / 2, color, g, (0, 0, 0))
        if i:
            pill.scale = (0.0001, 0.0001, 0.0001)
    for t in txts[1:]:
        t.scale = (0.0001, 0.0001, 0.0001)
    g["widths"] = widths
    g["pill_h"] = h
    return g


def counter_show(badge, i):
    """Show value i of a counter badge (for a still): its digits and its pill."""
    for k in range(len(badge["widths"])):
        s = 1.0 if k == i else 0.0001
        bpy.data.objects[f"{badge.name}_v{k}"].scale = (s, s, s)
        bpy.data.objects[f"{badge.name}_pill{k}"].scale = (s, s, s)


def counter_step(badge, i, f):
    """The count changes to value i, fully shown on beat f: the old value
    shrinks away over 2 frames, the new one pops in, the pill of the new width
    replaces the old one on f-2 (under the shrink, so the swap is not seen) and
    the badge bounces 1.08 -> 1 over 6 frames."""
    name = badge.name
    old = bpy.data.objects[f"{name}_v{i - 1}"]
    new = bpy.data.objects[f"{name}_v{i}"]
    keys(old, "scale", ((f - 4, 1.0), (f - 2, 0.0001)))
    keys(new, "scale", ((1, 0.0001), (f - 2, 0.0001), (f, 1.12), (f + 3, 1.0)))
    p_old = bpy.data.objects[f"{name}_pill{i - 1}"]
    p_new = bpy.data.objects[f"{name}_pill{i}"]
    keys(p_old, "scale", ((f - 3, 1.0), (f - 2, 0.0001)))
    keys(p_new, "scale", ((1, 0.0001), (f - 3, 0.0001), (f - 2, 1.0)))
    for p in (p_old, p_new):
        for fc in fcurves(p):
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"
    base = value_at(badge, "scale", 0, f - 1, badge.scale.x)
    keys(badge, "scale", ((f - 1, base), (f, base * 1.08), (f + 6, base)))


# ------------------------------------------------------------------ objects (scene 2)

def _checkbox(name, parent, loc, size=0.26, z=0.0):
    """A tint checkbox with a soft skel rim, so it reads on white paper."""
    slab(name + "_rim", size, size, 0.025, size * 0.28, "skel", parent, (loc[0], loc[1], z), bevel=0.01)
    slab(name + "_box", size * 0.7, size * 0.7, 0.03, size * 0.2, "tint", parent, (loc[0], loc[1], z), bevel=0.008)


def todo_list(name="todo", loc=(0, 0, 0), rows=16, seed=7, parent=None, w=3.0, row_h=0.5, gap=0.62):
    """A to-do list that grows upwards: rows of paper slabs `gap` apart, each its
    own group `{name}_row{i}` (row 0 is the header with a clipboard chip, the
    others a checkbox and a skel line). All rows are visible; scenes hide and
    pop them."""
    import random
    rnd = random.Random(seed)
    g = group(name, loc, 0, parent)
    d = 0.05
    out = []
    for i in range(rows):
        rg = group(f"{name}_row{i}", (0, gap * i, 0), 0, g)
        slab(f"{name}_row{i}_bg", w, row_h, d, 0.14, "paper", rg)
        if i == 0:
            chip(f"{name}_head_chip", "clipboard-text", "a1", "tint", 0.4, rg, (-w / 2 + 0.34, 0, d))
            slab("head_line", 1.5, 0.11, 0.02, 0.055, "skel", rg, (-w / 2 + 0.7 + 0.75, 0, d), bevel=0.008)
        else:
            _checkbox(f"{name}_cb{i}", rg, (-w / 2 + 0.3, 0), 0.26, d)
            lw = rnd.uniform(1.2, 1.9)
            slab("todo_line", lw, 0.09, 0.02, 0.045, "skel", rg, (-w / 2 + 0.58 + lw / 2, 0, d), bevel=0.008)
        out.append(rg)
    return g


def email_card(name="email", loc=(0, 0, 0), w=3.4, h=2.6, parent=None, fillers_hidden=True):
    """The AI email draft: paper card, a short "to" line top left, the envelope
    chip top right, three body lines and three hidden filler lines
    (`{name}_filler{i}`, groups whose origin is the line's left end, so scale x
    0 -> 1 grows them from the left). The envelope chip sits top right so the
    buzz chips at SCRIPT.md's card-relative spots never cut into it."""
    g = group(name, loc, 0, parent)
    d = 0.07
    slab(name + "_bg", w, h, d, 0.16, "paper", g)
    chip(name + "_chip", "envelope-simple", "a1", "tint", 0.5, g, (w / 2 - 0.45, h / 2 - 0.42, d))
    x0 = -w / 2 + 0.3
    slab("to_line", 0.95, 0.1, 0.02, 0.05, "skel", g, (x0 + 0.475, h / 2 - 0.36, d), bevel=0.008)
    y0, gap = h / 2 - 1.0, 0.26
    for i, f in enumerate((0.8, 0.72, 0.6)):
        lw = (w - 0.6) * f
        slab("body_line", lw, 0.09, 0.02, 0.045, "skel", g, (x0 + lw / 2, y0 - i * gap, d), bevel=0.008)
    for i, f in enumerate((0.76, 0.84, 0.55)):
        lw = (w - 0.6) * f
        fg = group(f"{name}_filler{i}", (x0, y0 - (3 + i) * gap, d), 0, g)
        slab(f"{name}_filler{i}_line", lw, 0.09, 0.02, 0.045, "skel", fg, (lw / 2, 0, 0), bevel=0.008)
        if fillers_hidden:
            fg.scale = (0.0001, 1.0, 1.0)
    return g


def buzz_chip(name="buzz", color="a3", parent=None, loc=(0, 0, 0)):
    """A buzzword chip crowding the email draft: a pill with a sparkle and a
    short line standing for a word nobody needs to read. No words."""
    g = group(name, loc, 0, parent)
    d, z = 0.06, 0.025       # z: rests on the card's skel lines, never cuts into them
    slab(name + "_bg", 1.0, 0.34, d, 0.17, color, g, (0, 0, z))
    on_accent = color in ("a1", "a2", "a3", "ink")
    # fix 1: icon 0.26 (was 0.22) so the sparkle's small sparks stay apart; line 0.36 (was 0.42)
    icon("sparkle", 0.26, "paper" if on_accent else "a1", g, (-0.3, 0, z + d), d=0.04)
    slab(name + "_line", 0.36, 0.075, 0.02, 0.0375, "paper" if on_accent else "skel", g,
         (0.12, 0, z + d), bevel=0.008)
    return g


# ------------------------------------------------------------------ objects (scene 4)

def project_card(name="project", loc=(0, 0, 0), w=7.2, h=4.4, parent=None):
    """The shared project: a big paper panel with a folder chip and two skel
    lines in its header and three tint slot wells the cards slide into. Wells
    at relative y 0.75, -0.4, -1.55 (for h 4.4; scaled with h), top at z 0.08."""
    g = group(name, loc, 0, parent)
    d = 0.08
    k = h / 4.4
    slab(name + "_bg", w, h, d, 0.22, "paper", g)
    chip(name + "_chip", "folder-simple", "a1", "tint", 0.62, g, (-w / 2 + 0.6, h / 2 - 0.45, d))
    for i, (lw, dy) in enumerate(((2.0, 0.12), (1.3, -0.12))):
        slab("proj_head", lw, 0.1, 0.02, 0.05, "skel", g, (-w / 2 + 1.1 + lw / 2, h / 2 - 0.45 + dy, d), bevel=0.008)
    for i, y in enumerate((0.75, -0.4, -1.55)):
        slab(f"{name}_well{i}", w - 0.6, 1.08 * k, 0.012, 0.18, "tint", g, (0, y * k, d), bevel=0.005)
    return g


# ------------------------------------------------------------------ objects (scene 6)

def _radio(name, parent, loc, filled, z):
    if filled:
        slab(name, 0.2, 0.2, 0.03, 0.1, "a1", parent, (loc[0], loc[1], z), bevel=0.01)
    else:
        slab(name + "_rim", 0.2, 0.2, 0.025, 0.1, "skel", parent, (loc[0], loc[1], z), bevel=0.01)
        slab(name + "_in", 0.12, 0.12, 0.03, 0.06, "tint", parent, (loc[0], loc[1], z), bevel=0.008)


def survey_card(name="survey", loc=(0, 0, 0), rot=0.0, parent=None, filled=None, seed=0):
    """One answered survey: paper 1.5 x 2.0, a clipboard chip, three answer rows
    (radio dot + skel line), one radio filled raspberry."""
    import random
    rnd = random.Random(seed)
    g = group(name, loc, rot, parent)
    d = 0.05
    w, h = 1.5, 2.0
    slab(name + "_bg", w, h, d, 0.12, "paper", g)
    chip(name + "_chip", "clipboard-text", "a2", "tint", 0.42, g, (-w / 2 + 0.36, h / 2 - 0.36, d))
    slab("sv_head", 0.6, 0.08, 0.02, 0.04, "skel", g, (-w / 2 + 0.68 + 0.3, h / 2 - 0.36, d), bevel=0.008)
    pick = (seed % 3) if filled is None else filled
    for i in range(3):
        y = 0.12 - i * 0.4
        _radio(f"{name}_r{i}", g, (-w / 2 + 0.3, y), i == pick, d)
        lw = rnd.uniform(0.62, 0.86)
        slab("sv_line", lw, 0.075, 0.02, 0.0375, "skel", g, (-w / 2 + 0.52 + lw / 2, y, d), bevel=0.008)
    return g


# ------------------------------------------------------------------ objects (scene 7)

def envelope(name="env", loc=(0, 0, 0), parent=None, rot=0.0):
    """An email on its way: paper 0.8 x 0.56 with an envelope icon."""
    g = group(name, loc, rot, parent)
    d = 0.05
    slab(name + "_bg", 0.8, 0.56, d, 0.08, "paper", g)
    icon("envelope-simple", 0.4, "a1", g, (0, 0, d), d=0.04)
    return g


def channel(name="channel", loc=(0, 0, 0), w=4.6, h=4.0, parent=None):
    """The team channel: a paper panel with a tint header strip holding a chat
    chip and a skel line. Things placed on it (avatar, bubbles) sit at z 0.08."""
    g = group(name, loc, 0, parent)
    d = 0.08
    slab(name + "_bg", w, h, d, 0.22, "paper", g)
    sy = h / 2 - 0.46
    slab(name + "_strip", w - 0.3, 0.64, 0.02, 0.16, "tint", g, (0, sy, d), bevel=0.006)
    chip(name + "_chip", "chat-circle-dots", "a2", "paper", 0.5, g, (-w / 2 + 0.5, sy, d + 0.02))
    slab("ch_line", 1.6, 0.1, 0.02, 0.05, "skel", g, (-w / 2 + 0.95 + 0.8, sy, d + 0.02), bevel=0.008)
    return g


# ------------------------------------------------------------------ objects (scene 9)

def block(name="block", loc=(0, 0, 0), w=3.0, h=3.0, icon_name="sparkle", accent="a1", parent=None):
    """One of the three steps (person, AI, person): a paper slab with a tint
    header strip and a chip at relative (-w/2 + 0.55, h/2 - 0.4). Things placed
    on it sit at z 0.08."""
    g = group(name, loc, 0, parent)
    d = 0.08
    slab(name + "_bg", w, h, d, 0.2, "paper", g)
    sy = h / 2 - 0.4
    slab(name + "_strip", w - 0.3, 0.6, 0.02, 0.16, "tint", g, (0, sy, d), bevel=0.006)
    chip(name + "_chip", icon_name, accent, "paper", 0.46, g, (-w / 2 + 0.55, sy, d + 0.02))
    slab("bl_line", min(1.2, w - 1.6), 0.1, 0.02, 0.05, "skel", g,
         (-w / 2 + 0.95 + min(1.2, w - 1.6) / 2, sy, d + 0.02), bevel=0.008)
    return g


def block_body(w=3.0, h=3.0, margin=0.2):
    """The free area of a block() under its header strip, block-relative, for
    placing content (bubbles, work lines, the draft card) so nothing covers the
    strip or hangs off an edge. The strip ends at h/2 - 0.7; the body starts
    0.05 below it. Returns dict(x0, x1, top, bottom, cx, cy, w, h). Content on
    a block sits at z 0.08."""
    top = h / 2 - 0.75
    bottom = -h / 2 + margin
    x0, x1 = -w / 2 + margin, w / 2 - margin
    return dict(x0=x0, x1=x1, top=top, bottom=bottom, cx=(x0 + x1) / 2, cy=(top + bottom) / 2,
                w=x1 - x0, h=top - bottom)


# ------------------------------------------------------------------ the Kingdom Sites mark (scene 10)

MARK_SVG = os.path.join(HERE, "assets", "logo-mark.svg")
# The mark's own colours (the one object outside Berry: it is our own mark, not a
# third-party logo). Brand hex: pin #0A63C9, crown #C05A2B. The warm fill lifts
# dark channels by about 0.025 (linear), so the material values are set lower
# to make the rendered pixels land on the brand hex (measured on the sheet).
# Fix 1: the pin's red channel was lifted by its own specular sheen (#2C63C9
# rendered). A matte, low-specular pin (roughness 0.6, specular 0.08) with a
# slightly greener base renders about #1463C8 on the flat of the pin.
MARK_BLUE = "#0061CC"
MARK_CROWN = "#BC4F03"
MARK_PIN_FINISH = (0.6, 0.08)   # (roughness, specular) of the pin layer only


def mark(name="mark", loc=(0, 0, 0), size=2.6, parent=None):
    """The Kingdom Sites mark from public/marketing/logo-mark.svg (copied to
    assets/logo-mark.svg): the blue pin, the white disc and the terracotta
    crown, each imported as curves, extruded and bevelled like icon(), stacked
    in three layers. `size` is the pin's height."""
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=MARK_SVG)
    new = [o for o in bpy.data.objects if o not in before and o.type == "CURVE"]

    def kind(o):
        m = o.data.materials[0] if o.data.materials else None
        c = tuple(m.diffuse_color[:3]) if m else (0, 0, 0)
        if c[2] > 0.3 and c[0] < 0.2:
            return "pin"
        if min(c) > 0.8:
            return "disc"
        return "crown"

    kinds = {o: kind(o) for o in new}
    xs, ys = [], []
    for o in new:
        if kinds[o] != "pin":
            continue
        for sp in o.data.splines:
            for bp in sp.bezier_points:
                v = o.matrix_world @ bp.co
                xs.append(v.x)
                ys.append(v.y)
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    k = size / (max(ys) - min(ys))
    root = group(name, loc, 0, parent)
    inner = group(name + "_svg", (0, 0, 0), 0, root)
    inner.scale = (k, k, k)
    # layer: (colour, bottom z, thickness, bevel) in world units
    # fix 2: softer, clay-kit edges (were pin 0.2/0.035, disc 0.012, crown 0.06/0.014)
    layers = {"pin": (MARK_BLUE, 0.0, 0.24, 0.07),
              "disc": ("paper", 0.24, 0.045, 0.02),
              "crown": (MARK_CROWN, 0.285, 0.08, 0.025)}
    for o in new:
        colr, z0, th, bv = layers[kinds[o]]
        o.data.dimensions = "2D"
        o.data.fill_mode = "BOTH"
        o.data.extrude = max(th / 2 - bv, 0.002) / k
        o.data.bevel_depth = bv / k
        o.data.bevel_resolution = 4
        o.data.materials.clear()
        rough, spec = MARK_PIN_FINISH if kinds[o] == "pin" else (0.45, 0.25)
        o.data.materials.append(mat("mark_" + kinds[o], col(colr), rough=rough, spec=spec))
        mw = o.matrix_world.copy()
        for c in list(o.users_collection):
            c.objects.unlink(o)
        bpy.context.scene.collection.objects.link(o)
        o.name = f"{name}_{kinds[o]}"
        o.parent = inner
        o.matrix_parent_inverse.identity()
        o.location = (mw.translation.x - cx, mw.translation.y - cy, (z0 + th / 2) / k)
        o.scale = (mw.to_scale().x, mw.to_scale().y, 1.0)
    for c in list(bpy.data.collections):
        if not c.objects and not c.children:
            bpy.data.collections.remove(c)
    return root
