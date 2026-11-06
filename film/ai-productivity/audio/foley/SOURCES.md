# Sound effects: sources

**2026-11-06: regenerated on the paid plan.** After Thomas upgraded the ElevenLabs account, every sound
was made again with the same prompts (`sfx.py <name> --try 2`, 110 credits), so the film's effects carry
the paid plan's commercial licence. `process.py` now cuts the `_try2` files; its windows are listed
there. The table below describes the first, Free plan takes (`_try1`), kept in `raw/` for the record.

Every sound is an ElevenLabs Sound Effects generation (`POST /v1/sound-generation`, Free plan key,
2026-11-05), one try each, made by `sfx.py` and cut by `process.py` into `<name>.wav` (48 kHz mono,
32-bit float, peak -1 dBFS). The raw generations are in `raw/`. Every prompt ended with: "Close-up, dry studio recording, soft, no music, no reverb, no room echo."

Cost: about 10 credits a second of sound (from the response's `character-cost` header); 16 sounds,
110 credits in all. No sound was synthesised. Free plan output has no commercial licence: regenerate
these on the paid plan (same prompts, `sfx.py`) before the film is shown outside.

`sync` is where the sound's moment is; the mix lands that point on the cue frame. Three raw files came
back with more than one hit (click: three clicks, counter: three ticks, bubble: two blips); the window
keeps one clean hit, no retry was spent.

| Sound | Used for | Prompt | Duration asked | Credits | Raw file, window kept | Length | Sync |
|---|---|---|---|---|---|---|---|
| pop | every object popping in | A single soft rubbery pop, a small clay toy piece set down on a table. | 0.5 s | 5 | `raw/pop_try1.mp3`, 0.0-0.17 s | 0.17 s | onset (0.0 s) |
| paper | paper stacks landing (s01), the sweep (s03 frame 481) | A short dry paper shuffle, a small stack of paper sheets set down on a desk. | 0.8 s | 8 | `raw/paper_try1.mp3`, 0.0-0.62 s | 0.604 s | peak (0.472 s) |
| sticky | sticky notes (s01) | A light single tap of a sticky note pressed down onto paper with a fingertip. | 0.5 s | 5 | `raw/sticky_try1.mp3`, 0.0-0.2 s | 0.103 s | onset (0.0 s) |
| tick | dotted lines drawing in (texture runs), the working ticks (s09) | One tiny soft tick, a small wooden bead tapped once on wood. Very short. | 0.5 s | 5 | `raw/tick_try1.mp3`, 0.15-0.32 s | 0.143 s | onset (0.0 s) |
| counter | the inbox counter climbing (s01, cue sound "tick") | One soft tick of a small plastic number counter clicking forward one step. Very short. | 0.5 s | 5 | `raw/counter_try1.mp3`, 0.105-0.2 s | 0.047 s | onset (0.0 s) |
| whoosh | anything riding a dotted line | A gentle short airy whoosh, a light object gliding past. | 0.8 s | 8 | `raw/whoosh_try1.mp3`, 0.0-0.45 s | 0.357 s | onset (0.0 s) |
| shutter | the phone photo (s05) | A soft phone camera shutter click, one photo. | 0.5 s | 5 | `raw/shutter_try1.mp3`, 0.0-0.3 s | 0.193 s | peak (0.075 s) |
| cloud | the cloud taking the photo (s05) | A soft airy puff, a gentle breath of air into a pillow. | 0.7 s | 7 | `raw/cloud_try1.mp3`, 0.0-0.58 s | 0.58 s | onset (0.0 s) |
| row | table rows (s05), survey cards (s06) | A light wooden click, a small wooden tile placed on a wooden table. | 0.5 s | 5 | `raw/row_try1.mp3`, 0.0-0.16 s | 0.139 s | onset (0.0 s) |
| grow | the to-do list (s02), the bars (s06) | A short soft rising swell, a gentle airy whoosh rising upward. | 1.0 s | 10 | `raw/grow_try1.mp3`, 0.0-0.9 s | 0.728 s | onset (0.0 s) |
| drawer | emails landing in drawers (s07) | A small wooden drawer sliding shut and closing softly. | 0.9 s | 9 | `raw/drawer_try1.mp3`, 0.0-0.85 s | 0.793 s | peak (0.38 s) |
| bubble | the chat answer (s07) | A soft rounded chat message blip, one gentle bubble pop. | 0.5 s | 5 | `raw/bubble_try1.mp3`, 0.0-0.15 s | 0.122 s | onset (0.0 s) |
| roll | the agent token out and back (s08) | A small plastic wheel rolling briefly across a wooden table. | 1.2 s | 12 | `raw/roll_try1.mp3`, 0.0-0.95 s | 0.95 s | onset (0.0 s) |
| type | the avatar typing (s09) | Four soft key taps on a quiet laptop keyboard. | 0.9 s | 9 | `raw/type_try1.mp3`, 0.0-0.86 s | 0.791 s | onset (0.0 s) |
| click | every cursor press (s05, s09, s10) | A single soft computer mouse click. | 0.5 s | 5 | `raw/click_try1.mp3`, 0.14-0.26 s | 0.052 s | onset (0.0 s) |
| send | Send (s09) | A short bright soft swish, a quick airy swoosh. | 0.7 s | 7 | `raw/send_try1.mp3`, 0.2-0.68 s | 0.179 s | peak (0.045 s) |
