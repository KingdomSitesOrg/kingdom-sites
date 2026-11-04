"""Laptop product film for the Kingdom Sites home page.

Builds a generic 16-inch laptop on a walnut desk in front of a whiteboard,
opens the lid, wakes the screen and settles on the whole laptop. Everything is
procedural; the inputs are the screen image
(public/work/farzana-classroom-home.webp), one Poly Haven studio HDRI
(design/laptop-film/assets/), and two Pillow-drawn textures: key legends
(keyboard_legends.py) and the whiteboard's marker work (whiteboard_texture.py).

Run headless from the repository root:

  Blender -b -P scripts/film/laptop_film.py -- --mode still --aspect desktop \
      --frames 1,48,96 --samples 160 --noise 0.015 --out design/film-renders/v4/stills
  Blender -b -P scripts/film/laptop_film.py -- --mode seq --aspect desktop \
      --frames 1-96 --samples 160 --noise 0.015 --quality 82 --out public/film/desktop
  Blender -b -P scripts/film/laptop_film.py -- --mode manifest --out public/film

The manifest holds, per aspect, the display's corners on the last frame
(screenQuad), the laptop's box (laptopBox) and, for every frame, the mug's
opening and rim radius in frame pixels (steam).

Units are metres. Z is up, the laptop's front faces -Y, its hinge is at +Y.
"""

import argparse
import json
import math
import os
import sys

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCREEN_IMAGE = os.path.join(ROOT, "public", "work", "farzana-classroom-home.webp")
HDRI = os.path.join(ROOT, "design", "laptop-film", "assets", "studio_small_09_2k.hdr")
# the website's typeface (Archivo, variable weight and width), for the mug
MUG_FONT = os.path.join(ROOT, "design", "film-renders", "v4", "tex", "Archivo-latin-variable.woff2")

FRAMES = 96
ASPECTS = {"desktop": (1600, 1000), "phone": (780, 1400)}
ASPECT = "desktop"     # set by main() before the scene is built (props differ per camera)

# Prop placement per camera: (x, y, yaw deg). The portrait camera is narrow
# and tall, so its props sit closer in and in front of the laptop.
PROPS = {
    "desktop": {"bookA": (-0.385, 0.175, 13), "bookB": (-0.378, 0.168, 4), "mug": (0.335, 0.215, -55)},
    "phone": {"bookA": (-0.345, 0.150, 13), "bookB": (-0.338, 0.143, 4), "mug": (0.272, 0.200, -60)},
}

# ---------------------------------------------------------------- dimensions
# Display active area, 16:10, with thin bezels like a current MacBook Pro:
# 5.5 mm at the sides, 6 mm at the top, 7.5 mm above the hinge. The lid
# (and so the base, which matches it) is as deep as that needs.
ACT_SIDE_MARGIN = 0.0055
ACT_TOP_MARGIN = 0.0060
ACT_BOTTOM_MARGIN = 0.0075
BASE_W = 0.356
ACT_W = BASE_W - 2 * ACT_SIDE_MARGIN
ACT_H = ACT_W / 1.6
ACT_RADIUS = ACT_W * 34.0 / 1800.0   # rounded display corners, as on the website's live layer
BASE_D, BASE_H = ACT_TOP_MARGIN + ACT_H + ACT_BOTTOM_MARGIN, 0.0080
FOOT_H = 0.0008
BASE_TOP = FOOT_H + BASE_H
LID_GAP = 0.0005
LID_T = 0.0065
CORNER_R = 0.0120      # concentric with the display's rounded corners
PIVOT = Vector((0.0, BASE_D / 2, BASE_TOP + LID_GAP))
LID_OPEN_DEG = 105.0

# Display active area in lid-local coordinates (lid runs along -Y from the
# hinge; the inside face is local z = 0 and faces local -Z).
ACT_Y0 = -(BASE_D - ACT_TOP_MARGIN - ACT_H)  # hinge-side edge of active area
GLASS_FRONT = -0.0002                          # local z of the glass surface

# Screen image is 1800 x 1095 (wider than 16:10): keep the full height and
# crop the right-hand 48 px so it is exactly 1752 x 1095 = 16:10.
IMG_W, IMG_H = 1800, 1095
IMG_U_SCALE = (IMG_H * 1.6) / IMG_W


# ------------------------------------------------------------------- helpers
def smoothstep(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def ease_in_out(t):
    t = min(1.0, max(0.0, t))
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def pchip(keys, x, end_slope_zero=True):
    """Monotone cubic (Fritsch-Carlson) through [(x, y), ...]."""
    xs = [k[0] for k in keys]
    ys = [k[1] for k in keys]
    n = len(xs)
    if x <= xs[0]:
        return ys[0]
    if x >= xs[-1]:
        return ys[-1]
    h = [xs[i + 1] - xs[i] for i in range(n - 1)]
    d = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [0.0] * n
    m[0] = d[0]
    m[-1] = 0.0 if end_slope_zero else d[-1]
    for i in range(1, n - 1):
        if d[i - 1] * d[i] <= 0:
            m[i] = 0.0
        else:
            w1 = 2 * h[i] + h[i - 1]
            w2 = h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    i = max(j for j in range(n - 1) if xs[j] <= x)
    t = (x - xs[i]) / h[i]
    h00 = 2 * t ** 3 - 3 * t ** 2 + 1
    h10 = t ** 3 - 2 * t ** 2 + t
    h01 = -2 * t ** 3 + 3 * t ** 2
    h11 = t ** 3 - t ** 2
    return h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1]


def rounded_rect_bm(bm, w, d, z0, z1, r, segs=10, cx=0.0, cy=0.0):
    """Add a rounded-rectangle slab to a bmesh; returns its verts."""
    pts = []
    corners = [(w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90),
               (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)]
    for (ccx, ccy, a0) in corners:
        for s in range(segs + 1):
            a = math.radians(a0 + 90.0 * s / segs)
            pts.append((cx + ccx + r * math.cos(a), cy + ccy + r * math.sin(a)))
    bottom = [bm.verts.new((x, y, z0)) for x, y in pts]
    top = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(list(reversed(bottom)))
    bm.faces.new(top)
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bottom[i], bottom[j], top[j], top[i]))
    return bottom + top


def mesh_object(name, bm, collection=None):
    me = bpy.data.meshes.new(name)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(ob)
    return ob


def slab(name, w, d, z0, z1, r, segs=10, cx=0.0, cy=0.0):
    bm = bmesh.new()
    rounded_rect_bm(bm, w, d, z0, z1, r, segs, cx, cy)
    return mesh_object(name, bm)


def add_bevel(ob, width, segments=4, angle=30.0, harden=True):
    m = ob.modifiers.new("Bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angle)
    m.harden_normals = harden
    m.use_clamp_overlap = True
    return m


def apply_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)


def boolean_cut(ob, cutters):
    for c in cutters:
        m = ob.modifiers.new("Bool_" + c.name, "BOOLEAN")
        m.operation = "DIFFERENCE"
        m.solver = "EXACT"
        m.object = c
    apply_modifiers(ob)
    for c in cutters:
        bpy.data.objects.remove(c, do_unlink=True)
    ob.data.materials.clear()
    for p in ob.data.polygons:
        p.use_smooth = True
        p.material_index = 0


# ----------------------------------------------------------------- materials
def sock(coll, ident):
    """Socket by exact identifier (Mix nodes reuse names across data types)."""
    for x in coll:
        if x.identifier == ident:
            return x
    raise KeyError(ident)


