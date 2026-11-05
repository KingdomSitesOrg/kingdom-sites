# AI productivity film: the script (the contract)

Written in phase 0 (2026-11-05) from PLAN.md. Every agent builds to this file. Words are locked;
frames come from `video/timeline/sheet.mjs` → `video/timeline.json` (`node video/timeline/build.mjs`).
The tables between `<!-- timeline:… -->` markers are written by that build: do not hand-edit them,
edit the sheet and rebuild. Everything else here is hand-written and is the brief for each lane.

- 1920×1080, 30 fps, 120 bpm (one beat = 15 frames). Beat n sounds at film frame 15n + 1.
- **Length: 2,341 frames = 78.0 s** (retimed to the real voice in phase 1; target 75 s, cap 90 s).
  The build refuses anything over 90 s.
- Palette Berry only (kit.py default). Soft 2.5D clay-toy objects from `blender/kit.py` only. No
  figures, no real logos (our own Kingdom Sites mark is allowed, see scene 10), no copied app
  screens, no italics, never a scanner.

## Voice (locked)

No agent changes these words. The build compares the sheet's lines with this table character by
character and refuses to write if they differ.

| # | Scene | Line |
|---|---|---|
| 1 | s01 | A school has a thousand moving parts. Most of them still run on paper. |
| 2 | s02 | Most teams have more work than they can handle. And they only know AI as a sloppy, jargon-filled email drafter. |
| 3 | s03 | What if AI did the busywork, and your people did the thinking? |
| 4 | s04 | Give Claude your handbook, your policies, your voice, once. Then share it with your whole team. |
| 5 | s05 | Scan a stack of paper forms, and get clean records instead of retyping. |
| 6 | s06 | Build a survey, read every answer, and see what to fix next. |
| 7 | s07 | Sort the inbox. Answer questions where your team already talks. |
| 8 | s08 | Send an agent out to do the legwork, and bring back what you need. |
| 9 | s09 | Your people bring the idea. AI does the work in between. Your people check it before anything goes out. |
| 10 | s10 | Let's help you save time, money and stress by letting AI do the heavy lifting. |

Voice: **Matilda** (ElevenLabs premade `XrExE9yKIg1WjnnlVkGX`, `eleven_multilingual_v2`, stability
0.55, similarity 0.75, style 0, speaker boost, speed 0.88, seed 4711; lines 7 and 8 seed 4712), chosen
in phase 1 (`audio/voice/AUDITION.md`). One file per line in `audio/voice/lines/`: `lineNN.mp3` as
generated, `lineNN.wav` (48 kHz mono, 8 ms fade in, 30 ms fade out: the file the mix uses) and
`lineNN.json` (character timestamps). `tts.py` regenerates any line with the same settings; earlier
takes are kept in `lines/takes/`.

Voice timing in film frames, real voice. Every line starts on a beat frame (local 15j + 1). "Film
end" is the end of the last word; each file then carries about 0.3 s of silent tail (`fileEnd` in
`timeline.json`). Air between lines is at least 0.3 s everywhere. It is 1.0 s around the silence
(lines 2 → 3 → 4) and 2.2 to 5.0 s at the other scene changes, where the beat sheet's actions run
on after the line (counter climb, rows and Approve, the label's reading hold, the agent's cards, the
send-off): the picture is longer than the voice there, and no action was cut to close the gap.

<!-- timeline:voice -->
| Line | Scene | Local start | Film start | Film end | Seconds | Source |
|---|---|---|---|---|---|---|
| 1 | s01 | 31 | 31 | 171 | 4.7 | real voice |
| 2 | s02 | 1 | 241 | 450 | 7 | real voice |
| 3 | s03 | 1 | 481 | 586 | 3.533 | real voice |
| 4 | s04 | 16 | 616 | 803 | 6.267 | real voice |
| 5 | s05 | 31 | 901 | 1030 | 4.333 | real voice |
| 6 | s06 | 16 | 1156 | 1274 | 3.967 | real voice |
| 7 | s07 | 46 | 1426 | 1539 | 3.8 | real voice |
| 8 | s08 | 16 | 1606 | 1711 | 3.533 | real voice |
| 9 | s09 | 31 | 1831 | 2014 | 6.133 | real voice |
| 10 | s10 | 16 | 2086 | 2239 | 5.133 | real voice |
| silence | s02 | | 466 | 480 | 0.5 | one full beat, nothing sounds |
<!-- /timeline:voice -->

Voice sync: where the words fall (local frames of the scene). Picture beats were not moved for
the voice; the line starts were chosen so these words sit on or just after their picture.

| Line | Scene | Local start–end | Key words (local frame the word starts) |
|---|---|---|---|
| 1 | s01 | 31–171 | "thousand" 59, "paper" 157 |
| 2 | s02 | 1–210 | "handle" 61 (surge 76), "AI" 113, "sloppy" 136, "jargon-filled" 155, "drafter" 193 (swell 196) |
| 3 | s03 | 1–106 | "busywork" 35 (close 31), "thinking" 92 |
| 4 | s04 | 16–203 | "Claude" 26, "handbook" 41 (card 46), "policies" 71 (76), "voice" 104 (91), "team" 191 (AK 166) |
| 5 | s05 | 31–160 | "Scan" 31, "forms" 72 (shutter 61), "records" 112 (rows from 121), "retyping" 141 |
| 6 | s06 | 16–134 | "survey" 31, "answer" 70, "fix" 112, "next" 122 (improve 121) |
| 7 | s07 | 46–159 | "inbox" 61, "Answer" 89, "team" 124 (channel 121), "talks" 144 (answer 136) |
| 8 | s08 | 16–121 | "agent" 32 (rolls out 33), "legwork" 59, "back" 95 (rolls back 78–100), "need" 112 |
| 9 | s09 | 31–214 | "idea" 59, "AI" 83, "work" 107, "check" 164 (Approve 166), "out" 206 (send-off 211) |
| 10 | s10 | 16–169 | "time" 48, "money" 67, "stress" 86, "AI" 121, "lifting" 155 (cursor in 151, press 196) |

## Scenes

<!-- timeline:scenes -->
| Scene | Name | Film start | Length (f) | Film end | Start (s) | Beats |
|---|---|---|---|---|---|---|
| s01 | Paper | 1 | 240 | 240 | 0.03 | 16 |
| s02 | Overload | 241 | 240 | 480 | 8.03 | 16 |
| s03 | Sweep | 481 | 120 | 600 | 16.03 | 8 |
| s04 | Project | 601 | 270 | 870 | 20.03 | 18 |
| s05 | Photo | 871 | 270 | 1140 | 29.03 | 18 |
| s06 | Survey | 1141 | 240 | 1380 | 38.03 | 16 |
| s07 | Inbox | 1381 | 210 | 1590 | 46.03 | 14 |
| s08 | Agent | 1591 | 210 | 1800 | 53.03 | 14 |
| s09 | Idea to send | 1801 | 270 | 2070 | 60.03 | 18 |
| s10 | End card | 2071 | 270 | 2340 | 69.03 | 18 |
| | **Total** | | | 2340 | | 2341 frames = 78.033 s |
<!-- /timeline:scenes -->

## Word table

Every word on screen, in order. All are Blender text on an object (`kit.text()`, Archivo, never
italics), so each label's "in" is the beat its object lands and its "out" the beat its object starts
to leave. Hold rule: at least 0.45 s per word + 1 s (the build refuses less). Labels only name what
is on screen; nothing else is written anywhere. Not words: skeleton lines (`skel`/`kraft2` bars),
which stand for text nobody needs to read.

