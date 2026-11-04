# `@/strata/hud` - STRATA technical overlay

Thin-line readouts that sit over the 3D scenes: hairlines, uppercase mono labels, molten/resin accents. Live values
tick on the shared **gsap ticker** and write straight to the DOM, so a chapter can show changing numbers without a
single React render. Showcase: `/lab/ui#hud-kit` (storyboard kit) and `/lab/ui#hud` (the rest).

```tsx
import { HudCluster, HudReadout, HudValue, Leader, BBoxBrackets, outOf, fixed } from "@/strata/hud";
```

STORYBOARD 3.7 in one place:

| Storyboard | Component |
|---|---|
| Readout: label 11 px uppercase `text-2`, value 13 px 500 `text-1`, unit `text-2`, 5 px molten live dot at 1.2 s | `HudReadout` (`live`) |
| Ticks at 15 Hz, fixed-width fields, leading zeros, never React state | `HudValue` (default `throttle` 67), `outOf`, `fixed`, `chars` |
| Cluster: hairlines `rgba(243,245,249,0.16)`, 8 px brackets, copy-panel material, p-window; draws 180 ms, values 120 ms, exits 240 ms | `HudCluster` |
| Leader: 3 px dot, 1 px line, one 45° elbow, hides within 24 px of the copy column | `Leader` (live anchor), `HudTag` (fixed anchor) |
| bbox brackets: 12 px corners, `88.0 mm` / `42.0 mm` labels, lock-on 1.6 -> 1.0 `back.out(1.6)` 320 ms | `BBoxBrackets` |
| Phase rail: nine chapter links, active tick fills molten with p, 2 px top line on phones | `PhaseRail` (mounted in `src/app/page.tsx`) |

**The cap.** At most **4 readouts on screen on desktop and 2 on phones**, counting `BBoxBrackets` as one and a
`Leader` that carries a value as one. Give readouts p-windows so they take turns, and use `desktopOnly` on
`HudReadout` (or `max-md:hidden` on a `Leader` / `BBoxBrackets`) to drop extras below 768 px. Every readout carries
`data-hud-readout` (the brackets `data-hud-readout="bbox"`), so a check can count them on a still.

## The live-value pattern

The Scene writes plain numbers into a chapter-local signals object inside `useChapterFrame`; the Overlay reads them
with getters. Getters run every tick, so they must be cheap and allocation-free.

```ts
// chapters/ch5-print/signals.ts
import { createAnchors, createBBox } from "@/strata/hud";
export const signals = { layer: 421, z: 21.05, temp: 270, anchors: createAnchors("tip"), bbox: createBBox() };
```

```tsx
// Overlay ("use client", because getters are functions)
const layer = () => signals.layer;
<HudCluster window={[0.06, 0.85]} className="absolute bottom-6 right-4 md:bottom-[8svh] md:right-[4vw]">
  <div className="flex gap-6">
    <HudReadout live label="Layer" chars={11}
      value={<HudValue get={layer} fallback={421} format={(v) => outOf(v, 840)} />} />
    <HudReadout desktopOnly label="Z" unit="mm"
      value={<HudValue get={() => signals.z} fallback={21.05} format={(v) => fixed(v, 2, 2)} />} />
  </div>
</HudCluster>
<Leader anchors={signals.anchors} name="tip" label="Nozzle" tone="molten" window={[0.06, 0.85]}
  value={<HudValue get={() => signals.temp} fallback={270} format={(v) => fixed(v, 0, 3)} />} />
```

- `fallback` is what the server renders and what static mode shows (pick a representative value). Without it, static
  mode reads `get()` once after mount. A runtime switch to static (context loss, reduced motion turned on) puts the
  fallback back.
- **Scrubbed readouts ([S] in the storyboard) use `scrub` instead of `get`:** a pure function of the chapter's p,
  for example `scrub={(p) => layerAt(p)}`. It ticks in every mode, static included (the Scene does not run there),
  so each still shows the value for its own p. Readouts driven by time or jitter use `get` and freeze on `fallback`.
