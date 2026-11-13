// Prints the film's length and when each moment that should sit on the music happens.
import { DURATION_FRAMES, HOLD_SECONDS, STEPS, moments } from "../src/scene";
console.log(`${STEPS} steps, ${DURATION_FRAMES} frames, ${(DURATION_FRAMES / 30).toFixed(2)} s; the words stand ${HOLD_SECONDS.toFixed(2)} s`);
for (const m of moments()) {
  const beat = Math.round(m.seconds * 2) / 2;
  console.log(`${m.seconds.toFixed(3).padStart(7)} s  step ${String(m.step).padStart(3)}  ${m.what.padEnd(30)} nearest beat ${beat.toFixed(1)} s, off by ${Math.round((m.seconds - beat) * 1000)} ms${beat % 2 === 0 ? " (bar line)" : ""}`);
}