- `counter` rows are the inbox badge's digits in scene 1 (the "inbox counter climbs" of the script):
  each value holds one beat; only the last ("99+") is held to the reading rule. They are a UI count,
  not a claim.
- `initials` rows are avatar chips (people are avatar chips and the cursor only). MR carries scenes
  4 to 9.

<!-- timeline:words -->
| # | Scene | On screen | Kind | Words | In (film) | Out (film) | Local in–out | Held | Needs |
|---|---|---|---|---|---|---|---|---|---|
| 1 | s01 | 3 | counter | 1 | 151 | 166 | 151–166 | 0.50 s | 1.47 s |
| 2 | s01 | 12 | counter | 1 | 166 | 181 | 166–181 | 0.50 s | 1.47 s |
| 3 | s01 | 27 | counter | 1 | 181 | 196 | 181–196 | 0.50 s | 1.47 s |
| 4 | s01 | 48 | counter | 1 | 196 | 211 | 196–211 | 0.50 s | 1.47 s |
| 5 | s01 | 99+ | counter | 1 | 211 | 481 | 211–481 | 9.00 s | 1.47 s |
| 6 | s04 | Handbook | label | 1 | 646 | 826 | 46–226 | 6.00 s | 1.47 s |
| 7 | s04 | Policies | label | 1 | 676 | 826 | 76–226 | 5.00 s | 1.47 s |
| 8 | s04 | Style guide | label | 2 | 691 | 826 | 91–226 | 4.50 s | 1.90 s |
| 9 | s04 | MR | initials | 1 | 616 | 2086 | 16–1486 | 49.00 s | 1.47 s |
| 10 | s04 | JL | initials | 1 | 751 | 826 | 151–226 | 2.50 s | 1.47 s |
| 11 | s04 | AK | initials | 1 | 766 | 826 | 166–226 | 2.00 s | 1.47 s |
| 12 | s05 | Approve | label | 1 | 1051 | 1126 | 181–256 | 2.50 s | 1.47 s |
| 13 | s06 | 3 things to improve | label | 4 | 1261 | 1366 | 121–226 | 3.50 s | 2.80 s |
| 14 | s07 | Admissions | label | 1 | 1396 | 1576 | 16–196 | 6.00 s | 1.47 s |
| 15 | s07 | Finance | label | 1 | 1396 | 1576 | 16–196 | 6.00 s | 1.47 s |
| 16 | s07 | Events | label | 1 | 1396 | 1576 | 16–196 | 6.00 s | 1.47 s |
| 17 | s07 | JL | initials | 1 | 1501 | 1576 | 121–196 | 2.50 s | 1.47 s |
| 18 | s09 | Approve | label | 1 | 1936 | 2056 | 136–256 | 4.00 s | 1.47 s |
| 19 | s09 | Send | label | 1 | 1936 | 2056 | 136–256 | 4.00 s | 1.47 s |
| 20 | s10 | kingdom-sites.com | label | 1 | 2116 | 2281 | 46–211 | 5.50 s | 1.47 s |
| 21 | s10 | Book a call | label | 3 | 2131 | 2281 | 61–211 | 5.00 s | 2.37 s |
<!-- /timeline:words -->

## Conventions every scene uses

**Frames.** Film frames are Remotion's 0-based frames. Every scene starts on a beat frame (15k + 1).
Blender renders each scene in local frames 1 … length: local frame L is film frame start + L − 1, so
local beat j is local frame 15j + 1 (j = 0, 1, 2 …: local frames 1, 16, 31, 46, 61, 76, 91, 106,
121, 136, 151, 166, 181, 196, 211, 226, 241, 256). Film frame 0 holds scene 1's local frame 1. Scene
scripts read their length, `beatsLocal` (event name → local frame), `paths` and `presses` from
`video/timeline.json` (`scenes[i]`), never hard-coded, so a retime is a re-render, not a rewrite.
The event names in the beat sheets below are the keys of `beatsLocal`.

**Space.** The frame is 16 × 9 units: x from −8 to 8, y from −4.5 to 4.5 (`kit.setup()`:
orthographic, 16 units across, 10° tilt). Title-safe: |x| ≤ 7.2, |y| ≤ 4.05. Objects that enter or
leave start or end past x = ±9. z is up; objects sit on z = 0 unless a z is given.

**Motion.** Anticipation, about 1% overshoot, then stillness. Smooth, not on twos.
- *Lands on beat F* means the object is fully down at local frame F: call `kit.pop(ob, F − 7)`
  (pop starts at F − 8, lands F, settles F + 7). Reset a pre-hidden object's scale to 1 before
  `pop()`.
- *Moves to P, landing F* means `kit.move(ob, F − d, F, P)` with d = 10 to 15 frames, plus a 1%
  overshoot key at F − 2 where it reads.
- *Exits on F* means `kit.pop_out(ob, F)` (new, see Kit): scale 1 → 1.04 at F + 2 → 0 at F + 8, no
  drop. Exits are silent unless a cue says otherwise.
- *Press on F*: the button's group dips z 0 → −0.06 exactly on F and is back by F + 6; it starts
  down at F − 2. Remotion's cursor is fully pressed on F.
- A dotted line (`kit.dotted`) draws dot by dot from its beat: dot i lands at start + floor(i ×
  every) (`kit.pop(dot, land − 7, drop=0.12)`), just ahead of whatever rides it. The rider follows
  `kit.bez()` along the same three points, two frames behind the dot it is over, lifted
  z = base + 0.35·sin(πt). Dots stay until the scene's exit beat.
- Blender scenes never contain a cursor. A scene with a press writes its press pixel (see Technical
  notes) and the button dips on exactly that frame.

**One idea at a time.** The avatar chip MR starts and ends every feature beat (scenes 4 to 9). The
dotted line appears only when something passes between two objects. People are avatar chips and the
cursor only.

## Beat sheets

Local frames in brackets. "Lands" = fully down on that frame. Kit calls use kit.py's signatures;
names marked **new** are added by the kit agent (see Kit objects).

### s01 · Paper · 16 beats (240 f)

"A school has a thousand moving parts. Most of them still run on paper." Kraft paper chaos fills the
left two thirds; the right is kept clear for scene 2. Colour is only on sticky notes and the inbox.

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | Empty ground (film frame 0 holds this). |
| j1 [16] | stackA | `stack("stackA", (-6.1, 2.2), 6, n=4, seed=11)` lands. |
| j2 [31] | stackB | `stack("stackB", (-3.6, 2.6), -5, n=5, seed=12)` lands. |
| j3 [46] | stickyA | `sticky("stickyA", (-5.75, 1.75, 0.2), -8, color="a2")` lands on stack A. |
| j4 [61] | stackC | `stack("stackC", (-1.2, 2.0), 4, n=3, seed=13)` lands. |
| j5 [76] | stackD | `stack("stackD", (-5.4, -1.6), -3, n=4, seed=14)` lands. |
| j6 [91] | stickyB | `sticky("stickyB", (-3.25, 3.05, 0.24), 7, color="a3")` lands on stack B. |
| j7 [106] | stackE | `stack("stackE", (-2.6, -1.9), 7, n=5, seed=15)` lands. |
| j8 [121] | stickyD | `sticky("stickyD", (-5.0, -2.1, 0.2), 10, color="a1")` lands on stack D. |
| j9 [136] | inbox | `chip("inbox", "tray", "a1", "tint", 1.2, loc=(5.4, 2.4))` lands. |
| j10 [151] | count3 | **new** `counter_badge("badge", ["3","12","27","48","99+"], loc=(5.95, 2.85, 0.06))` lands showing "3". |
| j11–j14 [166, 181, 196, 211] | count12 … count99 | The badge's digits swap on each beat (old value scale → 0 over 2 frames, new value pops in), the badge bounces 1.08 → 1 over 6 frames; for "99+" the pill widens. |
| j15 [226] | stickyE | `sticky("stickyE", (-2.3, -1.45, 0.24), -6, color="a2")` lands on stack E. Hold to 240. |

