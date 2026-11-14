// Check stills at half size: `node tools/stills.mjs 30,96,150` writes ../draft/still-f0030.png and so on.
import { execFileSync } from "node:child_process";
const frames = (process.argv[2] ?? "30").split(",").map(Number);
for (const f of frames) {
  const name = `../draft/still-f${String(f).padStart(4, "0")}.png`;
  execFileSync("npx", ["remotion", "still", "CafeApp", name, `--frame=${f}`, "--scale=0.5", "--log=error", "--props={\"audio\":false}"], { stdio: "inherit" });
}
