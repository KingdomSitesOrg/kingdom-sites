#!/usr/bin/env node
// Checks the review page in a headless browser (Remotion's own Chrome, driven
// over the DevTools protocol): it loads, shows no error, mounts the player and
// draws the film at the frame asked for (the s05 press by default: the scene
// picture and the one pointer). Saves out/review-check.png.
//   node verify/review-check.mjs [http://127.0.0.1:5191/?f=1081]
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = process.argv[2] ?? "http://127.0.0.1:5191/?f=1081";
const find = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const hit = find(p);
      if (hit) return hit;
    } else if (e.name === "chrome-headless-shell") return p;
  }
  return null;
};
const chrome = find(path.join(ROOT, "node_modules", ".remotion"));
if (!chrome) throw new Error("no headless Chrome in node_modules/.remotion (run a still first)");
const port = 9334;
const proc = spawn(chrome, ["--headless", "--disable-gpu", `--remote-debugging-port=${port}`, "--window-size=1280,1000", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
  } catch {}
}
if (!target) {
  proc.kill();
  throw new Error("headless Chrome did not start");
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener("message", (m) => {
  const msg = JSON.parse(m.data);
  if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text);
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") errors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) => new Promise((r) => {
  const n = ++id;
  pending.set(n, r);
  ws.send(JSON.stringify({ id: n, method, params }));
});
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url });
let state;
for (let i = 0; i < 40; i++) {
  await sleep(250);
  state = await evaluate(`({ err: document.getElementById("err")?.textContent ?? "", time: document.getElementById("time")?.textContent ?? "", scenes: document.querySelectorAll("#scenes button").length, root: document.querySelectorAll("#player [data-film-root]").length, pointers: document.querySelectorAll("#player [data-pointer]").length, imgs: [...document.querySelectorAll("#player img")].filter((i) => i.complete && i.naturalWidth > 0).length + [...document.querySelectorAll("#player video")].filter((v) => v.readyState >= 2).length, videoAt: [...document.querySelectorAll("#player video")].map((v) => +v.currentTime.toFixed(3)) })`);
  if (state?.err || (state?.time && state.root > 0 && state.imgs > 0)) break;
}
await sleep(800);
const shot = await send("Page.captureScreenshot", { format: "png" });
fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "out", "review-check.png"), Buffer.from(shot.result.data, "base64"));
ws.close();
proc.kill();
console.log(JSON.stringify({ ...state, errors }));
const expectPointer = /[?&]f=1081\b/.test(url);
if (!state || state.err || !state.time || state.scenes !== 10 || state.root !== 1 || state.imgs < 1 || (expectPointer && state.pointers !== 1) || state.pointers > 1) {
  console.error("review-check FAILED");
  process.exit(1);
}
console.log("review-check ok: out/review-check.png");