def new_mat(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    return m, m.node_tree.nodes, m.node_tree.links


def mat_aluminium(name, color, grilles=False):
    m, N, L = new_mat(name)
    bsdf = N["Principled BSDF"]
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Anisotropic"].default_value = 0.12
    tc = N.new("ShaderNodeTexCoord")
    tan = N.new("ShaderNodeTangent")
    tan.direction_type = "RADIAL"
    tan.axis = "Y"
    L.new(tan.outputs["Tangent"], bsdf.inputs["Tangent"])

    # roughness: matte satin (bead-blasted), 0.44 with a broad and a fine
    # noise so the soft highlights break up
    n_big = N.new("ShaderNodeTexNoise")
    n_big.inputs["Scale"].default_value = 18.0
    n_big.inputs["Detail"].default_value = 3.0
    L.new(tc.outputs["Object"], n_big.inputs["Vector"])
    n_fine = N.new("ShaderNodeTexNoise")
    n_fine.inputs["Scale"].default_value = 2600.0
    n_fine.inputs["Detail"].default_value = 2.0
    L.new(tc.outputs["Object"], n_fine.inputs["Vector"])
    r1 = N.new("ShaderNodeMapRange")
    r1.inputs["To Min"].default_value = 0.40
    r1.inputs["To Max"].default_value = 0.48
    L.new(n_big.outputs["Fac"], r1.inputs["Value"])
    r2 = N.new("ShaderNodeMapRange")
    r2.inputs["To Min"].default_value = -0.035
    r2.inputs["To Max"].default_value = 0.035
    L.new(n_fine.outputs["Fac"], r2.inputs["Value"])
    rsum = N.new("ShaderNodeMath")
    rsum.operation = "ADD"
    L.new(r1.outputs["Result"], rsum.inputs[0])
    L.new(r2.outputs["Result"], rsum.inputs[1])

    # bead-blasted micro texture
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.06
    bump.inputs["Distance"].default_value = 0.00002
    L.new(n_fine.outputs["Fac"], bump.inputs["Height"])

    rough_out = rsum.outputs[0]
    if grilles:
        # speaker perforation either side of the keyboard, top face only
        sep = N.new("ShaderNodeSeparateXYZ")
        L.new(tc.outputs["Object"], sep.inputs["Vector"])

        def band(sock, lo, hi):
            a = N.new("ShaderNodeMath"); a.operation = "GREATER_THAN"
            a.inputs[1].default_value = lo; L.new(sock, a.inputs[0])
            b = N.new("ShaderNodeMath"); b.operation = "LESS_THAN"
            b.inputs[1].default_value = hi; L.new(sock, b.inputs[0])
            c = N.new("ShaderNodeMath"); c.operation = "MULTIPLY"
            L.new(a.outputs[0], c.inputs[0]); L.new(b.outputs[0], c.inputs[1])
            return c.outputs[0]

        absx = N.new("ShaderNodeMath"); absx.operation = "ABSOLUTE"
        L.new(sep.outputs["X"], absx.inputs[0])
        mx = band(absx.outputs[0], 0.1475, 0.1665)
        _kl, _kf = keyboard_layout()
        my = band(sep.outputs["Y"], _kf - 0.004, KB_BACK)
        mz = band(sep.outputs["Z"], BASE_TOP - 0.0003, BASE_TOP + 0.001)
        mxy = N.new("ShaderNodeMath"); mxy.operation = "MULTIPLY"
        L.new(mx, mxy.inputs[0]); L.new(my, mxy.inputs[1])
        region = N.new("ShaderNodeMath"); region.operation = "MULTIPLY"
        L.new(mxy.outputs[0], region.inputs[0]); L.new(mz, region.inputs[1])
        # dot grid, pitch 0.9 mm, hole radius 0.24 mm
        sc = N.new("ShaderNodeVectorMath"); sc.operation = "SCALE"
        sc.inputs["Scale"].default_value = 1.0 / 0.0009
        L.new(tc.outputs["Object"], sc.inputs[0])
        fr = N.new("ShaderNodeVectorMath"); fr.operation = "FRACTION"
        L.new(sc.outputs[0], fr.inputs[0])
        sub = N.new("ShaderNodeVectorMath"); sub.operation = "SUBTRACT"
        sub.inputs[1].default_value = (0.5, 0.5, 0.0)
        L.new(fr.outputs[0], sub.inputs[0])
        mulz = N.new("ShaderNodeVectorMath"); mulz.operation = "MULTIPLY"
        mulz.inputs[1].default_value = (1.0, 1.0, 0.0)
        L.new(sub.outputs[0], mulz.inputs[0])
        ln = N.new("ShaderNodeVectorMath"); ln.operation = "LENGTH"
        L.new(mulz.outputs[0], ln.inputs[0])
        dot = N.new("ShaderNodeMapRange")
        dot.inputs["From Min"].default_value = 0.21
        dot.inputs["From Max"].default_value = 0.16
        L.new(ln.outputs["Value"], dot.inputs["Value"])
        hole = N.new("ShaderNodeMath"); hole.operation = "MULTIPLY"
        L.new(dot.outputs["Result"], hole.inputs[0]); L.new(region.outputs[0], hole.inputs[1])
        col = N.new("ShaderNodeMix"); col.data_type = "RGBA"
        sock(col.inputs, "A_Color").default_value = (*color, 1)
        sock(col.inputs, "B_Color").default_value = (0.004, 0.004, 0.004, 1)
        L.new(hole.outputs[0], sock(col.inputs, "Factor_Float"))
        L.new(sock(col.outputs, "Result_Color"), bsdf.inputs["Base Color"])
        met = N.new("ShaderNodeMath"); met.operation = "SUBTRACT"
        met.inputs[0].default_value = 1.0
        L.new(hole.outputs[0], met.inputs[1])
        L.new(met.outputs[0], bsdf.inputs["Metallic"])
        rr = N.new("ShaderNodeMix"); rr.data_type = "FLOAT"
        L.new(hole.outputs[0], sock(rr.inputs, "Factor_Float"))
        L.new(rsum.outputs[0], sock(rr.inputs, "A_Float"))
        sock(rr.inputs, "B_Float").default_value = 0.8
        rough_out = sock(rr.outputs, "Result_Float")
        hb = N.new("ShaderNodeBump")
        hb.inputs["Strength"].default_value = 0.6
        hb.inputs["Distance"].default_value = 0.0002
        hb.invert = True
        L.new(hole.outputs[0], hb.inputs["Height"])
        L.new(bump.outputs["Normal"], hb.inputs["Normal"])
        L.new(hb.outputs["Normal"], bsdf.inputs["Normal"])
    else:
        L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    L.new(rough_out, bsdf.inputs["Roughness"])
    return m


def mat_simple(name, color, rough, metallic=0.0, spec=0.5, coat=0.0):
    m, N, L = new_mat(name)
    b = N["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Specular IOR Level"].default_value = spec
    b.inputs["Coat Weight"].default_value = coat
    return m


def make_legends(keys, kb_front):
    """Render the key-legend texture with Pillow (system Python) and return its path."""
    import shutil
    import subprocess
    work = os.path.join(ROOT, "design", "laptop-film", "work")
    os.makedirs(work, exist_ok=True)
    spec = os.path.join(work, "keys.json")
    png = os.path.join(work, "key-legends.png")
    with open(spec, "w") as fh:
        json.dump({"rect": [-KB_W / 2, kb_front, KB_W / 2, KB_BACK],
                   "keys": [list(k) for k in keys]}, fh)
    py = shutil.which("python3") or "/Library/Frameworks/Python.framework/Versions/3.13/bin/python3"
    subprocess.run([py, os.path.join(ROOT, "scripts", "film", "keyboard_legends.py"), spec, png], check=True)
    return png


def mat_keys(keys, kb_front):
    m, N, L = new_mat("KeyCaps")
    b = N["Principled BSDF"]
    # near-black matte plastic (#111214), a tiny sheen, edges a touch lighter
    b.inputs["Specular IOR Level"].default_value = 0.5
    b.inputs["Sheen Weight"].default_value = 0.12
    b.inputs["Sheen Roughness"].default_value = 0.45
    tc = N.new("ShaderNodeTexCoord")
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 900.0
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = 0.52
    mr.inputs["To Max"].default_value = 0.58
    L.new(nz.outputs["Fac"], mr.inputs["Value"])
    L.new(mr.outputs["Result"], b.inputs["Roughness"])
    geo = N.new("ShaderNodeNewGeometry")
    edge = N.new("ShaderNodeMapRange")
    edge.inputs["From Min"].default_value = 0.52
    edge.inputs["From Max"].default_value = 0.62
    L.new(geo.outputs["Pointiness"], edge.inputs["Value"])
    col = N.new("ShaderNodeMix"); col.data_type = "RGBA"
    sock(col.inputs, "A_Color").default_value = (0.0056, 0.0060, 0.0070, 1)
    sock(col.inputs, "B_Color").default_value = (0.020, 0.021, 0.023, 1)
    L.new(edge.outputs["Result"], sock(col.inputs, "Factor_Float"))
    # printed legends (#D9DADC) on the key tops only
    tc2 = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc2.outputs["Object"], sep.inputs["Vector"])
    u = N.new("ShaderNodeMath"); u.operation = "MULTIPLY_ADD"
    u.inputs[1].default_value = 1.0 / KB_W; u.inputs[2].default_value = 0.5
    L.new(sep.outputs["X"], u.inputs[0])
    v = N.new("ShaderNodeMath"); v.operation = "MULTIPLY_ADD"
    v.inputs[1].default_value = 1.0 / (KB_BACK - kb_front)
    v.inputs[2].default_value = -kb_front / (KB_BACK - kb_front)
    L.new(sep.outputs["Y"], v.inputs[0])
    uv = N.new("ShaderNodeCombineXYZ")
    L.new(u.outputs[0], uv.inputs["X"]); L.new(v.outputs[0], uv.inputs["Y"])
    leg = N.new("ShaderNodeTexImage")
    leg.image = bpy.data.images.load(make_legends(keys, kb_front))
    leg.image.pack()
    leg.extension = "CLIP"
    leg.interpolation = "Cubic"
    L.new(uv.outputs[0], leg.inputs["Vector"])
    geo2 = N.new("ShaderNodeNewGeometry")
    nz_ = N.new("ShaderNodeSeparateXYZ")
    L.new(geo2.outputs["Normal"], nz_.inputs["Vector"])
    top = N.new("ShaderNodeMapRange")
    top.inputs["From Min"].default_value = 0.96
    top.inputs["From Max"].default_value = 0.995
    L.new(nz_.outputs["Z"], top.inputs["Value"])
    ink = N.new("ShaderNodeMath"); ink.operation = "MULTIPLY"
    L.new(leg.outputs["Alpha"], ink.inputs[0]); L.new(top.outputs["Result"], ink.inputs[1])
    legmix = N.new("ShaderNodeMix"); legmix.data_type = "RGBA"
    L.new(sock(col.outputs, "Result_Color"), sock(legmix.inputs, "A_Color"))
    sock(legmix.inputs, "B_Color").default_value = (0.693, 0.701, 0.716, 1)
    L.new(ink.outputs[0], sock(legmix.inputs, "Factor_Float"))
    for l in list(L):
        if l.to_node == b and l.to_socket.name == "Base Color":
            L.remove(l)
    L.new(sock(legmix.outputs, "Result_Color"), b.inputs["Base Color"])
    return m


def screen_image_agx_inverse():
    """The screenshot pre-corrected so that AgX hands back the source pixels.

    AgX compresses and desaturates; feeding it the exact inverse of its own
    display transform means an unlit, unreflected screen renders with the
    screenshot's true colours (needed for the website's cross-fade)."""
    import numpy as np
    import PyOpenColorIO as OCIO
    cfg_path = os.path.join(os.path.dirname(bpy.app.binary_path), "..", "Resources",
                            "%d.%d" % bpy.app.version[:2], "datafiles",
                            "colormanagement", "config.ocio")
    cfg = OCIO.Config.CreateFromFile(os.path.abspath(cfg_path))
    t = OCIO.DisplayViewTransform(src=cfg.getColorSpace("scene_linear").getName(),
                                  display="sRGB", view="AgX")
    inv = cfg.getProcessor(t, OCIO.TRANSFORM_DIR_INVERSE).getDefaultCPUProcessor()
    src = bpy.data.images.load(SCREEN_IMAGE)
    w, h = src.size
    px = np.empty(w * h * 4, dtype=np.float32)
    src.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    rgb = np.ascontiguousarray(np.clip(px[:, :3], 0.0, 0.975))
    out = inv.applyRGB(rgb)
    if out is not None:
        rgb = np.asarray(out, dtype=np.float32).reshape(-1, 3)
    px[:, :3] = np.clip(rgb, 0.0, None)
    px[:, 3] = 1.0
    img = bpy.data.images.new("ScreenAgXInverse", w, h, alpha=False, float_buffer=True)
    img.colorspace_settings.name = cfg.getColorSpace("scene_linear").getName()
    img.pixels.foreach_set(px.ravel())
    img.pack()
    return img


