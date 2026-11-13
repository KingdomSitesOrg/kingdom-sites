# Reach out: script

An 18.7-second tile-mural ad for Kingdom Sites custom apps, in the style of "Bend reality"
(`film/bend-reality` on the `film/ai-keep-up-mural` branch, which is left untouched). Vertical
1080x1920, 30 frames a second, 224 stop-motion steps at 12 a second (560 frames).

Thomas, 2026-11-13: "make it even more in capturing when they first see it. Have it even have a
weirder illusion and make it a little bit shorter, and this time have it be like a hand coming
out, and it looks like it's reaching out into you, and then the camera switches around and it's
all the mirrors rearrange until like a laptop ... and then have the mural hand just quickly tap a
thing on the laptop and then have it turn into a custom app, and then have it floating, and then
have a sort of explode and have kingdom site say, get your custom app today".

Everything on screen is a small square tile on a dark ground, the same 360 by 640 wall as Bend
reality (2 px tiles in 3 px cells). One body of tiles, no cuts.

## The one idea

A hand made of the illusion's tiles reaches out of the phone at you, the illusion's pieces become
a laptop, one tap turns it into an app, and the app bursts into the offer.

## On-screen words (the only words in the film)

| In (lands) | Out | Words | Reading time needed (0.45 s a word + 1 s) |
|---|---|---|---|
| 14.00 s | 18.17 s (fades by 18.67 s) | KINGDOM SITES / GET YOUR / CUSTOM APP / TODAY. | 7 words: 4.15 s, held 4.17 s |

## Beat sheet

Steps are 1/12 s; the music is 120 BPM, so a beat is every 6 steps (0.5 s) and a bar every 2 s.

| Seconds | Step | What happens | On the beat |
|---|---|---|---|
| 0.00 | 0 | **The hook, from frame one, at full strength:** a counter-rotating ring tunnel. Every ring is cut into checker cells, alternate rings turn opposite ways, the rings wobble into a three-lobed shape and stream outward at you. No build-in. | music starts at full energy |
| 0.33 to 4.00 | 4 to 48 | **The hand.** A hand made of mural tiles comes out of the hole in the middle, tiny and far, and grows toward the viewer (perspective: it speeds up as it nears), fingers spreading. The illusion's own lines run through it. The tunnel streams faster as it comes. | |
| 4.00 | 48 | The hand is huge, fingertips at the top edge, and its fingers close a little toward you, as if reaching out of the phone. Slight overshoot, then still. | bar line |
| 4.17 to 7.00 | 50 to 84 | **The camera swings around.** The illusion cracks into 48 mirror panels, each still showing the moving illusion. The camera swings far to one side and back while every mirror flips and flies to its place; they settle as a laptop seen from above and to the side: 24 make the screen, 24 the keyboard deck. The hand shrinks and turns as the camera moves, until it points down at the laptop. | lands 7.00 |
| 7.00 to 8.00 | 84 to 96 | The laptop rests. Its screen shows one bright button. The hand glides in and its fingertip settles over the button. The music drops to its break. | |
| 8.00 | 96 | **The tap.** The fingertip presses the button (the fingertip and the button shrink for two steps); a ring runs out across the screen. | bar line, music drops back in |
| 8.17 to 10.00 | 98 to 120 | **It turns into a custom app.** The hand pulls away. The screen's 24 panels flip over one by one and show an app; they rearrange from a wide laptop screen into a tall phone, while the keyboard's 24 panels flip and fly up into two more app screens fanned out behind it. The camera comes round to face it. | |
| 10.00 to 12.00 | 120 to 144 | **The app floats.** Three screens: the phone in front (a header, a card with a chart, two small cards, a list, a tab bar), a calendar screen and a messages screen behind it, each bobbing on its own. | |
| 12.00 | 144 | **The burst.** Every tile flies outward from the phone. | the track's final hit |
| 12.00 to 14.00 | 144 to 168 | Some of the bursting tiles curve back and gather into the words while the rest fly off; the ring tunnel returns dimly behind. The hit rings out. | |
| 14.00 | 168 | **KINGDOM SITES / GET YOUR / CUSTOM APP / TODAY.** lands, tiles closing solid for one step. | bar line, music back in |
| 14.00 to 18.17 | 168 to 218 | The words hold, swaying a tile with the beat, a band of larger tiles sweeping across them every second beat. | |
| 18.17 to 18.67 | 218 to 224 | The words and tunnel dim to dark. | |

