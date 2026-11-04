# src/part: the STRATA bracket

One procedural hero object for the whole story: a lightweight Ti-6Al-4V bracket that clamps a 16 mm carbon drone-arm
tube (collar along x, split slot, M3 clamp screw with a hex-nut pocket) and bolts down through four 3.2 mm holes on a
30 x 30 mm pattern.

Units are **millimetres**, y-up, base on y = 0, centred in x and z. Both designs fill the storyboard envelope
88.0 x 42.0 x 40.0 mm (x +-44, y 0..42, z +-20; the meshes reach it to within 0.15 mm). The story's world is in millimetres
(STORYBOARD: 1 unit = 1 mm), so chapters render the geometry unscaled. `PART_SCALE` (0.1, 1 world unit = 10 mm) is
only the lab's convention.

| Shape | What it is | Used by |
| --- | --- | --- |
| `solid` | The AI's first, chunky machined block (raked top, relief under the collar, chamfers, tool-access wells over the bolts). Also the design space. | Ch1 target, Ch2 output, Ch3 start |
| `solidLow` | ~820-triangle faceted version (non-indexed, face normals) | Ch2 low-poly stage |
| `optimized` | Topology-optimized truss of tapered Bezier struts with smooth-min fillets; `stress` attribute 0..1 | Ch3 end, Ch4, Ch5, Ch8 |
| `infill` | Gyroid lattice (6 mm cell, 1.2 mm wall) inside `optimized` under a 1.2 mm skin | Ch3 cutaway |

Calibrated to `facts.part.massG` (Ti-6Al-4V, 4.43 g/cm^3), measured on the high-tier meshes:

| | Volume | Mass | Fact | Off by |
| --- | --- | --- | --- | --- |
| solid | 93.09 cm^3 | 412.4 g | 412 g | +0.1 % |
| optimized | 21.66 cm^3 | 95.9 g | 96 g (21.7 cm^3) | -0.1 % |

