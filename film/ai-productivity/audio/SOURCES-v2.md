# Version 2 sound: sources and how to rebuild it

The version 2 film's sound is `video/public/mix-v2.wav`: 48 kHz, 16-bit stereo, exactly 2415 frames
(80.5 s). Version 1's sound (`make_mix.py`, `mix.wav`, `music/score.py`) is not changed.

## Rebuild and check

```
python3 audio/make_mix_v2.py && python3 audio/verify_mix_v2.py
```

Rerun both whenever a scene's cue file in `video/timeline/cues-v2/` changes. A missing cue file is
skipped, and the checker fails if the mix is older than the cue files. Stems and `report.json` are
written to `audio/mix/v2/` (git-ignored, with version 1's).

## What is in the mix

- **Voice:** the ten version 2 lines (`audio/voice/lines-v2/lineNN.wav`, Matilda, speed 0.88), each
  starting on its frame in `video/timeline-v2.json`, through version 1's voice chain. ElevenLabs
  text-to-speech, **Free plan**.
- **Sound effects:** every cue in `cues-v2/sNN.json`, from the 16 effects in `audio/foley/` (see
  `audio/foley/SOURCES.md`). ElevenLabs Sound Effects, **Free plan**. A cue's gain is an offset
  from that sound's usual level. Fast repeats of one sound in a scene (the unread counter, the
  meetings landing, the buzzword ticks) are made a little quieter, and repeats less than 4 frames
  apart are dropped. On the last run, 8 of 129 cues were dropped: 4 meeting clicks and 4 buzzword
  ticks in s02. The `type` sound plays once, or stops where the scene's next typing cue starts.
- **Music:** a placeholder pad (`audio/music/score_v2.py`), made by the script, because the
  ElevenLabs key has no music permission. It is in C major at 120 bpm, with every note on the
  frame grid (beat n at film frame 15n). Every note is in equal temperament, with no detuned
  chorus voices.
- **Room tone:** barely audible, everywhere except the silent beat.

## The music's shape

| Where | Frames | What plays |
|---|---|---|
| s01 | 0-224 | Sparse but restless: a dark pad and marimba eighths with the filter closed (chords Am F C G) |
| s02 | 225-479 | Busier: a plucked bass joins, the filter opens, and the last beat of every bar fills with sixteenths |
| Silent beat | 480-494 | Nothing at all. Every part is exactly zero, tails included |
| s03 | 495-629 | Starts with the title. Brighter and calmer: an open pad and marimba quarter notes (C F G Am) |
| s04 to s09 | 630-2144 | One gentle layer more in each scene: bass, shaker, high pad, soft kick, bell, soft snaps |
| s10 | 2145-2414 | Drums and bell out, and quieter. The final C major chord lands at frame 2355 (s10 local 210) and rings into the fade |

The music is about 6 dB quieter whenever the voice speaks, and 1 to 2.5 dB quieter under each
sound effect. The master is set to -14 LUFS integrated, with a true-peak limiter at -1.5 dBTP.
The last frame is silent.

## Measured, not heard

Nobody has listened to this mix. `verify_mix_v2.py` measures it. On the last run it found:

- Loudness: -13.9 LUFS integrated and -3.1 dBTP true peak (ffmpeg ebur128). Nothing clips.
- The silent beat: frames 480-494 are exactly zero in the mix and in every stem.
- Voice and cues: every voice line and every cue lands on its frame (within 1 ms).
- Music level: the music is 6.0 to 7.1 dB quieter while the voice speaks, and the voice is 15 to
  21 LU above it.
- Music timing and shape: 120 bpm on the grid (+1.2 ms), busy then calm, darker then brighter,
  one layer more in each feature scene, and the final chord within 1.3 ms of frame 2355.
- Possibly masked: 12 quiet cues may be covered by the music. These are mostly the `tick`
  sounds in s02, s07 and s08, plus the s10 opening pop. The checker lists them each run.

## Licence

The voice and the sound effects come from the ElevenLabs **Free plan**, which includes no
commercial licence. Before the film is shown outside, regenerate them on a paid plan with the same
settings (`audio/voice/tts.py`, `audio/foley/sfx.py`). Replace the placeholder music with a licensed
or paid-plan track: save it as `audio/music/track.wav`. Version 1 already reads that file;
`make_mix_v2.py` would need the same switch added.