## Music

The same generated track as Bend reality (`audio/music-raw.mp3`, 120 BPM, no new generation, no
cost), cut on beats by `video/tools/align-music.mjs`:

- 0 to 12 s: the track as generated (its own break at 7 to 8 s falls before the tap, and its
  second phrase drops in on the tap at 8 s).
- 12.0 s: the track's final hit (24.027 s in the file) on the burst, ringing out to 14 s.
- 14.0 to 18.67 s: the track from 19 s (the run into its loudest bar), fading over the last 0.6 s.

Music only, no effects, mixed to about -16 LUFS with a 3 dB rise to the words (`npm run mix`).
Nobody has listened to it; the timing is measured.

## Photosensitivity

The illusion and the app screens use dim tones; only the words, the button and small accents are
bright. The hand and screens grow and change over seconds, not steps. Measured on the finished
file: `final/flash-check.txt`.

## How to work on it

```
cd film/reach-out/video        # node_modules is a link to film/mural-promo's
npx remotion studio            # live preview
npm run stills -- 0,60,120     # half-size check stills into ../draft
npm run music && npm run mix   # music cut and mix -> build/mix.wav
npm run final                  # full-size film into ../final
```

## Version 2 (Thomas's notes, 2026-11-13: "that's perfect", with six changes)

This replaces the timings, colours and music above; the first cut is kept in `v1/`.

1. **New colours**, so it does not look like Bend reality: midnight blue ground, a blue and amber
   ring tunnel, an ice-blue hand, gold accents and button, cyan and orchid in the app, a cool
   steel foot. Same dim tones, so it stays inside the flash limits.
2. **Music, a variation:** the same track two semitones higher at the same tempo, warmer and with a
   light chorus, plus a new shaker on every sixteenth note and a clap on beats 2 and 4. Same beat
   and hits. No new generation, nothing paid. Nobody has listened to it.
3. **The button says PUBLISH**, readable; the fingertip presses its lower right, clear of the word.
4. **The app is an iPhone:** steel rim, black bezel, rounded corners, a Dynamic Island.
5. **The hand comes sooner:** visible from about 0.1 s and clearly a hand by 0.7 s.
6. **Quicker:** 15.67 s (188 steps) instead of 18.67 s; nothing cut, every beat shorter.

| Seconds | What happens | Music |
|---|---|---|
| 0.0 | Ring tunnel at full strength; the hand starts out of the hole | track from its start |
| 3.0 | The hand is nearest, reaching out | bar line |
| 3.17 to 5.5 | Camera swings, mirrors fly into the laptop | |
| 5.5 to 6.5 | Laptop rests; the hand glides in | the track's break |
| 6.5 | The fingertip presses PUBLISH | second phrase drops in |
| 6.67 to 8.0 | Screen flips into the iPhone app, two screens behind | |
| 8.0 to 9.5 | The app floats | |
| 9.5 | Burst | final hit, ringing out |
| 11.0 to 15.17 | KINGDOM SITES / GET YOUR / CUSTOM APP / TODAY. (4.17 s) | track from 19 s, fading at the end |

## Version 3 (Thomas's notes on v2)

This replaces the v2 timings from 8 s on; v2 is kept in `v2/`. Everything before 8 s is as v2.

1. **Carousel:** the app holds longer and shows off on three devices on a turning ring: the
   iPhone, an iPad (a sidebar beside the same app) and a Duo (two screens opened like a book, the
   app spanning both). Each turns to the front and holds for a moment (8.0 to 11.0 s), then the
   ring keeps turning, dimmed, behind the message.
2. **Dynamic Island whole:** the rounded-box helper now caps its corner radius at half the box's
   height; it was clipping the island's top half. The island sits well inside the screen top.
