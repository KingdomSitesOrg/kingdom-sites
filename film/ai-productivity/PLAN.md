# AI productivity film: overnight plan

Status: ready for ultracode. One unattended overnight run, start to finished film. No stop
waits for Thomas; every decision is either made below or made by the run's own reviewers.
Written 2026-11-05 from Thomas's voice notes about his conversation with a leader at a graduate
school of leadership in Manila. The school is never named in the film.

## What Thomas gets in the morning

1. The finished film: `film/ai-productivity/renders/final/ai-productivity-1080p.mp4`, about
   75 seconds, voice, music and sound in. A 4K file too, if the night allowed it.
2. A poster still and a contact sheet (one frame per second on one image).
3. The review page with the film and his notes tool, running on his phone over Tailscale:
   `http://100.69.115.38:5191/` (and `http://127.0.0.1:5191/` on the Mac).
4. The three voice auditions the run chose between, with one line on why the winner won.
5. A morning report in the agent-report shape (verdict, what it means, actions), with anything
   the reviewers flagged but could not fix.

The first eight images (style frames and key stills) and the report are sent to his phone at the
end of the run.

Note on the drafts-first rule: Thomas normally sees draft stills before any long render. This
run is his explicit request to go all the way overnight, so the morning film is his first look.
That is acceptable here because every scene is rendered in Eevee (minutes, not hours): any note
he gives in the morning is a fix and a re-render of one scene, not a lost night.

## Decisions made (Thomas, 2026-11-05)

| Question | Answer |
|---|---|
| Look | "Soft 2.5D" made in Blender, edited in Remotion. See Look |
| Voice | ElevenLabs. The overnight run may use a Free plan key (10,000 credits a month, API access). The Free plan has no commercial licence for speech or music, so the final voice and music are regenerated on a paid plan before the film is shown to anyone outside |
| Tool names | The voice says "Claude", "Claude Projects", "Claude in Slack". No real logos, no copied app screens; our own drawn cards |
| Ending | Voice: "Let's help you save time, money and stress by letting AI do the heavy lifting." End card: Kingdom Sites mark, kingdom-sites.com, a Book a call button the cursor clicks |
| Length | 75 s target, 90 s hard cap |
| Format | 1920×1080 at 30 fps. 4K if time allows. Vertical cut is not part of this run |
| Agents | Opus for every agent, effort high |
| Palette | **Berry**, locked: warm ground `#F7F1EE`, ink `#2B2440`, raspberry `#EE4F6E`, teal `#1FAFAC`, butter `#FFC64A`, kraft tones for the paper "before" (`kit.py` default). No palette contest in the run |
| Connector | Whenever something passes between two things, a dotted line draws itself between them and the thing rides it (Thomas, 2026-11-05) |

## What it is

A product film for Kingdom Sites' AI consulting. It speaks to one school that runs half on paper
and half on computers, with more work than its people can handle and AI known only as a sloppy
email drafter, but it is general enough for any school, ministry or small organisation. Light and
fun, never a consulting pitch.

## The one idea

AI is the tool in the middle; people bookend it. A person brings the idea, AI does the work, a
person reviews before anything is sent. Every feature scene follows that shape in miniature: an
avatar chip starts it, the work happens on its own, a cursor approves it.

## Look

Code-drawn 2D has failed every time because each shape is drawn by hand in code, with no light,
material or depth, so it reads as stick figures and broken boxes. Blender work looks good because
light, bevels and soft shadows do the craft. So the flat, light, fun style is made in Blender:

- Camera: orthographic, front-on, locked off unless a scene calls for a slow push. Compositions
  read flat and graphic, but every object has real light and a soft contact shadow.
- Material: matte soft-touch plastic, like clay toys, every edge rounded with a real bevel.
- Ground: one warm bright white, the same in every scene, with a soft gradient falloff to the
  edges. The film reads as one place.
- Light: one rig for the whole film. Big soft key from top left, soft fill, ambient occlusion,
  soft shadows. Never harsh, never dark.
- Icons: Phosphor (MIT licence, already a site dependency), SVG imported into Blender as curves,
  extruded and bevelled. No shape is drawn by hand in code.
- Freedom to add (Thomas, 2026-11-05): agents may add any new icon or object a scene needs, as
  long as it is in the same style. New icons: any of Phosphor's 1,500 icons (fill weight; get them
  with `npm pack @phosphor-icons/core` into the scratchpad and copy the SVG into
  `blender/assets/icons/`), shown through `icon()` or `chip()`. New objects: built only from the
  kit's `slab()`, `icon()`, `text()`, `dotted()` and `packet()`, in palette colours, with the same
  bevels and light, then added to `kit.py` as a function. Every new icon or object goes on the
  component sheet and passes the checklist before a scene uses it.