def mat_cover_glass():
    """Cover glass: fully transmissive, reflects by Fresnel only, damped by an
    anti-reflective coating so the opening lid never flashes."""
    m, N, L = new_mat("CoverGlass")
    N.remove(N["Principled BSDF"])
    tr = N.new("ShaderNodeBsdfTransparent")
    gl = N.new("ShaderNodeBsdfGlossy")
    gl.inputs["Roughness"].default_value = 0.05
    fr = N.new("ShaderNodeFresnel")
    fr.inputs["IOR"].default_value = 1.52
    ar = N.new("ShaderNodeMath"); ar.operation = "MULTIPLY"
    ar.inputs[1].default_value = 0.5
    L.new(fr.outputs["Fac"], ar.inputs[0])
    L.new(ar.outputs[0], gl.inputs["Color"])
    add = N.new("ShaderNodeAddShader")
    L.new(tr.outputs[0], add.inputs[0]); L.new(gl.outputs[0], add.inputs[1])
    L.new(add.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def mat_screen():
    """Black cover glass with the emissive UI under it."""
    m, N, L = new_mat("ScreenGlass")
    b = N["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.0015, 0.0015, 0.0017, 1)
    b.inputs["Roughness"].default_value = 0.035
    b.inputs["Specular IOR Level"].default_value = 0.05
    b.inputs["IOR"].default_value = 1.52
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Object"], sep.inputs["Vector"])
    # u = (x + ACT_W/2) / ACT_W * IMG_U_SCALE ; v = (-y + ACT_Y0) / ACT_H
    u = N.new("ShaderNodeMath"); u.operation = "MULTIPLY_ADD"
    u.inputs[1].default_value = IMG_U_SCALE / ACT_W
    u.inputs[2].default_value = 0.5 * IMG_U_SCALE
    L.new(sep.outputs["X"], u.inputs[0])
    v = N.new("ShaderNodeMath"); v.operation = "MULTIPLY_ADD"
    v.inputs[1].default_value = -1.0 / ACT_H
    v.inputs[2].default_value = ACT_Y0 / ACT_H
    L.new(sep.outputs["Y"], v.inputs[0])
    # rounded corners, radius ACT_RADIUS: a signed distance to the rounded
    # rectangle, anti-aliased over 0.3 mm
    ctr = N.new("ShaderNodeVectorMath"); ctr.operation = "SUBTRACT"
    ctr.inputs[1].default_value = (0.0, ACT_Y0 - ACT_H / 2, 0.0)
    L.new(tc.outputs["Object"], ctr.inputs[0])
    flat = N.new("ShaderNodeVectorMath"); flat.operation = "MULTIPLY"
    flat.inputs[1].default_value = (1.0, 1.0, 0.0)
    L.new(ctr.outputs[0], flat.inputs[0])
    ab = N.new("ShaderNodeVectorMath"); ab.operation = "ABSOLUTE"
    L.new(flat.outputs[0], ab.inputs[0])
    q = N.new("ShaderNodeVectorMath"); q.operation = "SUBTRACT"
    q.inputs[1].default_value = (ACT_W / 2 - ACT_RADIUS, ACT_H / 2 - ACT_RADIUS, 0.0)
    L.new(ab.outputs[0], q.inputs[0])
    qp = N.new("ShaderNodeVectorMath"); qp.operation = "MAXIMUM"
    qp.inputs[1].default_value = (0.0, 0.0, 0.0)
    L.new(q.outputs[0], qp.inputs[0])
    ql = N.new("ShaderNodeVectorMath"); ql.operation = "LENGTH"
    L.new(qp.outputs[0], ql.inputs[0])
    qs = N.new("ShaderNodeSeparateXYZ")
    L.new(q.outputs[0], qs.inputs["Vector"])
    qm = N.new("ShaderNodeMath"); qm.operation = "MAXIMUM"
    L.new(qs.outputs["X"], qm.inputs[0]); L.new(qs.outputs["Y"], qm.inputs[1])
    qn = N.new("ShaderNodeMath"); qn.operation = "MINIMUM"
    qn.inputs[1].default_value = 0.0
    L.new(qm.outputs[0], qn.inputs[0])
    sd = N.new("ShaderNodeMath"); sd.operation = "ADD"
    L.new(ql.outputs["Value"], sd.inputs[0]); L.new(qn.outputs[0], sd.inputs[1])
    mask = N.new("ShaderNodeMapRange")
    mask.inputs["From Min"].default_value = ACT_RADIUS + 0.00015
    mask.inputs["From Max"].default_value = ACT_RADIUS - 0.00015
    L.new(sd.outputs[0], mask.inputs["Value"])
    cmb = N.new("ShaderNodeCombineXYZ")
    L.new(u.outputs[0], cmb.inputs["X"]); L.new(v.outputs[0], cmb.inputs["Y"])
    img = N.new("ShaderNodeTexImage")
    img.image = screen_image_agx_inverse()
    img.interpolation = "Linear"
    img.extension = "CLIP"
    L.new(cmb.outputs[0], img.inputs["Vector"])
    gated = N.new("ShaderNodeMix"); gated.data_type = "RGBA"
    sock(gated.inputs, "A_Color").default_value = (0, 0, 0, 1)
    L.new(mask.outputs[0], sock(gated.inputs, "Factor_Float"))
    L.new(img.outputs["Color"], sock(gated.inputs, "B_Color"))
    L.new(sock(gated.outputs, "Result_Color"), b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 0.0
    return m


def mat_floor():
    m, N, L = new_mat("Cyclorama")
    b = N["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.0058, 0.0057, 0.0058, 1)
    b.inputs["Specular IOR Level"].default_value = 0.30
    tc = N.new("ShaderNodeTexCoord")
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 6.0
    nz.inputs["Detail"].default_value = 6.0
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = 0.30
    mr.inputs["To Max"].default_value = 0.42
    L.new(nz.outputs["Fac"], mr.inputs["Value"])
    L.new(mr.outputs["Result"], b.inputs["Roughness"])
    return m


# ------------------------------------------------------------------ the room
WALL_Y = 0.95          # wall (and whiteboard) about three feet behind the laptop
# what sits on the whiteboard's tray, per camera: eraser (x, yaw) and three
# markers [(x, yaw)], x from the board's centre; each camera sees a different
# part of the tray past the laptop
# board centre x and the strength of the board-only fill light, per camera
# (the phone camera sees the whole board, further back and more square-on)
BOARD = {"desktop": {"x": 0.18, "fill": 26.0}, "phone": {"x": 0.30, "fill": 12.0}}
TRAY = {
    "desktop": {"eraser": (-0.40, 4), "markers": [(0.255, 3), (0.300, -4), (0.345, 8)]},
    "phone": {"eraser": (0.10, -3), "markers": [(0.255, 3), (0.300, -4), (0.345, 8)]},
}


def colour_ramp(N, stops):
    cr = N.new("ShaderNodeValToRGB")
    els = cr.color_ramp.elements
    while len(els) < len(stops):
        els.new(0.5)
    for el, (pos, col) in zip(els, stops):
        el.position = pos
        el.color = (*col, 1)
    return cr


def mat_wood():
    """Walnut desk top: warped grain of varying width, darker figure streaks,
    slow colour drift and micro-roughness variation (not a laminate)."""
    m, N, L = new_mat("Walnut")
    b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")

    def noise(vec, scale, detail=4.0, rough=0.55):
        n = N.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail
        n.inputs["Roughness"].default_value = rough
        L.new(vec, n.inputs["Vector"])
        return n

    def mapping(vec, scale):
        mp = N.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = scale
        L.new(vec, mp.inputs["Vector"])
        return mp.outputs["Vector"]

    obj = tc.outputs["Object"]
    # domain warp: grain lines drift and swell like real flat-sawn boards
    warp = noise(mapping(obj, (0.35, 3.0, 3.0)), 2.2, 4.0)
    wsub = N.new("ShaderNodeVectorMath"); wsub.operation = "SUBTRACT"
    L.new(warp.outputs["Color"], wsub.inputs[0]); wsub.inputs[1].default_value = (0.5, 0.5, 0.5)
    wsc = N.new("ShaderNodeVectorMath"); wsc.operation = "SCALE"
    wsc.inputs["Scale"].default_value = 0.09
    L.new(wsub.outputs[0], wsc.inputs[0])
    warped = N.new("ShaderNodeVectorMath"); warped.operation = "ADD"
    L.new(obj, warped.inputs[0]); L.new(wsc.outputs[0], warped.inputs[1])
    grain_vec = mapping(warped.outputs[0], (0.08, 1.0, 1.0))
    wave = N.new("ShaderNodeTexWave")
    wave.bands_direction = "Y"
    wave.wave_profile = "SIN"
    wave.inputs["Scale"].default_value = 5.0
    wave.inputs["Distortion"].default_value = 11.0
    wave.inputs["Detail"].default_value = 5.0
    wave.inputs["Detail Scale"].default_value = 1.2
    L.new(grain_vec, wave.inputs["Vector"])
    fine = noise(mapping(warped.outputs[0], (0.2, 25.0, 25.0)), 4.0, 6.0, 0.6)
    figure = noise(mapping(obj, (0.12, 7.0, 7.0)), 2.5, 5.0, 0.6)
    fig = N.new("ShaderNodeMapRange")
    fig.inputs["From Min"].default_value = 0.55; fig.inputs["From Max"].default_value = 0.72
    L.new(figure.outputs["Fac"], fig.inputs["Value"])
    # combine: soft grain + fine pores, minus darker figure streaks
    g1 = N.new("ShaderNodeMath"); g1.operation = "MULTIPLY_ADD"
    g1.inputs[1].default_value = 0.9
    fh = N.new("ShaderNodeMath"); fh.operation = "MULTIPLY"; fh.inputs[1].default_value = 0.25
    L.new(fine.outputs["Fac"], fh.inputs[0])
    L.new(wave.outputs["Fac"], g1.inputs[0]); L.new(fh.outputs[0], g1.inputs[2])
    g2 = N.new("ShaderNodeMath"); g2.operation = "MULTIPLY_ADD"
    g2.inputs[1].default_value = -0.30
    L.new(fig.outputs["Result"], g2.inputs[0]); L.new(g1.outputs[0], g2.inputs[2])
    ramp = colour_ramp(N, [(0.05, (0.026, 0.015, 0.009)), (0.55, (0.040, 0.024, 0.014)),
                           (1.05, (0.056, 0.035, 0.021))])
    L.new(g2.outputs[0], ramp.inputs["Fac"])
    # slow colour drift across the boards
    drift = noise(obj, 1.2, 2.0)
    hsv = N.new("ShaderNodeHueSaturation")
    hr = N.new("ShaderNodeMapRange")
    hr.inputs["To Min"].default_value = 0.47; hr.inputs["To Max"].default_value = 0.53
    L.new(drift.outputs["Fac"], hr.inputs["Value"])
    vr = N.new("ShaderNodeMapRange")
    vr.inputs["To Min"].default_value = 0.85; vr.inputs["To Max"].default_value = 1.15
    L.new(drift.outputs["Fac"], vr.inputs["Value"])
    L.new(hr.outputs["Result"], hsv.inputs["Hue"]); L.new(vr.outputs["Result"], hsv.inputs["Value"])
    L.new(ramp.outputs["Color"], hsv.inputs["Color"])
    L.new(hsv.outputs["Color"], b.inputs["Base Color"])
    # roughness: satin, broken up by micro variation and the grain
    micro = noise(obj, 220.0, 3.0)
    rr = N.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = 0.30; rr.inputs["To Max"].default_value = 0.50
    L.new(micro.outputs["Fac"], rr.inputs["Value"])
    rg = N.new("ShaderNodeMath"); rg.operation = "MULTIPLY_ADD"
    rg.inputs[1].default_value = 0.10
    L.new(wave.outputs["Fac"], rg.inputs[0]); L.new(rr.outputs["Result"], rg.inputs[2])
    L.new(rg.outputs[0], b.inputs["Roughness"])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.05
    bump.inputs["Distance"].default_value = 0.0003
    L.new(fine.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Coat Weight"].default_value = 0.2
    b.inputs["Coat Roughness"].default_value = 0.25
    return m


def whiteboard_textures():
    """The board's marker work, drawn with Pillow (system Python) at
    4800 x 3200 px for this camera; returns (colour, mask) image paths.
    Cached: redrawn only when whiteboard_texture.py is newer."""
    import shutil
    import subprocess
    work = os.path.join(ROOT, "design", "laptop-film", "work")
    os.makedirs(work, exist_ok=True)
    gen = os.path.join(ROOT, "scripts", "film", "whiteboard_texture.py")
    png = os.path.join(work, "whiteboard-%s.png" % ASPECT)
    mask = os.path.join(work, "whiteboard-%s-mask.png" % ASPECT)
    if not (os.path.exists(png) and os.path.exists(mask)
            and os.path.getmtime(png) > os.path.getmtime(gen)):
        py = shutil.which("python3") or "/Library/Frameworks/Python.framework/Versions/3.13/bin/python3"
        subprocess.run([py, gen, ASPECT, png, mask], check=True)
    return png, mask


def build_room(scene):
    # desk top: walnut, extends well past every frame edge
    desk = slab("Desk", 2.8, 0.55 + WALL_Y, -0.03, 0.0, 0.004, segs=3, cy=(WALL_Y - 0.55) / 2 - 0.001)
    add_bevel(desk, 0.0015, segments=3)
    desk.data.materials.append(mat_wood())

    wall_m = mat_simple("WallPaint", (0.040, 0.036, 0.032), 0.85, spec=0.3)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, WALL_Y, 1.0), rotation=(math.radians(90), 0, 0))
    wall = bpy.context.active_object
    wall.name = "Wall"; wall.scale = (8.0, 3.0, 1.0)
    wall.data.materials.append(wall_m)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -1.0, -0.75))
    floor = bpy.context.active_object
    floor.name = "Floor"; floor.scale = (8.0, 6.0, 1.0)
    floor.data.materials.append(wall_m)

    # whiteboard -------------------------------------------------------
    # white glossy board (matte where there is paper or ink), a thin
    # aluminium frame with grey corner caps, and a tray with markers and an
    # eraser. The marker work is a 4800 px texture.
    bw, bh, bcx, bcz = 1.20, 0.80, BOARD[ASPECT]["x"], 0.56
    rot = Euler((math.radians(90), 0, 0))
    board_m, N, L = new_mat("WhiteboardPanel")
    bb = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    png, mask_png = whiteboard_textures()
    tex = N.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(png)
    tex.image.pack()
    tex.interpolation = "Cubic"
    L.new(tc.outputs["Generated"], tex.inputs["Vector"])
    L.new(tex.outputs["Color"], bb.inputs["Base Color"])
    mtex = N.new("ShaderNodeTexImage")
    mtex.image = bpy.data.images.load(mask_png)
    mtex.image.colorspace_settings.name = "Non-Color"
    mtex.image.pack()
    L.new(tc.outputs["Generated"], mtex.inputs["Vector"])
    rough = N.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = 0.14
    rough.inputs["To Max"].default_value = 0.75
    L.new(mtex.outputs["Color"], rough.inputs["Value"])
    L.new(rough.outputs["Result"], bb.inputs["Roughness"])
    coat = N.new("ShaderNodeMapRange")
    coat.inputs["To Min"].default_value = 0.15
    coat.inputs["To Max"].default_value = 0.0
    L.new(mtex.outputs["Color"], coat.inputs["Value"])
    L.new(coat.outputs["Result"], bb.inputs["Coat Weight"])
    bb.inputs["Coat Roughness"].default_value = 0.06
    panel = slab("WhiteboardPanel", bw, bh, 0.0, 0.010, 0.002, segs=2)
    panel.rotation_euler = rot
    panel.location = (bcx, WALL_Y, bcz)
    panel.data.materials.append(board_m)

    frame_m, N, L = new_mat("BoardFrame")
    fb = N["Principled BSDF"]
    fb.inputs["Base Color"].default_value = (0.78, 0.79, 0.80, 1)
    fb.inputs["Metallic"].default_value = 1.0
    fb.inputs["Anisotropic"].default_value = 0.5
    fn = N.new("ShaderNodeTexNoise")
    fn.inputs["Scale"].default_value = 400.0
    fr_ = N.new("ShaderNodeMapRange")
    fr_.inputs["To Min"].default_value = 0.28
    fr_.inputs["To Max"].default_value = 0.36
    L.new(fn.outputs["Fac"], fr_.inputs["Value"])
    L.new(fr_.outputs["Result"], fb.inputs["Roughness"])
    cap_m = mat_simple("BoardCorner", (0.10, 0.10, 0.105), 0.45, spec=0.4)
    t = 0.013                      # thin frame: 13 mm face, 14 mm deep
    for (fw, fh, ox, oz) in [(bw + 2 * t, t, 0, bh / 2 + t / 2), (bw + 2 * t, t, 0, -bh / 2 - t / 2),
                             (t, bh, -bw / 2 - t / 2, 0), (t, bh, bw / 2 + t / 2, 0)]:
        bar = slab("BoardFrame", fw, fh, 0.0, 0.014, 0.0025, segs=3)
        add_bevel(bar, 0.0012, segments=3)
        bar.rotation_euler = rot
        bar.location = (bcx + ox, WALL_Y, bcz + oz)
        bar.data.materials.append(frame_m)
    for sx in (-1, 1):
        for sz in (-1, 1):
            cc = slab("BoardCorner", 0.030, 0.030, 0.0, 0.0175, 0.006, segs=4)
            add_bevel(cc, 0.002, segments=3)
            cc.rotation_euler = rot
            cc.location = (bcx + sx * (bw / 2 + t / 2), WALL_Y, bcz + sz * (bh / 2 + t / 2))
            cc.data.materials.append(cap_m)

    # tray: a shallow aluminium channel under the board
    tray_w = 0.90
    tray_z = bcz - bh / 2 - t - 0.006
    tray = slab("MarkerTray", tray_w, 0.072, 0.0, 0.006, 0.003, segs=3)
    add_bevel(tray, 0.0012, segments=3)
    tray.location = (bcx, WALL_Y - 0.036, tray_z - 0.006)
    tray.data.materials.append(frame_m)
    lip = slab("MarkerTrayLip", tray_w, 0.004, 0.0, 0.016, 0.0015, segs=2)
    add_bevel(lip, 0.0008, segments=2)
    lip.location = (bcx, WALL_Y - 0.070, tray_z - 0.006)
    lip.data.materials.append(frame_m)
    for ex in (-1, 1):
        end = slab("MarkerTrayEnd", 0.004, 0.072, 0.0, 0.016, 0.0015, segs=2,
                   cx=ex * (tray_w / 2 - 0.002))
        end.location = (bcx, WALL_Y - 0.036, tray_z - 0.006)
        end.data.materials.append(cap_m)

    # markers: barrel in the ink colour, a darker cap, a white label band
    def marker(name, ink, x, yaw):
        root = bpy.data.objects.new(name, None)
        scene.collection.objects.link(root)
        root.location = (bcx + x, WALL_Y - 0.040, tray_z + 0.0085)
        root.rotation_euler = (0, 0, math.radians(yaw))
        body_m = mat_simple(name + "Body", ink, 0.38, spec=0.5, coat=0.3)
        cap_c = tuple(c * 0.6 for c in ink)
        capm = mat_simple(name + "Cap", cap_c, 0.32, spec=0.5, coat=0.3)
        label = mat_simple(name + "Label", (0.72, 0.72, 0.70), 0.5, spec=0.4)
        parts = [(0.0085, 0.085, -0.010, body_m), (0.0089, 0.040, 0.050, capm),
                 (0.0087, 0.030, -0.018, label), (0.0060, 0.008, -0.0565, capm)]
        for (r, ln, off, mm) in parts:
            bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=r, depth=ln,
                                                location=(0, 0, 0), rotation=(0, math.radians(90), 0))
            c = bpy.context.active_object
            c.name = name + "Part"
            for p in c.data.polygons:
                p.use_smooth = True
            add_bevel(c, min(0.0015, r * 0.2), segments=3, angle=40)
            c.location = (off, 0, 0)
            c.data.materials.append(mm)
            c.parent = root

    def eraser(x, yaw):
        root = bpy.data.objects.new("Eraser", None)
        scene.collection.objects.link(root)
        root.location = (bcx + x, WALL_Y - 0.043, tray_z)
        root.rotation_euler = (0, 0, math.radians(yaw))
        felt = mat_simple("EraserFelt", (0.05, 0.05, 0.055), 0.95, spec=0.2)
        shell_m = mat_simple("EraserShell", (0.018, 0.045, 0.11), 0.4, spec=0.5, coat=0.2)
        f = slab("EraserFelt", 0.135, 0.048, 0.0, 0.010, 0.006, segs=4)
        add_bevel(f, 0.002, segments=2)
        f.data.materials.append(felt); f.parent = root
        sh = slab("EraserShell", 0.132, 0.045, 0.010, 0.030, 0.008, segs=6)
        add_bevel(sh, 0.006, segments=5, angle=30)
        sh.data.materials.append(shell_m); sh.parent = root

    T = TRAY[ASPECT]
    eraser(*T["eraser"])
    for (nm, ink), (x, yaw) in zip([("MarkerBlue", (0.03, 0.08, 0.32)), ("MarkerBlack", (0.025, 0.025, 0.028)),
                                    ("MarkerRed", (0.42, 0.04, 0.035))], T["markers"]):
        marker(nm, ink, x, yaw)

    P = PROPS[ASPECT]
    # two closed books at back left
    def book(name, w, d, h, cover_col, loc, yaw):
        root = bpy.data.objects.new(name, None)
        scene.collection.objects.link(root)
        root.location = loc
        root.rotation_euler = (0, 0, math.radians(yaw))
        cm = mat_simple(name + "Cloth", cover_col, 0.78, spec=0.35)
        pm, N, L = new_mat(name + "Pages")
        pb = N["Principled BSDF"]
        pb.inputs["Base Color"].default_value = (0.62, 0.57, 0.47, 1)
        pb.inputs["Roughness"].default_value = 0.85
        tco = N.new("ShaderNodeTexCoord")
        wv = N.new("ShaderNodeTexWave"); wv.bands_direction = "Z"
        wv.inputs["Scale"].default_value = 900.0
        L.new(tco.outputs["Object"], wv.inputs["Vector"])
        bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.25
        L.new(wv.outputs["Fac"], bp.inputs["Height"]); L.new(bp.outputs["Normal"], pb.inputs["Normal"])
        bt = 0.0025
        for zc in (0.0, h - bt):
            board = slab(name + "Board", w, d, zc, zc + bt, 0.002, segs=2)
            add_bevel(board, 0.0008, segments=2)
            board.data.materials.append(cm); board.parent = root
        spine = slab(name + "Spine", 0.004, d, 0.0, h, 0.0015, segs=2, cx=-w / 2 + 0.002)
        spine.data.materials.append(cm); spine.parent = root
        pages = slab(name + "Pages", w - 0.007, d - 0.006, bt, h - bt, 0.001, segs=2, cx=-0.0005)
        pages.data.materials.append(pm); pages.parent = root
        return root

    book("BookA", 0.240, 0.168, 0.028, (0.055, 0.11, 0.085), (P["bookA"][0], P["bookA"][1], 0.0), P["bookA"][2])
    book("BookB", 0.215, 0.150, 0.022, (0.30, 0.06, 0.04), (P["bookB"][0], P["bookB"][1], 0.028), P["bookB"][2])

    # a used stoneware mug at back right: thrown by hand, so a slight belly
    # and taper and a little out of round, a rounded lip, an unglazed foot
    # ring, a satin speckled glaze with the studio's name printed into it,
    # and coffee inside
    mroot = bpy.data.objects.new("MugRoot", None)
    scene.collection.objects.link(mroot)
    mroot.location = (P["mug"][0], P["mug"][1], 0.0)
    mroot.rotation_euler = (0, 0, math.radians(P["mug"][2]))
    mug = mesh_object("Mug", mug_body_bm())
    handle = mug_handle()
    coffee = mesh_object("MugCoffee", mug_coffee_bm())
    # the print faces the camera on the last frame
    cam_loc = camera_state(ASPECT, FRAMES)[0]
    world_ang = math.atan2(cam_loc.y - P["mug"][1], cam_loc.x - P["mug"][0])
    local_ang = world_ang - math.radians(P["mug"][2])
    u_logo = (math.atan2(math.sin(local_ang), math.cos(local_ang)) / math.tau + 0.5) % 1.0
    glaze = mat_mug(u_logo, 0.5)   # the handle sits at angle 0, u = 0.5
    mug.data.materials.append(glaze); handle.data.materials.append(glaze)
    coffee.data.materials.append(mat_coffee())
    for o in (mug, handle, coffee):
        o.parent = mroot


