/**
 * JS mirror of the canonical palette in src/app/globals.css (STORYBOARD 3.1), for canvas drawing,
 * inline SVG and anything outside CSS. Shaders use src/shaders/palette.ts. Keep all three in sync.
 */
export const palette = {
  "bg-0": "#03050A",
  "bg-1": "#070A12",
  "bg-2": "#0B1020",
  "bg-3": "#111829",
  line: "#1C2436",
  "line-strong": "#2A3449",
  "text-1": "#F3F5F9",
  "text-2": "#A9B2C3",
  "text-3": "#7A8499",
  molten: "#FF6A1A",
  "molten-hot": "#FFB36B",
  "molten-core": "#FFE7C2",
  "molten-deep": "#B83E0C",
  resin: "#38E1FF",
  "resin-deep": "#0FA3C7",
  uv: "#7C6CFF",
  ok: "#5EF2A6",
  "text-on-molten": "#120802",
  "stress-lo": "#2D6BFF",
  "stress-mid": "#FFD43B",
  "stress-hi": "#FF3B2F",
} as const;

export type PaletteToken = keyof typeof palette;

/** Grouped view of the same palette, plus the extras that have no storyboard equivalent. */
export const colors = {
  bg: [palette["bg-0"], palette["bg-1"], palette["bg-2"], palette["bg-3"]],
  line: { base: palette.line, strong: palette["line-strong"], hud: "rgba(243, 245, 249, 0.16)" },
  text: { 1: palette["text-1"], 2: palette["text-2"], 3: palette["text-3"], onMolten: palette["text-on-molten"] },
  molten: { base: palette.molten, hot: palette["molten-hot"], core: palette["molten-core"], deep: palette["molten-deep"] },
  resin: { base: palette.resin, deep: palette["resin-deep"] },
  uv: palette.uv,
  ok: palette.ok,
  stress: { lo: palette["stress-lo"], mid: palette["stress-mid"], hi: palette["stress-hi"] },
  state: { warn: "#FFB547", danger: "#FF5A64" },
} as const;

/**
 * Physical material base colours (STORYBOARD 3.2 / 3.3). Not UI tokens: use them for three.js materials and
 * lights only. Linear RGB for uniforms: `materialLinear(name)` in '@/strata/shaders/palette'.
 */
export const materials = {
  titanium: "#8C9096",
  aluminium: "#B7BCC4",
  anodised: "#16181D",
  nozzleSteel: "#5E6168",
  pa12cf: "#1B1C20",
  pa12cfSheen: "#3A3F4A",
  resinAttenuation: "#9FE9FF",
  liquidResin: "#0FA3C7",
  pa12Powder: "#EDEBE6",
  metalPowder: "#5A5D63",
  pei: "#2B2620",
  cabinetGlass: "#0B1020",
  cycloramaFloor: "#0B0F18",
  cycloramaTop: "#03050A",
  siliconeSock: "#2A2D33",
  keyLight: "#F4F1EC",
} as const;

export type MaterialToken = keyof typeof materials;

export const MOLTEN = palette.molten;
export const RESIN = palette.resin;
export const UV = palette.uv;
export const BG = palette["bg-0"];

export const ease = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOutQuint: [0.83, 0, 0.17, 1],
  snap: [0.2, 0.9, 0.1, 1],
  standard: [0.4, 0, 0.2, 1],
} as const;

/** Reads a live CSS custom property from :root, e.g. readToken("--molten"). */
export function readToken(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
