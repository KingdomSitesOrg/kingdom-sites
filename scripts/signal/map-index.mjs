#!/usr/bin/env node
// A copy. The source of truth is tools/map-index.mjs in the crash-reports repo
// (KingdomSitesOrg/crash-reports): change it there, then copy it here unchanged.
/**
 * Cuts source maps into the small lookup rows the Worker reads (CONTRACT.md →
 * "Source maps"), and uploads them. Runs at build time, in Node, where there is
 * no 10 ms limit. No dependencies: it decodes the map's mappings itself.
 *
 *   node map-index.mjs --app farzana --release <sha> --map <file.js.map>=<path in stack> [...]
 *   node map-index.mjs --app farzana --release <sha> --dir .next/static --prefix /_next/static
 *
 * Reads SIGNAL_UPLOAD_TOKEN and SIGNAL_ENDPOINT from the environment. With no
 * token it says so and exits 0, so a build never fails for want of it.
 * `--dry-run` prints the row count instead of uploading.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const BUCKET = 4000;
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_VALUE = new Map([...B64].map((c, i) => [c, i]));

/** Decodes a source map's `mappings` into [genLine0][[genCol, src, line0, col0, name|-1]]. */
export function decodeMappings(mappings) {
  const lines = [];
  let src = 0, origLine = 0, origCol = 0, name = 0;
  for (const lineText of mappings.split(";")) {
    const segments = [];
    let genCol = 0;
    if (lineText) {
      for (const segText of lineText.split(",")) {
        if (!segText) continue;
        const values = [];
        let value = 0, shift = 0;
        for (const char of segText) {
          const digit = B64_VALUE.get(char);
          if (digit === undefined) throw new Error(`Bad mapping character ${char}`);
          value += (digit & 31) << shift;
          if (digit & 32) {
            shift += 5;
          } else {
            values.push(value & 1 ? -(value >>> 1) : value >>> 1);
            value = 0;
            shift = 0;
          }
        }
        genCol += values[0];
        if (values.length >= 4) {
          src += values[1];
          origLine += values[2];
          origCol += values[3];
          if (values.length >= 5) name += values[4];
          segments.push([genCol, src, origLine, origCol, values.length >= 5 ? name : -1]);
        }
      }
    }
    segments.sort((a, b) => a[0] - b[0]);
    lines.push(segments);
  }
  return lines;
}

/** Flattens an indexed map (`sections`) into one regular map's shape. */
function flatten(map) {
  if (!map.sections) return map;
  const sources = [], names = [], lines = [];
  for (const section of map.sections) {
    const inner = flatten(section.map);
    const decoded = decodeMappings(inner.mappings);
    const srcBase = sources.length, nameBase = names.length;
    sources.push(...inner.sources.map((s) => joinRoot(inner.sourceRoot, s)));
    names.push(...(inner.names ?? []));
    decoded.forEach((segments, i) => {
      const at = section.offset.line + i;
      lines[at] ??= [];
      for (const [col, s, l, c, n] of segments) {
        lines[at].push([i === 0 ? col + section.offset.column : col, s + srcBase, l, c, n < 0 ? -1 : n + nameBase]);
      }
    });
  }
  return { sources, names, decoded: lines.map((l) => (l ?? []).sort((a, b) => a[0] - b[0])) };
}

const joinRoot = (root, source) => (root && !source.startsWith("/") && !/^[a-z]+:/.test(source) ? `${root.replace(/\/$/, "")}/${source}` : source);

