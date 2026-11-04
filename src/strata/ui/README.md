# `@/strata/ui` - STRATA UI kit

Typed, accessible building blocks for the chapters and the SaaS section. Everything is token-driven
(`src/app/globals.css`, table in `strata-landing/tokens.md`). Showcase: `/lab/ui`.

```tsx
import { Button, Section, Container, SectionHeading, GlowCard, IconFleet } from "@/strata/ui";
```

Ground rules

- `className` adds classes; it does not override. `cn()` joins strings and does not resolve Tailwind conflicts, so
  `className="hidden sm:inline-flex"` on a component that already sets `inline-flex` will not hide it. Wrap it instead.
- Server-safe (no `"use client"`): `Container`, `Section`, `SectionHeading`, `Eyebrow`, `Badge`, `Kbd`, `Divider`,
  `GlassPanel`, `Marquee`, `Logo`, all icons. Client: `Button`, `DemoButton`, `DemoNote`, `RadioCards`, `GlowCard`, `AnimatedNumber`, `SegmentedControl`,
  `Accordion`, `TextField`, hooks. Client components can still be rendered from Server Components; only function props
  (e.g. an `AnimatedNumber` `format` function) need a Client parent.
- Headings: each `Section` gets `aria-labelledby="<id>-title"` by default; give its heading `id="<id>-title"`.
- Colours for three.js / canvas: `import { colors, MOLTEN, RESIN, UV, BG, materials } from "@/strata/ui"` (mirror of the CSS tokens; `materials` holds the STORYBOARD 3.2 material colours for three.js only).

## Layout

```tsx
<Section id="pricing" surface="bg-0" spacing="default">   {/* py-section, opaque bg, scroll-mt */}
  <Container size="page">                                    {/* prose | page | wide | full; 16 px gutter at 375 */}
    <SectionHeading
      id="pricing-title"
      eyebrow="Pricing" index="07" eyebrowTone="molten"
      title="Pay per part. Or don't."
      lead="Three plans, one fleet."
      align="left" size="lg"                                   {/* xl | lg | md */}
    />
  </Container>
</Section>
```

`Section` props: `id` (required), `labelledBy`, `spacing` (`default` | `sm` | `none`), `surface`
(`bg-0` | `bg-2` | `bg-3` | `transparent`). SaaS sections should stay opaque (canvas behind).

## Text bits

```tsx
<Eyebrow index="05">Printing</Eyebrow>                  // Geist Mono 12 px molten: "05 — PRINTING"
<Badge tone="molten" dot>Most popular</Badge>           // neutral | molten | resin | uv | ok
<Kbd>⌘</Kbd><Kbd>K</Kbd>
<Divider />                                             // decorative hairline
<Divider label="Or describe it" ticks />                // labelled separator with mm ticks
<GlassPanel padding="md">...</GlassPanel>               // the copy panel (STORYBOARD 3.1); alias CopyPanel; variant "lite" = always solid
```

## Button

```tsx
<Button href="#idea" size="lg" trailingIcon={<IconArrowRight />}>Start building</Button>
<Button variant="secondary" leadingIcon={<IconPlay />} onClick={play}>Watch the fleet</Button>
<Button variant="ghost" size="sm">Docs</Button>
```

- `variant`: `primary` (molten fill, `--text-on-molten` text, 6.9:1) | `secondary` (copy-panel material, `--line-strong` outline) | `ghost`.
- `size`: `sm` (36 px tall) | `md` (48 px) | `lg` (56 px). Every size has a hit area of at least 44 x 44 px (a
  transparent `::before`), so `sm` stays a touch target (STORYBOARD 8.2).
- Focus ring: the global 2 px `--resin` outline at 3 px offset; never restyle it.
- `href` renders an `<a>`, otherwise a `<button type="button">`. All native props pass through (`disabled`, `aria-*`, `target`).
- `magnetic` (default true): spring follow on mouse hover via framer-motion. Automatically off for reduced motion,
  coarse pointers and non-mouse pointers.
- Icons are `aria-hidden`; the label is the accessible name.

## Demo actions (STORYBOARD 5.3)

Plan buttons, **Book a fleet tour** and **Subscribe** are `type="button"` and only show an inline note.

```tsx
<DemoButton variant="primary" wrapperClassName="w-full" className="w-full">Choose Studio</DemoButton>
<DemoButton variant="secondary" note="Demo site: tours are not booked.">Book a fleet tour</DemoButton>

// Custom layouts (the footer field): the hook wires the button to the note.
const subscribe = useDemoNote();
<TextField label="Work email" hint="Demo site: nothing is sent."
  trailing={<Button size="sm" magnetic={false} {...subscribe.buttonProps}>Subscribe</Button>} />
<DemoNote {...subscribe.noteProps} />
```

- `DEMO_NOTE` = `Demo site: sign-ups are disabled.` (the default text).
- `DemoButton`: every `Button` prop except `type`, plus `note`, `wrapperClassName`, `noteClassName`. Pressing it reveals
  the note under the button; `onClick` still runs.
- `useDemoNote()` -> `{ shown, show, buttonProps: { type, "aria-describedby", onClick }, noteProps: { id, shown } }`.
- `DemoNote` (`id`, `shown`, `children = DEMO_NOTE`, `reserve = true`): a `role="status"` line that is the button's
  description, empty until shown (so it is announced when it appears); `reserve` keeps its height to avoid layout shift.

## GlowCard

```tsx
<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <GlowCard as="li" accent="resin" className="flex flex-col gap-10 p-7">
    <IconOptimize />
    <h3>Generative optimization</h3>
  </GlowCard>
</ul>
```