- Live updates stop while the element is off screen (IntersectionObserver) and whenever the HUD is not live.

### Live vs static

`useHudLive()` decides. `ChapterSection` wraps every overlay in `<HudLive value={!isStatic}>`; without a provider the
HUD is live unless the user prefers reduced motion. Every live component also takes `live` to force it. Not live:
values show their fallback, live dots disappear, clusters stay shown, leaders and brackets hide (there is no scene to
project). `useCaptureMode()` is true under `?capture=1`: live dots disappear and the bbox lock-on is instant.

### Screen-space signals (the agreed format)

```ts
anchors: Record<string, Float32Array(3)>  // [x CSS px, y CSS px, visible 0|1]      createAnchors("collar", "tip")
bbox: Float32Array(4)                     // [minX, minY, maxX, maxY] CSS px; NaN in slot 0 = hidden   createBBox()
```

CSS px of the canvas, which is the viewport's top-left origin (the canvas and every `position: fixed` HUD element
share it, also during handoffs and under a mobile toolbar). The Scene writes them after its camera update (the story
owns the writers, `writeAnchor` / `writeBBox`); `Leader` and `BBoxBrackets` read them on the gsap ticker, which runs
after the story's frame rendered (the director is first on the ticker), so they never trail by a frame. Custom DOM
that follows Scene output uses `useStoryTick(cb, { after: 'render' })` from `@/strata/story`. Write into the
arrays, never replace them. Also exported: `copyColumn(width, height, out)` (the copy column as `[x0, y0, x1, y1]`),
`nearRect(x, y, rect, margin = 24)`, `COPY_COLUMN_MARGIN`, and the types `ScreenAnchor`, `ScreenAnchors`,
`ScreenBBox`, `PWindow`.

## Components

Every primitive (`HudFrame`, `HudReadout`, `HudPanel`, `HudTag`) and `HudCluster` forwards other attributes to its
root element, so `data-hud`, `aria-hidden`, `id` and `style` work on them directly (`useChapterTimeline`'s
`[data-hud]` selector included).

### HudValue (client)

