export type ClassValue = string | false | null | undefined | 0;

/** Joins truthy class names. It does not dedupe Tailwind conflicts: a caller's class adds, it does not override. */
export function cn(...classes: ClassValue[]): string {
  let out = "";
  for (const c of classes) if (c) out = out ? `${out} ${c}` : c;
  return out;
}
