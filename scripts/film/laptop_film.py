"""Laptop product film for the Kingdom Sites home page.

Builds a generic 16-inch laptop in a dark studio, opens the lid, wakes the
screen and dollies into the display. Everything is procedural; the only inputs
are the screen image (public/work/farzana-classroom-home.webp) and one Poly
Haven studio HDRI (design/laptop-film/assets/).

Run headless from the repository root:

  Blender -b -P scripts/film/laptop_film.py -- --mode still --aspect desktop \
      --frames 10,45,75 --samples 1024 --out design/laptop-film/stills
  Blender -b -P scripts/film/laptop_film.py -- --mode seq --aspect desktop \
      --frames 1-120 --samples 160 --out public/film/desktop
  Blender -b -P scripts/film/laptop_film.py -- --mode manifest

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

FRAMES = 96
ASPECTS = {"desktop": (1600, 1000), "phone": (720, 1280)}

# ---------------------------------------------------------------- dimensions
BASE_W, BASE_D, BASE_H = 0.356, 0.248, 0.0080
FOOT_H = 0.0008
BASE_TOP = FOOT_H + BASE_H
LID_GAP = 0.0005
LID_T = 0.0065
CORNER_R = 0.0115
PIVOT = Vector((0.0, BASE_D / 2, BASE_TOP + LID_GAP))
LID_OPEN_DEG = 105.0

# Display active area, 16:10, in lid-local coordinates (lid runs along -Y from
# the hinge; the inside face is local z = 0 and faces local -Z).
ACT_W = 0.342
ACT_H = ACT_W / 1.6
ACT_TOP_MARGIN = 0.007
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
    bsdf.inputs["Anisotropic"].default_value = 0.25
    tc = N.new("ShaderNodeTexCoord")
    tan = N.new("ShaderNodeTangent")
    tan.direction_type = "RADIAL"
    tan.axis = "Y"
    L.new(tan.outputs["Tangent"], bsdf.inputs["Tangent"])

    # roughness: 0.3 with a broad and a fine noise so highlights break up
    n_big = N.new("ShaderNodeTexNoise")
    n_big.inputs["Scale"].default_value = 18.0
    n_big.inputs["Detail"].default_value = 3.0
    L.new(tc.outputs["Object"], n_big.inputs["Vector"])
    n_fine = N.new("ShaderNodeTexNoise")
    n_fine.inputs["Scale"].default_value = 2600.0
    n_fine.inputs["Detail"].default_value = 2.0
    L.new(tc.outputs["Object"], n_fine.inputs["Vector"])
    r1 = N.new("ShaderNodeMapRange")
    r1.inputs["To Min"].default_value = 0.26
    r1.inputs["To Max"].default_value = 0.34
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
        my = band(sep.outputs["Y"], -0.006, 0.098)
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
    """Cover glass: fully transmissive, reflects by Fresnel only."""
    m, N, L = new_mat("CoverGlass")
    N.remove(N["Principled BSDF"])
    tr = N.new("ShaderNodeBsdfTransparent")
    gl = N.new("ShaderNodeBsdfGlossy")
    gl.inputs["Roughness"].default_value = 0.035
    fr = N.new("ShaderNodeFresnel")
    fr.inputs["IOR"].default_value = 1.52
    L.new(fr.outputs["Fac"], gl.inputs["Color"])
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
    # active-area mask (u in [0, 1] before the crop scale, v in [0, 1])
    def inside(sock, hi):
        a = N.new("ShaderNodeMath"); a.operation = "GREATER_THAN"
        a.inputs[1].default_value = 0.0; L.new(sock, a.inputs[0])
        bb = N.new("ShaderNodeMath"); bb.operation = "LESS_THAN"
        bb.inputs[1].default_value = hi; L.new(sock, bb.inputs[0])
        c = N.new("ShaderNodeMath"); c.operation = "MULTIPLY"
        L.new(a.outputs[0], c.inputs[0]); L.new(bb.outputs[0], c.inputs[1])
        return c.outputs[0]
    mu = inside(u.outputs[0], IMG_U_SCALE)
    mv = inside(v.outputs[0], 1.0)
    mask = N.new("ShaderNodeMath"); mask.operation = "MULTIPLY"
    L.new(mu, mask.inputs[0]); L.new(mv, mask.inputs[1])
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


def whiteboard_image():
    """A faint marker sketch of a software plan: boxes, arrows, squiggles."""
    import numpy as np
    W, H = 1200, 800
    rng = np.random.default_rng(7)
    alpha = np.zeros((H, W), np.float32)
    rgb = np.ones((H, W, 3), np.float32)
    yy, xx = np.mgrid[0:H, 0:W]

    def seg(p, q, w, col, a=0.8):
        x0, y0 = p; x1, y1 = q
        xa, xb = int(max(0, min(x0, x1) - w - 2)), int(min(W, max(x0, x1) + w + 3))
        ya, yb = int(max(0, min(y0, y1) - w - 2)), int(min(H, max(y0, y1) + w + 3))
        if xa >= xb or ya >= yb:
            return
        X = xx[ya:yb, xa:xb]; Y = yy[ya:yb, xa:xb]
        dx, dy = x1 - x0, y1 - y0
        ll = dx * dx + dy * dy or 1.0
        t = np.clip(((X - x0) * dx + (Y - y0) * dy) / ll, 0, 1)
        d = np.hypot(X - (x0 + t * dx), Y - (y0 + t * dy))
        cov = np.clip(w / 2 + 0.8 - d, 0, 1) * a
        sub = alpha[ya:yb, xa:xb]
        upd = cov > sub
        sub[upd] = cov[upd]
        rgb[ya:yb, xa:xb][upd] = col

    def poly(pts, w, col, a=0.8):
        for p, q in zip(pts[:-1], pts[1:]):
            seg(p, q, w, col, a)

    def box(x0, y0, x1, y1, col):
        j = lambda: rng.uniform(-3, 3)
        poly([(x0 + j(), y0 + j()), (x1 + j(), y0 + j()), (x1 + j(), y1 + j()),
              (x0 + j(), y1 + j()), (x0 + j(), y0 + j())], 8, col, 0.95)

    def squiggle(x0, y, length, col, amp=5.0):
        pts = []
        ph = rng.uniform(0, 6)
        for i in range(int(length / 4)):
            x = x0 + i * 4
            pts.append((x, y + amp * math.sin(ph + i * rng.uniform(0.7, 1.2)) * rng.uniform(0.4, 1.0)))
        poly(pts, 6.0, col, 0.9)

    def arrow(p, q, col):
        seg(p, q, 7.0, col, 0.95)
        ang = math.atan2(q[1] - p[1], q[0] - p[0])
        for s in (-1, 1):
            a2 = ang + math.pi - s * 0.45
            seg(q, (q[0] + 22 * math.cos(a2), q[1] + 22 * math.sin(a2)), 7.0, col, 0.95)

    blue, black, red = (0.04, 0.10, 0.32), (0.03, 0.03, 0.035), (0.42, 0.05, 0.04)
    box(80, 90, 330, 230, blue)
    for i in range(3):
        squiggle(105, 130 + i * 32, rng.uniform(120, 190), blue)
    box(470, 70, 760, 220, black)
    for i in range(3):
        squiggle(495, 110 + i * 34, rng.uniform(140, 230), black)
    box(880, 110, 1120, 260, blue)
    for i in range(3):
        squiggle(905, 150 + i * 34, rng.uniform(110, 180), blue)
    arrow((335, 160), (462, 150), black)
    arrow((765, 150), (872, 180), black)
    box(420, 400, 760, 590, red)
    for i in range(4):
        squiggle(445, 440 + i * 34, rng.uniform(150, 280), red)
    arrow((615, 228), (600, 392), red)
    for i in range(5):
        seg((95, 380 + i * 52), (103, 380 + i * 52), 9, black)
        squiggle(125, 380 + i * 52, rng.uniform(110, 200), black)
    poly([(880, 420), (900, 470), (960, 440), (1010, 520), (1080, 480), (1110, 560)], 4, blue, 0.6)
    # ghosts of earlier, erased sketches
    for _ in range(9):
        cx, cy = rng.uniform(80, 1120), rng.uniform(60, 740)
        r = rng.uniform(40, 140)
        g = np.exp(-(((xx - cx) / r) ** 2 + ((yy - cy) / (r * 0.4)) ** 2)) * 0.06
        upd = g > alpha
        alpha[upd] = g[upd]; rgb[upd] = (0.2, 0.2, 0.22)
    white = np.array((0.80, 0.80, 0.77), np.float32)   # #E8E8E4
    col = white * (1 - alpha[..., None]) + rgb * alpha[..., None]
    px = np.ones((H, W, 4), np.float32)
    px[..., :3] = col[::-1]
    img = bpy.data.images.new("WhiteboardSketch", W, H, alpha=False, float_buffer=True)
    img.colorspace_settings.name = "Linear Rec.709"
    img.pixels.foreach_set(px.ravel())
    img.pack()
    return img


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
    bw, bh, bcx, bcz = 1.20, 0.80, 0.18, 0.56
    rot = Euler((math.radians(90), 0, 0))
    board_m, N, L = new_mat("WhiteboardPanel")
    bb = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    tex = N.new("ShaderNodeTexImage"); tex.image = whiteboard_image()
    L.new(tc.outputs["Generated"], tex.inputs["Vector"])
    L.new(tex.outputs["Color"], bb.inputs["Base Color"])
    bb.inputs["Roughness"].default_value = 0.18
    bb.inputs["Coat Weight"].default_value = 0.35
    bb.inputs["Coat Roughness"].default_value = 0.08
    panel = slab("WhiteboardPanel", bw, bh, 0.0, 0.010, 0.002, segs=2)
    panel.rotation_euler = rot
    panel.location = (bcx, WALL_Y, bcz)
    panel.data.materials.append(board_m)
    frame_m = mat_simple("BoardFrame", (0.55, 0.56, 0.58), 0.3, metallic=1.0)
    t = 0.022
    for (fw, fh, ox, oz) in [(bw + 2 * t, t, 0, bh / 2 + t / 2), (bw + 2 * t, t, 0, -bh / 2 - t / 2),
                             (t, bh, -bw / 2 - t / 2, 0), (t, bh, bw / 2 + t / 2, 0)]:
        bar = slab("BoardFrame", fw, fh, 0.0, 0.016, 0.003, segs=3)
        add_bevel(bar, 0.0012, segments=3)
        bar.rotation_euler = rot
        bar.location = (bcx + ox, WALL_Y, bcz + oz)
        bar.data.materials.append(frame_m)
    tray = slab("MarkerTray", 0.55, 0.065, 0.0, 0.010, 0.004, segs=3)
    add_bevel(tray, 0.0015, segments=3)
    tray.location = (bcx, WALL_Y - 0.0325, bcz - bh / 2 - t - 0.012)
    tray.data.materials.append(frame_m)
    lip = slab("MarkerTrayLip", 0.55, 0.004, 0.0, 0.018, 0.0015, segs=2)
    lip.location = (bcx, WALL_Y - 0.063, bcz - bh / 2 - t - 0.012)
    lip.data.materials.append(frame_m)
    for i, (mx, col) in enumerate([(-0.12, (0.04, 0.08, 0.30)), (-0.05, (0.03, 0.03, 0.03)),
                                   (0.10, (0.40, 0.04, 0.03))]):
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.0085, depth=0.13,
                                            location=(bcx + mx, WALL_Y - 0.035, bcz - bh / 2 - t - 0.002),
                                            rotation=(0, math.radians(90), math.radians(6 * (i - 1))))
        mk = bpy.context.active_object; mk.name = "Marker"
        for p in mk.data.polygons:
            p.use_smooth = True
        mk.data.materials.append(mat_simple("Marker%d" % i, col, 0.35, spec=0.5))

    # props ------------------------------------------------------------
    paint = mat_simple("PencilPaint", (0.80, 0.46, 0.012), 0.28, spec=0.5, coat=0.5)
    ferrule = mat_simple("Ferrule", (0.80, 0.74, 0.58), 0.28, metallic=1.0)
    eraser = mat_simple("Eraser", (0.78, 0.30, 0.33), 0.75, spec=0.3)
    wood = mat_simple("PencilWood", (0.52, 0.34, 0.18), 0.7, spec=0.3)
    graphite = mat_simple("Graphite", (0.03, 0.03, 0.032), 0.35, metallic=0.4)
    mats = [paint, ferrule, eraser, wood, graphite]

    def pencil(name, length=0.175):
        bm = bmesh.new()
        r = 0.0036
        parts = [  # (material, segments, r1, r2, depth, z centre)
            (0, 6, r, r, length - 0.032, 0.0),
            (1, 32, r * 1.04, r * 1.04, 0.009, -(length - 0.032) / 2 - 0.0045),
            (2, 32, r * 0.97, r * 0.97, 0.007, -(length - 0.032) / 2 - 0.009 - 0.0035),
            (3, 24, r * 0.97, 0.0009, 0.013, (length - 0.032) / 2 + 0.0065),
            (4, 24, 0.0009, 0.0001, 0.003, (length - 0.032) / 2 + 0.013 + 0.0015),
        ]
        for mi, seg_n, r1, r2, dep, zc in parts:
            res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg_n,
                                        radius1=r1, radius2=r2, depth=dep,
                                        matrix=Matrix.Translation((0, 0, zc)))
            fs = {f for v in res["verts"] for f in v.link_faces}
            for f in fs:
                f.material_index = mi
                f.smooth = seg_n > 6
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new(name, me)
        scene.collection.objects.link(ob)
        for mm in mats:
            ob.data.materials.append(mm)
        return ob

    # an open tin of pencils at front right
    tin_m = mat_simple("Tin", (0.030, 0.075, 0.058), 0.38, metallic=0.7)
    tin_root = bpy.data.objects.new("PencilTin", None)
    scene.collection.objects.link(tin_root)
    tin_root.location = (0.29, -0.175, 0.0)
    tin_root.rotation_euler = (0, 0, math.radians(-24))
    tin = slab("Tin", 0.195, 0.072, 0.0, 0.0115, 0.006, segs=6)
    inner = slab("TinInner", 0.189, 0.066, 0.0012, 0.04, 0.004, segs=6)
    boolean_cut(tin, [inner])
    add_bevel(tin, 0.0006, segments=2, angle=40)
    tin.data.materials.append(tin_m)
    tin.parent = tin_root
    for i in range(7):
        p = pencil("Pencil%d" % i, 0.176)
        p.parent = tin_root
        p.rotation_euler = (0, math.radians(90), math.radians(0))
        p.rotation_euler.rotate_axis("Z", math.radians(30 * i))
        p.location = (0.004 * ((i % 2) - 0.5), -0.0235 + i * 0.0078, 0.0047)
    loose = pencil("PencilLoose", 0.168)
    loose.rotation_euler = Euler((math.radians(30), math.radians(90), 0), "XYZ")
    loose.rotation_euler = (Euler((0, 0, math.radians(38))).to_matrix() @
                            Euler((0, math.radians(90), 0)).to_matrix() @
                            Euler((0, 0, math.radians(30))).to_matrix()).to_euler()
    loose.location = (0.17, -0.285, 0.0032)

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

    book("BookA", 0.240, 0.168, 0.028, (0.055, 0.11, 0.085), (-0.385, 0.175, 0.0), 13)
    book("BookB", 0.215, 0.150, 0.022, (0.30, 0.06, 0.04), (-0.378, 0.168, 0.028), 4)

    # a plain ceramic mug at back right
    mug = slab("Mug", 0.084, 0.084, 0.0, 0.095, 0.0419, segs=16)
    mug_in = slab("MugInner", 0.075, 0.075, 0.007, 0.2, 0.0374, segs=16)
    boolean_cut(mug, [mug_in])
    add_bevel(mug, 0.0012, segments=3, angle=35)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.026, minor_radius=0.0058, major_segments=40,
                                     minor_segments=16, location=(0.043, 0, 0.050),
                                     rotation=(math.radians(90), 0, 0))
    handle = bpy.context.active_object
    for p in handle.data.polygons:
        p.use_smooth = True
    mug_m = mat_simple("Ceramic", (0.70, 0.66, 0.60), 0.22, spec=0.5, coat=0.6)
    mug.data.materials.append(mug_m); handle.data.materials.append(mug_m)
    mroot = bpy.data.objects.new("MugRoot", None)
    scene.collection.objects.link(mroot)
    mroot.location = (0.335, 0.215, 0.0)
    mroot.rotation_euler = (0, 0, math.radians(-55))
    mug.parent = mroot; handle.parent = mroot


# --------------------------------------------------------------------- build
KEY_PITCH = 0.0184
KEY_GAP = 0.0026
KB_W = 15 * KEY_PITCH
KB_BACK = BASE_D / 2 - 0.021          # y of the keyboard's back edge
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
    pad_m = mat_simple("TrackpadGlass", (0.085, 0.087, 0.092), 0.28, metallic=0.8, spec=0.5, coat=0.15)
    hinge_m = mat_simple("Hinge", (0.06, 0.062, 0.066), 0.32, metallic=1.0)
    screen_m = mat_screen()
    floor_m = mat_floor()

    # base -------------------------------------------------------------
    base = slab("Base", BASE_W, BASE_D, FOOT_H, BASE_TOP, CORNER_R, segs=12)
    keys, kb_front = keyboard_layout()
    well = slab("WellCut", KB_W + 0.0035, (KB_BACK - kb_front) + 0.0035,
                BASE_TOP - 0.0013, BASE_TOP + 0.01, 0.0035, segs=6,
                cy=(KB_BACK + kb_front) / 2)
    pad_w, pad_d = 0.160, 0.100
    pad_cy = -BASE_D / 2 + 0.012 + pad_d / 2
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
    area("Rim", (0.6, 1.4, 0.9), (0.0, 0.0, 0.05), 0.9, 0.25, 3.0, temp=7600, spread=40)
    area("Top", (0.25, 0.35, 1.6), (0.0, 0.05, 0.0), 0.8, 0.8, 3, temp=5600, spread=60)
    area("BoardWash", (0.25, 0.30, 1.35), (0.18, WALL_Y, 0.50), 1.4, 0.30, 11.0, temp=4700, spread=75)

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

    cb = card("CardBack", (0.95, 1.0, 0.30), (0.0, 0.0, 0.02), 0.75, 0.30, 0.27, (0.86, 0.9, 1.0))
    cl = card("CardLeft", (-1.0, 0.25, 0.30), (0.0, 0.0, 0.05), 0.7, 0.35, 0.22, (1.0, 0.86, 0.72))

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
    streak = card("ScreenStreak", tuple(sloc), tuple(centre), 0.34, 1.3, 11.0, (1.0, 0.95, 0.9))
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
CAM_KEYS = {"desktop": _DESK_KEYS, "phone": _DESK_KEYS}   # phone film parked


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
    fstop = 4.0 + 1.6 * smoothstep(62, 90, f)
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


def measure_screen(scene, aspect):
    w, h = ASPECTS[aspect]
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    apply_frame(scene, aspect, FRAMES)
    _, _, corners = screen_frame()
    pts = {}
    for k, co in corners.items():
        v = world_to_camera_view(scene, scene.camera, co)
        pts[k] = (v.x * w, (1.0 - v.y) * h)
    xs = [p[0] for p in pts.values()]
    ys = [p[1] for p in pts.values()]
    rect = {"x": round(min(xs)), "y": round(min(ys)),
            "w": round(max(xs)) - round(min(xs)), "h": round(max(ys)) - round(min(ys))}
    return rect, pts


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

    scene = build_scene()
    out = os.path.join(ROOT, args.out) if not os.path.isabs(args.out) else args.out
    os.makedirs(out, exist_ok=True)

    if args.mode == "manifest":
        man = {"frames": FRAMES}
        for asp in ("desktop", "phone"):
            rect, pts = measure_screen(scene, asp)
            w, h = ASPECTS[asp]
            man[asp] = {"w": w, "h": h, "dir": "/film/%s/" % asp, "screen": rect}
            print("CORNERS", asp, {k: (round(x, 3), round(y, 3)) for k, (x, y) in pts.items()})
        man["ext"] = "jpg"
        path = os.path.join(out, "manifest.json")
        with open(path, "w") as fh:
            json.dump(man, fh, indent=2)
        print("MANIFEST", json.dumps(man))
        return

    if args.mode == "geometry":
        w, h = ASPECTS["desktop"]
        scene.render.resolution_x, scene.render.resolution_y = w, h
        scene.render.resolution_percentage = 100
        apply_frame(scene, "desktop", FRAMES)
        _, _, c = screen_frame()

        def px(co):
            v = world_to_camera_view(scene, scene.camera, co)
            return [round(v.x * w, 1), round((1.0 - v.y) * h, 1)]
        quad = [px(c["tl"]), px(c["tr"]), px(c["br"]), px(c["bl"])]
        dg = bpy.context.evaluated_depsgraph_get()
        xs, ys = [], []
        for o in scene.objects:
            if o.type != "MESH" or not o.name.startswith(
                    ("Base", "Lid", "Keys", "Trackpad", "Hinge", "ScreenGlass", "Foot", "WellFloor", "CoverGlass")):
                continue
            ev = o.evaluated_get(dg)
            me = ev.to_mesh()
            for v in me.vertices:
                p = px(o.matrix_world @ v.co)
                xs.append(p[0]); ys.append(p[1])
            ev.to_mesh_clear()
        x0, y0, x1, y1 = math.floor(min(xs)), math.floor(min(ys)), math.ceil(max(xs)), math.ceil(max(ys))
        geo = {"frame": FRAMES, "w": w, "h": h, "screenQuad": quad,
               "laptopBox": {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}}
        path = os.path.join(out, "final-geometry.json")
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
