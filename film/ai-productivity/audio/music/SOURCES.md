# Music: sources

**The film's music tonight is the placeholder bed (`score.py`), not ElevenLabs Music.** The night's
key was refused by the music endpoint: HTTP 401, "missing the permission music_generation"
(2026-11-05, logged in `audio/credits.jsonl`, 0 credits). A missing permission is not something a
retry fixes, so per PLAN.md Fallbacks the music is a soft placeholder pad on the grid.

## The placeholder (`score.py`, synthesised by `make_mix.py` on every run)

- C major, one chord a bar (C, Am, F, G), 120 bpm, notes on the frame grid (beat n at film frame
  15n + 1, eighths between). Equal temperament, A = 440 Hz: nothing detuned, nothing "bad".
- Shape read from `video/timeline.json` every run: felt pad and sparse marimba under s01; plucked
  bass and marimba eighths with the filter opening under s02; nothing in the silence (frames 466
  to 480); brighter from the sweep (481); one layer more at each feature scene (s04 shaker, s05 soft
  kick, s06 high pad, s07 soft snaps on 2 and 4, s08 glockenspiel, s09 all); drums out under the
  end card (s10); a C major chord on the music table's final-chord frame (2281) ringing into the end.
- Instruments come from the Farzana v3 film's `score3.py`.
- Measured, not heard: tempo 120 bpm (eighth-note onsets fit 240 per minute), onsets on average
  6.5 ms after the grid, unducked loudness per scene s01 -27.8, s02 -25.2, s03 -22.7, s04 -22.6,
  s05 -22.3, s06 -21.8, s07 -22.0, s08 -21.7, s09 -21.6, s10 -24.0 LUFS (`audio/verify_mix.py`).

## Getting the real track later

`music.py` is ready for a key with the music permission (paid plan, for the commercial licence):
`music.py plan` prints the composition plan built from timeline.json (11 sections: Intro, Build,
Turn, Layer 1 to 6, Settle, Final chord; 80 s; 120 bpm; instrumental, major, never detuned), and
`music.py full --gen 2` generates it (at most three generations; read the first one's cost from the
`character-cost` header before the second). Line the track up so a downbeat falls on film frame 1,
save it as `audio/music/track.wav`, and rerun `python3 audio/make_mix.py`: the mix uses the track
instead of the placeholder and still cuts the silence and the ending to the film.
