// The exposure sheet for the AI productivity film: the hand-edited source of
// every frame. `node timeline/build.mjs` turns it into ../timeline.json and
// refuses to write when a rule breaks (see build.mjs).
//
// Frame convention (SCRIPT.md, "Technical notes"):
//   - Film frames are Remotion's 0-based frames at 30 fps. Beat n sounds at
//     film frame 15n + 1 (120 bpm).
//   - Every scene starts on a beat frame. Scene starts are not written here:
//     they follow from the lengths (`beats`), so a retime is a length change.
//   - Inside a scene everything is in LOCAL beats j (0-based); local beat j is
//     local frame 15j + 1, and local frame L is film frame start + L - 1.
//     Film frame 0 holds scene 1's local frame 1.
//   - Voice lines are given in local frames (`at`, always a local beat frame
//     15j + 1) and `seconds` = the measured speech length (file start to the
//     end of the last word, rounded up to a frame). `fileSeconds` is the whole
//     file (it carries about 0.3 s of silent tail), `speechOn` the silent lead.
//     Real voice since phase 1 (Matilda, audio/voice/AUDITION.md): estimate false.
//
// Cue tuple: [sound, j, x, options]. j is the local beat (the sound starts on
// that beat frame); x is the world x of the action (-8 … 8) and sets the pan;
// options: { gain (dB), primary (default true), run: { count, every } } for a
// texture run such as a dotted line's ticks (it starts on its beat, one tick
// every `every` frames, and is not a primary hit).
//
// Label: { text, words, in: j, out: j, x, y, kind }. `in` is the beat the
// label's object lands (readable from that frame); `out` is the beat it starts
// to leave. Hold must be at least 0.45 s per word + 1 s. kind "counter" is the
// inbox badge's digits: each value is held one beat and only the last one is
// held to the reading rule.
//
// Path: { name, j, p0, c, p1, every }. A dotted connector (kit.dotted, quadratic
// curve p0 -> c -> p1 on the table, dot spacing 0.24). Its dots pop in one after
// another from beat j, one dot every `every` frames (0.5 = two dots a frame).
// build.mjs counts the dots exactly as kit.dotted() does and adds the quiet tick
// run (texture, not a primary hit) to the cues.
//
// Press: { name, j, target, world: [x, y, z] }. `world` is the press point on
// the button's top surface (button centre + 0.36 × width in x, − 0.08 in y),
// used until Blender writes timeline/targets/sNN.json with the measured pixel.

export const FPS = 30;
export const BPM = 120;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const MAX_SECONDS = 90;
export const TILT_DEG = 10; // kit.setup() camera tilt; used only for the first-estimate pixel of a press

// The silence: one full beat with no voice, no music and no sound.
export const SILENCE = { scene: "s02", j: 15 };

// Default level of each sound, in dB, before the mix (the sound agent may
// rebalance in the mix; these keep every effect quiet under the voice).
export const SOUND_GAIN = {
  pop: -20, paper: -20, sticky: -22, tick: -26, whoosh: -22, shutter: -18, cloud: -22,
  row: -20, grow: -22, drawer: -15, bubble: -20, roll: -22, type: -20, click: -16, send: -18,
};

// The ten locked lines (PLAN.md "Script"). build.mjs refuses to write if any
// differs from SCRIPT.md's voice table by one character.
export const VOICE = [
  "A school has a thousand moving parts. Most of them still run on paper.",
  "Most teams have more work than they can handle. And they only know AI as a sloppy, jargon-filled email drafter.",
  "What if AI did the busywork, and your people did the thinking?",
  "Give Claude your handbook, your policies, your voice, once. Then share it with your whole team.",
  "Scan a stack of paper forms, and get clean records instead of retyping.",
  "Build a survey, read every answer, and see what to fix next.",
  "Sort the inbox. Answer questions where your team already talks.",
  "Send an agent out to do the legwork, and bring back what you need.",
  "Your people bring the idea. AI does the work in between. Your people check it before anything goes out.",
  "Let's help you save time, money and stress by letting AI do the heavy lifting.",
];