- People: no figures, ever. People are round avatar chips with initials, and the cursor.
- Objects come from one shared kit: paper sheet, paper stack, sticky note, folder, card, chat
  bubble, drawer, phone (camera open), cloud, photo card, table, bar chart, avatar chip, agent
  token, button. Never a scanner. Every scene uses
  the kit; no scene invents its own object style.
- Renderer: Eevee. Seconds a frame.
- Words, captions, cursor and end card: Remotion, laid over the rendered scenes, in Archivo (the
  site's typeface). Never italics.
- Motion: anticipation, about 1% overshoot, then stillness. Smooth motion (not stop-motion
  "on twos"). Every landing on a beat with a small dry sound. One true silence before scene 3.
- Palette: Berry (see Decisions). The paper chaos stays in kraft tones; colour arrives with the
  "after".
- One motif: the avatar chip. It starts and ends each feature beat.
- One connector: the dotted line (`kit.dotted`), raspberry dots lying on the table, drawn in dot
  by dot just ahead of whatever travels along it (a photo, a data pill, an email, the agent
  token). Used every time something moves between two objects, and only then.

## Script (locked, about 147 words)

No agent changes these words. Timings are first estimates; phase 2 retimes them to the real voice.

| # | Time | Picture | Voice |
|---|---|---|---|
| 1 | 0–8 s | Paper stacks pop up across the table, sticky notes land on them, an inbox counter climbs | "A school has a thousand moving parts. Most of them still run on paper." |
| 2 | 8–16 s | A to-do list grows past the top of the frame; an email draft card swells with buzzword chips and filler lines | "Most teams have more work than they can handle. And they only know AI as a sloppy, jargon-filled email drafter." |
| 3 | 16–20 s | One beat of silence, then every paper sweeps into one bright folder | "What if AI did the busywork, and your people did the thinking?" |
| 4 | 20–30 s | The folder becomes a project card; handbook, policy and style-guide cards slot in; avatar chips join it | "Give Claude your handbook, your policies, your voice, once. Then share it with your whole team." |
| 5 | 30–37 s | A phone rises over a paper form and takes a photo (shutter flash); the photo arcs up into a cloud; rows drop from it into a table. No scanner anywhere (Thomas, 2026-11-05) | "Scan a stack of paper forms, and get clean records instead of retyping." |
| 6 | 37–44 s | Survey cards fan out, a bar chart grows, a card lands: "3 things to improve" | "Build a survey, read every answer, and see what to fix next." |
| 7 | 44–51 s | Emails fly into labelled drawers; a chat bubble in a team channel answers a question | "Sort the inbox. Answer questions where your team already talks." |
| 8 | 51–58 s | A small agent token rolls out of frame, comes back carrying cards, sets them down in order | "Send an agent out to do the legwork, and bring back what you need." |
| 9 | 58–66 s | Three blocks in a row: avatar types the idea, the middle block works, avatar's cursor clicks Approve, then Send | "Your people bring the idea. AI does the work in between. Your people check it before anything goes out." |
| 10 | 66–75 s | Everything settles; end card with the Kingdom Sites mark, kingdom-sites.com and Book a call; cursor clicks it; fade to white, then black | "Let's help you save time, money and stress by letting AI do the heavy lifting." |

On-screen words are only labels for what is on screen ("Handbook", "Policies", "3 things to
improve", "Approve", "Send", "Book a call", "kingdom-sites.com"). No subtitles of the voice. No
invented numbers, claims, names or logos. No school name.

## Sound cue list

The music builds under all of it. Each sound is small and quiet; the voice always wins. One file
per sound name, reused every time that action happens.

| Sound | Prompt idea | Used in |
|---|---|---|
| pop | soft rubbery pop, like a clay piece set down | every object popping in, all scenes |
| paper | short dry paper shuffle | paper stacks landing (1), papers sweeping into the folder (3) |
| sticky | light tap of a sticky note pressed down | sticky notes (1) |
| tick | tiny soft tick, like a bead on wood | each dot of a dotted line drawing in (5, 7, 8; a quiet run, not every dot at full level) |
| whoosh | gentle airy whoosh, short | anything riding a dotted line: photo, data pill, emails, agent token |
| shutter | soft phone camera shutter | the phone taking the photo (5) |
| cloud | soft airy puff | the cloud taking the photo in (5) |
| row | light wooden click | each table row landing (5), each survey card landing (6) |
| grow | short rising soft swell | bars growing in the chart (6), the to-do list growing (2) |
| drawer | soft drawer slide and close | emails landing in drawers (7) |
| bubble | soft chat blip | the chat answer appearing (7) |
| roll | small wheel rolling on a table | the agent token rolling out and back (8) |
| type | three or four soft key taps | the avatar typing the idea (9) |
| click | soft mouse click | every cursor press: Approve (5, 9), Send (9), Book a call (10) |
| send | short bright swish | Send in scene 9 |
| silence | nothing, one full beat | before scene 3: music and sound both stop |

Per scene:

1. Papers: paper and pop on each stack, sticky on each note, a soft counter tick as the inbox
   count climbs.
2. To-do list: grow as it climbs past the frame; pops as buzzword chips crowd the email draft.
3. One beat of silence, then paper as everything sweeps into the folder, pop as it closes.
4. Project card: pop as each card (handbook, policies, style guide) slots in, pop on each avatar
   joining.
5. Phone: whoosh as it rises in, shutter, a run of ticks as the first dotted line draws, whoosh
   as the photo rides it, cloud, ticks and whoosh on the second line, row on each row, click on
   Approve.
6. Survey: row as each card fans out, grow as the bars rise, pop as the "3 things to improve"
   card lands.
7. Inbox: whoosh as each email rides its dotted line, drawer as it lands; bubble for the chat
   answer.
8. Agent: roll as the token leaves along its dotted line and comes back, pop as each card it
   carried is set down.
9. Idea to send: type, a soft working run of ticks in the middle block, click on Approve, send.
10. End card: pop as it settles, click on Book a call, then the final music chord into the fade.

## Tools

| Tool | Job |
|---|---|
| Blender 5.2.3 (installed, `/opt/homebrew/bin/blender`), headless | Every picture. `kit.py` plus one Python file per scene, same pattern as `scripts/film/laptop_film.py` |
| Eevee | All renders |
| Remotion, one pinned version for every `@remotion/*` package | The edit: `timeline.json`, scene clips, overlays, voice, music, the review page |
| ElevenLabs text to speech, with timestamps | The voice. Key read from the keychain: `security find-generic-password -s elevenlabs-api-key -w` |
| ElevenLabs Music | One light, building instrumental track, cut to the film's shape |
| ElevenLabs Sound Effects | Every sound effect, from a written description (the key's access was tested 2026-11-05) |
| Python audio pipeline (from the Farzana film) | Places each sound on the beat grid, pans it, mixes, masters to −14 LUFS with a true-peak limiter |
| ffmpeg | Final encodes, poster, contact sheet |
| `~/.claude/skills/film-studio/scripts/review_server.mjs` | The review page server, port 5191 |

Read before starting: `~/.claude/skills/film-studio/SKILL.md`, `references/craft.md`,
`references/remotion.md`.

## Preview already built (2026-11-05)

The approved look, for every reviewer to compare against: `reference/approved-scene5-still.png`,
`reference/approved-component-sheet.png`, `reference/approved-scene5-animation.mp4` (Thomas:
"this is what I want").

- `blender/kit.py`: the shared kit. Every object is a rounded slab or a Phosphor icon; palettes
  `sky`, `garden`, `berry` (Berry is the default and the locked choice); exposure tuned so
  rendered colours match the palette hex values; `dotted()` and `packet()` for the connector.
- `blender/preview.py`: the component sheet, the scene 5 style frame (phone, cloud, table) and a 5-second animation
  test (`--what sheet|style|anim`, `--palette`).
- `blender/assets/`: the 18 Phosphor icons (fill weight) and Archivo SemiBold (made from the
  variable font at weight 650).
- Speed: about 7 s a 1080p still, about 35 s for 124 frames at 960×540 (Eevee).
- Lessons: when a group is hidden with a scale key before it pops, set its scale back to 1 before
  calling `pop()` (pop scales to the current scale); phone internals are sized for the default
  1.7×3.3 phone, so do not shrink it; lift the cursor above anything it rests on (z 0.22) and place its tip beside, not on,
  a label; start off-screen objects past x = ±9; skeleton lines use the `skel` colour, not `tint`
  (tint vanishes on white).

## Folder layout

All work on branch `claude/product-video-ai-productivity-e277bb` in this worktree.

```
film/ai-productivity/
  PLAN.md          this file
  SCRIPT.md        the contract: words, word table, beat sheet with frames, sound cues
  REPORT.md        the morning report
  blender/         kit.py, preview.py, s01_paper.py … s10_end.py, render.sh
  renders/         style/, drafts/, scenes/, final/ (git-ignored)
  video/           Remotion project: timeline/, src/, review/, verify/
  audio/           voice/ (auditions, lines, timestamps), music/, foley/, mix/
```

## The run

Phases run in this order; phases on the same line run side by side.

### Phase 0: setup (1 agent)

- Confirm the branch, create the folders, add `renders/` and audio intermediates to `.gitignore`.
- Confirm Blender runs headless and Eevee renders a test frame.
- Confirm the ElevenLabs key is in the keychain and answers. If it is missing or refused, the run
  does not stop: the voice and music lanes switch to the fallback (see Fallbacks).
- Create the Remotion project with one pinned version; install fonts (Archivo) and Phosphor SVGs.
- Write SCRIPT.md: the locked words, the word table, each scene's beat sheet in frames at 30 fps,
  the sound cue list on the 120 bpm grid (beat n at frame 15n + 1).

### Phase 1: voice, and the kit with the style frame (2 agents, side by side)

Voice agent:
- Pick three ElevenLabs voices from the library: warm, clear, friendly, unhurried, neutral
  accent. Render the opening and closing lines with each.
- Choose one with a written reason (clarity first, warmth second, no "announcer" voice).
- Render every line with timestamps. Keep 0.3 to 0.6 s of air between lines, and a full beat of
  silence before scene 3.
- Retime SCRIPT.md and `timeline.json` to the real line lengths. If the film runs past 90 s,
  speed nothing up: lengthen nothing else and report it.

Kit and style agent:
- The kit already exists (built 2026-11-05 for the look review, see Preview below): extend
  `blender/kit.py`, do not rewrite it. It holds the light rig, ground, camera, colour-matched
  exposure, the bevelled kit objects, Phosphor import, Archivo text, and the pop and move helpers.
  The palette is locked (Berry, the kit's default). There is no palette contest.
- Scene 5 is already designed: `preview.py`'s `style_scene()` is its approved layout and motion
  (phone, flash, photo along the dotted line into the cloud, data pill along the second dotted
  line, rows into the table, Approve). Turn it into `s05_photo.py`, retimed to the beat sheet.
- Add any kit objects the other scenes need (to-do list, email card, team channel, agent
  token paths, end card), in the same style, and render them on a new component sheet.
- A reviewer agent (fresh, Opus) checks the sheet against the checklist below before phase 2.

### Phase 2: scenes, edit and sound (5 agents, side by side)

Picture agents (3), scenes split as 1–3, 4–7, 8–10:
- Build each scene from the kit and the locked palette, following its beat sheet frame by frame.
- Render draft stills at half size (first, each beat, last), look at them, run the checklist.
- Fix and re-draft; at most two retries per scene (see Rules). Then render the scene's frames at
  1920×1080 into `renders/scenes/sNN/`.
- Rendering goes through one shared queue with at most 2 Blender processes on the Mac at once.

Edit agent:
- Remotion composition: scene clips in order, the cursor (one pointer, frame coordinates, arcs
  and presses on beats), labels, the end card, cuts and the final fade.
- The review page (Player plus notes, notes in `video/notes.json`) served on port 5191 with
  `--host 127.0.0.1,100.69.115.38`, started in the background and left running.
- The checks in `verify/`: sounds on the grid, label reading times, one pointer, film length
  matches the sheet, every label inside title-safe.
- Until a scene's frames exist, its slot shows its latest draft stills, so the page works all
  night.

Sound agent:
- ElevenLabs Music: one light, warm instrumental that builds a layer per feature scene, drops out
  for the beat before scene 3, and lands a final chord on the end card. Never "bad" or detuned
  music for the problem scenes.
- Sound effects from ElevenLabs Sound Effects (text to sound), one short file per sound in the
  cue list below, generated once and reused wherever the same action repeats (every pop uses the
  same pop, every cursor click the same click). Prompts ask for short, close, dry, soft studio
  sounds with no music and no reverb tail. Trim silence, place each on its beat frame
  (15n + 1 at 30 fps), pan it to where its action is on screen, and keep each one quiet under the
  voice. The Python pipeline only places, pans and mixes; it does not synthesise sounds unless
  ElevenLabs is out of credits (then it is the fallback).
- Mix voice over music (music ducks under the voice), master to −14 LUFS, true peak −1 dB, into
  `video/public/mix.wav`.

### Phase 3: assemble and review the whole film (2 agents, one after the other)

- Assembly: render the full film at 1080p from Remotion (concurrency 2), run every check on the
  file, make the poster and the contact sheet.
- Whole-film reviewer (fresh, Opus): looks at the contact sheet and one still a second against
  the checklist and against the script. Lists every problem with its time.
- One fix pass on that list by the agents that own those scenes, then one re-render of only the
  changed scenes and the film. No second review pass; whatever is left goes in the report.
- If at least 90 minutes of the night remain, render 4K (`--scale=2`).

### Phase 4: hand-off (the run itself)

- Commit everything except renders on the branch, with plain-language messages, and push the
  branch. Never touch `main`, never deploy, never open anything public.
- Write REPORT.md in the agent-report shape: one-line verdict, three to six bullets on what he
  will see, then "For Thomas:" and "For the agent:" actions. Flagged problems and choices
  (voice) with one line each.
- Send Thomas the poster, the component sheet, four key stills and the report, as
  images and files to his phone. Leave the review page running.

## The checklist every reviewer uses

A still passes only if all are true:

1. Nothing looks like a stick figure, a broken box, clip art or a rough drawing.
2. No object cuts into another; every object sits on the ground or floats on purpose with a
   soft shadow.
3. Every edge is rounded, every surface is lit, nothing is pure flat colour without shading.
4. Only the locked palette; the ground matches every other scene.
5. One idea on screen, and it is the one the script says for that moment.
6. Every label is readable at phone size, inside title-safe, and covered by nothing.
7. No real logo, no real app screen, no person figure, no italics.
8. It looks like the same film as scene 5's style frame.

## Rules for the run

- **Two retries, then move on.** Anything that fails gets one attempt and at most two retries.
  Then keep the best result so far, never overwrite a good result with a worse one, flag it in
  the report, and carry on with the rest of the film. The run never stalls on one scene.
- **Memory.** At most 2 Blender processes and Remotion concurrency 2. Do not run Blender and the
  Remotion render at the same time.
- **Words are locked.** No agent changes the script's words. A scene that cannot show its line
  is flagged, not rewritten.
- **No production.** No deploy, no push to `main`, no public upload, no email.
- **Cost guard.** ElevenLabs: at most three auditions per voice, at most three music generations,
  at most two tries per sound effect, and the whole run stays under 8,000 credits so it fits a
  Free plan month. Order: voice first (about 3,000 credits: the script is about 850 characters),
  then the sound effects (about 15 short sounds), then music from what is left. Read the credit
  cost of the first sound effect and the first music call, and stop that kind before it would
  break the cap. If music would go over, use the placeholder pad; if sound effects would go over,
  the Python pipeline synthesises the rest. Say so in the report, and log every generation's
  credit use there.
- **Agents:** Opus, effort high, about 9 in total (setup, voice, kit and style, style reviewer,
  three picture, edit, sound, assembly, whole-film reviewer; the fix pass reuses the picture
  agents).

## Fallbacks

- **No ElevenLabs key, or it fails:** voice lines made with the Mac's built-in voice for timing
  only, music as a soft placeholder pad on the grid. Everything else is finished. The report says
  the real voice and music are the first job in the morning.
- **A scene fails the checklist after two retries:** its best version goes in, and it is first
  on the report's list.
- **Running out of night:** the 1080p film comes first, 4K last. If the full film cannot render,
  the review page with the latest scenes and the voice is the morning deliverable.

## Before the run starts

- Done 2026-11-05: the ElevenLabs key is in the keychain as `elevenlabs-api-key` (Free plan),
  never in a file or the repo. Tested: text to speech works and the music endpoint accepts it. The
  key cannot list voices or read the account (no `voices_read` / `user_read` permission), so the
  voice agent auditions from premade voice IDs it already knows (for example George,
  `JBFqnCBsd6RMkjVDRZzb`) and counts credits from the characters it sends.
- Nothing else is needed from him.

## Before the film is shown outside

- Upgrade ElevenLabs to a paid plan, then regenerate the final voice lines and music while
  subscribed (same voice, same script, same timings), so the film carries a commercial licence.
  The report's "For Thomas" block says this until it is done.
