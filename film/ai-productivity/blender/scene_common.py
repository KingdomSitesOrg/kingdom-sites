"""The one way every scene script runs.

A scene script (blender/sNN_name.py) builds its objects and keys its motion
from the kit, reading every frame it needs from video/timeline.json, and hands
itself to run():

    import os, sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import kit
    import scene_common as sc

    def build(S):
        B = S.beat                       # B("phone") -> local frame of that beat
        ...                              # kit objects, kit.pop(ob, B("x") - 7), ...
        return {
            "presses": [sc.Press("approve", approve_group, w=2.3)],   # optional
            "latest": B("press"),        # which draft frame becomes latest.png
        }

    sc.run("s05", build)

Run it only through the queue (never call blender directly):

    blender/render.sh blender/s05_photo.py --mode drafts
        half size (960x540), 16 samples: the first frame, every beat in the
        scene's beatsLocal and the last frame, as renders/drafts/s05/0016.png
        (named by local frame), and the "latest" frame copied to latest.png.
    blender/render.sh blender/s05_photo.py --mode frames --frames 1-60
        1920x1080, 32 samples: that range to renders/scenes/s05/0001.png ...
        Keep each call to 30-60 frames.
    blender/render.sh blender/s05_photo.py --mode still --frames 211 --scale 1 --out DIR
        any listed frames ("211" or "1,16,211" or "200-211") as single PNGs.
    blender/render.sh blender/s05_photo.py --mode targets
        only writes the press targets, renders nothing.

Options: --scale (resolution factor, drafts 0.5, frames 1.0), --samples
(drafts 16, frames 32), --out (a folder; default by mode), --no-latest (drafts:
leave latest.png alone, e.g. for a version you are not sure is better),
--tag (drafts: written as 0016_<tag>.png, so a retry never overwrites a good
draft).

Every mode also writes video/timeline/targets/sNN.json when the scene has
presses: the press point's pixel on its press frame (1920x1080, origin top
left, y down), computed with bpy_extras.object_utils.world_to_camera_view from
the button's evaluated position on that frame. Press point = the button centre
+ 0.36 x width in x, -0.08 in y, on its top surface (SCRIPT.md "Cursor"). The
timeline build (node video/timeline/build.mjs) picks the file up.

Frames: local frame L is film frame start + L - 1; local beat j is 15j + 1. The
Blender scene runs frames 1 .. length. Nothing here is hard-coded per scene: a
retime in timeline.json is a re-render, not a rewrite.
"""

import argparse
import json
import os
import shutil
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
TIMELINE = os.path.join(FILM, "video", "timeline.json")
TARGETS = os.path.join(FILM, "video", "timeline", "targets")
RENDERS = os.path.join(FILM, "renders")
W, H = 1920, 1080

sys.path.insert(0, HERE)
import kit  # noqa: E402


def load_timeline():
    with open(TIMELINE) as fh:
        return json.load(fh)


class Scene:
    """A scene's record from timeline.json, with small helpers."""

    def __init__(self, rec, timeline):
        self.rec = rec
        self.timeline = timeline
        self.id = rec["id"]
        self.name = rec.get("name", self.id)
        self.start = rec["start"]
        self.length = rec["length"]
        self.beats = dict(rec.get("beatsLocal", {}))
        self.paths = {p["name"]: p for p in rec.get("paths", [])}
        self.presses = {p["name"]: p for p in rec.get("presses", [])}
        self.labels = rec.get("labels", [])
        self.handoff_in = rec.get("handoffIn")
        self.handoff_out = rec.get("handoffOut")

    def beat(self, name):
        if name not in self.beats:
            raise KeyError(f"{self.id}: no beat '{name}' in timeline.json beatsLocal "
                           f"(have: {', '.join(self.beats)})")
        return self.beats[name]

    def path(self, name):
        if name not in self.paths:
            raise KeyError(f"{self.id}: no path '{name}' in timeline.json (have: {', '.join(self.paths)})")
        return self.paths[name]

    def press_frame(self, name):
        if name not in self.presses:
            raise KeyError(f"{self.id}: no press '{name}' in timeline.json (have: {', '.join(self.presses)})")
        return self.presses[name]["localFrame"]

    def film(self, local):
        return self.start + local - 1


class Press:
    """A press target: the button group, its width and the local height of its
    top surface (kit.button: 0.12)."""

    def __init__(self, name, ob, w, top=0.12, dx=0.36, dy=-0.08):
        self.name, self.ob, self.w, self.top, self.dx, self.dy = name, ob, w, top, dx, dy

    def world(self):
        return self.ob.matrix_world @ Vector((self.dx * self.w, self.dy, self.top))


