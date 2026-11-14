// The pieces: stamped type, paper cut-outs (cup, croissant, app icon), the phone and the pointer.
import React from "react";
import { random } from "remotion";
import { C, CUT_SHADOW, FONT, STEP, UI, boil, boilT, outBack, prog, lerp } from "./lib";

/** A line of type stamped in one letter per pose; each letter lands big, squashes, then sits a
    little crooked like a cut-out letter placed by hand. */
export const Stamp: React.FC<{
  id: string; text: string; f: number; start: number; y: number; size: number; color: string;
  per?: number; x?: number; align?: "center" | "left"; shadow?: boolean; width?: number;
}> = ({ id, text, f, start, y, size, color, per = STEP, x = 540, align = "center", shadow = true, width = 1080 }) => {
  const letters = [...text];
  return (
    <div
      style={{
        position: "absolute", left: align === "center" ? 0 : x, width: align === "center" ? width : undefined,
        top: y - size * 0.5, height: size, display: "flex", justifyContent: align === "center" ? "center" : "flex-start",
        alignItems: "center", fontFamily: FONT, fontWeight: 900, fontVariationSettings: "'wdth' 62",
        fontSize: size, lineHeight: 1, color, letterSpacing: -size * 0.01, whiteSpace: "pre",
      }}
    >
      {letters.map((ch, i) => {
        if (ch === " ") return <span key={i} style={{ display: "inline-block", width: size * 0.22 }} />;
        const at = start + i * per;
        if (f < at - 1e-6) return <span key={i} style={{ opacity: 0 }}>{ch}</span>;
        const age = f - at;
        const land = age < STEP - 1e-6 ? 1.5 : age < 2 * STEP - 1e-6 ? 0.9 : 1;
        const lift = age < STEP - 1e-6 ? -size * 0.12 : 0;
        const tilt = (random(`${id}t${i}`) - 0.5) * 7;
        const b = boil(`${id}${i}`, f, 0.7);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translate(${b.x}px, ${lift + b.y}px) rotate(${tilt * (age < STEP ? 2.2 : 1) + b.r}deg) scale(${land})`,
              textShadow: shadow ? `${size * 0.03}px ${size * 0.04}px 0 rgba(0,0,0,0.22)` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Places a cut-out at a centre point with its own wobble and the hard paper shadow. */
export const Cut: React.FC<{ id: string; f: number; x: number; y: number; w: number; rot?: number; scale?: number; sy?: number; children: React.ReactNode }> = ({
  id, f, x, y, w, rot = 0, scale = 1, sy = 1, children,
}) => (
  <div
    style={{
      position: "absolute", left: x - w / 2, top: y - w / 2, width: w, height: w,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: `${boilT(id, f)} rotate(${rot}deg) scale(${scale}, ${scale * sy})`, filter: CUT_SHADOW,
    }}
  >
    {children}
  </div>
);

export const Cup: React.FC<{ w: number; sleeve?: string }> = ({ w, sleeve = C.warm }) => (
  <svg width={w} height={w * 1.4} viewBox="0 0 200 280">
    <path d="M32 74 L168 74 L149 272 L51 272 Z" fill={C.white} />
    <path d="M40 140 L160 140 L154 208 L46 208 Z" fill={sleeve} />
    <path d="M86 160 h28 v18 a14 14 0 0 1 -28 0 Z" fill={C.white} opacity={0.9} />
    <rect x="18" y="50" width="164" height="30" rx="12" fill={C.ink} />
    <path d="M44 52 Q100 12 156 52 Z" fill={C.ink} />
  </svg>
);

export const Steam: React.FC<{ id: string; f: number; w: number }> = ({ id, f, w }) => (
  <svg width={w} height={w * 0.8} viewBox="0 0 200 160" style={{ overflow: "visible" }}>
    {[50, 100, 150].map((x, i) => {
      const b = boil(`${id}s${i}`, f, 2.2);
      return (
        <path
          key={i}
          d={`M${x + b.x} 150 q ${18 + b.r * 6} -30 0 -60 t 0 -60`}
          fill="none" stroke={C.paper} strokeWidth={12} strokeLinecap="round" opacity={0.92}
        />
      );
    })}
  </svg>
);

export const Croissant: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 0.6} viewBox="0 0 300 180">
    <path
      d="M16 128 Q 30 34 150 26 Q 270 34 284 128 Q 256 104 232 148 Q 196 86 150 90 Q 104 86 68 148 Q 44 104 16 128 Z"
      fill={C.crust} stroke={C.crustDk} strokeWidth={7} strokeLinejoin="round"
    />
    <path d="M92 40 Q 108 78 98 116 M150 28 Q 158 60 150 90 M208 40 Q 192 78 202 116" fill="none" stroke={C.crustDk} strokeWidth={7} strokeLinecap="round" />
    <path d="M60 70 Q 80 54 104 50" fill="none" stroke="#f1c27d" strokeWidth={8} strokeLinecap="round" />
  </svg>
);

/** The café's own app icon: a terracotta tile with a white cup. */
export const AppIcon: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ width: w, height: w, borderRadius: w * 0.23, background: C.warm, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.12)" }}>
    <svg width={w * 0.56} height={w * 0.62} viewBox="0 0 200 220">
      <path d="M40 60 L160 60 L144 210 L56 210 Z" fill={C.white} />
      <rect x="26" y="40" width="148" height="26" rx="10" fill={C.white} />
      <path d="M60 110 L140 110 L136 150 L64 150 Z" fill={C.warm} />
    </svg>
  </div>
);

/** A phone drawn in code: ink body, paper screen, a small island. Children are the screen. */
export const PHONE = { w: 500, h: 1020, r: 74, bezel: 16 };
export const Phone: React.FC<{ id: string; f: number; x: number; y: number; scale?: number; sy?: number; rot?: number; children: React.ReactNode }> = ({
  id, f, x, y, scale = 1, sy = 1, rot = 0, children,
}) => (
  <div
    style={{
      position: "absolute", left: x - PHONE.w / 2, top: y - PHONE.h / 2, width: PHONE.w, height: PHONE.h,
      borderRadius: PHONE.r, background: C.ink, filter: "drop-shadow(12px 16px 0 rgba(0,0,0,0.25))",
      transform: `${boilT(id, f, 0.5)} rotate(${rot}deg) scale(${scale}, ${scale * sy})`, transformOrigin: "50% 100%",
    }}
  >
    <div style={{ position: "absolute", inset: PHONE.bezel, borderRadius: PHONE.r - PHONE.bezel, overflow: "hidden", background: C.paper }}>
      {children}
    </div>
    <div style={{ position: "absolute", left: PHONE.w / 2 - 70, top: 34, width: 140, height: 38, borderRadius: 19, background: C.ink }} />
  </div>
);

/** Skeleton line for text nobody needs to read. */
export const Skel: React.FC<{ w: number; h?: number; c?: string; style?: React.CSSProperties }> = ({ w, h = 18, c = C.grey, style }) => (
  <div style={{ width: w, height: h, borderRadius: h / 2, background: c, ...style }} />
);

export const uiText = (size: number, weight = 700, color: string = C.ink): React.CSSProperties => ({
  fontFamily: UI, fontSize: size, fontWeight: weight, color, lineHeight: 1.15, letterSpacing: -size * 0.01,
});

/** The one pointer: a flat arrow, moved between keys in poses, pressed on its frame. */
export type PointerKey = { f: number; x: number; y: number };
export const Pointer: React.FC<{ f: number; keys: PointerKey[]; press: number[]; show: [number, number] }> = ({ f, keys, press, show }) => {
  if (f < show[0] || f >= show[1]) return null;
  let x = keys[0].x, y = keys[0].y;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f >= a.f && f <= b.f) {
      const t = outBack(prog(f, a.f, b.f), 0.6);
      x = lerp(a.x, b.x, t);
      y = lerp(a.y, b.y, t);
    } else if (f > b.f) {
      x = b.x;
      y = b.y;
    }
  }
  const pressed = press.some((p) => f >= p && f < p + 2 * STEP);
  return (
    <div style={{ position: "absolute", left: x - 6, top: y - 4, transform: `scale(${pressed ? 0.86 : 1})`, transformOrigin: "6px 4px", filter: CUT_SHADOW }}>
      <svg width={92} height={124} viewBox="0 0 76 104">
        <path d="M6 4 L6 84 L27 65 L41 98 L55 92 L41 60 L70 60 Z" fill={C.ink} stroke={C.white} strokeWidth={6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** A ring that runs out from a press, in poses. */
export const TapRing: React.FC<{ f: number; at: number; x: number; y: number; color?: string }> = ({ f, at, x, y, color = C.white }) => {
  const age = f - at;
  if (age < 0 || age >= 4 * STEP) return null;
  const r = 30 + age * 14;
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, border: `${Math.max(2, 10 - age)}px solid ${color}`, opacity: 1 - age / (4 * STEP) }} />;
};