def _catmull(pts, sub=4):
    out = []
    for i in range(len(pts) - 1):
        p0 = pts[max(0, i - 1)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(len(pts) - 1, i + 2)]
        for s in range(sub):
            t = s / sub
            out.append(tuple(0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t
                                    + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t ** 3) for k in (0, 1)))
    out.append(pts[-1])
    return out


MUG_SEGS = 96
MUG_LIP = (0.0411, 0.0922, 0.00275)   # outer radius at the lip, lip centre height, lip radius


def mug_profile():
    """(radius, z) from the centre of the underside, up the outside, over
    the rounded lip and down the inside to the centre of the floor."""
    ro, zc, rl = MUG_LIP
    under = [(0.0003, 0.0018), (0.024, 0.0018), (0.0295, 0.0006), (0.0325, 0.0), (0.0345, 0.0004),
             (0.0356, 0.0022), (0.0360, 0.0050), (0.0368, 0.0066)]
    outside = [(0.0394, 0.0105), (0.0411, 0.0190), (0.0419, 0.0320), (0.0420, 0.0480), (0.0414, 0.0650),
               (0.0409, 0.0790), (ro, zc - 0.004)]
    lip = [((ro - rl) + rl * math.cos(math.radians(a)), zc + rl * math.sin(math.radians(a)))
           for a in range(0, 181, 15)]
    inside = [(ro - 2 * rl - 0.0001, zc - 0.004), (0.0355, 0.0790), (0.0359, 0.0650), (0.0362, 0.0480),
              (0.0360, 0.0330), (0.0350, 0.0210), (0.0322, 0.0135), (0.0275, 0.0098), (0.0150, 0.0084),
              (0.0003, 0.0082)]
    prof = _catmull(under, 3) + _catmull(outside, 5)[1:] + lip[1:] + _catmull(inside, 5)
    out = []
    for p in prof:      # drop points that land on top of each other
        if not out or math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > 1e-5:
            out.append(p)
    return out


