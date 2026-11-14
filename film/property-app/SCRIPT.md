# Property app: script

A 15.5-second kinetic stop-motion ad for Kingdom Sites custom apps, aimed at small and medium
property management companies with many renters. A sibling of the café ad (`../cafe-app`): same
look, same timing, same music and sound cues; new pictures and words. Vertical 1080x1920, 30 fps,
poses at 12 a second.

Thomas, 2026-11-14, after the café ad: "do the exact same thing and build one for property
management organizations like https://stewartproperty.net/ Or other small to medium sized
property management people where they have a lot of renters managing things Etc."

Words are Claude's first draft. "Your Rentals" is a stand-in name on the demo app; the rent
amount, the dates and the water notice are made-up demo content. No client names or logos.

## Words and beats (a beat is 15 frames, 0.5 s)

| Frames | Seconds | Ground | On screen | What moves |
|---|---|---|---|---|
| 0-75 | 0.0-2.5 | green | PROPERTY / MANAGER? / LOTS OF RENTERS? | a house slides up and lands (0.5 s), a key hops in (1.5 s) |
| 75-135 | 2.5-4.5 | blue | GET YOUR / OWN APP. | a phone drops in; the company's icon (green tile, white house) stamps onto the home screen; the pointer taps it |
| 135-180 | 4.5-6.0 | cream | PAY RENT / IN A TAP. | December rent card; the pointer taps "Pay rent" (5.0 s), it turns "Paid"; "Payment received" drops in (5.5 s) |
| 180-240 | 6.0-8.0 | green | FIX-IT / REQUESTS. | a repair request with a photo of a dripping tap; a rubber stamp checks off Photo sent, Request received, Plumber booked, On the way, Fixed, then thumps FIXED! (7.5 s) |
| 240-292.5 | 8.0-9.75 | ink | BUILDING / ALERTS. | a lock-screen notice drops in (8.5 s): "Water is off Tuesday, 9 to 11 AM, for pipe repairs."; three houses hop on |
| 292.5-382.5 | 9.75-12.75 | blue | ONLINE RENT + FAST REPAIRS / FEWER CALLS. / HAPPIER / RENTERS. | a ringing office phone walks off the left edge for good; a smiling house walks in from the right and lands as RENTERS. stamps in (12.0 s) |
| 382.5-465 | 12.75-15.5 | paper | APPS FOR PROPERTY MANAGERS / KINGDOM / SITES / kingdom-sites.com | paper burst on the music's last hit; the card holds a second; the pointer clicks the address; fade to black |

## Sound

Same track and mix as the café ad (`audio/raw/music_gen1.mp3`, `video/tools/mix.mjs`); the
actions sit on the same frames, so every cue lines up. Measured, not listened to.

## Commands (in `video/`)

- `npm run stills 50,170`, `npm run draft` (half size), `npm run final` only after Thomas says so.
- `node tools/flashcheck.mjs ../draft/property-app-draft-540x960.mp4`.