Stacks are 1.7 × 2.2 sheets: z of a sticky = the stack's top (n × 0.04 + 0.035) + 0.005. Nothing
overlaps x > −0.2 except the inbox at the top right.

### s02 · Overload · 16 beats (240 f), the silence is its last beat

"Most teams have more work than they can handle. And they only know AI as a sloppy, jargon-filled
email drafter." Scene 1 stays exactly where it was. First the to-do list (one idea), then the email
draft (the next idea).

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | Scene 1's last frame, unchanged. |
| j1 [16] | todoHeader | **new** `todo_list("todo", loc=(1.4, -3.5), rows=16)`: rows are 3.0 × 0.5 paper slabs at (1.4, −3.5 + 0.62·i); row 0 is the header (`clipboard-text` chip 0.42 + skel line). Every row starts hidden. Row 0 lands. |
| j2–j4 [31, 46, 61] | todoRow1–3 | Rows 1, 2, 3 land (each: tint checkbox 0.26 at the left + one skel line, widths 1.2 to 1.9 varied). |
| j5 [76] | todoSurge | The surge: rows 4 to 15 land one every 2 frames, row 4 on 70 … row 15 on 92, so the list climbs past the top of the frame (row 13 is cut by the frame edge, rows 14 and 15 are off it). The "grow" swell sounds on 76. |
| j7 [106] | email | **new** `email_card("email", loc=(5.2, -1.2), w=3.4, h=2.6)` lands: paper card, `envelope-simple` chip (a1) top left, a short skel "to" line, three skel body lines. |
| j8 [121] | chip1 | **new** `buzz_chip` (pill 1.0 × 0.34, `sparkle` icon 0.22 + a short skel line), a3, at card-relative (−0.9, 0.65), lands on the card (child of the card group). |
| j9 [136] | chip2 | buzz chip, tint, at card-relative (0.55, 0.3). |
| j10 [151] | chip3 | buzz chip, a2, at card-relative (0.9, −0.55). |
| j11 [166] | filler | Three more skel filler lines grow in from the left inside the card (scale x 0 → 1, 3 frames apart) and the card swells to 1.06 (grow). |
| j12 [181] | chip4 | buzz chip, a1, at card-relative (−0.6, −0.85). |
| j13 [196] | swell | The card group swells 1.06 → 1.13 → 1.12 (overshoot, settle by 203). The chips crowd it. |
| j14 [211–225] | hold | Still. |
| j15 [226–240] | silence | **The silence.** Nothing moves, nothing sounds, no voice, no music: a full beat of stillness. |

The email card at 1.12 spans x 3.3 … 7.1, y −2.66 … 0.26; the to-do list spans x −0.1 … 2.9; the
inbox (x 4.8 … 6.0, y ≥ 1.85) is untouched.

### s03 · Sweep · 8 beats (120 f)

"What if AI did the busywork, and your people did the thinking?" The turn. No dotted line: this is a
sweep, not one thing passing to another.

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | sweep | Everything on screen (all stacks, stickies, inbox and badge, to-do rows, email card with its chips) lifts (z + 0.1, scale 1.03, frames 1 to 4) and then flies in an arc (lift 0.3 at mid-flight, plus 0.02 per later flyer, never above z 0.75) to the folder's mouth at (0, 1.15, 0.35), above the white inner sheet, arriving at 0.18 of its size, then over the last 3 frames of its flight sinks onto the inner sheet at (0, 1.12, 0.115), behind the front lip, shrinking to 0; nothing crosses the front panel. Start is staggered by distance from the centre (0 to 6 frames; stack A, stack D and the email card leave 2 frames earlier, so they are inside the mouth by the folder's landing on 16); each flight takes 12 frames; all are gone by 21. "paper" sounds on 1. |
| j1 [16] | folder | `folder("folder", (0, 0.2), color="a1")` at scale 1.2 lands on 16 (pops from 8), so the papers fall into it from 14 on. |
| j2 [31] | close | The folder's front gives a closing bump: `folder_front` scale y 1 → 0.94 → 1.01 → 1 over 31 to 38; the folder group dips z −0.04 on 31. "pop". |
| j3–j7 [46–120] | | Stillness. The folder holds at (0, 0.2), scale 1.2, to the last frame. |

### s04 · Project · 18 beats (270 f)

"Give Claude your handbook, your policies, your voice, once. Then share it with your whole team."

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | The folder from scene 3. |
| j1 [16] | mr | `avatar("mr", "MR", "a2", (-1.2, -2.75), size=0.85)` lands. The person starts it. |
| j2 [31] | project | The folder becomes the project: the folder group scales 1.2 → 0 over 24 to 31 while **new** `project_card("project", loc=(0, 0.45), w=7.2, h=4.4)` lands on 31. Project card: paper slab d 0.08 r 0.22; header at relative y 1.75 with `chip("folder-simple", "a1", "tint", 0.62)` at relative x −3.0 and two skel lines; three tint slot wells (d 0.01) at relative y 0.75, −0.4, −1.55. |
| j3 [46] | handbook | `card("handbook", w=6.4, h=1.0, icon_name="book-open-text", accent="a1", label="Handbook", n_lines=1)` slides in from (12.5, 1.2, 0.08) to (0, 1.2, 0.08), landing 46 (1% overshoot at 44). Start x 12.5, not 10.5: the 6.4-wide card must start with its left edge past x = +9 (picture lane B). |
| j5 [76] | policies | `card("policies", … icon_name="clipboard-text", accent="a2", label="Policies")` slides in to (0, 0.05, 0.08), landing 76. |
| j6 [91] | styleGuide | `card("style", … icon_name="pen-nib", accent="a3", label="Style guide")` slides in to (0, −1.1, 0.08), landing 91. (`pen-nib` is a new Phosphor icon; if it cannot be added, `chat-circle-dots`.) |
| j10 [151] | jl | `avatar("jl", "JL", "a1", (0, -2.75), size=0.85)` lands beside MR: the team joins. |
| j11 [166] | ak | `avatar("ak", "AK", "a3", (1.2, -2.75), size=0.85)` lands. |
| j12–j14 | | Hold. |
| j15 [226] | exit | Project card, the three cards, JL and AK exit. MR stays. |
| j16 [241] → j17 [256] | mrMove, mrLand | MR moves from (−1.2, −2.75) to (3.6, −2.65), landing 256 (soft pop). Hold to 270. |

### s05 · Photo · 18 beats (270 f) — the approved scene

