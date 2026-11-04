/**
 * The quote model (STORYBOARD 2.2): pure functions shared by Ch8's spec card and #quote.
 * No imports, so `node --test` loads it with type stripping (npm run test:quote).
 * Money is computed in whole cents, so totals never pick up float dust.
 */

export const objects = {
  bracket: { name: 'Drone arm bracket', V: 21.7, k: 1.15 },
  finger: { name: 'Gripper finger', V: 14.2, k: 1.0 },
  manifold: { name: 'Hydraulic manifold', V: 48.6, k: 1.3 },
  knuckle: { name: 'Hinge knuckle', V: 8.9, k: 0.9 },
} as const;

/** r $/cm³, s setup $, b base lead (business days), c capacity cm³/day. */
export const materials = {
  titanium: { name: 'Titanium', spec: 'Ti-6Al-4V', process: 'Metal LPBF', r: 6.8, s: 85, b: 4, c: 400 },
  carbonNylon: { name: 'Carbon nylon', spec: 'PA12-CF', process: 'FDM', r: 0.42, s: 9, b: 2, c: 2500 },
  clearResin: { name: 'Clear resin', spec: 'Clear resin', process: 'Resin SLA', r: 0.38, s: 6, b: 1, c: 1200 },
} as const;

export type QuoteObject = keyof typeof objects;
export type QuoteMaterial = keyof typeof materials;

export const QUANTITY = { min: 1, max: 500 } as const;
export const OBJECT_KEYS = Object.keys(objects) as QuoteObject[];
export const MATERIAL_KEYS = Object.keys(materials) as QuoteMaterial[];

/** Integer 1..500. Non-numbers fall back to 1. */
export function clampQuantity(q: number): number {
  if (!Number.isFinite(q)) return QUANTITY.min;
  return Math.min(QUANTITY.max, Math.max(QUANTITY.min, Math.round(q)));
}

export function round2(v: number): number {
  return Math.round((v + Math.sign(v) * 1e-9) * 100) / 100;
}

/** clamp(1 − 0.06 · log2(q), 0.55, 1) */
export function discount(q: number): number {
  const d = 1 - 0.06 * Math.log2(clampQuantity(q));
  return Math.min(1, Math.max(0.55, d));
}

function unitCents(object: QuoteObject, material: QuoteMaterial, q: number): number {
  const o = objects[object];
  const m = materials[material];
  const n = clampQuantity(q);
  return Math.round((o.V * m.r * o.k * discount(n) + m.s / n) * 100 + 1e-7);
}

/** round2(V · r · k · discount(q) + s / q), in dollars. */
export function unitPrice(object: QuoteObject, material: QuoteMaterial, q: number): number {
  return unitCents(object, material, q) / 100;
}

/** round2(unitPrice · q), in dollars. */
export function total(object: QuoteObject, material: QuoteMaterial, q: number): number {
  return (unitCents(object, material, q) * clampQuantity(q)) / 100;
}

/** b + ceil(q · V / c), in business days. */
export function leadDays(object: QuoteObject, material: QuoteMaterial, q: number): number {
  const m = materials[material];
  return m.b + Math.ceil((clampQuantity(q) * objects[object].V) / m.c - 1e-9);
}

/** 'YYYY-MM-DD' to a Date at UTC midnight. All date maths here works in UTC days. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** A local calendar day (e.g. new Date()) as a Date at UTC midnight of the same Y/M/D. */
export function toUTCDay(local: Date): Date {
  return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
}

/** Adds business days, skipping Saturdays and Sundays. From a weekend, day 1 is the next Monday. */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  let left = Math.max(0, Math.round(days));
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

/** today + leadDays business days. `today` is a UTC-midnight day (see parseISODate, toUTCDay). */
export function shipDate(object: QuoteObject, material: QuoteMaterial, q: number, today: Date): Date {
  return addBusinessDays(today, leadDays(object, material, q));
}

export interface Quote {
  object: QuoteObject;
  material: QuoteMaterial;
  q: number;
  discount: number;
  unitPrice: number;
  total: number;
  leadDays: number;
  shipDate: Date;
}

export function quote(object: QuoteObject, material: QuoteMaterial, q: number, today: Date): Quote {
  const n = clampQuantity(q);
  return {
    object,
    material,
    q: n,
    discount: discount(n),
    unitPrice: unitPrice(object, material, n),
    total: total(object, material, n),
    leadDays: leadDays(object, material, n),
    shipDate: shipDate(object, material, n, today),
  };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'Mon, Nov 9' (locale-independent, so server and client agree). */
export function formatShipDate(d: Date): string {
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** '$5,696.50' */
export function formatUSD(v: number): string {
  const cents = Math.round(Math.abs(v) * 100);
  const whole = Math.floor(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${v < 0 ? '-' : ''}$${whole}.${String(cents % 100).padStart(2, '0')}`;
}