`get?: () => number | string`, `scrub?: (p) => number | string`, `fallback?`, `format?: (v: number) => string`, `decimals = 0`, `pad = 0` (zero-pad the
integer part), `throttle = 67` (writes are quantized to 67 ms buckets, the storyboard's 15 Hz; `0` = every frame),
`live?`, `className`. Writes `textContent` only when the string changes; counters step, they never glide. Always
tabular. Formatters: `fixed(v, decimals, pad)`, `outOf(v, total, pad = 4)` -> `0421 / 0840`, `clock(seconds)` ->
`01:23:45`, `thousands(v)` -> `1,284,093`, `percent(v01, decimals)`. `useHudTick` quantizes the same way.

### HudReadout (server-safe)

```tsx
<HudReadout live label="Layer" chars={11} value={<HudValue get={layer} format={(v) => outOf(v, 840)} fallback={421} />} />
<HudReadout desktopOnly label="Z" unit="mm" value="21.05" />
```

LABEL / value / unit; renders its own `<dl>` (`dt` label, `dd` value) so it is valid anywhere. `size`: `sm` (default:
the storyboard readout, Geist Mono 500 13 px) | `md` | `lg` | `xl` (showcase numbers off the canvas). `tone`: `molten`
| `resin` | `uv` | `neutral` | `ok` | `warn` (coloured tones get a soft glow). `live` adds the 5 px molten dot pulsing
at 1.2 s (`LiveDot`; off in static mode, reduced motion and capture; leave it off in Ch8). `desktopOnly` hides it
below 768 px. `chars` sets the value field's minimum width in characters so ticking digits never shift the layout.

### HudCluster (client)

```tsx
<HudCluster window={[0.12, 0.86]} className="absolute bottom-6 right-4">...readouts...</HudCluster>
```

Readouts on the copy-panel material (`glass`), framed by 1 px `hud-line` hairlines and 8 px corner brackets.
`window` is a p-window in the enclosing chapter: on entry the hairlines draw (180 ms), then the values fade in
(120 ms); on exit everything fades (240 ms). Without `window` it follows `visible` (default true); outside a chapter
pass `progress` (a getter). Always shown when the HUD is not live. `aria-hidden` by default (`decorative={false}` for
values that carry meaning the copy does not). `padding` (classes, default `px-4 py-3`). Position it with `className`;
the root is a wrapper, so it composes with `[data-hud]` timelines.

### Leader (client)

```tsx
<Leader anchors={signals.anchors} name="collar" label="Collar" value="Ø16.0" tone="resin"
  dx={96} dy={-56} mobile={{ dx: 48, dy: -40 }} window={[0.4, 1]} />
```

A 3 px dot on the projected point, a 1 px line with one 45° elbow (a 45° run covering `|dy|`, then horizontal to
`dx`; `|dx|` is raised to `|dy|` if smaller), and a label chip on the panel material: `label` / `value`, or any
`children`. Position comes from `anchors[name]` in viewport px (position: fixed, written as a transform each tick).
It hides when the anchor's visible slot is 0, outside `window`, when its chapter is off screen, when the HUD is not
live, and (unless `avoidCopyColumn={false}`) when the dot or the label end is within 24 px of the copy column
(desktop x 6vw .. 6vw + min(34vw, 520px); phones y 10..34 % of the height). Same entry and exit timing as clusters.
`aria-hidden` by default. **Mount it directly in the Overlay root, never inside a transformed parent** (a transform
on an ancestor breaks `position: fixed`).

### BBoxBrackets (client)

```tsx
<BBoxBrackets bbox={signals.bbox} width="88.0 mm" height="42.0 mm" window={[0.88, 1]} className="max-md:hidden" />
```

Four 12 px corner brackets `pad` px (default 8) outside `signals.bbox`, with a dimension line and label along the
bottom and up the side (right side, or left when there is no room). Pass the envelope values from `facts`. Each time
the box appears it locks on: scale 1.6 -> 1.0, `back.out(1.6)`, 320 ms (instant under capture and reduced motion).
Hidden while `bbox[0]` is NaN, outside `window`, when the chapter is off screen or the HUD is not live. Counts as one
readout. Fixed like `Leader`: mount it in the Overlay root.

### PhaseRail (client)

```tsx
<PhaseRail />                                                          // the nine story chapters, hides at #customers
<PhaseRail chapters={[{ id: "color", label: "Colour" }]} endId="lab-footer" />
```

`<nav aria-label="Story chapters">` with real links `#ignition` ... `#object` (works without script). Desktop: ticks
on the left edge (44 x 44 targets), labels `00 Ignition` ... `08 Object` on hover and focus, the active tick widens
and fills `--molten` with p, past ticks fill `text-2`, `aria-current="location"` on the active link. Below 768 px: a
2 px progress line across the top (whole story) and the chapter code on the right; the links stay as a visually
hidden list, and a focused link shows as a chip. Hidden once `#customers` is within the top 15 % of the viewport.
It measures section offsets on resize and reads only `scrollY` per tick. Mounted once in `src/app/page.tsx`; the skip
link must come before it in the DOM. `STORY_CHAPTERS` is the default list.

### HudCounter (client)

```tsx
<HudCounter get={() => signals.parts} value={1284093} digits={7} label="Parts printed today"
  className="text-[44px] text-text-1" />
```

Odometer: every digit is a rolling strip (CSS transform transition); leading zeros are dimmed. `digits` (integer
digits), `decimals`, `group` (thousands separators, default true), `throttle`. Digits are `aria-hidden`; a hidden text
copy (updated at most every 2 s) carries `label: value` for screen readers.

### HudBar (client)

```tsx
<HudBar label="Thermal" tone="thermal" ticks={20}
  get={() => (signals.temp - 200) / 60} value={0.75}
  readout={<HudValue get={() => signals.temp} decimals={1} fallback={245} />} />
```

0..1 meter. `tone`: `molten` | `resin` | `uv` | `thermal` (resin -> UV -> molten; hot colours appear as it rises).
`role="meter"` with `aria-valuenow` (0-100) kept current; the fill is a clip of a fixed gradient with a glowing head.

### HudScale (client)

```tsx
<HudScale from={0} to={42} step={1} majorEvery={10} orientation="vertical" unit="Z"
  getMarker={() => signals.z} tone="resin" />
```

Ruler with mm ticks (minor, mid, major + labels) and an optional static `marker` or live `getMarker` (mm).
Horizontal fills the width (h-7); vertical fills the height (w-9). Decorative (`aria-hidden`): pair it with a real readout.

### HudGrid (server-safe)

```tsx
<div className="relative h-[60svh]"><HudGrid cell={24} majorEvery={4} crosshair={{ x: 50, y: 50 }} fade /></div>
```

Measurement grid filling its positioned parent, optional crosshair (percent), radial edge fade. Decorative.

### HudTag (server-safe)

```tsx
<div className="relative">
  <HudTag x="62%" y={140} dx={72} dy={-44} label="Wireframe" value="12,480 tris" tone="resin" />
</div>
```

The `Leader` graphic with a fixed anchor inside a positioned parent (both render `LeaderShape` + `LeaderLabel`).
`x`/`y`: number = px, string = any CSS length (overridable through `--x` / `--y`). `dx`/`dy`: label offset in px.
`visible={false}` fades it out; on show the line draws again. Either control it with `visible` or leave `visible`
undefined and write `el.dataset.visible` yourself, never both (a re-render would overwrite the DOM value).
**Never put a HudTag on a projected 3D point**: the sticky container moves during handoffs, so its coordinates are
not canvas coordinates. Use `Leader` with `writeAnchor`.

### HudStatus (server-safe)

```tsx
<HudStatus tone="molten">Printing</HudStatus>   // pulsing dot + uppercase state
<HudStatus tone="neutral" pulse={false}>Idle</HudStatus>
```

For live state text put a `HudValue` with a string getter inside.

### HudPanel (server-safe)

`title`, `meta` (right side: text or a `HudStatus`), `columns` (1-3), `variant`: `glass` (backdrop blur; small panels
only over the canvas) | `lite` (no blur, cheaper) | `bare` (hairline only). Children stack in a grid. Over the canvas
prefer `HudCluster` (the storyboard material); `HudPanel` is for larger off-canvas dashboards.

### HudFrame (server-safe)

```tsx
<HudFrame label="CAM 02 / MACRO" tone="molten" size={14} outline className="p-6">...</HudFrame>
```

Four corner brackets (decorative) with an optional caption inside the top-left. `outline` adds a faint full hairline.
The root is `relative` unless `className` contains `absolute`, `fixed` or `sticky`, so
`className="absolute bottom-6 right-4"` positions it.

### HudTicker (client)

```tsx
<HudTicker rows={6} rate={7} />                               // seeded FDM G-code stream
<HudTicker next={(i) => toolpathLine(i)} rows={8} rate={12} /> // your own lines, e.g. from part.slice()
```

Scrolling G-code log; recycled DOM rows slide up one line per tick, coloured by command (`G` resin, `M` molten,
`;comments` muted). Decorative (`aria-hidden`). `gcodeStream(seed)` is exported for client code.

## Style notes

- Labels: `hud-label` (mono 11 px, uppercase, 0.12em). Values: `hud-value` or `font-mono tabular`.
- Hairlines: `border-line`; HUD hairlines and brackets `hud-line` (rgba(243,245,249,0.16), STORYBOARD 3.7). Accents: molten for heat, resin for resin/UV/cool data, uv for cure.
- Over the canvas, labels and tick numerals use `text-text-2` at 11 px or more (never `text-text-3`, which is for opaque surfaces only, such as HudTicker line numbers on a panel); values `text-text-1`.
- Every HUD element over the canvas sits on the panel material (`glass`, or `glass-lite` when many are on screen); never add another backdrop blur.
