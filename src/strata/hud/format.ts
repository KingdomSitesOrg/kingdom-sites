export type HudFormat = (value: number) => string;

/** Fixed decimals with optional zero-padding of the integer part: fixed(3.14159, 2, 3) -> "003.14". */
export function fixed(value: number, decimals = 0, pad = 0): string {
  if (!Number.isFinite(value)) return "--";
  const neg = value < 0;
  const s = Math.abs(value).toFixed(decimals);
  if (!pad) return neg ? `-${s}` : s;
  const [int, frac] = s.split(".");
  const padded = int.padStart(pad, "0");
  return `${neg ? "-" : ""}${frac !== undefined ? `${padded}.${frac}` : padded}`;
}

/** 5025 seconds -> "01:23:45". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
/** 1284093 -> "1,284,093". */
export function thousands(value: number): string {
  return grouped.format(Math.round(value));
}

export function percent(value01: number, decimals = 0): string {
  return `${(value01 * 100).toFixed(decimals)}%`;
}

/** Fixed-width counter with leading zeros: outOf(421, 840) -> "0421 / 0840". */
export function outOf(value: number, total: number, pad = 4): string {
  return `${fixed(Math.round(value), 0, pad)} / ${fixed(total, 0, pad)}`;
}