// The avatar chip that carries through scenes 4 to 9 (kit.avatar("mr", "MR", "a2", size=0.85)).
const MR = { name: "mr", kit: 'avatar("mr", "MR", "a2", size=0.85)', scale: 1, rot: 0 };

export const SCENES = [
  {
    id: "s01", name: "Paper", beats: 16,
    voice: { line: 1, at: 31, seconds: 4.7, fileSeconds: 5.062, speechOn: 0.04, file: "audio/voice/lines/line01.wav", timestamps: "audio/voice/lines/line01.json", estimate: false },
    events: {
      stackA: 1, stackB: 2, stickyA: 3, stackC: 4, stackD: 5, stickyB: 6, stackE: 7, stickyD: 8,
      inbox: 9, count3: 10, count12: 11, count27: 12, count48: 13, count99: 14, stickyE: 15,
    },
    cues: [
      ["paper", 1, -6.1], ["paper", 2, -3.6], ["sticky", 3, -5.8], ["paper", 4, -1.2],
      ["paper", 5, -5.4], ["sticky", 6, -3.3], ["paper", 7, -2.6], ["sticky", 8, -5.0],
      ["pop", 9, 5.4], ["tick", 10, 5.9], ["tick", 11, 5.9], ["tick", 12, 5.9], ["tick", 13, 5.9],
      ["tick", 14, 5.9], ["sticky", 15, -2.3],
    ],
    labels: [
      { text: "3", words: 1, in: 10, out: 11, x: 5.95, y: 2.85, kind: "counter" },
      { text: "12", words: 1, in: 11, out: 12, x: 5.95, y: 2.85, kind: "counter" },
      { text: "27", words: 1, in: 12, out: 13, x: 5.95, y: 2.85, kind: "counter" },
      { text: "48", words: 1, in: 13, out: 14, x: 5.95, y: 2.85, kind: "counter" },
      // "99+" stays on through scene 2 until the sweep in scene 3 (out is in s03).
      { text: "99+", words: 1, in: 14, out: { scene: "s03", j: 0 }, x: 5.95, y: 2.85, kind: "counter" },
    ],
    presses: [],
    handoffIn: [],
    handoffOut: "all of scene 1 stays where it is into scene 2 (see SCRIPT.md handoff table)",
  },
  {
    id: "s02", name: "Overload", beats: 16,
    voice: { line: 2, at: 1, seconds: 7.0, fileSeconds: 7.338, speechOn: 0.03, file: "audio/voice/lines/line02.wav", timestamps: "audio/voice/lines/line02.json", estimate: false },
    events: {
      todoHeader: 1, todoRow1: 2, todoRow2: 3, todoRow3: 4, todoSurge: 5, email: 7, chip1: 8, chip2: 9,
      chip3: 10, filler: 11, chip4: 12, swell: 13, hold: 14, silence: 15,
    },
    cues: [
      ["pop", 1, 1.4], ["pop", 2, 1.4], ["pop", 3, 1.4], ["pop", 4, 1.4], ["grow", 5, 1.4], ["pop", 7, 5.2], ["pop", 8, 4.3], ["pop", 9, 5.6],
      ["pop", 10, 6.1], ["grow", 11, 5.2], ["pop", 12, 4.6], ["pop", 13, 5.2],
    ],
    labels: [],
    presses: [],
    handoffOut: "everything on screen goes into scene 3 unchanged",
  },
  {
    id: "s03", name: "Sweep", beats: 8,
    voice: { line: 3, at: 1, seconds: 3.533, fileSeconds: 3.855, speechOn: 0.08, file: "audio/voice/lines/line03.wav", timestamps: "audio/voice/lines/line03.json", estimate: false },
    events: { sweep: 0, folder: 1, close: 2 },
    cues: [["paper", 0, 0], ["pop", 1, 0], ["pop", 2, 0]],
    labels: [],
    presses: [],
    handoffOut: "folder at (0, 0.2, 0), scale 1.2, rot 0",
  },
  {
    id: "s04", name: "Project", beats: 18,
    voice: { line: 4, at: 16, seconds: 6.267, fileSeconds: 6.548, speechOn: 0.03, file: "audio/voice/lines/line04.wav", timestamps: "audio/voice/lines/line04.json", estimate: false },
    events: {
      mr: 1, project: 2, handbook: 3, policies: 5, styleGuide: 6, jl: 10, ak: 11, exit: 15,
      mrMove: 16, mrLand: 17,
    },
    cues: [
      ["pop", 1, -1.2], ["pop", 2, 0], ["pop", 3, 0], ["pop", 5, 0], ["pop", 6, 0],
      ["pop", 10, 0], ["pop", 11, 1.2], ["pop", 17, 3.6, { gain: -26 }],
    ],
    labels: [
      { text: "Handbook", words: 1, in: 3, out: 15, x: -1.75, y: 1.6 },
      { text: "Policies", words: 1, in: 5, out: 15, x: -1.75, y: 0.35 },
      { text: "Style guide", words: 2, in: 6, out: 15, x: -1.75, y: -0.9 },
      { text: "MR", words: 1, in: 1, out: { scene: "s10", j: 1 }, x: -1.2, y: -2.75, kind: "initials" },
      { text: "JL", words: 1, in: 10, out: 15, x: 0, y: -2.75, kind: "initials" },
      { text: "AK", words: 1, in: 11, out: 15, x: 1.2, y: -2.75, kind: "initials" },
    ],
    presses: [],
    handoffOut: { ...MR, x: 3.6, y: -2.65, z: 0 },
  },
  {
    id: "s05", name: "Photo", beats: 18,
    voice: { line: 5, at: 31, seconds: 4.333, fileSeconds: 4.69, speechOn: 0.03, file: "audio/voice/lines/line05.wav", timestamps: "audio/voice/lines/line05.json", estimate: false },
    events: {
      paperIn: 1, cloudTable: 2, phone: 3, shutter: 4, pathA: 5, cloudIn: 6, pathB: 7,
      row0: 8, row1: 9, row2: 10, row3: 11, approve: 12, press: 14, exit: 17,
    },
    cues: [
      ["pop", 1, -5.3], ["pop", 2, 2.8], ["whoosh", 3, -4.05], ["shutter", 4, -4.05],
      ["whoosh", 5, -2.6], ["cloud", 6, 0.1], ["whoosh", 7, 2.4],
      ["row", 8, 5.4], ["row", 9, 5.4], ["row", 10, 5.4], ["row", 11, 5.4], ["pop", 12, 5.9],
      ["click", 14, 5.9],
    ],
    paths: [
      { name: "pathA", j: 5, p0: [-3.5, 1.25], c: [-2.85, 2.55], p1: [-1.75, 1.75], every: 1 },
      { name: "pathB", j: 7, p0: [1.5, 0.8], c: [2.3, -0.05], p1: [3.25, 0.45], every: 1 },
    ],
    labels: [{ text: "Approve", words: 1, in: 12, out: 17, x: 5.9, y: -2.65 }],
    presses: [{ name: "approve", j: 14, target: "approve", world: [5.9 + 0.36 * 2.3, -2.65 - 0.08, 0.12] }],
    cursor: { enter: 12, exit: 17 },
    handoffIn: { ...MR, x: 3.6, y: -2.65, z: 0 },
    handoffOut: { ...MR, x: 3.6, y: -2.65, z: 0 },
  },
  {
    id: "s06", name: "Survey", beats: 16,
    voice: { line: 6, at: 16, seconds: 3.967, fileSeconds: 4.319, speechOn: 0.03, file: "audio/voice/lines/line06.wav", timestamps: "audio/voice/lines/line06.json", estimate: false },
    events: { stack: 1, fan0: 2, fan1: 3, fan3: 4, fan4: 5, chart: 6, bars: 7, improve: 8, exit: 15 },
    cues: [
      ["pop", 1, -4.4], ["row", 2, -6.0], ["row", 3, -5.2], ["row", 4, -3.6], ["row", 5, -2.8],
      ["pop", 6, 3.4], ["grow", 7, 3.4], ["pop", 8, -0.2],
    ],
    labels: [{ text: "3 things to improve", words: 4, in: 8, out: 15, x: -0.2, y: -2.33 }],
    presses: [],
    handoffIn: { ...MR, x: 3.6, y: -2.65, z: 0 },
    handoffOut: { ...MR, x: 3.6, y: -2.65, z: 0 },
  },
  {
    id: "s07", name: "Inbox", beats: 14,
    voice: { line: 7, at: 46, seconds: 3.8, fileSeconds: 4.133, speechOn: 0.0, file: "audio/voice/lines/line07.wav", timestamps: "audio/voice/lines/line07.json", estimate: false },
    events: {
      trayDrawers: 1, email1: 2, land1: 3, email2: 4, land2: 5, email3: 6, land3: 7,
      channel: 8, answer: 9, exit: 13,
    },
    cues: [
      ["pop", 1, -4.0],
      ["whoosh", 2, -4.3], ["drawer", 3, -2.0],
      ["whoosh", 4, -4.3], ["drawer", 5, -2.0],
      ["whoosh", 6, -4.3], ["drawer", 7, -2.0],
      ["pop", 8, 4.6], ["bubble", 9, 5.2],
    ],
    paths: [
      { name: "path1", j: 2, p0: [-5.3, 1.55], c: [-4.4, 2.9], p1: [-3.3, 2.4], every: 1 },
      { name: "path2", j: 4, p0: [-5.25, 1.1], c: [-4.3, 1.45], p1: [-3.3, 1.0], every: 1 },
      { name: "path3", j: 6, p0: [-5.3, 0.65], c: [-4.4, -0.6], p1: [-3.3, -0.4], every: 1 },
    ],
    labels: [
      { text: "Admissions", words: 1, in: 1, out: 13, x: -2.0, y: 2.58 },
      { text: "Finance", words: 1, in: 1, out: 13, x: -2.0, y: 1.18 },
      { text: "Events", words: 1, in: 1, out: 13, x: -2.0, y: -0.22 },
      { text: "JL", words: 1, in: 8, out: 13, x: 2.95, y: 1.45, kind: "initials" },
    ],
    presses: [],
    handoffIn: { ...MR, x: 3.6, y: -2.65, z: 0 },
    handoffOut: { ...MR, x: 3.6, y: -2.65, z: 0 },
  },
  {
    id: "s08", name: "Agent", beats: 14,
    voice: { line: 8, at: 16, seconds: 3.533, fileSeconds: 3.901, speechOn: 0.01, file: "audio/voice/lines/line08.wav", timestamps: "audio/voice/lines/line08.json", estimate: false },
    events: { token: 1, out: 2, back: 5, home: 7, card1: 8, card2: 9, card3: 10, exit: 12, mrMove: 12, mrLand: 13 },
    cues: [
      ["pop", 1, -0.6], ["roll", 2, -4.5], ["roll", 5, -4.5], ["pop", 7, -0.6],
      ["pop", 8, -4.2], ["pop", 9, -0.4], ["pop", 10, 3.4], ["pop", 13, -5.0, { gain: -26 }],
    ],
    paths: [
      { name: "pathOut", j: 2, p0: [-1.35, -0.95], c: [-4.8, -2.9], p1: [-9.2, -1.6], every: 0.5 },
      { name: "pathBack", j: 5, p0: [-9.2, 0.6], c: [-5.0, 0.9], p1: [-1.45, -0.25], every: 0.5 },
    ],
    labels: [],
    presses: [],
    handoffIn: { ...MR, x: 3.6, y: -2.65, z: 0 },
    handoffOut: { ...MR, x: -5.0, y: -2.45, z: 0 },
  },
  {
    id: "s09", name: "Idea to send", beats: 18,
    voice: { line: 9, at: 31, seconds: 6.133, fileSeconds: 6.502, speechOn: 0.06, file: "audio/voice/lines/line09.wav", timestamps: "audio/voice/lines/line09.json", estimate: false },
    events: {
      blocks: 1, type: 2, idea: 3, pathL: 4, work: 5, pathR: 7, draft: 8, buttons: 9,
      approve: 11, send: 13, sendOff: 14, exit: 17,
    },
    cues: [
      ["pop", 1, 0], ["type", 2, -5.0], ["pop", 3, -5.0],
      ["whoosh", 4, -2.2],
      // the middle block working: a soft run of ticks (texture), 10 ticks, one every 3 frames
      ["tick", 5, 0, { primary: false, gain: -32, run: { count: 10, every: 3 } }],
      ["whoosh", 7, 2.2], ["pop", 8, 5.0], ["pop", 9, 5.0], ["click", 11, 4.1], ["click", 13, 5.95],
      ["send", 14, 6.5],
    ],
    paths: [
      { name: "pathL", j: 4, p0: [-3.05, 0.1], c: [-2.35, -0.8], p1: [-1.65, 0.1], every: 1 },
      { name: "pathR", j: 7, p0: [1.65, 0.1], c: [2.35, -0.8], p1: [3.05, 0.1], every: 1 },
    ],
    labels: [
      { text: "Approve", words: 1, in: 9, out: 17, x: 4.1, y: -0.1 },
      { text: "Send", words: 1, in: 9, out: 17, x: 5.95, y: -0.1 },
    ],
    presses: [
      { name: "approve", j: 11, target: "approve", world: [4.1 + 0.36 * 1.6, -0.1 - 0.08, 0.08 + 0.12] },
      { name: "send", j: 13, target: "send", world: [5.95 + 0.36 * 1.4, -0.1 - 0.08, 0.08 + 0.12] },
    ],
    cursor: { enter: 9, exit: 17 },
    handoffIn: { ...MR, x: -5.0, y: -2.45, z: 0 },
    handoffOut: { ...MR, x: -5.0, y: -2.45, z: 0 },
  },
  {
    id: "s10", name: "End card", beats: 18,
    voice: { line: 10, at: 16, seconds: 5.133, fileSeconds: 5.48, speechOn: 0.03, file: "audio/voice/lines/line10.wav", timestamps: "audio/voice/lines/line10.json", estimate: false },
    events: { clear: 1, mark: 2, address: 3, button: 4, cursorIn: 10, press: 13, toWhite: 14, whiteFull: 16, end: 17 },
    cues: [["pop", 2, 0], ["pop", 3, 0], ["pop", 4, 0], ["click", 13, 0.6]],
    labels: [
      { text: "kingdom-sites.com", words: 1, in: 3, out: 14, x: 0, y: -0.75 },
      { text: "Book a call", words: 3, in: 4, out: 14, x: 0, y: -2.2 },
    ],
    presses: [{ name: "bookACall", j: 13, target: "book", world: [0 + 0.36 * 3.2, -2.2 - 0.08, 0.12] }],
    cursor: { enter: 10, exit: 14 },
    // fade: white from j14 to j16, then white to black from j16 to the last frame
    fade: { whiteFrom: 14, whiteFull: 16, blackFull: "end" },
    handoffIn: { ...MR, x: -5.0, y: -2.45, z: 0 },
    handoffOut: [],
  },
];

// Music shape (for the sound agent): one light, warm, building instrumental.
// Each entry is a span in scene/beat terms; build.mjs converts to film frames.
export const MUSIC = [
  { from: ["s01", 0], to: ["s02", 14], what: "soft start: one plucked/keys layer, light pulse; builds a little under scene 2" },
  { from: ["s02", 15], to: ["s02", 15], what: "silence: music and every sound stop for this one beat" },
  { from: ["s03", 0], to: ["s03", 7], what: "the turn: music returns brighter on the sweep (s03 beat 1)" },
  { from: ["s04", 0], to: ["s09", 17], what: "builds a layer at each feature scene (s04, s05, s06, s07, s08, s09); never detuned or 'bad'" },
  { from: ["s10", 0], to: ["s10", 13], what: "settles under the end card" },
  { from: ["s10", 14], to: ["s10", 17], what: "final chord lands on s10 beat 14 and rings into the fade to white and black" },
];
