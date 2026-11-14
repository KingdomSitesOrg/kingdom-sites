# Cafe app: script

A 14.5-second kinetic stop-motion ad for Kingdom Sites custom apps, aimed at coffee shops and
bakeries. Vertical 1080x1920, 30 frames a second, everything moving in poses at 12 a second
(a pose holds 2.5 frames) with a slight per-pose wobble, paper cut-outs with hard shadows and a
paper grain that changes every two poses. No narrator; it reads with the sound off.

Thomas, 2026-11-14: "less like a video and more like a kinetic stop motion graphic quick font
kinetic hyper moving hyper engaging ad ... specifically for mobile apps and targeted towards coffee
shops and bakeries max 12 seconds".

Draft 2 (Thomas, 2026-11-14, after draft 1: "this is perfect, but just you can make it a little
bit longer, but just add like through rewards and a seamless experience you will retain more
customers Or something that's fun and works with your vibe"): one 3-second payoff card before the
end card. The rest of the words are Claude's first draft, which Thomas called perfect. No prices, numbers,
client names or logos; "Your Café" is a stand-in name on the demo app.

## Words and beats (a beat is 15 frames, 0.5 s)

| Frames | Seconds | Ground | On screen | What moves |
|---|---|---|---|---|
| 0-75 | 0.0-2.5 | terracotta | COFFEE / SHOP? / BAKERY? | letters stamp in one per pose; a takeaway cup slides up and lands (0.5 s), a croissant hops in (1.5 s) |
| 75-135 | 2.5-4.5 | blue | GET YOUR / OWN APP. | a phone drops in (3.0 s); the café's icon stamps onto its home screen (3.5 s); the pointer taps it (4.0 s) and it opens |
| 135-180 | 4.5-6.0 | cream | ORDER / AHEAD. | the pointer taps "Order ahead" (5.0 s); a "Ready for pickup" ticket drops in (5.5 s) |
| 180-240 | 6.0-8.0 | terracotta | STAMP / CARDS. | a rubber stamp thumps five cups onto the card, the sixth is FREE (7.5 s); FREE COFFEE! |
| 240-292.5 | 8.0-9.75 | ink | FRESH-BAKED / ALERTS. | a lock-screen notification drops in (8.5 s): "Warm croissants just came out of the oven."; three croissants hop on |
| 292.5-382.5 | 9.75-12.75 | blue | SWEET REWARDS + SMOOTH ORDERS / KEEP THEM / COMING / BACK. | the cup and the croissant walk off the left edge, then come back in from the right and land as BACK. stamps in (12.0 s) |
| 382.5-435 | 12.75-14.5 | paper | APPS FOR CAFÉS & BAKERIES / KINGDOM / SITES / kingdom-sites.com | the music's last hit bursts paper bits out; the name stamps in; the pointer clicks the address (13.75 s); fade to black |

## Sound

- Music: one ElevenLabs track (`audio/music.py`, prompt kept there): 120 BPM plucked strings,
  marimba, upright bass, claps on 2 and 4, kick on 1 only, no shaker. Trimmed 40 ms so its beats
  sit on the film's grid; its 6-9 s section plays twice (from 9 s) so its own final hit lands with the end card at 12.75 s. Measured, not
  listened to.
- Effects only where something real happens, under the music: cut-outs landing (soft pops, and
  one when the cup and croissant come back), the
  phone landing (a low thump), taps, five stamp thumps, the notification, the final click. No
  swishes. Short clips reused from the kinetic promo's `audio/raw`.
- Mix: `npm run mix` -> `video/public/mix.wav`, -14 LUFS, true peak under -1 dBTP.

## Commands (in `video/`)

- `npm run stills 50,170` check stills, `npm run draft` half-size draft with sound (about 6 s),
  `npm run final` full size, only after Thomas says so.
- `node tools/flashcheck.mjs ../draft/cafe-app-draft-540x960.mp4` photosensitivity check.