def _args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="drafts", choices=("drafts", "frames", "still", "targets"))
    ap.add_argument("--frames", default=None, help="a-b, or a comma list (drafts/still)")
    ap.add_argument("--scale", type=float, default=None)
    ap.add_argument("--samples", type=int, default=None)
    ap.add_argument("--out", default=None)
    ap.add_argument("--tag", default="")
    ap.add_argument("--no-latest", action="store_true")
    return ap.parse_args(argv)


def _frame_list(spec, length):
    out = []
    for part in str(spec).split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = (int(x) for x in part.split("-", 1))
            out.extend(range(a, b + 1))
        else:
            out.append(int(part))
    return sorted({f for f in out if 1 <= f <= length})


def write_targets(S, presses):
    """Write video/timeline/targets/sNN.json for these presses."""
    from bpy_extras.object_utils import world_to_camera_view
    if not presses:
        return None
    sc = bpy.context.scene
    keep = sc.frame_current
    out = []
    for p in presses:
        L = S.press_frame(p.name)
        sc.frame_set(L)
        bpy.context.view_layer.update()
        co = p.world()
        u, v, _ = world_to_camera_view(sc, sc.camera, co)
        out.append({"name": p.name, "localFrame": L, "x": round(u * W, 1), "y": round((1 - v) * H, 1),
                    "world": [round(co.x, 4), round(co.y, 4), round(co.z, 4)]})
    sc.frame_set(keep)
    os.makedirs(TARGETS, exist_ok=True)
    path = os.path.join(TARGETS, f"{S.id}.json")
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump({"scene": S.id, "presses": out}, fh, indent=2)
        fh.write("\n")
    os.replace(tmp, path)
    print(f"[{S.id}] targets -> {os.path.relpath(path, FILM)}: " +
          ", ".join(f"{q['name']}@{q['localFrame']} ({q['x']}, {q['y']})" for q in out))
    return out


def run(scene_id, build):
    a = _args()
    tl = load_timeline()
    rec = next((s for s in tl["scenes"] if s["id"] == scene_id), None)
    if rec is None:
        raise SystemExit(f"{scene_id}: not in timeline.json")
    S = Scene(rec, tl)

    drafts = a.mode == "drafts"
    scale = a.scale if a.scale is not None else (0.5 if drafts else 1.0)
    samples = a.samples or (16 if drafts else 32)
    kit.reset()
    sc = kit.setup(int(round(W * scale)), int(round(H * scale)), samples=samples)
    sc.frame_start, sc.frame_end = 1, S.length
    sc.render.image_settings.color_mode = "RGB"   # opaque frames: no alpha channel

    result = build(S) or {}
    kit.ease_all()

    presses = result.get("presses", [])
    write_targets(S, presses)
    if a.mode == "targets":
        return

    if a.mode == "frames":
        f0, f1 = 1, S.length
        if a.frames:
            fl = _frame_list(a.frames, S.length)
            f0, f1 = fl[0], fl[-1]
        out = a.out or os.path.join(RENDERS, "scenes", S.id)
        os.makedirs(out, exist_ok=True)
        sc.frame_start, sc.frame_end = f0, f1
        sc.render.filepath = os.path.join(out, "####")
        bpy.ops.render.render(animation=True)
        sc.frame_start, sc.frame_end = 1, S.length
        print(f"[{S.id}] frames {f0}-{f1} -> {out}")
        return

    # drafts and stills: single frames
    if a.frames:
        frames = _frame_list(a.frames, S.length)
    elif drafts:
        frames = sorted({1, S.length, *S.beats.values(), *result.get("draft_frames", [])})
        frames = [f for f in frames if 1 <= f <= S.length]
    else:
        raise SystemExit("--mode still needs --frames")
    out = a.out or os.path.join(RENDERS, "drafts" if drafts else "style", S.id)
    os.makedirs(out, exist_ok=True)
    suffix = f"_{a.tag}" if a.tag else ""
    written = []
    for f in frames:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(out, f"{f:04d}{suffix}.png")
        bpy.ops.render.render(write_still=True)
        written.append(f)
    print(f"[{S.id}] {a.mode}: {len(written)} frames -> {out}: {written}")
    if drafts and not a.no_latest:
        latest = result.get("latest")
        if latest is None:
            beats = sorted(S.beats.values())
            latest = beats[-1] if beats else S.length
        src = os.path.join(out, f"{latest:04d}{suffix}.png")
        if os.path.exists(src):
            dst = os.path.join(RENDERS, "drafts", S.id, "latest.png")
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copyfile(src, dst)
            print(f"[{S.id}] latest.png <- {os.path.basename(src)}")
