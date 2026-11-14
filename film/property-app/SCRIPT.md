# Property app: script

A 15.5-second kinetic stop-motion ad for Kingdom Sites custom apps, aimed at small and medium
property management companies with many renters. A sibling of the café ad (`../cafe-app`): same
look, same timing, same music and sound cues; new pictures and words. Vertical 1080x1920, 30 fps,
poses at 12 a second.

Thomas, 2026-11-14, after the café ad: "do the exact same thing and build one for property
management organizations like https://stewartproperty.net/ Or other small to medium sized
property management people where they have a lot of renters managing things Etc."

Draft 2 (Thomas, same day: "again less shaking, a little bit faster and a few more change ups
from the last one for the coffee one. This seems like it's just a copy"): its own music at
150 BPM; every move 1.25x faster (12.2 s); half the wobble, changing half as often, letters still
once landed, no camera roll or beat kick; a new opening, app scene, rent, repair, alert and payoff,
built on an apartment building; scenes slide in as paper panels instead of cutting. The end card
stays the same across the series.

Draft 3 (same day: "too fast ... I can't actually really read what's going on. Slow it down by
like 10 or 20%"): picture and music 17% slower, 128.6 BPM, 14.2 s. Draft 4 ("Slower still"):
the café ad's pace, 120 BPM, 15.3 s. Draft 5 (on draft 4: "I can't tell the difference the big
thing is the rent, the leak, all those little message, those need to stay longer. Each frame just
needs to stay a little bit longer before transitioning"): back to draft 3's pace, and the hook,
rent, repair and alert scenes each hold 30 units (0.93 s) longer once their action is done; the
"Payment received" note drops in below the amount instead of over it. 18.0 s.

Words are Claude's. "Your Rentals" is a stand-in name; the rent amount, dates and water notice
are made-up demo content. No client names or logos.

## Words and beats

Scene units: a beat is 15 units, a pose 2.5 (the café grid); the film plays them at 15/14 of
that, 128.6 BPM, a beat every 14 frames (0.47 s). The scene code keeps the draft-2 clock and
`SCENES` in scenes.tsx shifts each scene by the holds before it; the units below are the film's.

| Units | Seconds | Ground | On screen | What moves |
|---|---|---|---|---|
| 0-105 | 0.0-3.3 | navy | PROPERTY / MANAGER? / LOTS OF RENTERS? | an apartment building lands, its windows light up two a pose, renters' bubbles pop out: Rent? Leak! Keys? Noise! Parking?; held |
| 105-165 | 3.3-5.1 | blue, slides up | GET YOUR / OWN APP. (below the phone) | a phone rises, every bubble flies into it, the company's app opens on its splash screen |
| 165-255 | 5.1-7.9 | cream, slides in from the right | PAY RENT / IN A SWIPE. | December rent; the pointer drags "Slide to pay" across, it turns green "Paid"; "Payment received" drops in; held |
| 255-345 | 7.9-10.7 | green, slides in from the left | FIX-IT / REQUESTS. (below) | the camera frames a dripping tap, the pointer snaps it; status Sent, Plumber booked, On the way while a van drives over stop by stop; FIXED!; held |
| 345-420 | 10.7-13.1 | ink, slides down | BUILDING / ALERTS. | a notice drops in ("Water is off Tuesday, 9 to 11 AM, for pipe repairs.") and a bell lands in every window; held |
| 420-495 | 13.1-15.4 | blue, slides in from the right | ONLINE RENT + FAST REPAIRS / FEWER CALLS. / HAPPIER / RENTERS. | a ringing office phone squashes away; the building comes back and every window smiles |
| 495-577.5 | 15.4-18.0 | paper, cut on the music's hit | APPS FOR PROPERTY MANAGERS / KINGDOM / SITES / kingdom-sites.com | paper burst; the card holds; the pointer clicks the address; fade to black |

## Sound

- Music: its own ElevenLabs track (`audio/music.py`, generation 2): 150 BPM funky bass, muted
  guitar, glockenspiel, snaps. Trimmed 0.245 s so its beats sit on the grid, bars 5.2-8.4 s
  played twice so it covers the holds, then slowed to 128.6 BPM with the picture (pitch kept);
  its big hit lands with the end card at 15.4 s. `video/tools/beats.mjs` measures tempo, phase
  and hits. Measured, not listened to.
- Effects under the music only where something happens (`video/tools/mix.mjs`, cues on the
  draft-2 clock, moved by the holds).

## Commands (in `video/`)

- `npm run stills 50,170`, `npm run draft` (half size), `npm run final` only after Thomas says so.
- `node tools/flashcheck.mjs ../draft/property-app-draft-540x960.mp4`.