"Scan a stack of paper forms, and get clean records instead of retyping." Layout and order of events
are `blender/preview.py` `style_scene(animate=True)` exactly (approved by Thomas: "this is what I
want"), retimed to the beats. No scanner. No cursor in Blender. MR is already in place.

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | MR at (3.6, −2.65) from scene 4. Everything else hidden. |
| j1 [16] | paperIn | `stack("stackA", (-6.4, 1.9), 4, n=4, seed=3)`, `sticky("sticky", (-7.0, -2.9), -9)`, `paper("form", (-4.2, -1.0, 0.0), -4, color="paper", ink="skel")` land together on 16 (one hit). |
| j2 [31] | cloudTable | `cloud("cloud", (0.1, 1.55))` and `table("table", (5.4, 0.55), rows=4, filled=4)` land together; the four `table_row{i}` start at scale 0. |
| j3 [46] | phone | `phone("phone", (-4.05, -0.75, 0.8), 6)` rises from (−4.05, −7.2, 0.8) at 30 and lands over the form at 46 ("whoosh"). |
| j4 [61] | shutter | Shutter: `phone_shutter` scale 1 @59 → 0.82 @61 → 1 @65; `phone_flash` scale 0 @60 → 1 @61 → 1 @64 → 0 @70; phone dips z 0.8 @59 → 0.72 @61 → 0.8 @66. `photo("photo", s=1.05)` grows off the phone from (−4.05, −0.4, 1.05): scale 0 @64 → 1.08 @69 → 1 @72. |
| j5 [76] | pathA | Path A `dotted("pathA", (-3.5, 1.25), (-2.85, 2.55), (-1.75, 1.75))` (10 dots) draws 76 to 85. The photo rides it: t = 0 @78, 0.2 @80, 0.42 @82, 0.64 @84, 0.84 @86, 1 @88, then into the cloud's centre (0.1, 1.55, 0.9) shrinking to 0 by 91 ("whoosh" on 76, ticks under the dots). |
| j6 [91] | cloudIn | The cloud takes it in: cloud scale 1 @88 → 1.07 @91 → 0.99 @95 → 1 @98 ("cloud"). |
| j7 [106] | pathB | Path B `dotted("pathB", (1.5, 0.8), (2.3, -0.05), (3.25, 0.45))` (9 dots) draws 106 to 114. `packet("packet")` grows at (1.5, 0.8, 0.45) 104 → 107 and rides: t = 0 @108, 0.3 @110, 0.65 @112, 1 @115, z 0.45 + 0.25·sin(πt), then shrinks into the table by 118 ("whoosh"). |
| j8–j11 [121, 136, 151, 166] | row0–row3 | Table rows 0 to 3 land one a beat (`row.scale = 1`, `pop(row, F − 7, drop=0.25)`), each with its tick icon ("row"). |
| j12 [181] | approve | `button("approve", "Approve", "a3", (5.9, -2.65), w=2.3, h=0.72)` lands ("pop"). |
| j13 [196] | | The Remotion cursor arrives beside the label (tip right of "Approve"). |
| j14 [211] | press | Press on Approve: the button dips on 211 ("click"). The table, MR and Approve hold: this is the approved still. |
| j15 [226] | | Hold. |
| j17 [256] | exit | Everything but MR exits (stack, sticky, form, phone, cloud, table, dots, Approve). MR stays at (3.6, −2.65). Hold to 270. (Phase 3 fix: was j16 [241], moved one beat later so the empty table between scenes is shorter.) |

### s06 · Survey · 16 beats (240 f)

"Build a survey, read every answer, and see what to fix next." MR stays at (3.6, −2.65) and is the
person who reads the result.

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | MR from scene 5. |
| j1 [16] | stack | Five **new** `survey_card(name, loc, rot)` (paper 1.5 × 2.0, d 0.05, r 0.12; `clipboard-text` chip a2 0.42 top left; three answer rows, each a tint radio dot 0.16 + skel line, one radio filled a1) land stacked at (−4.4, 0.85), rot 0, card i at z 0.12·i (0.06 let the chip of the card below poke through the card above; picture lane B). |
| j2–j5 [31, 46, 61, 76] | fan0, fan1, fan3, fan4 | One card fans out per beat (moves and turns over 10 frames, landing on the beat): card 0 → (−6.0, 0.55) rot 16; card 1 → (−5.2, 0.85) rot 8; card 3 → (−3.6, 0.85) rot −8; card 4 → (−2.8, 0.55) rot −16. Card 2 stays at (−4.4, 0.95), rot 0. Each keeps its z (they rest on each other like a hand of cards). "row" each. |
| j6 [91] | chart | `bars("chart", (3.4, 1.25), w=3.8, h=2.8, values=(0.55, 0.85, 0.4, 0.7))` lands with its bars at height 0 (bars grow from their bottom edge: key scale y and location y together, or set the origin at the bottom). |
| j7 [106] | bars | The bars grow, bar k full on 106 + 3k with a 1% overshoot ("grow" on 106). |
| j8 [121] | improve | `card("improve", w=4.9, h=1.2, icon_name="lightbulb", accent="a1", label="3 things to improve", n_lines=1)` lands at (−0.2, −2.55) (drop 0.5): the answer. (Phase 3 fix: was x 0.4, which sat about 24 px from MR's ring.) |
| j9–j14 | | Hold. |
| j15 [226] | exit | Everything but MR exits. Hold to 240. (Phase 3 fix: was j14 [211].) |

### s07 · Inbox · 14 beats (210 f)

"Sort the inbox. Answer questions where your team already talks." MR stays at (3.6, −2.65), under
the team channel.

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | MR from scene 6. |
| j1 [16] | trayDrawers | `chip("tray", "tray", "a1", "tint", 1.2, loc=(-6.0, 1.1))` and three drawers land together: `drawer("d1", "Admissions", "a1", (-2.0, 2.4), w=2.4)`, `drawer("d2", "Finance", "a2", (-2.0, 1.0), w=2.4)`, `drawer("d3", "Events", "a3", (-2.0, -0.4), w=2.4)`, all three with `label_color="ink"` (fix 1: white on the butter "Events" tag was 1.56:1; ink is 9.4:1 on butter, 5.45:1 on teal, 4.18:1 on raspberry). |
| j2 [31] | email1 | Path 1 `dotted("path1", (-5.3, 1.55), (-4.4, 2.9), (-3.3, 2.4))` (11 dots) draws 31 to 41. **new** `envelope("env1")` (paper 0.8 × 0.56, `envelope-simple` icon a1 0.4) grows off the tray at 29 and rides it t 0 @33 → 1 @41, then drops into drawer 1 (scale → 0, z → 0.3) by 46 ("whoosh"). |
| j3 [46] | land1 | Drawer 1 takes it: body bump scale y 1 → 0.96 → 1 over 46 to 52 ("drawer"). |
| j4 [61] / j5 [76] | email2 / land2 | Same for `env2` on path 2 `dotted("path2", (-5.25, 1.1), (-4.3, 1.45), (-3.3, 1.0))` (9 dots, 61 to 69, ride 63 → 71) into drawer 2, which bumps on 76. |
| j6 [91] / j7 [106] | email3 / land3 | Same for `env3` on path 3 `dotted("path3", (-5.3, 0.65), (-4.4, -0.6), (-3.3, -0.4))` (10 dots, 91 to 100, ride 93 → 102) into drawer 3, bump on 106. |
| j8 [121] | channel | **new** `channel("channel", loc=(4.6, 0.95), w=4.6, h=4.0)` lands: paper panel, tint header strip with `chat-circle-dots` chip (a2, 0.55) and a skel line; inside, `avatar("jl", "JL", "a1", (2.95, 1.45), size=0.6)` and a question `bubble(w=2.6, h=0.8, tail="left")` at (4.65, 1.45, 0.08) (0.1 clear of JL; style review fix). The avatar, both bubbles and the agent chip sit at z 0.08 on the channel. |
| j9 [136] | answer | The answer: `bubble(w=2.8, h=0.9, color="tint", tail="right")` at (4.45, −0.15) and a small agent chip (`sparkle`, a1, 0.55) at (6.3, −0.25) land ("bubble"). |
| j10–j12 | | Hold. |
| j13 [196] | exit | Everything but MR exits. Hold to 210. (Phase 3 fix: was j12 [181].) |

### s08 · Agent · 14 beats (210 f)

"Send an agent out to do the legwork, and bring back what you need."

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | MR at (3.6, −2.65). |
| j1 [16] | token | `token("agent", (-0.6, -0.6), "a1", size=1.0)` lands. |
| j2 [31] | out | Path out `dotted("pathOut", (-1.35, -0.95), (-4.8, -2.9), (-9.2, -1.6))` (34 dots, two a frame, 31 to 47). The token rolls along it, t 0 @33 → 1 @50, spinning about z (two turns), and leaves the frame ("roll"). |
| j3–j4 [46–75] | | Away: only MR and the out path. A held breath. |
| j5 [76] | back | Path back `dotted("pathBack", (-9.2, 0.6), (-5.0, 0.9), (-1.45, -0.25))` (33 dots, two a frame, 76 to 92). The token rolls back along it, t 0 @78 → 1 @100, carrying three small cards stacked on its top (scale 0.35, z 0.28 + 0.03 i) ("roll"). |
| j7 [106] | home | The token settles home at (−0.6, −0.6), landing 106 ("pop"). |
| j8–j10 [121, 136, 151] | card1–card3 | In order, each card hops off the token in an arc (z peak 0.8, scale 0.35 → 1) and lands in the row: `card("found1", w=3.4, h=1.1, icon_name="file-text", accent="a1", n_lines=2)` at (−4.2, 1.9); `found2` (`chart-bar`, a2) at (−0.4, 1.9); `found3` (`table`, a3) at (3.4, 1.9). No labels. "pop" each. |
| j11 | | Hold. |
| j12 [181] → j13 [196] | exit, mrMove, mrLand | Everything but MR exits on 181; MR moves to (−5.0, −2.45), landing 196 (soft pop). Hold to 210. |

### s09 · Idea to send · 18 beats (270 f)

"Your people bring the idea. AI does the work in between. Your people check it before anything goes
out." The film's one idea in miniature: person, AI, person.

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | MR at (−5.0, −2.45). |
| j1 [16] | blocks | Three **new** `block(name, loc, w, h, icon, accent)` land together (paper slab d 0.08 r 0.2, tint header strip with a chip at relative (−w/2 + 0.55, 1.1)): left (−5.0, 0.9) w 3.6 h 3.0 `lightbulb` a3; middle (0, 0.9) w 3.0 h 3.0 `sparkle` a1; right (5.0, 0.9) w 3.6 h 3.0 `check-circle` a2. |
| j2 [31] | type | MR types the idea: `bubble("idea", (-4.85, 0.6), w=2.8, h=1.2, tail="left")` on the left block (z 0.08) pops by 31, and three skel lines type in from the left, 31 to 44 ("type"). |
| j3 [46] | idea | A `lightbulb` chip (a3, 0.5) lands on the bubble's right end at (−3.85, 0.8). |
| j4 [61] | pathL | Path L `dotted("pathL", (-3.05, 0.1), (-2.35, -0.8), (-1.65, 0.1))` (9 dots, 61 to 69). An idea `packet` (a3) rides it t 0 @63 → 1 @71 and is taken into the middle block (scale → 0 by 74) ("whoosh"). |
| j5 [76] | work | The middle block works: `token("worker", (0, 1.0), size=0.7)` spins one turn 76 → 120; four skel lines fill in below it at 78, 87, 96, 105 (soft tick run). |
| j7 [106] | pathR | Path R `dotted("pathR", (1.65, 0.1), (2.35, -0.8), (3.05, 0.1))` (9 dots, 106 to 114). A draft `packet` (a2) rides t 0 @108 → 1 @116 ("whoosh"). |
| j8 [121] | draft | `card("draft", w=3.2, h=1.2, icon_name="envelope-simple", accent="a1", n_lines=2)` lands in the right block at (5.0, 0.95, 0.08) (inside `kit.block_body()` of the right block, clear of its header strip; style review fix). |
| j9 [136] | buttons | `button("approve", "Approve", "a3", (4.1, -0.1, 0.08), w=1.6, h=0.66)` and `button("send", "Send", "a1", (5.95, -0.1, 0.08), w=1.4, h=0.66)` land together. |
| j11 [166] | approve | Press on Approve (dip on 166, "click"); a `check-circle` icon (a2, 0.4) pops onto the draft's top right, about (6.4, 1.4), 166 to 173. |
| j13 [196] | send | Press on Send (dip on 196, "click"). |
| j14 [211] | sendOff | The draft lifts and flies out past the right edge (x → 10.5, z + 0.3, a slight arc), 211 to 224 ("send"). |
| j15–j16 | | Hold. |
| j17 [256] | exit | Everything but MR exits. Hold to 270. (Phase 3 fix p05: was j16 [241], moved one beat later so the empty ground before the end card is shorter.) |

### s10 · End card · 18 beats (270 f)

"Let's help you save time, money and stress by letting AI do the heavy lifting."

| Beat | Event | What happens |
|---|---|---|
| j0 [1] | | MR at (−5.0, −2.45). |
| j1 [16] | clear | MR exits: everything has cleared. Empty ground for one beat. |
| j2 [31] | mark | **new** `mark("mark", loc=(0, 1.15), size=2.6)`: the Kingdom Sites mark from `public/marketing/logo-mark.svg` (copy it to `blender/assets/logo-mark.svg`), imported as curves, extruded and bevelled in the kit's style, in its own colours (pin `#0a63c9`, inner disc white, crown `#c05a2b`): the one object outside the Berry palette, because it is our own mark. Lands. |
| j3 [46] | address | `text("kingdom-sites.com", 0.5, "ink", loc=(0, -0.75), d=0.06)` lands (drop 0.3). |
| j4 [61] | button | `button("book", "Book a call", "a1", (0, -2.2), w=3.2, h=0.85)` lands. |
| j10 [151] | cursorIn | The Remotion cursor enters from the bottom right. |
| j13 [196] | press | Press on Book a call: the button dips on 196 ("click"). |
| j14 [211] | toWhite | Remotion fades to white, 211 → 241; the final music chord lands on 211. Blender holds still to the end. |
| j16 [241] → end [270] | whiteFull, end | Remotion fades white to black, 241 → 270. The last frame is black. |

## Handoff table

Objects carried from the last frame of one scene to the first frame of the next: same world
position, rotation and scale on both frames. The ground and camera never change, so cuts are
invisible.

| Cut | Object(s) | World position (x, y, z) | Scale | Rot (°) |
|---|---|---|---|---|
| s01 → s02 | stackA, stackB, stackC, stackD, stackE | (−6.1, 2.2, 0), (−3.6, 2.6, 0), (−1.2, 2.0, 0), (−5.4, −1.6, 0), (−2.6, −1.9, 0) | 1 | 6, −5, 4, −3, 7 |
| s01 → s02 | stickyA, stickyB, stickyD, stickyE | (−5.75, 1.75, 0.2), (−3.25, 3.05, 0.24), (−5.0, −2.1, 0.2), (−2.3, −1.45, 0.24) | 1 | −8, 7, 10, −6 |
| s01 → s02 | inbox chip, badge showing "99+" | (5.4, 2.4, 0), (5.95, 2.85, 0.06) | 1.2 (chip size), 1 | 0 |
| s02 → s03 | everything from s01, plus to-do rows 0–15 and the email card with chips and filler | to-do row i at (1.4, −3.5 + 0.62 i, 0); email card (5.2, −1.2, 0) | email card 1.12 | 0 |
| s03 → s04 | folder | (0, 0.2, 0) | 1.2 | 0 |
| s04 → s05 | MR avatar (`avatar("mr", "MR", "a2", size=0.85)`) | (3.6, −2.65, 0) | 1 | 0 |
| s05 → s06 | MR | (3.6, −2.65, 0) | 1 | 0 |
| s06 → s07 | MR | (3.6, −2.65, 0) | 1 | 0 |
| s07 → s08 | MR | (3.6, −2.65, 0) | 1 | 0 |
| s08 → s09 | MR | (−5.0, −2.45, 0) | 1 | 0 |
| s09 → s10 | MR | (−5.0, −2.45, 0) | 1 | 0 |

Scenes 1 to 3 share one script owner (picture agent 1), so the s01 → s03 carry-over should be built
from one shared layout module (for example `blender/layout_s01_s03.py`) that each scene script
imports, so the objects are byte-for-byte the same.

## Sound cue list (120 bpm grid)

One file per sound name, reused every time that action happens (PLAN.md "Sound cue list"). Primary
hits sit on beat frames 15n + 1, at most one per beat (the build refuses otherwise). A texture run
(the ticks of a dotted line drawing in, the working ticks in scene 9) starts on a beat and is not a
primary hit; it is quiet (a run, not every dot at full level). Pan is from the action's x on screen.
Gains are pre-mix levels in dB; every effect stays under the voice.

**The silence:** film frames 466 to 480 (the last beat of scene 2): no voice, no music, no sound
(tails included). Music, sound and the voice (line 3) return with the sweep on 481.

<!-- timeline:cues -->
| Film frame | Beat | Scene | Local | Sound | Primary | Pan | Gain dB | Run |
|---|---|---|---|---|---|---|---|---|
| 16 | 1 | s01 | 16 | paper | yes | -0.61 | -20 |  |
| 31 | 2 | s01 | 31 | paper | yes | -0.36 | -20 |  |
| 46 | 3 | s01 | 46 | sticky | yes | -0.58 | -22 |  |
| 61 | 4 | s01 | 61 | paper | yes | -0.12 | -20 |  |
| 76 | 5 | s01 | 76 | paper | yes | -0.54 | -20 |  |
| 91 | 6 | s01 | 91 | sticky | yes | -0.33 | -22 |  |
| 106 | 7 | s01 | 106 | paper | yes | -0.26 | -20 |  |
| 121 | 8 | s01 | 121 | sticky | yes | -0.5 | -22 |  |
| 136 | 9 | s01 | 136 | pop | yes | 0.54 | -20 |  |
| 151 | 10 | s01 | 151 | tick | yes | 0.59 | -26 |  |
| 166 | 11 | s01 | 166 | tick | yes | 0.59 | -26 |  |
| 181 | 12 | s01 | 181 | tick | yes | 0.59 | -26 |  |
| 196 | 13 | s01 | 196 | tick | yes | 0.59 | -26 |  |
| 211 | 14 | s01 | 211 | tick | yes | 0.59 | -26 |  |
| 226 | 15 | s01 | 226 | sticky | yes | -0.23 | -22 |  |
| 256 | 17 | s02 | 16 | pop | yes | 0.14 | -20 |  |
| 271 | 18 | s02 | 31 | pop | yes | 0.14 | -20 |  |
| 286 | 19 | s02 | 46 | pop | yes | 0.14 | -20 |  |
| 301 | 20 | s02 | 61 | pop | yes | 0.14 | -20 |  |
| 316 | 21 | s02 | 76 | grow | yes | 0.14 | -22 |  |
| 346 | 23 | s02 | 106 | pop | yes | 0.52 | -20 |  |
| 361 | 24 | s02 | 121 | pop | yes | 0.43 | -20 |  |
| 376 | 25 | s02 | 136 | pop | yes | 0.56 | -20 |  |
| 391 | 26 | s02 | 151 | pop | yes | 0.61 | -20 |  |
| 406 | 27 | s02 | 166 | grow | yes | 0.52 | -22 |  |
| 421 | 28 | s02 | 181 | pop | yes | 0.46 | -20 |  |
| 436 | 29 | s02 | 196 | pop | yes | 0.52 | -20 |  |
| 481 | 32 | s03 | 1 | paper | yes | 0 | -20 |  |
| 496 | 33 | s03 | 16 | pop | yes | 0 | -20 |  |
| 511 | 34 | s03 | 31 | pop | yes | 0 | -20 |  |
| 616 | 41 | s04 | 16 | pop | yes | -0.12 | -20 |  |
| 631 | 42 | s04 | 31 | pop | yes | 0 | -20 |  |
| 646 | 43 | s04 | 46 | pop | yes | 0 | -20 |  |
| 676 | 45 | s04 | 76 | pop | yes | 0 | -20 |  |
| 691 | 46 | s04 | 91 | pop | yes | 0 | -20 |  |
| 751 | 50 | s04 | 151 | pop | yes | 0 | -20 |  |
| 766 | 51 | s04 | 166 | pop | yes | 0.12 | -20 |  |
| 856 | 57 | s04 | 256 | pop | yes | 0.36 | -26 |  |
| 886 | 59 | s05 | 16 | pop | yes | -0.53 | -20 |  |
| 901 | 60 | s05 | 31 | pop | yes | 0.28 | -20 |  |
| 916 | 61 | s05 | 46 | whoosh | yes | -0.41 | -22 |  |
| 931 | 62 | s05 | 61 | shutter | yes | -0.41 | -18 |  |
| 946 | 63 | s05 | 76 | whoosh | yes | -0.26 | -22 |  |
| 946 | 63 | s05 | 76 | tick | texture | -0.26 | -30 | 10 × every 1 f (pathA) |
| 961 | 64 | s05 | 91 | cloud | yes | 0.01 | -22 |  |
| 976 | 65 | s05 | 106 | whoosh | yes | 0.24 | -22 |  |
| 976 | 65 | s05 | 106 | tick | texture | 0.24 | -30 | 9 × every 1 f (pathB) |
| 991 | 66 | s05 | 121 | row | yes | 0.54 | -20 |  |
| 1006 | 67 | s05 | 136 | row | yes | 0.54 | -20 |  |
| 1021 | 68 | s05 | 151 | row | yes | 0.54 | -20 |  |
| 1036 | 69 | s05 | 166 | row | yes | 0.54 | -20 |  |
| 1051 | 70 | s05 | 181 | pop | yes | 0.59 | -20 |  |
| 1081 | 72 | s05 | 211 | click | yes | 0.59 | -16 |  |
| 1156 | 77 | s06 | 16 | pop | yes | -0.44 | -20 |  |
| 1171 | 78 | s06 | 31 | row | yes | -0.6 | -20 |  |
| 1186 | 79 | s06 | 46 | row | yes | -0.52 | -20 |  |
| 1201 | 80 | s06 | 61 | row | yes | -0.36 | -20 |  |
| 1216 | 81 | s06 | 76 | row | yes | -0.28 | -20 |  |
| 1231 | 82 | s06 | 91 | pop | yes | 0.34 | -20 |  |
| 1246 | 83 | s06 | 106 | grow | yes | 0.34 | -22 |  |
| 1261 | 84 | s06 | 121 | pop | yes | -0.02 | -20 |  |
| 1396 | 93 | s07 | 16 | pop | yes | -0.4 | -20 |  |
| 1411 | 94 | s07 | 31 | whoosh | yes | -0.43 | -22 |  |
| 1411 | 94 | s07 | 31 | tick | texture | -0.43 | -30 | 11 × every 1 f (path1) |
| 1426 | 95 | s07 | 46 | drawer | yes | -0.2 | -15 |  |
| 1441 | 96 | s07 | 61 | whoosh | yes | -0.43 | -22 |  |
| 1441 | 96 | s07 | 61 | tick | texture | -0.43 | -30 | 9 × every 1 f (path2) |
| 1456 | 97 | s07 | 76 | drawer | yes | -0.2 | -15 |  |
| 1471 | 98 | s07 | 91 | whoosh | yes | -0.43 | -22 |  |
| 1471 | 98 | s07 | 91 | tick | texture | -0.43 | -30 | 10 × every 1 f (path3) |
| 1486 | 99 | s07 | 106 | drawer | yes | -0.2 | -15 |  |
| 1501 | 100 | s07 | 121 | pop | yes | 0.46 | -20 |  |
| 1516 | 101 | s07 | 136 | bubble | yes | 0.52 | -20 |  |
| 1606 | 107 | s08 | 16 | pop | yes | -0.06 | -20 |  |
| 1621 | 108 | s08 | 31 | roll | yes | -0.45 | -22 |  |
| 1621 | 108 | s08 | 31 | tick | texture | -0.53 | -30 | 17 × every 1 f (pathOut) |
| 1666 | 111 | s08 | 76 | roll | yes | -0.45 | -22 |  |
| 1666 | 111 | s08 | 76 | tick | texture | -0.53 | -30 | 17 × every 1 f (pathBack) |
| 1696 | 113 | s08 | 106 | pop | yes | -0.06 | -20 |  |
| 1711 | 114 | s08 | 121 | pop | yes | -0.42 | -20 |  |
| 1726 | 115 | s08 | 136 | pop | yes | -0.04 | -20 |  |
| 1741 | 116 | s08 | 151 | pop | yes | 0.34 | -20 |  |
| 1786 | 119 | s08 | 196 | pop | yes | -0.5 | -26 |  |
| 1816 | 121 | s09 | 16 | pop | yes | 0 | -20 |  |
| 1831 | 122 | s09 | 31 | type | yes | -0.5 | -20 |  |
| 1846 | 123 | s09 | 46 | pop | yes | -0.5 | -20 |  |
| 1861 | 124 | s09 | 61 | whoosh | yes | -0.22 | -22 |  |
| 1861 | 124 | s09 | 61 | tick | texture | -0.23 | -30 | 8 × every 1 f (pathL) |
| 1876 | 125 | s09 | 76 | tick | texture | 0 | -32 | 10 × every 3 f |
| 1906 | 127 | s09 | 106 | whoosh | yes | 0.22 | -22 |  |
| 1906 | 127 | s09 | 106 | tick | texture | 0.23 | -30 | 8 × every 1 f (pathR) |
| 1921 | 128 | s09 | 121 | pop | yes | 0.5 | -20 |  |
| 1936 | 129 | s09 | 136 | pop | yes | 0.5 | -20 |  |
| 1966 | 131 | s09 | 166 | click | yes | 0.41 | -16 |  |
| 1996 | 133 | s09 | 196 | click | yes | 0.6 | -16 |  |
| 2011 | 134 | s09 | 211 | send | yes | 0.65 | -18 |  |
| 2101 | 140 | s10 | 31 | pop | yes | 0 | -20 |  |
| 2116 | 141 | s10 | 46 | pop | yes | 0 | -20 |  |
| 2131 | 142 | s10 | 61 | pop | yes | 0 | -20 |  |
| 2266 | 151 | s10 | 196 | click | yes | 0.06 | -16 |  |
| 466–480 | 31 | s02 | 226 | **silence** | | | | music and sound stop |
<!-- /timeline:cues -->

Music shape (for the sound agent): soft start under scenes 1 and 2 building a little; stops dead for
the silence; returns brighter on the sweep (481); adds one layer at each feature scene (4 to 9),
never detuned or "bad"; settles under the end card; the final chord lands on s10 beat 14 (film
2281) and rings into the fade to white and black. Film-frame spans are in `timeline.json` → `music`.

## Cursor

One pointer, drawn only by Remotion as a sprite (`video/public/cursor.png`, rendered by the kit
agent from `kit.cursor()` on a transparent background, with its tip pixel recorded in
`video/public/cursor.json` as {"tipX", "tipY", "width", "height"}). It moves in short eased arcs,
arrives a hair past its target, settles 2 frames before the press, is fully pressed on the beat
frame, and springs back by +6. Press points are on the button, right of its label (button centre
+ 0.36 × width in x, −0.08 in y, on the button's top surface), so the tip never covers a word.

<!-- timeline:cursor -->
| Film frame | Scene | x px | y px | Press | Shown | Note |
|---|---|---|---|---|---|---|
| 1051 | s05 | 2040 | 1170 |  | yes | enters from bottom right |
| 1079 | s05 | 1767.4 | 861.4 |  | yes | settled on approve |
| 1081 | s05 | 1767.4 | 861.4 | press | yes | press approve |
| 1087 | s05 | 1767.4 | 861.4 |  | yes | released |
| 1126 | s05 | 1767.4 | 861.4 |  | yes | rests |
| 1138 | s05 | 2040 | 1170 |  | no | leaves |
| 1936 | s09 | 2040 | 1170 |  | yes | enters from bottom right |
| 1964 | s09 | 1521.1 | 558.4 |  | yes | settled on approve |
| 1966 | s09 | 1521.1 | 558.4 | press | yes | press approve |
| 1972 | s09 | 1521.1 | 558.4 |  | yes | released |
| 1994 | s09 | 1734.5 | 558.4 |  | yes | settled on send |
| 1996 | s09 | 1734.5 | 558.4 | press | yes | press send |
| 2002 | s09 | 1734.5 | 558.4 |  | yes | released |
| 2056 | s09 | 1734.5 | 558.4 |  | yes | rests |
| 2068 | s09 | 2040 | 1170 |  | no | leaves |
| 2221 | s10 | 2040 | 1170 |  | yes | enters from bottom right |
| 2264 | s10 | 1098.2 | 808.2 |  | yes | settled on bookACall |
| 2266 | s10 | 1098.2 | 808.2 | press | yes | press bookACall |
| 2272 | s10 | 1098.2 | 808.2 |  | yes | released |
| 2281 | s10 | 1098.2 | 808.2 |  | yes | rests |
| 2293 | s10 | 2040 | 1170 |  | no | leaves |
<!-- /timeline:cursor -->

## Kit objects

Existing in `blender/kit.py` (use as is): `stack`, `paper`, `sticky`, `folder`, `chip`, `card`,
`avatar`, `button`, `bubble`, `phone`, `cloud`, `photo`, `table`, `bars`, `drawer`, `token`,
`cursor` (only for the Remotion sprite), `dotted`, `packet`, `text`, `icon`, `slab`, `lines`, `pop`,
`move`, `ease_all`, `bez`.

New, for the kit agent to add (built only from `slab()`, `icon()`, `text()`, `dotted()`,
`packet()`, palette colours, same bevels and light; each goes on the new component sheet and passes
the checklist before a scene uses it):

| Function | Used in | What it is |
|---|---|---|
| `pop_out(ob, f)` | 4–10 | Exit: scale 1 → 1.04 at f + 2 → 0 at f + 8. |
| `counter_badge(name, values, loc)` | 1 | Raspberry (a1) pill, h 0.42, paper Archivo digits (0.26), one text child per value, all but the first at scale 0; widens for "99+". |
| `todo_list(name, loc, rows)` | 2 | Rows of 3.0 × 0.5 paper slabs 0.62 apart; header row with a `clipboard-text` chip; other rows: tint checkbox + skel line. Each row its own group (`{name}_row{i}`), for popping. |
| `email_card(name, loc, w, h)` | 2 | Paper card: `envelope-simple` chip a1, skel "to" line, three skel body lines, three hidden filler lines (`{name}_filler{i}`). |
| `buzz_chip(name, color, parent, loc)` | 2 | Pill 1.0 × 0.34 with a `sparkle` icon 0.22 and a short skel line. No words. |
| `project_card(name, loc, w, h)` | 4 | Big paper panel: header chip `folder-simple` + skel lines, three tint slot wells. |
| `survey_card(name, loc, rot)` | 6 | Paper 1.5 × 2.0, `clipboard-text` chip, three answer rows with radio dots. |
| `envelope(name, loc)` | 7 | Paper 0.8 × 0.56 with an `envelope-simple` icon. |
| `channel(name, loc, w, h)` | 7 | Paper panel with a tint header strip, `chat-circle-dots` chip and skel line. |
| `block(name, loc, w, h, icon, accent)` | 9 | Paper slab with a tint header strip and a chip. |
| `mark(name, loc, size)` | 10 | The Kingdom Sites mark from its SVG, extruded and bevelled, own colours. |
| Remotion cursor sprite | 5, 9, 10 | `kit.cursor()` rendered alone, transparent, 1080p scale, to `video/public/cursor.png` + `cursor.json`. |

New Phosphor icons (fill weight, into `blender/assets/icons/` and `video/public/icons/`): `pen-nib`
(scene 4). Already there: `tray`, `clipboard-text`, `folder-simple`, `book-open-text`, `lightbulb`,
`sparkle`, `envelope-simple`, `chat-circle-dots`, `check-circle`, `chart-bar`, `table`, `file-text`.

## Technical notes

**Renders.** Eevee, 1920×1080, through `blender/render.sh <script.py> [args]` only (two-slot queue;
exit 75 = no slot within 4 minutes, run it again). Keep each call a few minutes: 30 to 60 frames at
1080p.

- **Final samples: 32** (`kit.setup(1920, 1080, samples=32)`). Measured in phase 0 on the approved
  animation at 1920×1080, 20 frames (100 to 119, rows landing, dotted lines, phone shadow), timing
  the whole render.sh call (Blender start-up of about 2 s included):

  | Samples | 20 frames | Per frame (start-up removed) | Against 64 samples |
  |---|---|---|---|
  | 64 | 33.7 s | about 1.55 s | reference |
  | 32 | 20.6 s | about 0.93 s | PSNR 61.4 to 61.9 dB: no visible difference |
  | 16 | 13.6 s | about 0.56 s | PSNR 54.6 to 54.9 dB: faint grain on the soft shadow edges |

  At 32 samples the soft shadows are clean and the bevels read exactly as at 64 (compared at 3×
  pixel zoom: `renders/style/compare_samples.png`, `compare_zoom.png`). 16 shows grain in the
  shadow penumbra, so 32 is the lowest that keeps the look. The 1080p style frame (64 samples, the
  look reference) renders in about 3.3 s including start-up.
- The whole film is 2,341 frames: at about 0.93 s a frame that is about 36 minutes of Blender time in
  one slot, about 18 minutes across both slots, plus start-up per chunk. Drafts: half size
  (960×540) at 16 samples.
- Paths: drafts `renders/drafts/sNN/` (put the latest best draft still at
  `renders/drafts/sNN/latest.png`: the review page and the Remotion placeholder show it); final
  frames `renders/scenes/sNN/####.png` (local frame numbers 0001 … length); clip
  `renders/scenes/sNN.mp4` (H.264, CRF 12, yuv420p, 30 fps, `-g 10`); style frames and sheets
  `renders/style/`. `renders/` is git-ignored. `video/public/drafts` and `video/public/scenes` are
  symlinks to `renders/drafts` and `renders/scenes`.
- Press targets: a scene with a press writes `video/timeline/targets/sNN.json`
  {"scene", "presses": [{"name", "localFrame", "x", "y"}]}: the press point's pixel on its press
  frame (`bpy_extras.object_utils.world_to_camera_view`, 1920×1080, origin top left, y down; x =
  u × 1920, y = (1 − v) × 1080). The timeline build then uses it instead of the first estimate
  (orthographic projection: x = 960 + 120·X, y = 540 − 120·(Y·cos 10° + Z·sin 10°)) and refuses a
  file whose press frame differs from the sheet.

**Timeline.** `video/timeline/sheet.mjs` is the hand-edited source; `node video/timeline/build.mjs`
writes `video/timeline.json` and refreshes the generated tables in this file; `--check` writes
nothing. It refuses: a primary sound off 15n + 1 or two on one beat; a scene not starting on 15k + 1;
a label held less than 0.45 s × words + 1 s; overlapping voice lines; any voice or sound (texture
runs and a 12-frame tail included) in the silence, or a silence not right before scene 3; a film
over 90 s; voice words that differ from this file; a press without a click on its beat. To retime
to the real voice, change a line's `at`/`seconds` (and `estimate: false`) and the scenes' `beats`;
local beats inside scenes stay the same.

`timeline.json` shape: `{fps, bpm, width, height, durationInFrames, seconds, frameConvention,
silence: {start, end}, music: [{from, to, what}], voice: [{scene, line, text, start, end,
localStart, localEnd, seconds, file, estimate, fileSeconds, fileEnd, speechOn, timestamps}], scenes: [{id, name, start, length, end, beats,
voice, beatsLocal: {event: localFrame}, presses: [{name, target, localFrame, frame, world, x, y,
source}], labels: [{text, words, kind, in, out, localIn, localOut, hold, minHold, x, y}], cues:
[{sound, frame, localFrame, beat, pan, gain, primary, run?, path?}], paths: [{name, p0, c, p1, dots,
every, localStart, localDrawn, start, drawn}], handoffIn, handoffOut, clip, frames, draft, cursor?,
fade?}], cursor: [{frame, x, y, press, show, scene, note}], cues: [...all], labels: [...all]}`.

**Remotion.** `video/`: Remotion 4.0.535 (every `remotion` and `@remotion/*` package pinned to it),
React 19.3.0, TypeScript. One composition `Film`, 1920×1080, 30 fps, `durationInFrames` from
`timeline.json`. Archivo (`public/fonts/Archivo-SemiBold.ttf`, the kit's face: the site loads
Archivo from Google Fonts through `next/font`, so there is no font file in the repo) is loaded with
`@remotion/fonts` and awaited; a frame never renders in a fallback. Phosphor SVGs in
`public/icons/`. Stills: `npx remotion still Film out/fNNNN.png --frame=NNNN` (fine for any agent).
Full film renders only through `../remotion-lock.sh` (assembly agent). The phase 0 skeleton shows,
per scene, the ground colour, the scene id and the draft still when there is one.

Review page server (not started in phase 0): `node ~/.claude/skills/film-studio/scripts/review_server.mjs
--root video/review/dist --notes video/notes.json --port 5191 --host 127.0.0.1,100.69.115.38`. It
has no `--help`: any run starts the server, so start it only to serve.

**ElevenLabs.** Key in the keychain (`elevenlabs-api-key`), checked in phase 0 with a 12-character
text to speech call (George, `JBFqnCBsd6RMkjVDRZzb`, `eleven_multilingual_v2`): HTTP 200, the
response's `character-cost` header said 12. Every generation is logged in `audio/credits.jsonl`.
The run stays under 8,000 credits. Phase 1 voice: Matilda (see Voice above); the voice lane's
spend is in `audio/credits.jsonl` (lane "voice").