Cursor position is written to `--mx/--my` on the element on pointermove: no React re-render. `accent`: `molten` |
`resin` | `uv`; `radius` (px) sets the spotlight size. Put a live mini 3D/animated icon inside as children.

## Marquee

```tsx
<Marquee label="Customers" items={logos} duration={48} itemClassName="text-text-3" />
```

Pure CSS. Pauses on hover and keyboard focus inside. The duplicate track is `aria-hidden` and `inert`.
With reduced motion it stops and wraps into a centered, multi-row list. `reverse`, `gap` (CSS length).

## AnimatedNumber

```tsx
<AnimatedNumber value={1284093} />                                  // counts up when 35% in view
<AnimatedNumber value={price} prefix="$" format={{ maximumFractionDigits: 0 }} live />
<AnimatedNumber value={38.6} suffix=" h" duration={2} />
```

- SSR and reduced motion render the final value. Later `value` changes tween from the shown value (60% of `duration`).
- `format`: Intl options (serializable) or `(n) => string` (Client parent only). Default decimals = the target's decimals (max 2).
- Writes `textContent` per frame; the visual span is `aria-hidden`, a hidden copy holds the final value.
  `live` makes that copy an `aria-live="polite"` region (use for quote prices, not for decorative counters).
- Always tabular.

## SegmentedControl

```tsx
const [billing, setBilling] = useState<"monthly" | "annual">("annual");
<span id="billing-label" className="hud-label">Billing</span>
<SegmentedControl
  labelledBy="billing-label"            // or label="Billing"
  value={billing} onChange={setBilling}
  options={[{ value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual", hint: "-20%" }]}
  tone="molten" size="md"               // molten | resin | neutral; sm | md
/>
```

`role="radiogroup"` with `role="radio"` buttons. Arrow keys move and select, Home/End jump; only the checked option is
tabbable. Equal-width segments, the thumb is CSS-only (correct on the server render). `md` segments are 44 px tall;
`sm` (32 px) keeps a 44 px hit area. An option's `description` adds a second line, e.g. the quote's material picker:

```tsx
<SegmentedControl labelledBy="material-label" tone="resin" value={m} onChange={setM}
  options={[{ value: "ti", label: "Titanium", description: "LPBF" }, { value: "cn", label: "Carbon nylon", description: "FDM" },
            { value: "resin", label: "Clear resin", description: "SLA" }]} />
```

## RadioCards

```tsx
<span id="object-label" className="hud-label text-text-2">Object</span>
<RadioCards labelledBy="object-label" value={part} onChange={setPart} tone="molten"
  gridClassName="grid-cols-2 md:grid-cols-4"
  options={[{ value: "arm", label: "Drone arm bracket", description: "88 × 42 × 40 mm", media: <ArmSvg /> }, ...]} />
```

Cards for the quote's object picker (and any picker with pictures). Native `<input type="radio">` inside `<label>`s in
a `role="radiogroup"`, so arrow keys, Space and selection work without script; the focus ring is drawn on the card.
Checked cards get a `tone` border, wash and dot; `media` is decorative (it tints with the tone when checked). Options:
`value`, `label`, `description?`, `media?`, `disabled?`. Props: `label` or `labelledBy`, `name` (defaults to a unique
id), `tone` (`molten` | `resin`), `gridClassName`, `cardClassName`.

## Accordion

```tsx
<Accordion
  type="single"                         // or "multiple"
  defaultOpen={["lead-time"]}
  headingLevel={3}
  items={[{ id: "lead-time", title: "How fast is a quote?", content: <p>Under two seconds.</p> }]}
/>
```

Each trigger is a `<button aria-expanded aria-controls>` inside a heading; panels are `role="region"`, animate height with
a grid-rows transition and are `inert` while closed.

## TextField

```tsx
<TextField
  label="Get the build log" hideLabel={false}
  type="email" placeholder="you@company.com" autoComplete="email"
  hint="One email a month."
  trailing={<Button size="sm" magnetic={false}>Subscribe</Button>}
/>
```

Labelled input in a pill frame; there is no form and nothing submits. The trailing `Button` is `type="button"`.

## Logo

```tsx
<Logo className="h-5" />                    // mark + wordmark (default), role="img" named "STRATA"
<Logo variant="mark" className="h-8" />     // the five-layer mark, top layer hot
<Logo variant="wordmark" sliced className="h-16" />  // wordmark cut into five print layers (large/decorative)
<Logo decorative />                         // aria-hidden when visible text already names it
```

Size with a height class; width follows (and is capped at the container width).

## Icons

24 px grid, 1.5 px stroke, `currentColor`, `aria-hidden` unless you pass `title`.

Feature set: `IconAiModel`, `IconOptimize`, `IconQuote`, `IconFleet`, `IconMaterial`, `IconApi`.
Story/UI: `IconLayers`, `IconNozzle`, `IconCube`, `IconSparkle`, `IconThermometer`, `IconClock`, `IconArrowRight`,
`IconArrowUpRight`, `IconArrowDown`, `IconCheck`, `IconPlus`, `IconMinus`, `IconChevronDown`, `IconPlay`, `IconMail`,
`IconX`, `IconLinkedIn`, `IconYouTube`.

```tsx
<IconFleet className="text-resin" size={20} strokeWidth={1.25} />
```

## Hooks

`useMediaQuery(query, serverValue)`, `usePrefersReducedMotion()`, `useCoarsePointer()` (client only; server value is
`false`, `false`, `true`).