/** Cleans a source path to the repo-relative path a GitHub link can use. */
export function cleanSource(source) {
  return source
    .replace(/^webpack:\/\/(_N_E\/)?/, "")
    .replace(/^turbopack:\/\/\/?(\[project\]\/)?/, "")
    .replace(/^file:\/\//, "")
    .replace(/^(\.\/|\.\.\/)+/, "")
    .replace(/\?.*$/, "");
}

/** Every lookup row for one map. `file` is the path frames will show. */
export function rowsFor(file, mapJson) {
  const map = typeof mapJson === "string" ? JSON.parse(mapJson) : mapJson;
  const flat = flatten(map);
  const sources = (flat.sources ?? map.sources).map((s) => cleanSource(joinRoot(map.sourceRoot, s)));
  const names = flat.names ?? map.names ?? [];
  const decoded = flat.decoded ?? decodeMappings(map.mappings);
  const rows = [];
  decoded.forEach((segments, lineIndex) => {
    if (!segments.length) return;
    const buckets = new Map();
    for (const segment of segments) {
      const bucket = Math.floor(segment[0] / BUCKET);
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket).push(segment);
    }
    // Each bucket also carries the segment just before it, so a column early in
    // a bucket still finds the mapping that covers it.
    let previous = null;
    const ordered = [...buckets.keys()].sort((a, b) => a - b);
    const maxBucket = ordered[ordered.length - 1];
    for (let bucket = ordered[0]; bucket <= maxBucket; bucket += 1) {
      const own = buckets.get(bucket) ?? [];
      const segs = previous ? [previous, ...own] : own;
      if (own.length) previous = own[own.length - 1];
      if (!segs.length) continue;
      const usedSources = [], usedNames = [];
      const srcAt = new Map(), nameAt = new Map();
      const data = segs.map(([col, s, l, c, n]) => {
        if (!srcAt.has(s)) { srcAt.set(s, usedSources.length); usedSources.push(sources[s] ?? "?"); }
        let ni = -1;
        if (n >= 0) {
          if (!nameAt.has(n)) { nameAt.set(n, usedNames.length); usedNames.push(names[n] ?? ""); }
          ni = nameAt.get(n);
        }
        return [col, srcAt.get(s), l + 1, c, ni];
      });
      rows.push({ file, line: lineIndex + 1, bucket, data: JSON.stringify([{ s: usedSources, n: usedNames }, ...data]) });
    }
  });
  return rows;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (path.endsWith(".js.map")) yield path;
  }
}

async function upload(endpoint, token, app, release, rows) {
  let sent = 0;
  while (sent < rows.length) {
    const batch = [];
    let size = 0;
    while (sent + batch.length < rows.length && batch.length < 200) {
      const row = rows[sent + batch.length];
      size += row.data.length + row.file.length + 40;
      if (batch.length && size > 300_000) break;
      batch.push(row);
    }
    let attempt = 0;
    for (;;) {
      const response = await fetch(`${endpoint}/v1/m`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ app, release, rows: batch }),
      });
      if (response.ok) break;
      attempt += 1;
      if (attempt >= 3) throw new Error(`Map upload refused: ${response.status} ${await response.text()}`);
      await new Promise((go) => setTimeout(go, 1000 * attempt));
    }
    sent += batch.length;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const take = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const app = take("--app"), release = take("--release"), dir = take("--dir"), prefix = take("--prefix") ?? "";
  const dry = args.includes("--dry-run");
  if (!app || !release) throw new Error("--app and --release are required");
  const pairs = [];
  args.forEach((arg, i) => { if (arg === "--map") pairs.push(args[i + 1]); });
  const maps = pairs.map((pair) => { const [path, file] = pair.split("="); return { path, file }; });
  if (dir) {
    for (const path of walk(dir)) {
      const rel = relative(dir, path).split(sep).join("/").replace(/\.map$/, "");
      maps.push({ path, file: `${prefix.replace(/\/$/, "")}/${rel}` });
    }
  }
  const rows = maps.flatMap(({ path, file }) => rowsFor(file, readFileSync(path, "utf8")));
  const endpoint = (process.env.SIGNAL_ENDPOINT ?? "").replace(/\/$/, "");
  const token = process.env.SIGNAL_UPLOAD_TOKEN;
  if (dry) { console.log(`map-index: ${maps.length} maps, ${rows.length} rows (dry run)`); return; }
  if (!token || !endpoint) {
    console.log(`map-index: SIGNAL_UPLOAD_TOKEN or SIGNAL_ENDPOINT not set; ${maps.length} maps not uploaded`);
    return;
  }
  await upload(endpoint, token, app, release, rows);
  console.log(`map-index: uploaded ${maps.length} maps (${rows.length} rows) for ${app} ${release}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => { console.error(`map-index: ${error.message}`); process.exit(1); });
}