The knobs are `BODY` (the solid's block) and `STRUT_R_SCALE` (every strut radius) in `sdf.ts`. If the geometry
changes, rerun the numbers in the lab panel, keep both within 5 % and re-measure `LAYER1_PATH_MM`. HUDs show
`facts.part.massG`, never `part.mass`.

## Getting it

```tsx
import { use } from 'react';
import { preloadPart } from '@/strata/part';
import { usePartQuality } from '@/strata/story';
import { materials } from '@/strata/ui/tokens';

function Bracket() {
  // Suspends the Scene until the part exists, so the chapter counts as ready (and captures fire) only with it.
  const part = use(preloadPart(usePartQuality()));
  return (
    // geometries are shared by every chapter: never let R3F dispose them
    <mesh geometry={part.optimized} dispose={null}>
      <meshPhysicalMaterial color={materials.titanium} metalness={1} roughness={0.34} />
    </mesh>
  );
}
```

- **Tier:** build the part at `usePartQuality()` (the detected ceiling tier, fixed for the session), never at the
  live `useQuality()`: an adaptive drop would otherwise suspend the Scene and rebuild the part mid-scroll.
- `use(preloadPart(tier))` is the chapter pattern (suspending). The story starts generation for the ceiling tier once
  the first chapter is ready, so later chapters find it built.
- `usePart(quality = 'high')` is the non-suspending form for lab pages: `PartData | null`, null until the first tier
  is built, then the requested tier (or the most recent one while it builds). Generation runs once per tier in five
  Web Workers in parallel (main-thread fallback if workers fail) and is cached for the session.
- `preloadPart(quality)` starts generation (once per tier) and returns the cached promise.
- `getPart(quality)` reads the cache without subscribing.
- `partReady(quality, kind)` starts generation if needed and resolves when one asset is built (see `ready` below).
- **Shared geometry and textures: always pass `dispose={null}`** on meshes/points that use `part.solid`, `solidLow`,
  `optimized`, `infill` or a `sliceStack` geometry, and never dispose `part.sdfTexture`. Geometry you get from
  `sliceGeometry` is yours to dispose.

Generation runs in five workers at once (solid + low-poly, optimized, the infill lattice as two x halves meshed on a
shared seam plane, sdfTexture), so wall clock is the slowest job (the optimized mesh and its stress). `part.stats` has the per-stage timings.

| Tier | solid | solidLow | optimized | infill | `sliceStack` (120 / 72 / 40 slabs) |
| --- | --- | --- | --- | --- | --- |
| high | ~46k tris | 820 | ~121k | ~156k | ~86k |
| medium | ~28k | 820 | ~74k | ~116k | ~41k |
| low | ~16k | 820 | ~44k | ~65k | ~19k |

## PartData

```ts
part.solid / solidLow / optimized / infill   // THREE.BufferGeometry (mm)
part.optimized.getAttribute('stress')        // also on part.solid; 0 = blue, 1 = red
part.samples(kind, count, seed = 1)          // Float32Array xyz, area-weighted, deterministic, cached
part.samplesWithNormals(kind, count, seed)   // { positions, normals }
part.sdf.sdSolid(p) / sdOptimized(p) / sdGyroid(p, cell?, wall?) / sdInfill(p) / sdPart(p, t)   // JS, p = {x,y,z} mm
part.sdfGLSL                                 // the same maths as GLSL (see below)
part.sdfTexture / sdfBox                     // 64^3 R16F grid of sdOptimized for Ch3 (see below)
part.sliceStack(count, fill = 0.8)           // Promise<BufferGeometry>: Ch4's slab stack, built in the worker
part.toolpaths(ys)                           // Promise<Toolpath[]>: nozzle paths per height, built in the worker
part.ready(kind)                             // Promise<void> per asset, for capture gates
part.slice(y)                                // raw slice of the optimized part at height y (main thread, cached per y)
part.sliceGeometry(y, thickness)             // extruded slab with holes, spans y +- thickness/2 (caller disposes)
part.layers(layerHeight)                     // Float32Array of mid-layer heights, bottom to top
part.mass                                    // { solidGrams, optimizedGrams, solidVolume, optimizedVolume, infillVolume } (cm^3)
part.size / bounds / center / scale          // constants, also exported as PART_SIZE, PART_BOUNDS, PART_CENTER, PART_SCALE
part.stats                                   // { totalMs, timings, triangles, usedWorker }; timings gains sliceStack.N / toolpaths.N
```

### Point clouds (Ch1, Ch2)

```ts
const pts = part.samples('solid', 20000, 7); // same seed, same points, every time
```

### Stress heatmap (Ch3)

`stress` is a smooth per-vertex float. Map it in the shader (blue -> yellow -> red), for example with
three-custom-shader-material or `onBeforeCompile`; `src/app/lab/part/PartLab.tsx` has a working `heat()` ramp.

### Erosion from the SDF texture (Ch3)

`part.sdfTexture` is a `THREE.Data3DTexture` (64^3, `RedFormat`, `HalfFloatType`, internal `R16F`, linear filtering,
clamped) holding `sdOptimized` in mm, built in its own worker. `part.sdfBox` (also `SDF_BOX`) is the box it covers,
`min (-46, -2, -22)` to `max (46, 44, 22)` mm; texel centres sit at `min + (i + 0.5) / 64 * (max - min)`, so sample at:

```glsl
uniform highp sampler3D uSdf;  // part.sdfTexture
uniform vec3 uSdfMin, uSdfMax; // part.sdfBox.min / max
float sdOpt(vec3 pMM) { return texture(uSdf, (pMM - uSdfMin) / (uSdfMax - uSdfMin)).r; }
// dissolve the solid where sdOpt(p) > uThr, uThr easing from SDF_SOLID_MAX (23.0 mm) to 0
```

`pMM` is the fragment position in part millimetres (the mesh's local position when the part is rendered unscaled).
Voxels are 1.44 x 0.72 x 0.69 mm, which is plenty for a threshold front; the values are within 0.05 % of the exact
JS `sdOptimized` at the texel centres. Lab: `view=sdfSlice` (iso-line every 2 mm, zero contour in `--molten-core`).

### Slab stack (Ch4)

```ts
const geo = await part.sliceStack(120); // 72 on medium, 40 on low; cached per (count, fill), shared
```

One indexed geometry of `count` slabs: slab `i` is the outline of the optimized part sliced at
`(i + 0.5) * 42 / count` mm, extruded `fill * 42 / count` thick and centred on that height (`fill` defaults to 0.8).
Attributes: `position`, `normal` (caps +-y, walls follow the outline), `aSlice` (float, 0 = bottom slab ..
`count - 1`). One draw call; about 86k / 41k / 19k triangles for 120 / 72 / 40 slabs (tiers set the outline grid and
simplification in `STACK`). Built in the slicing worker in roughly 0.3-1 s depending on load, so request it while
Ch3 is active and keep the stripe stand-in until the promise resolves. Lab: `view=stack&fan=0.6` runs the storyboard
fan in a vertex shader keyed on `aSlice`.

### Toolpaths (Ch4, Ch5, Ch6)

```ts
const [layer1] = await part.toolpaths([LAYER.first]); // y = 0.025 mm, the middle of layer 1
```

Each `Toolpath` is one continuous nozzle path, printed moves and travel moves in order:

```ts
tp.y           // layer height (mm)
tp.xz          // Float32Array (x, z) pairs, mm: every nozzle position in order
tp.dist        // Float32Array cumulative arc length (mm) at each point, travel included; dist[0] = 0
tp.cls         // Uint8Array class of the move ending at each point: 0 outer perimeter, 1 inset perimeter,
               // 2 infill, 3 travel (TOOLPATH_CLASS); cls[0] repeats the first move's class
tp.runs        // Int32Array (class, firstPoint, lastPoint) triples: the path split into runs of one class
tp.start       // [x, z] S1, where the outer perimeter starts (= xz[0], xz[1])
tp.lengths     // [outer, inset, infill, travel] mm
tp.printedMM   // classes 0-2; tp.totalMM includes travel
```

Order per island (islands nearest-neighbour from the front-left corner): the outer perimeter loops (outline and
holes, against the wall), then two inset perimeters, then the island's gyroid infill (4 mm cell) nearest-first;
every jump between them, and between islands, is a straight travel move. Line width is the FDM proof's 0.27 mm bead.
Helpers (pure, from `@/strata/part`):

- `toolpathSegments(tp, classes, lift = 0)` -> `{ positions, dist, count }`: segment pairs for
  `LineSegmentsGeometry.setPositions`, plus each vertex's arc length for a `uDrawMM` draw-on (Ch4 builds one per
  colour: outer, inset, infill, with travel dashed).
- `toolpathAt(tp, d, out)` writes the nozzle `{ x, z }` at arc length `d` into `out` without allocating and returns
  the class there (Ch5's `f x total` lookup).

Cached per height (4 decimals) and shared; ask for several heights in one call (Ch5's 32 / 16 / 8 representative
layers) so they go to the worker as one batch, roughly 10-40 ms a layer on the high tier.

**Layer 1:** `LAYER1_PATH_MM` = **713.5 mm** printed (outer 199.0, inset 378.5, infill 136.1; travel 206.2) on the high
tier; medium and low agree within 0.8 mm. It is the source for `facts.layer.layer1PathMM`. Layer 1 is the four bolt
pads with their holes (the struts lift off the plate above it).

### Waiting for assets: `ready`

`part.ready(kind)` takes a `PartKind`, `'sdfTexture'`, `'sliceStack'` or `'toolpaths'`. Meshes and the SDF texture
exist as soon as `part` does, so they resolve at once; `sliceStack` and `toolpaths` resolve once every request of that
kind made so far has settled. Request first, then gate a capture:

```ts
part.sliceStack(120);
await part.ready('sliceStack'); // or partReady(quality, 'sliceStack') before the part exists
```

### Raw slices

`part.slice(y)` (main thread) is the slicer's raw output, which `toolpaths` turns into one path:

```ts
const s = part.slice(12.0);
s.outer           // Float32Array[]: closed (x, z) loops, CCW (positive shoelace area in x-z), first point repeated last
s.holes           // Float32Array[]: closed loops, CW
s.perimeters      // Float32Array[][]: per island (same order as outer), 3 inset loops per boundary, outermost first
s.perimeterLevels // number[][]: inset level of each perimeter loop, 0 = against the wall
s.infill          // Float32Array[]: open gyroid polylines (4 mm cell) inside the innermost perimeter, in print order
```

A slice costs about 5-15 ms on the high tier (0.25 mm grid) on the main thread, so prefer `toolpaths` from a chapter.

### Raymarching the morph

`part.sdfGLSL` (also exported as `PART_GLSL`) defines, in millimetres:

```glsl
float sdSolid(vec3 p);
float sdOptimized(vec3 p);
float sdGyroid(vec3 p, float cell, float wall);
float sdInfill(vec3 p);
float sdPart(vec3 p, float t);   // t = 0 solid, t = 1 optimized: an inflated copy of the optimized part with a
                                 // noisy erosion front shrinks onto it, so material only ever disappears
float sdPartBounds(vec3 p);      // box for early-out
```

Prepend it to a WebGL2 fragment shader, convert the ray into part millimetres, and march with a step factor of about
0.6 (`sdPart` and `sdGyroid` are not exact distances). Internal helpers are prefixed `pt_`. The JS `sdPart` matches
the GLSL apart from float precision. The storyboard's Ch3 uses `sdfTexture` instead; this is for the lab and stills.

## Lab

`/lab/part` shows every output with a studio light rig. Query params:

- `view=solid|solidLow|optimized|stress|stressSolid|infill|samples|slice|deck|sdf|sdfSlice|stack|toolpaths`
- `t=0.5` (sdf morph), `y=12` (slice, sdfSlice and toolpaths height in mm; toolpaths default to layer 1),
  `axis=y|z` (sdfSlice plane: horizontal at y, or vertical at z = y), `count=120&fan=0.6` (stack),
  `draw=0.5` (toolpaths drawn fraction, pen point at the head), `kind=optimized` (samples), `quality=high|medium|low`
- `az=35&el=22&dist=15` camera orbit (degrees, world units), `target=x,y,z` orbit target in mm, `ui=0` hides the panel

The panel lists generation time, triangles, both masses, the SDF texture and stack timings, and the measured layer-1
length next to `LAYER1_PATH_MM`.

```bash
node scripts/shoot.mjs --url http://localhost:3124 --path /lab/part --params 'view=stress&ui=0' --out .shots/part
node scripts/shoot.mjs --url http://localhost:3124 --path /lab/part --params 'view=toolpaths&az=0&el=89&dist=13&target=0,0,0' --out .shots/paths
```

The lab sets `window.__strataLab = { lab: "part", ready: true, stats }` once the view's asset is built (stack,
toolpaths) and drawn, so screenshot tools can wait for it.

## Files

- `sdf.ts` geometry (constants, struts, interfaces, cuts, envelope, morph) and the culling fields used by the mesher
- `glsl.ts` GLSL twin generated from the same constants and strut table
- `mesher.ts` narrow-band surface nets with dual-contouring vertices; `decimate.ts` QEM for `solidLow`
- `sdfVolume.ts` the 64^3 half-float grid; `slicer.ts` marching-squares slices; `sliceStack.ts` slabs (earcut);
  `toolpath.ts` continuous paths and their helpers
- `stress.ts`, `samples.ts`, `generate.ts` (worker jobs and requests), `part.worker.ts`, `part.ts`, `usePart.ts`
