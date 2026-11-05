"""Shared kit for the AI productivity film: palette, light rig, camera and the
soft 2.5D objects every scene is built from.

Everything is made from two primitives so the film has one look:
  slab()  a rounded-rectangle shape extruded with a rounded edge (cards, paper,
          buttons, avatars, the scanner)
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


def icon(name, size, color, parent=None, loc=(0, 0, 0), d=0.06, rot=0.0):
    """Phosphor icon, `size` units across, extruded `d`, bottom at loc.z."""
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
        o.data.extrude = max(d / 2 - 0.012, 0.002) / k
        o.data.bevel_depth = 0.012 / k
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
    text(initials, size * 0.34, "paper", g, (0, 0, 0.1))
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


def drawer(name="drawer", label="Admissions", color="a1", loc=(0, 0, 0), w=2.6, h=1.1, parent=None):
    g = group(name, loc, 0, parent)
    slab(name + "_body", w, h, 0.3, 0.16, "paper", g)
    slab(name + "_tag", w * 0.62, 0.34, 0.03, 0.17, color, g, (0, 0.18, 0.3))
    text(label, 0.19, "paper", g, (0, 0.18, 0.33))
    slab(name + "_handle", w * 0.3, 0.12, 0.05, 0.06, "ink", g, (0, -0.26, 0.3))
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


def dotted(name, p0, c, p1, color="a1", spacing=0.24, dot=0.15, z=0.0):
    """The film's connector: a dotted line lying on the table between two
    things that pass something to each other. Returns the dots in order, so a
    scene can pop them in one after another along the way."""
    samples = [bez(p0, c, p1, i / 200) for i in range(201)]
    length = sum(math.dist(samples[i], samples[i + 1]) for i in range(200))
    n = max(2, int(length / spacing))
    dots = []
    for i in range(n + 1):
        x, y = bez(p0, c, p1, i / n)
        dots.append(slab(f"{name}_{i:02d}", dot, dot, 0.03, dot / 2, color, None, (x, y, z), bevel=0.012))
    return dots


def packet(name="packet", loc=(0, 0, 0), color="a2", parent=None):
    """A small rounded pill: a piece of data on its way somewhere."""
    g = group(name, loc, 0, parent)
    slab(name + "_bg", 0.62, 0.24, 0.08, 0.12, color, g)
    return g