def mug_wobble(r, z, a):
    """Hand-thrown: out of round by a few tenths of a millimetre, varying with height."""
    return r * (1.0 + 0.0045 * math.sin(2 * a + 1.3 + 9.0 * z) + 0.0025 * math.sin(3 * a + 0.4 - 14.0 * z)
                + 0.0015 * math.sin(5 * a + 2.0))


def mug_body_bm():
    prof = mug_profile()
    bm = bmesh.new()
    rings = []
    for k in range(MUG_SEGS):
        a = math.tau * k / MUG_SEGS
        rings.append([bm.verts.new((mug_wobble(r, z, a) * math.cos(a), mug_wobble(r, z, a) * math.sin(a), z))
                      for (r, z) in prof])
    n = len(prof)
    for k in range(MUG_SEGS):
        A, B = rings[k], rings[(k + 1) % MUG_SEGS]
        for i in range(n - 1):
            bm.faces.new((A[i], B[i], B[i + 1], A[i + 1]))
    # close the tiny holes at the two poles
    bm.faces.new([rings[k][0] for k in range(MUG_SEGS)])
    bm.faces.new([rings[k][-1] for k in range(MUG_SEGS)])
    return bm


def mug_handle():
    """A C-shaped handle: a torus with the half inside the wall removed."""
    bpy.ops.mesh.primitive_torus_add(major_radius=0.026, minor_radius=0.0058, major_segments=48,
                                     minor_segments=18, location=(0, 0, 0))
    h = bpy.context.active_object
    h.name = "MugHandle"
    M = Matrix.Translation((0.044, 0, 0.050)) @ Matrix.Rotation(math.radians(90), 4, "X") @ \
        Matrix.Diagonal((1.0, 1.06, 0.82, 1.0))
    h.data.transform(M)
    bm = bmesh.new(); bm.from_mesh(h.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x < 0.0375], context="VERTS")
    bm.to_mesh(h.data); bm.free()
    for p in h.data.polygons:
        p.use_smooth = True
    return h


def mug_coffee_bm():
    """Coffee about 1.5 cm below the rim: a disc tucked into the wall."""
    bm = bmesh.new()
    z = MUG_LIP[1] + MUG_LIP[2] - 0.015
    r = 0.0359
    vs = [bm.verts.new((r * math.cos(math.tau * k / 64), r * math.sin(math.tau * k / 64), z)) for k in range(64)]
    bm.faces.new(vs)
    return bm


