#!/usr/bin/env node
// Every check, in order; stops at the first that fails.
//   npm run verify
//
//   timeline  the sheet against SCRIPT.md (timeline/build.mjs --check: beat
//             grid, holds, silence, voice words, presses with clicks, 90 s cap)
//   types     the film's TypeScript
//   sheet     sounds on 15n + 1 and one per beat; label reading times; labels
//             inside title-safe; the film's length; one pointer and its motion
//             (arcs, ~1% overshoot, settled 2 frames early, 0.9 on the press,
//             back by +6); every scene's source complete on disk, and the list
//             of scenes still on drafts (reported, not failed)
//   press     measured on rendered stills: the composition's length, never
//             more than one pointer, the tip within 0.75 px of its target on
//             every press frame (also proves the font loads: a frame with a
//             missing face refuses to render)
//   review    the review page draws the film (only if its server is up)
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const run = (label, cmd, args) => {
  process.stdout.write(`── ${label}\n`);
  execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
};

try {
  run("scan", process.execPath, ["tools/scan-scenes.mjs"]);
  run("timeline", process.execPath, ["timeline/build.mjs", "--check"]);
  run("types", path.join(ROOT, "node_modules", ".bin", "tsc"), ["--noEmit"]);
  run("sheet", process.execPath, ["--no-warnings", "verify/sheet-check.mjs"]);
  run("press", process.execPath, ["--no-deprecation", "verify/press-check.mjs"]);
  let up = false;
  try {
    up = (await fetch("http://127.0.0.1:5191/api/notes")).ok;
  } catch {}
  if (up) run("review", process.execPath, ["verify/review-check.mjs"]);
  else console.log("── review: server not running, skipped (npm run review:serve)");
  console.log("all checks passed");
} catch {
  console.log("a check failed; see above");
  process.exit(1);
}
