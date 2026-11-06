// Scene s03 (version 2): The turn. "What if AI did the busywork, and your
// people did the thinking?"
//
// Half a second of empty ground (the silent beat), then a big serif statement,
// centred like the reference's title cards. Each word arrives on the narrator's
// word: "What if AI did the busywork," alone in the middle first, then it eases
// up to make room for "and your people did the thinking?". It holds still,
// and leaves in the last 8 frames.
//
// Local, 0-based frames. Sounds: video/timeline/cues-v2/s03.json.

import { AbsoluteFill, useCurrentFrame } from "remotion";

import { sceneT, t01, wordAt } from "../kit.tsx";
import { T } from "../ui.tsx";

const ID = "s03";
const LEN = sceneT(ID).length; // 150

const LINE1 = ["What", "if", "AI", "did", "the", "busywork,"];
const LINE2 = ["and", "your", "people", "did", "the", "thinking?"];

// the narrator's start frame for each word ("did" and "the" come twice)
const AT1 = LINE1.map((w) => wordAt(ID, w, 0));
const AT2 = LINE2.map((w) => wordAt(ID, w, w === "did" || w === "the" ? 1 : 0));

const SIZE = 88;
const PITCH = Math.round(SIZE * 1.2); // line to line
const MAKE_ROOM = AT2[0] - 6; // line 1 eases up as line 2 begins
const OUT = LEN - 8;

function Word({ text, at, f, last }: { text: string; at: number; f: number; last: boolean }) {
  // arrives a touch before it is heard, rising softly
  const k = t01(f, at - 3, at + 7);
  return (
    <span style={{ display: "inline-block", opacity: k, transform: `translateY(${(1 - k) * 18}px)`, marginRight: last ? 0 : "0.24em" }}>{text}</span>
  );
}

function Line({ words, at, f, y }: { words: string[]; at: number[]; f: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 540 + y - PITCH / 2,
        height: PITCH,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {words.map((w, i) => (
        <Word key={i} text={w} at={at[i]} f={f} last={i === words.length - 1} />
      ))}
    </div>
  );
}

export function S03() {
  const f = useCurrentFrame();
  if (f < AT1[0] - 3) return null; // the silent beat: nothing moves
  const room = t01(f, MAKE_ROOM, MAKE_ROOM + 16);
  const out = t01(f, OUT, OUT + 8);
  return (
    <AbsoluteFill
      style={{
        fontFamily: T.serif,
        fontSize: SIZE,
        fontWeight: 400,
        letterSpacing: -1.2,
        color: T.ink,
        opacity: 1 - out,
        transform: `translateY(${-out * 10}px)`,
      }}
    >
      <Line words={LINE1} at={AT1} f={f} y={-PITCH / 2 + (1 - room) * (PITCH / 2)} />
      <Line words={LINE2} at={AT2} f={f} y={PITCH / 2} />
    </AbsoluteFill>
  );
}