def mat_coffee():
    m, N, L = new_mat("Coffee")
    b = N["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.07
    b.inputs["Specular IOR Level"].default_value = 0.5
    b.inputs["IOR"].default_value = 1.34
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Object"], sep.inputs["Vector"])
    rr = N.new("ShaderNodeVectorMath"); rr.operation = "LENGTH"
    L.new(tc.outputs["Object"], rr.inputs[0])
    # a faint lighter ring where the coffee meets the wall
    edge = N.new("ShaderNodeMapRange")
    edge.inputs["From Min"].default_value = 0.0320
    edge.inputs["From Max"].default_value = 0.0356
    edge.interpolation_type = "SMOOTHSTEP"
    L.new(rr.outputs["Value"], edge.inputs["Value"])
    col = N.new("ShaderNodeMix"); col.data_type = "RGBA"
    sock(col.inputs, "A_Color").default_value = (0.010, 0.0042, 0.0018, 1)
    sock(col.inputs, "B_Color").default_value = (0.042, 0.020, 0.009, 1)
    L.new(edge.outputs["Result"], sock(col.inputs, "Factor_Float"))
    L.new(sock(col.outputs, "Result_Color"), b.inputs["Base Color"])
    return m


def mug_textures(u_logo, u_handle):
    import shutil
    import subprocess
    work = os.path.join(ROOT, "design", "laptop-film", "work")
    os.makedirs(work, exist_ok=True)
    gen = os.path.join(ROOT, "scripts", "film", "mug_texture.py")
    decal = os.path.join(work, "mug-%s-decal.png" % ASPECT)
    rough = os.path.join(work, "mug-%s-rough.png" % ASPECT)
    py = shutil.which("python3") or "/Library/Frameworks/Python.framework/Versions/3.13/bin/python3"
    subprocess.run([py, gen, decal, rough, "%.5f" % u_logo, "%.5f" % u_handle, MUG_FONT], check=True)
    return decal, rough


def mat_mug(u_logo, u_handle):
    """Satin stoneware glaze over a buff clay body."""
    m, N, L = new_mat("Stoneware")
    b = N["Principled BSDF"]
    b.inputs["Specular IOR Level"].default_value = 0.4
    tc = N.new("ShaderNodeTexCoord")
    obj = tc.outputs["Object"]
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(obj, sep.inputs["Vector"])
    # cylindrical coordinates: u = angle (handle at 0.5), v = z / height
    at = N.new("ShaderNodeMath"); at.operation = "ARCTAN2"
    L.new(sep.outputs["Y"], at.inputs[0]); L.new(sep.outputs["X"], at.inputs[1])
    u = N.new("ShaderNodeMath"); u.operation = "MULTIPLY_ADD"
    u.inputs[1].default_value = 1.0 / math.tau; u.inputs[2].default_value = 0.5
    L.new(at.outputs[0], u.inputs[0])
    v = N.new("ShaderNodeMath"); v.operation = "MULTIPLY"
    v.inputs[1].default_value = 1.0 / 0.095
    L.new(sep.outputs["Z"], v.inputs[0])
    uv = N.new("ShaderNodeCombineXYZ")
    L.new(u.outputs[0], uv.inputs["X"]); L.new(v.outputs[0], uv.inputs["Y"])
    decal_p, rough_p = mug_textures(u_logo, u_handle)
    dec = N.new("ShaderNodeTexImage"); dec.image = bpy.data.images.load(decal_p); dec.image.pack()
    dec.extension = "EXTEND"; dec.interpolation = "Cubic"
    L.new(uv.outputs[0], dec.inputs["Vector"])
    rtx = N.new("ShaderNodeTexImage"); rtx.image = bpy.data.images.load(rough_p); rtx.image.pack()
    rtx.image.colorspace_settings.name = "Non-Color"; rtx.extension = "EXTEND"
    L.new(uv.outputs[0], rtx.inputs["Vector"])
    # outer wall only (the print must not show through on the inside)
    rad = N.new("ShaderNodeMath"); rad.operation = "SQRT"
    xx = N.new("ShaderNodeVectorMath"); xx.operation = "DOT_PRODUCT"
    flat = N.new("ShaderNodeVectorMath"); flat.operation = "MULTIPLY"
    flat.inputs[1].default_value = (1.0, 1.0, 0.0)
    L.new(obj, flat.inputs[0])
    L.new(flat.outputs[0], xx.inputs[0]); L.new(flat.outputs[0], xx.inputs[1])
    L.new(xx.outputs["Value"], rad.inputs[0])
    outer = N.new("ShaderNodeMapRange")
    outer.inputs["From Min"].default_value = 0.0378
    outer.inputs["From Max"].default_value = 0.0386
    L.new(rad.outputs[0], outer.inputs["Value"])
    dmask = N.new("ShaderNodeMath"); dmask.operation = "MULTIPLY"
    L.new(dec.outputs["Alpha"], dmask.inputs[0]); L.new(outer.outputs["Result"], dmask.inputs[1])

    # glaze colour: the old cream, drifting a few percent, deeper where it pools
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 38.0; nz.inputs["Detail"].default_value = 3.0
    L.new(obj, nz.inputs["Vector"])
    drift = N.new("ShaderNodeMapRange")
    drift.inputs["To Min"].default_value = 0.955; drift.inputs["To Max"].default_value = 1.035
    L.new(nz.outputs["Fac"], drift.inputs["Value"])
    base = N.new("ShaderNodeMix"); base.data_type = "RGBA"; base.blend_type = "MULTIPLY"
    sock(base.inputs, "Factor_Float").default_value = 1.0
    sock(base.inputs, "A_Color").default_value = (0.70, 0.66, 0.60, 1)
    L.new(drift.outputs["Result"], sock(base.inputs, "B_Color"))
    pool = N.new("ShaderNodeMapRange")       # 1 at the glaze's bottom edge, 0 by 16 mm up
    pool.inputs["From Min"].default_value = 0.016
    pool.inputs["From Max"].default_value = 0.0068
    pool.interpolation_type = "SMOOTHSTEP"
    L.new(sep.outputs["Z"], pool.inputs["Value"])
    pooled = N.new("ShaderNodeMix"); pooled.data_type = "RGBA"
    L.new(sock(base.outputs, "Result_Color"), sock(pooled.inputs, "A_Color"))
    sock(pooled.inputs, "B_Color").default_value = (0.56, 0.50, 0.42, 1)
    pf = N.new("ShaderNodeMath"); pf.operation = "MULTIPLY"; pf.inputs[1].default_value = 0.65
    L.new(pool.outputs["Result"], pf.inputs[0])
    L.new(pf.outputs[0], sock(pooled.inputs, "Factor_Float"))
    printed = N.new("ShaderNodeMix"); printed.data_type = "RGBA"
    L.new(sock(pooled.outputs, "Result_Color"), sock(printed.inputs, "A_Color"))
    L.new(dec.outputs["Color"], sock(printed.inputs, "B_Color"))
    L.new(dmask.outputs[0], sock(printed.inputs, "Factor_Float"))
    # the foot ring: raw buff clay below a slightly wavy glaze line
    fz = N.new("ShaderNodeTexNoise"); fz.inputs["Scale"].default_value = 60.0
    L.new(obj, fz.inputs["Vector"])
    line = N.new("ShaderNodeMath"); line.operation = "MULTIPLY_ADD"
    line.inputs[1].default_value = 0.0016; line.inputs[2].default_value = 0.0062
    L.new(fz.outputs["Fac"], line.inputs[0])
    dz = N.new("ShaderNodeMath"); dz.operation = "SUBTRACT"
    L.new(sep.outputs["Z"], dz.inputs[0]); L.new(line.outputs[0], dz.inputs[1])
    clay = N.new("ShaderNodeMapRange")
    clay.inputs["From Min"].default_value = 0.0003
    clay.inputs["From Max"].default_value = -0.0003
    L.new(dz.outputs[0], clay.inputs["Value"])
    # ...only on the outside and underside, not the floor inside
    notin = N.new("ShaderNodeMapRange")
    notin.inputs["From Min"].default_value = 0.0035
    notin.inputs["From Max"].default_value = 0.0025
    L.new(sep.outputs["Z"], notin.inputs["Value"])
    clay_or = N.new("ShaderNodeMath"); clay_or.operation = "MAXIMUM"
    cm2 = N.new("ShaderNodeMath"); cm2.operation = "MULTIPLY"
    L.new(clay.outputs["Result"], cm2.inputs[0]); L.new(outer.outputs["Result"], cm2.inputs[1])
    L.new(cm2.outputs[0], clay_or.inputs[0]); L.new(notin.outputs["Result"], clay_or.inputs[1])
    cn = N.new("ShaderNodeTexNoise"); cn.inputs["Scale"].default_value = 900.0
    L.new(obj, cn.inputs["Vector"])
    claycol = N.new("ShaderNodeMix"); claycol.data_type = "RGBA"
    sock(claycol.inputs, "A_Color").default_value = (0.27, 0.20, 0.135, 1)
    sock(claycol.inputs, "B_Color").default_value = (0.34, 0.26, 0.18, 1)
    L.new(cn.outputs["Fac"], sock(claycol.inputs, "Factor_Float"))
    col = N.new("ShaderNodeMix"); col.data_type = "RGBA"
    L.new(sock(printed.outputs, "Result_Color"), sock(col.inputs, "A_Color"))
    L.new(sock(claycol.outputs, "Result_Color"), sock(col.inputs, "B_Color"))
    L.new(clay_or.outputs[0], sock(col.inputs, "Factor_Float"))
    L.new(sock(col.outputs, "Result_Color"), b.inputs["Base Color"])

    # roughness: satin 0.46, a little variation, glossier where the glaze
    # pools and where hands have been, raw clay matte
    rn = N.new("ShaderNodeTexNoise"); rn.inputs["Scale"].default_value = 70.0
    L.new(obj, rn.inputs["Vector"])
    r1 = N.new("ShaderNodeMapRange")
    r1.inputs["To Min"].default_value = 0.43; r1.inputs["To Max"].default_value = 0.50
    L.new(rn.outputs["Fac"], r1.inputs["Value"])
    r2 = N.new("ShaderNodeMath"); r2.operation = "MULTIPLY_ADD"     # (map - 0.5) * 0.5
    r2.inputs[1].default_value = 0.5; r2.inputs[2].default_value = -0.25
    L.new(rtx.outputs["Color"], r2.inputs[0])
    r3 = N.new("ShaderNodeMath"); r3.operation = "ADD"
    L.new(r1.outputs["Result"], r3.inputs[0]); L.new(r2.outputs[0], r3.inputs[1])
    r4 = N.new("ShaderNodeMath"); r4.operation = "MULTIPLY_ADD"
    r4.inputs[1].default_value = -0.08
    L.new(pool.outputs["Result"], r4.inputs[0]); L.new(r3.outputs[0], r4.inputs[2])
    rmix = N.new("ShaderNodeMix"); rmix.data_type = "FLOAT"
    L.new(r4.outputs[0], sock(rmix.inputs, "A_Float"))
    sock(rmix.inputs, "B_Float").default_value = 0.88
    L.new(clay_or.outputs[0], sock(rmix.inputs, "Factor_Float"))
    L.new(sock(rmix.outputs, "Result_Float"), b.inputs["Roughness"])
    # throwing rings and an orange-peel glaze surface, barely there
    rings = N.new("ShaderNodeTexWave"); rings.bands_direction = "Z"
    rings.inputs["Scale"].default_value = 26.0
    rings.inputs["Distortion"].default_value = 2.0
    L.new(obj, rings.inputs["Vector"])
    peel = N.new("ShaderNodeTexNoise"); peel.inputs["Scale"].default_value = 1400.0
    L.new(obj, peel.inputs["Vector"])
    bsum = N.new("ShaderNodeMath"); bsum.operation = "MULTIPLY_ADD"
    bsum.inputs[1].default_value = 0.4
    L.new(peel.outputs["Fac"], bsum.inputs[0]); L.new(rings.outputs["Fac"], bsum.inputs[2])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.04
    bump.inputs["Distance"].default_value = 0.00008
    L.new(bsum.outputs[0], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


# --------------------------------------------------------------------- build
KEY_PITCH = 0.0184
KEY_GAP = 0.0026
KB_W = 15 * KEY_PITCH
KB_BACK = BASE_D / 2 - 0.017          # y of the keyboard's back edge
FN_H = 0.72


def keyboard_layout():
    fkey = (15 - 1.5 - 1.0) / 12
    rows = [
        (FN_H, [1.5] + [fkey] * 12 + [1.0]),
        (1.0, [1.0] * 13 + [2.0]),
        (1.0, [1.5] + [1.0] * 12 + [1.5]),
        (1.0, [1.75] + [1.0] * 11 + [2.25]),
        (1.0, [2.25] + [1.0] * 10 + [2.75]),
        (1.0, [1.0, 1.0, 1.0, 1.375, 5.25, 1.375, 1.0, "L", "UD", "R"]),
    ]
    keys = []
    y = KB_BACK
    for (h, widths) in rows:
        x = -KB_W / 2
        hh = h * KEY_PITCH
        for wv in widths:
            if wv == "UD":
                w = KEY_PITCH
                half = (hh - KEY_GAP) / 2 - KEY_GAP / 4
                keys.append((x + w / 2, y - KEY_GAP / 2 - half / 2, w - KEY_GAP, half))
                keys.append((x + w / 2, y - hh + KEY_GAP / 2 + half / 2, w - KEY_GAP, half))
                x += w
                continue
            if wv in ("L", "R"):
                w = KEY_PITCH
                half = (hh - KEY_GAP) / 2 - KEY_GAP / 4
                keys.append((x + w / 2, y - hh + KEY_GAP / 2 + half / 2, w - KEY_GAP, half))
                x += w
                continue
            w = wv * KEY_PITCH
            keys.append((x + w / 2, y - hh / 2, w - KEY_GAP, hh - KEY_GAP))
            x += w
        y -= hh
    return keys, y  # y = front edge of keyboard


def build_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    alu = mat_aluminium("SpaceGreyAluminium", (0.205, 0.208, 0.218), grilles=True)
    alu_lid = mat_aluminium("SpaceGreyAluminiumLid", (0.205, 0.208, 0.218))
    _kl, _kf = keyboard_layout()
    keys_m = mat_keys(_kl, _kf)
    rubber = mat_simple("Rubber", (0.008, 0.008, 0.008), 0.7, spec=0.3)
    well_m = mat_simple("WellFloor", (0.10, 0.102, 0.108), 0.45, metallic=1.0)
    pad_m = mat_simple("TrackpadGlass", (0.085, 0.087, 0.092), 0.44, metallic=0.7, spec=0.5)
    hinge_m = mat_simple("Hinge", (0.06, 0.062, 0.066), 0.32, metallic=1.0)
    screen_m = mat_screen()
    floor_m = mat_floor()

    # base -------------------------------------------------------------
    base = slab("Base", BASE_W, BASE_D, FOOT_H, BASE_TOP, CORNER_R, segs=12)
    keys, kb_front = keyboard_layout()
    well = slab("WellCut", KB_W + 0.0035, (KB_BACK - kb_front) + 0.0035,
                BASE_TOP - 0.0013, BASE_TOP + 0.01, 0.0035, segs=6,
                cy=(KB_BACK + kb_front) / 2)
    pad_w = 0.160
    pad_d = (kb_front - 0.010) - (-BASE_D / 2 + 0.010)   # 10 mm from the keys and the front edge
    pad_cy = -BASE_D / 2 + 0.010 + pad_d / 2
    pad_cut = slab("PadCut", pad_w + 0.0008, pad_d + 0.0008,
                   BASE_TOP - 0.0009, BASE_TOP + 0.01, 0.0059, segs=8, cy=pad_cy)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1.0,
                                         location=(0, -BASE_D / 2 - 0.0005, BASE_TOP + 0.0008))
    scoop = bpy.context.active_object
    scoop.name = "Scoop"
    scoop.scale = (0.036, 0.0055, 0.0032)
    boolean_cut(base, [well, pad_cut, scoop])
    add_bevel(base, 0.0007, segments=4, angle=30)
    base.data.materials.append(alu)

    wf = slab("WellFloor", KB_W + 0.003, (KB_BACK - kb_front) + 0.003,
              BASE_TOP - 0.0016, BASE_TOP - 0.0012, 0.003, segs=4,
              cy=(KB_BACK + kb_front) / 2)
    wf.data.materials.append(well_m)

    bm = bmesh.new()
    for (kx, ky, kw, kd) in keys:
        rounded_rect_bm(bm, kw, kd, BASE_TOP - 0.0012, BASE_TOP + 0.0001, 0.0014,
                        segs=4, cx=kx, cy=ky)
    kb = mesh_object("Keys", bm)
    add_bevel(kb, 0.00045, segments=3, angle=40)
    kb.data.materials.append(keys_m)

    pad = slab("Trackpad", pad_w, pad_d, BASE_TOP - 0.0008, BASE_TOP - 0.00006,
               0.0055, segs=10, cy=pad_cy)
    add_bevel(pad, 0.00025, segments=2, angle=40)
    pad.data.materials.append(pad_m)

    for sx in (-1, 1):
        for sy in (-1, 1):
            f = slab("Foot", 0.012, 0.012, 0.0, FOOT_H + 0.0002, 0.0059, segs=8,
                     cx=sx * (BASE_W / 2 - 0.03), cy=sy * (BASE_D / 2 - 0.026))
            f.data.materials.append(rubber)

    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.0042, depth=BASE_W - 0.07,
                                        location=(0, PIVOT.y - 0.0028, PIVOT.z - 0.0022),
                                        rotation=(0, math.radians(90), 0))
    hinge = bpy.context.active_object
    hinge.name = "Hinge"
    for p in hinge.data.polygons:
        p.use_smooth = True
    add_bevel(hinge, 0.0006, segments=3, angle=40)
    hinge.data.materials.append(hinge_m)

    # lid --------------------------------------------------------------
    pivot = bpy.data.objects.new("LidPivot", None)
    scene.collection.objects.link(pivot)
    pivot.location = PIVOT
    lid = slab("Lid", BASE_W, BASE_D, 0.0, LID_T, CORNER_R, segs=12, cy=-BASE_D / 2)
    add_bevel(lid, 0.0007, segments=4, angle=30)
    lid.data.materials.append(alu_lid)
    lid.parent = pivot
    glass = slab("ScreenGlass", BASE_W - 0.0042, BASE_D - 0.0042, GLASS_FRONT,
                 0.0003, CORNER_R - 0.0021, segs=12, cy=-BASE_D / 2)
    add_bevel(glass, 0.00018, segments=2, angle=40)
    glass.data.materials.append(screen_m)
    glass.parent = pivot
    bm = bmesh.new()
    cw, cdp, cr, zc = BASE_W - 0.0042, BASE_D - 0.0042, CORNER_R - 0.0021, GLASS_FRONT - 0.00015
    pts = []
    for (ccx, ccy, a0) in [(cw / 2 - cr, cdp / 2 - cr, 0), (-cw / 2 + cr, cdp / 2 - cr, 90),
                           (-cw / 2 + cr, -cdp / 2 + cr, 180), (cw / 2 - cr, -cdp / 2 + cr, 270)]:
        for k in range(13):
            ang = math.radians(a0 + 90.0 * k / 12)
            pts.append((ccx + cr * math.cos(ang), ccy - BASE_D / 2 + cr * math.sin(ang)))
    face = bm.faces.new([bm.verts.new((x, y, zc)) for x, y in reversed(pts)])
    me = bpy.data.meshes.new("CoverGlass")
    bm.to_mesh(me); bm.free()
    cover = bpy.data.objects.new("CoverGlass", me)
    scene.collection.objects.link(cover)
    cover.data.materials.append(mat_cover_glass())
    cover.parent = pivot
    cover.visible_shadow = False

    # the room: walnut desk, wall, whiteboard, props ----------------
    build_room(scene)

    # lights -----------------------------------------------------------
    def area(name, loc, target, size, size_y, energy, color=None, temp=None, spread=180):
        ld = bpy.data.lights.new(name, "AREA")
        ld.shape = "RECTANGLE"
        ld.size, ld.size_y = size, size_y
        ld.energy = energy
        ld.spread = math.radians(spread)
        if temp:
            ld.use_temperature = True
            ld.temperature = temp
        if color:
            ld.color = color
        ob = bpy.data.objects.new(name, ld)
        scene.collection.objects.link(ob)
        ob.location = loc
        d = Vector(target) - Vector(loc)
        ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        return ob

    area("Key", (-1.05, -0.10, 0.95), (0.0, 0.02, 0.05), 1.0, 0.55, 5, temp=4500, spread=35)
    area("Rim", (0.6, 1.4, 0.9), (0.0, 0.0, 0.05), 0.9, 0.25, 1.8, temp=6200, spread=40)
    area("Top", (0.25, 0.35, 1.6), (0.0, 0.05, 0.0), 0.8, 0.8, 3, temp=5600, spread=60)
    bx = BOARD[ASPECT]["x"]
    area("BoardWash", (bx + 0.07, WALL_Y - 0.65, 1.35), (bx, WALL_Y, 0.50), 1.4, 0.30, 11.0, temp=5300, spread=75)
    # a second, cooler wash that only the whiteboard sees, so the board reads
    # white while the wall around it keeps its dark mood
    bfill = area("BoardFill", (bx + 0.07, WALL_Y - 0.65, 1.35), (bx, WALL_Y, 0.50), 1.4, 0.30, BOARD[ASPECT]["fill"],
                 temp=6500, spread=75)
    brd = bpy.data.collections.new("Board")
    scene.collection.children.link(brd)
    for o in list(scene.objects):
        if o.type == "MESH" and o.name.startswith(("Whiteboard", "BoardFrame", "BoardCorner", "MarkerTray",
                                                   "Marker", "Eraser")):
            brd.objects.link(o)
    bfill.light_linking.receiver_collection = brd

    # reflection card: a soft gradient panel only glossy rays can see, so
    # the aluminium has a studio softbox to reflect (classic product trick)
    def card(name, loc, target, w, h, strength, temp_rgb):
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=loc)
        ob = bpy.context.active_object
        ob.name = name
        ob.scale = (w, h, 1)
        d = Vector(target) - Vector(loc)
        ob.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        m, N, L = new_mat(name + "Mat")
        N.remove(N["Principled BSDF"])
        em = N.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = (*temp_rgb, 1)
        tc = N.new("ShaderNodeTexCoord")
        sep = N.new("ShaderNodeSeparateXYZ")
        L.new(tc.outputs["Generated"], sep.inputs["Vector"])
        # soft falloff on all four sides, brighter towards the top
        def ramp(sock, lo, hi):
            r = N.new("ShaderNodeMapRange")
            r.interpolation_type = "SMOOTHERSTEP"
            r.inputs["From Min"].default_value = lo
            r.inputs["From Max"].default_value = hi
            L.new(sock, r.inputs["Value"])
            return r.outputs["Result"]
        xa = ramp(sep.outputs["X"], 0.0, 0.35)
        xb = ramp(sep.outputs["X"], 1.0, 0.65)
        ya = ramp(sep.outputs["Y"], 0.0, 0.75)
        yb = ramp(sep.outputs["Y"], 1.0, 0.85)
        acc = None
        for s_ in (xa, xb, ya, yb):
            if acc is None:
                acc = s_
                continue
            mm = N.new("ShaderNodeMath"); mm.operation = "MULTIPLY"
            L.new(acc, mm.inputs[0]); L.new(s_, mm.inputs[1]); acc = mm.outputs[0]
        st = N.new("ShaderNodeMath"); st.operation = "MULTIPLY"
        st.inputs[1].default_value = strength
        L.new(acc, st.inputs[0])
        L.new(st.outputs[0], em.inputs["Strength"])
        L.new(em.outputs["Emission"], N["Material Output"].inputs["Surface"])
        ob.data.materials.append(m)
        ob.visible_camera = False
        ob.visible_diffuse = False
        ob.visible_shadow = False
        ob.visible_transmission = False
        ob.visible_volume_scatter = False
        return ob

    # kept faint: the aluminium should read matte satin, not chrome
    cb = card("CardBack", (0.95, 1.0, 0.30), (0.0, 0.0, 0.02), 0.75, 0.30, 0.11, (0.96, 0.96, 1.0))
    cl = card("CardLeft", (-1.0, 0.25, 0.30), (0.0, 0.0, 0.05), 0.7, 0.35, 0.14, (1.0, 0.88, 0.76))

    # cards and rim only touch the laptop, so the floor stays dark
    lap = bpy.data.collections.new("Laptop")
    scene.collection.children.link(lap)
    for o in list(scene.objects):
        if o.name.startswith(("Base", "Keys", "Well", "Trackpad", "Foot", "Hinge", "Lid", "Screen")):
            lap.objects.link(o)
    shell = bpy.data.collections.new("Shell")   # the aluminium body only
    scene.collection.children.link(shell)
    for n in ("Base", "Lid", "Hinge", "ScreenGlass"):
        shell.objects.link(scene.objects[n])
    scene.objects["Rim"].light_linking.receiver_collection = lap
    for o in (cb, cl):
        o.light_linking.receiver_collection = shell

    # a soft streak only the cover glass sees: front-right and high, so it
    # crosses the upper screen while the camera is off-axis and leaves the
    # mirror cone as the camera squares up (final frames: no reflection)
    centre, _, _ = screen_frame()
    a, e = math.radians(36.0), math.radians(20.0)
    sloc = centre + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * 1.3
    streak = card("ScreenStreak", tuple(sloc), tuple(centre), 0.34, 1.3, 3.0, (1.0, 0.95, 0.9))
    streak.rotation_euler.rotate_axis("Z", math.radians(28))
    cov = bpy.data.collections.new("Cover")
    scene.collection.children.link(cov)
    cov.objects.link(scene.objects["CoverGlass"])
    streak.light_linking.receiver_collection = cov

    # world: HDRI for reflections at low strength, black to the camera ----
    world = bpy.data.worlds.new("Studio")
    scene.world = world
    try:
        world.use_nodes = True
    except Exception:
        pass
    N, L = world.node_tree.nodes, world.node_tree.links
    bg = N["Background"]
    env = N.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(HDRI)
    mapn = N.new("ShaderNodeMapping")
    mapn.inputs["Rotation"].default_value = (0, 0, math.radians(120))
    tco = N.new("ShaderNodeTexCoord")
    L.new(tco.outputs["Generated"], mapn.inputs["Vector"])
    L.new(mapn.outputs["Vector"], env.inputs["Vector"])
    # black flag behind the camera: no studio light in the cone the screen
    # mirrors back towards a square-on camera
    _, n_scr, _ = screen_frame()
    dotn = N.new("ShaderNodeVectorMath"); dotn.operation = "DOT_PRODUCT"
    dotn.inputs[1].default_value = tuple(n_scr)
    L.new(tco.outputs["Generated"], dotn.inputs[0])
    flag = N.new("ShaderNodeMapRange")
    flag.interpolation_type = "SMOOTHSTEP"
    flag.inputs["From Min"].default_value = math.cos(math.radians(48))
    flag.inputs["From Max"].default_value = math.cos(math.radians(36))
    flag.inputs["To Min"].default_value = 1.0
    flag.inputs["To Max"].default_value = 0.0
    L.new(dotn.outputs["Value"], flag.inputs["Value"])
    flagged = N.new("ShaderNodeMix"); flagged.data_type = "RGBA"
    sock(flagged.inputs, "A_Color").default_value = (0, 0, 0, 1)
    L.new(flag.outputs["Result"], sock(flagged.inputs, "Factor_Float"))
    L.new(env.outputs["Color"], sock(flagged.inputs, "B_Color"))
    L.new(sock(flagged.outputs, "Result_Color"), bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.04
    lp = N.new("ShaderNodeLightPath")
    black = N.new("ShaderNodeBackground")
    black.inputs["Color"].default_value = (0, 0, 0, 1)
    mix = N.new("ShaderNodeMixShader")
    L.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
    L.new(bg.outputs["Background"], mix.inputs[1])
    L.new(black.outputs["Background"], mix.inputs[2])
    L.new(mix.outputs["Shader"], N["World Output"].inputs["Surface"])

    # camera -----------------------------------------------------------
    cd = bpy.data.cameras.new("Camera")
    cd.sensor_fit = "HORIZONTAL"
    cd.sensor_width = 36.0
    cd.lens = 50.0
    cd.clip_start = 0.01
    cd.dof.use_dof = True
    cd.dof.aperture_blades = 9
    cam = bpy.data.objects.new("Camera", cd)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # render -----------------------------------------------------------
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "METAL"
    scene.cycles.device = "GPU"
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    try:
        scene.cycles.denoising_use_gpu = True
    except Exception:
        pass
    scene.cycles.max_bounces = 8
    scene.cycles.glossy_bounces = 6
    scene.cycles.diffuse_bounces = 3
    scene.cycles.transmission_bounces = 4
    scene.cycles.sample_clamp_indirect = 8.0
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.blur_glossy = 0.5
    scene.cycles.filter_width = 1.2
    scene.render.use_persistent_data = True
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.render.film_transparent = False
    scene.frame_start, scene.frame_end = 1, FRAMES
    return scene


# ------------------------------------------------------------------ animation
def lid_angle(f):
    return LID_OPEN_DEG * ease_in_out((f - 20) / 42.0)


def lid_matrix(angle_deg):
    return Matrix.Translation(PIVOT) @ Matrix.Rotation(math.radians(-angle_deg), 4, "X")


def screen_frame(angle_deg=LID_OPEN_DEG):
    """World-space centre, normal and active-area corners of the display."""
    M = lid_matrix(angle_deg)
    yc = ACT_Y0 - ACT_H / 2
    centre = M @ Vector((0, yc, GLASS_FRONT))
    normal = (M.to_3x3() @ Vector((0, 0, -1))).normalized()
    corners = {
        "tl": M @ Vector((-ACT_W / 2, ACT_Y0 - ACT_H, GLASS_FRONT)),
        "tr": M @ Vector((ACT_W / 2, ACT_Y0 - ACT_H, GLASS_FRONT)),
        "bl": M @ Vector((-ACT_W / 2, ACT_Y0, GLASS_FRONT)),
        "br": M @ Vector((ACT_W / 2, ACT_Y0, GLASS_FRONT)),
    }
    return centre, normal, corners


LENS = 50.0
D_FINAL = ACT_W * LENS / 36.0

FINAL_TARGET = (0.020, 0.020, 0.104)
_DESK_KEYS = [
    # frame, azimuth deg, elevation deg, distance m, target xyz
    (1, -42.0, 8.5, 0.92, (0.0, 0.02, 0.040)),
    (20, -39.0, 9.5, 0.86, (0.0, 0.03, 0.050)),
    (45, -31.0, 11.0, 0.90, (0.03, 0.06, 0.100)),
    (62, -22.0, 11.5, 0.93, (0.02, 0.05, 0.115)),
    (86, -13.15, 11.05, 1.067, FINAL_TARGET),
    (96, -13.0, 11.0, 1.060, FINAL_TARGET),
]
PHONE_TARGET = (0.016, 0.010, 0.112)
_PHONE_KEYS = [
    # same timing and angles; closer, so the laptop fills the portrait width
    (1, -42.0, 9.5, 0.66, (0.0, 0.00, 0.050)),
    (20, -39.0, 10.0, 0.62, (0.0, 0.01, 0.060)),
    (45, -31.0, 11.0, 0.64, (0.03, 0.04, 0.105)),
    (62, -22.0, 11.5, 0.65, (0.02, 0.03, 0.115)),
    (86, -13.15, 11.05, 0.648, PHONE_TARGET),
    (96, -13.0, 11.0, 0.644, PHONE_TARGET),
]
CAM_KEYS = {"desktop": _DESK_KEYS, "phone": _PHONE_KEYS}
FSTOPS = {"desktop": (7.5, 10.0), "phone": (9.0, 13.0)}   # while opening, at the end


def camera_state(aspect, f):
    """Push in closed, open, ease to the hero framing and hold (86-96)."""
    centre, _, _ = screen_frame()
    keys = CAM_KEYS[aspect]
    az = pchip([(k[0], k[1]) for k in keys], f)
    el = pchip([(k[0], k[2]) for k in keys], f)
    dist = pchip([(k[0], k[3]) for k in keys], f)
    target = Vector([pchip([(k[0], k[4][i]) for k in keys], f) for i in range(3)])
    a, e = math.radians(az), math.radians(el)
    direction = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    loc = target + direction * dist
    # focus: hinge while the lid opens, then the screen
    hinge_pt = Vector((0.0, 0.10, BASE_TOP + 0.002))
    focus_pt = hinge_pt.lerp(centre, smoothstep(42, 72, f))
    # stopped down enough that the whiteboard is only gently soft
    f0, f1 = FSTOPS[aspect]
    fstop = f0 + (f1 - f0) * smoothstep(62, 90, f)
    return loc, target, (loc - focus_pt).length, fstop


def screen_emission(f):
    # 1.0 = the inverse-AgX image renders back as the source screenshot
    return smoothstep(45, 65, f)


def apply_frame(scene, aspect, f):
    scene.frame_set(int(f))
    piv = bpy.data.objects["LidPivot"]
    piv.rotation_euler = Euler((math.radians(-lid_angle(f)), 0, 0))
    m = bpy.data.materials["ScreenGlass"].node_tree.nodes["Principled BSDF"]
    m.inputs["Emission Strength"].default_value = screen_emission(f)
    cam = scene.camera
    loc, target, focus, fstop = camera_state(aspect, f)
    cam.location = loc
    fwd = (target - loc).normalized()
    cam.rotation_euler = fwd.to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = LENS
    cam.data.dof.focus_distance = focus
    cam.data.dof.aperture_fstop = fstop
    bpy.context.view_layer.update()


def _px(scene, co):
    w, h = scene.render.resolution_x, scene.render.resolution_y
    v = world_to_camera_view(scene, scene.camera, co)
    return [v.x * w, (1.0 - v.y) * h]


def final_geometry(scene, aspect):
    """Last frame: the display's active area (tl, tr, br, bl) and the laptop's
    bounding box, in frame pixels."""
    w, h = ASPECTS[aspect]
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    apply_frame(scene, aspect, FRAMES)
    _, _, c = screen_frame()
    quad = [[round(v, 1) for v in _px(scene, c[k])] for k in ("tl", "tr", "br", "bl")]
    dg = bpy.context.evaluated_depsgraph_get()
    xs, ys = [], []
    for o in scene.objects:
        if o.type != "MESH" or not o.name.startswith(
                ("Base", "Lid", "Keys", "Trackpad", "Hinge", "ScreenGlass", "Foot", "WellFloor", "CoverGlass")):
            continue
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            p = _px(scene, o.matrix_world @ v.co)
            xs.append(p[0]); ys.append(p[1])
        ev.to_mesh_clear()
    x0, y0, x1, y1 = math.floor(min(xs)), math.floor(min(ys)), math.ceil(max(xs)), math.ceil(max(ys))
    return {"w": w, "h": h, "dir": "/film/%s/" % aspect, "screenQuad": quad,
            "laptopBox": {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}}


MUG_TOP, MUG_R = 0.095, 0.0411     # rim height and outer radius at the lip (see mug_profile)


def mug_track(scene, aspect):
    """Per frame: the centre of the mug's opening and the rim's radius in
    frame pixels (half the rim ellipse's width), for the website's steam.
    Also prints any frame where the mug is cut by the frame edge or partly
    hidden behind the laptop."""
    w, h = ASPECTS[aspect]
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    root = bpy.data.objects["MugRoot"]
    mug = bpy.data.objects["Mug"]
    track, cut, hidden, blockers = [], [], [], set()
    for f in range(1, FRAMES + 1):
        apply_frame(scene, aspect, f)
        dg = bpy.context.evaluated_depsgraph_get()
        M = root.matrix_world
        c = _px(scene, M @ Vector((0, 0, MUG_TOP)))
        rim = [_px(scene, M @ Vector((MUG_R * math.cos(a), MUG_R * math.sin(a), MUG_TOP)))
               for a in [i * math.tau / 64 for i in range(64)]]
        r = (max(p[0] for p in rim) - min(p[0] for p in rim)) / 2
        track.append([round(c[0], 1), round(c[1], 1), round(r, 1)])
        # cut off: any part of the mug (handle included) outside the frame
        pts = []
        for o in (mug, bpy.data.objects["MugHandle"]):
            ev = o.evaluated_get(dg)
            me = ev.to_mesh()
            pts += [_px(scene, o.matrix_world @ v.co) for v in me.vertices]
            ev.to_mesh_clear()
        if min(p[0] for p in pts) < 0 or max(p[0] for p in pts) > w or \
                min(p[1] for p in pts) < 0 or max(p[1] for p in pts) > h:
            cut.append(f)
        # hidden: rays from the camera to points on the near side of the
        # mug and its rim that hit something else first
        cam = scene.camera.matrix_world.translation
        samples, blocked = 0, 0
        for a in [i * math.tau / 24 for i in range(24)]:
            for z in (0.01, 0.035, 0.06, 0.085, MUG_TOP):
                wp = M @ Vector((MUG_R * math.cos(a), MUG_R * math.sin(a), z))
                nrm = (M.to_3x3() @ Vector((math.cos(a), math.sin(a), 0))).normalized()
                if z < MUG_TOP and nrm.dot(cam - wp) <= 0:
                    continue
                samples += 1
                o_, end = cam.copy(), wp
                while True:     # step through things the camera cannot see (reflection cards)
                    d = end - o_
                    hit, loc, _, _, ob, _ = scene.ray_cast(dg, o_, d.normalized(), distance=d.length - 0.002)
                    if hit and not ob.visible_camera:
                        o_ = loc + d.normalized() * 0.0005
                        continue
                    break
                if hit and not ob.name.startswith("Mug"):
                    blocked += 1
                    blockers.add(ob.name)
        if blocked:
            hidden.append((f, round(100.0 * blocked / samples)))
    print("MUG", aspect, "cut by frame edge:", cut or "none")
    print("MUG", aspect, "hidden behind something (frame, % of samples):", hidden or "none", sorted(blockers))
    return track


def screen_track(scene, aspect):
    """Per frame: the display's active area (tl, tr, br, bl) in frame pixels,
    or None when its face is turned away, edge-on, or completely hidden; and
    how bright the display is (0..1, the wake-up curve). Prints the frames in
    which something covers part of a visible display."""
    w, h = ASPECTS[aspect]
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    quads, on, covered = [], [], []
    for f in range(1, FRAMES + 1):
        apply_frame(scene, aspect, f)
        dg = bpy.context.evaluated_depsgraph_get()
        ang = lid_angle(f)
        centre, normal, c = screen_frame(ang)
        cam = scene.camera.matrix_world.translation
        facing = normal.dot((cam - centre).normalized())
        on.append(round(screen_emission(f), 3))
        if facing < 0.10:                       # turned away or within ~84 degrees of edge-on
            quads.append(None)
            continue
        # sample the active area and ray-cast from the camera
        M = lid_matrix(ang)
        n_s, hidden, by = 0, 0, set()
        for i in range(13):
            for j in range(9):
                x = -ACT_W / 2 + ACT_W * (i + 0.5) / 13
                y = ACT_Y0 - ACT_H * (j + 0.5) / 9
                wp = M @ Vector((x, y, GLASS_FRONT))
                n_s += 1
                o_ = cam.copy()
                while True:
                    d = wp - o_
                    if d.length < 0.0006:
                        hit = False
                        break
                    hit, loc, _, _, ob, _ = scene.ray_cast(dg, o_, d.normalized(), distance=d.length - 0.0005)
                    if hit and (not ob.visible_camera or ob.name in ("CoverGlass", "ScreenGlass")):
                        o_ = loc + d.normalized() * 0.0002
                        continue
                    break
                if hit:
                    hidden += 1
                    by.add(ob.name)
        if hidden == n_s:
            quads.append(None)
            continue
        if hidden:
            covered.append((f, round(100.0 * hidden / n_s), sorted(by)))
        quads.append([[round(v, 1) for v in _px(scene, c[k])] for k in ("tl", "tr", "br", "bl")])
    vis = [i + 1 for i, q in enumerate(quads) if q]
    print("SCREEN", aspect, "visible frames:", (vis[0], vis[-1]) if vis else "none", "count", len(vis))
    print("SCREEN", aspect, "partly covered (frame, % of area, by):", covered or "none")
    return quads, on


def manifest_json(man):
    """Indented JSON with each point or steam entry on one line."""
    txt = json.dumps(man, indent=2)
    import re
    return re.sub(r"\[\s+(-?[\d.]+),\s+(-?[\d.]+)(?:,\s+(-?[\d.]+))?\s+\]",
                  lambda m: "[" + ", ".join(g for g in m.groups() if g is not None) + "]", txt) + "\n"


def configure(aspect):
    global ASPECT, WALL_Y
    ASPECT = aspect
    # the portrait camera sees the board large: it hangs further back
    WALL_Y = 1.55 if aspect == "phone" else 0.95


# ----------------------------------------------------------------------- main
def parse_frames(s):
    out = []
    for part in s.split(","):
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a), int(b) + 1))
        elif part:
            out.append(int(part))
    return out


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="still", choices=["still", "seq", "manifest", "blend", "geometry"])
    ap.add_argument("--aspect", default="desktop", choices=list(ASPECTS))
    ap.add_argument("--frames", default="10,45,75")
    ap.add_argument("--samples", type=int, default=256)
    ap.add_argument("--noise", type=float, default=0.01)
    ap.add_argument("--scale", type=int, default=100, help="resolution percentage")
    ap.add_argument("--out", default="design/laptop-film/stills")
    ap.add_argument("--quality", type=int, default=82)
    ap.add_argument("--names", default="", help="comma list of file names for stills")
    ap.add_argument("--overwrite", action="store_true", help="seq: re-render existing frames")
    args = ap.parse_args(argv)

    out = os.path.join(ROOT, args.out) if not os.path.isabs(args.out) else args.out
    os.makedirs(out, exist_ok=True)

    if args.mode == "manifest":
        # each camera has its own props and wall, so each is built and measured
        man = {"frames": FRAMES, "ext": "jpg"}
        for asp in ("desktop", "phone"):
            configure(asp)
            scene = build_scene()
            man[asp] = final_geometry(scene, asp)
            man[asp]["steam"] = mug_track(scene, asp)
            man[asp]["screenQuads"], man[asp]["screenOn"] = screen_track(scene, asp)
            assert man[asp]["screenQuads"][-1] == man[asp]["screenQuad"]
        path = os.path.join(out, "manifest.json")
        with open(path, "w") as fh:
            fh.write(manifest_json(man))
        print("MANIFEST", path)
        return

    configure(args.aspect)
    scene = build_scene()

    if args.mode == "geometry":
        geo = final_geometry(scene, args.aspect)
        geo["frame"] = FRAMES
        path = os.path.join(out, "final-geometry.json" if args.aspect == "desktop"
                            else "final-geometry-%s.json" % args.aspect)
        with open(path, "w") as fh:
            json.dump(geo, fh, indent=2)
        print("GEOMETRY", json.dumps(geo))
        return

    if args.mode == "blend":
        apply_frame(scene, args.aspect, parse_frames(args.frames)[0])
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, "laptop_film.blend"))
        return

    w, h = ASPECTS[args.aspect]
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = args.scale
    scene.cycles.samples = args.samples
    scene.cycles.adaptive_threshold = args.noise
    names = [n for n in args.names.split(",") if n]
    if args.mode == "still":
        scene.render.image_settings.file_format = "PNG"
        scene.render.image_settings.color_depth = "8"
    else:
        scene.render.image_settings.file_format = "JPEG"
        scene.render.image_settings.quality = args.quality
    import time
    for i, f in enumerate(parse_frames(args.frames)):
        if args.mode == "still":
            name = names[i] if i < len(names) else "f%04d.png" % f
        else:
            name = "%04d.jpg" % f
        path = os.path.join(out, name)
        if args.mode == "seq" and os.path.exists(path) and not args.overwrite:
            print("SKIP", f, flush=True)
            continue
        t0 = time.time()
        apply_frame(scene, args.aspect, f)
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print("FRAME %d %.1fs %s" % (f, time.time() - t0, path), flush=True)


if __name__ == "__main__":
    main()