3. **Lighter colours:** the same midnight blue, amber and ice blue, lifted (the ground is
   #162136, was #070B14).
4. **The message, said plainly:** YOU NEED A / BEAUTIFUL, / STUNNING / CUSTOM APP / FOR YOUR /
   BUSINESS. gathers out of the devices at 11.0 s and holds 5.5 s (10 words at 0.45 s a word
   plus 1 s), then bursts into KINGDOM SITES / GET YOUR / CUSTOM APP / TODAY. (4.17 s).

Length 22.17 s (266 steps). Music: as v2 (the varied track), with the track from 8 s to 18 s under
the carousel and message, the final hit on the burst at 16.5 s, and the end words from 17.5 s.

| Seconds | What happens |
|---|---|
| 0 to 8.0 | as v2 (tunnel, hand by 0.7 s, mirrors into laptop, PUBLISH tap at 6.5, the app) |
| 8.0 to 11.0 | carousel: iPhone, iPad, Duo, each to the front in turn |
| 10.25 to 11.0 | the message gathers out of the devices, which dim behind it |
| 11.0 to 16.5 | YOU NEED A BEAUTIFUL, STUNNING CUSTOM APP FOR YOUR BUSINESS. |
| 16.5 | burst on the music's final hit |
| 17.5 to 21.67 | KINGDOM SITES / GET YOUR / CUSTOM APP / TODAY. |
| 21.67 to 22.17 | dims to the end |

## Version 4 (Thomas's notes on v3)

v3 is kept in `v3/`. Timings are as v3 (22.17 s).

1. **The foldable is one screen:** the Duo's two separate screens are now one folding screen (a
   faint crease down the middle, one bezel round both halves), showing the app with its sidebar.
2. **Music, cleaner:** v3's pitch shift, chorus and shaker/clap layer are gone (they made it sound
   broken); it is the clean track, re-arranged.
3. **Light theme:** a light ground (#E9EEF5) with a deep steel-blue foot; the tunnel in pale blue
   and amber; navy, amber and blue words; the devices in light mode (white screens, silver
   bodies, black bezels and Dynamic Island); a darker silver laptop with a dark edge. The tunnel's
   contrast was measured against the flash check before it was settled.
4. **Breaks in the music:** a dead stop at 6.0 s, a beat before the tap; at 6.5 s a small click
   alone in the silence as the fingertip presses PUBLISH (a crisp tick over a soft low thock,
   then a quieter one as the button springs back); the music drops back in at 7.0 s. A second dead
   stop at 16.0 s, a beat before the burst, which lands on the final hit at 16.5 s. The picture's
   beat pulse rests during both breaks.

## Version 5 (Thomas's notes on v4)

v4 is kept in `v4/`. Timings as v4.

1. **Deeper contrast.** The message and end words are deep navy (#0E1E38), a richer amber
   (#C26A00) and a deeper blue (#0A5FA8), and their tile gaps are a darker shade of each letter, so
   the words read solid. The devices fade out completely behind the message (no ghost). The
   tunnel's colours are more saturated at the same brightness. More tunnel brightness contrast
   was tried and measured 2.5 flashes in a second (limit 3), too close, so it was not used.
2. **A louder, firmer click** on the PUBLISH tap: a crisp snap, a woody knock and a low body, as
   loud as the music's peaks, alone in the break; then a smaller one as the button springs back.

## Version 6 (Thomas's notes on v5)

v5 is kept in `v5/`. Everything as v5 except the message, which is now two parts, and the
second break and the end, which come 1 s sooner. Length 21.17 s (254 steps).

| Seconds | What happens |
|---|---|
| 10.25 to 11.0 | YOU NEED A / BEAUTIFUL, / STUNNING gathers out of the devices, which fade out completely |
| 11.0 to 13.0 | part one stands (2.0 s) |
| 13.0 to 13.5 | part one melts outward as part two gathers |
| 13.5 to 15.5 | CUSTOM APP / FOR YOUR / BUSINESS. stands (2.0 s) |
| 15.0 | the music stops dead |
| 15.5 | burst on the final hit |
| 16.5 to 20.67 | KINGDOM SITES / GET YOUR / CUSTOM APP / TODAY. |

The message takes 4.5 s from the first part landing to the burst (v5: 5.5 s). Each part is held
for 0.3 s a word plus 0.5 s (the build checks it). The devices now fade to the ground's own
colour and stop drawing, so no faint shape is left behind the words.
