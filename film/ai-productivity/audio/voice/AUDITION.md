# Voice audition

Three premade ElevenLabs voices (the Free plan key cannot list the library, so these are known
premade IDs), each reading the opening and the closing line once, `eleven_multilingual_v2`,
identical settings (stability 0.55, similarity 0.75, style 0, speaker boost on, speed 1.0, seed
4711). Files: `auditions/<voice>_open.mp3` and `auditions/<voice>_close.mp3`, each with its
timestamps JSON. Measured with ffprobe and `measure.py` (speech span from the audio, pauses from the
character timestamps); nobody listened, so the choice is by numbers and each voice's known character.

| Voice | ID | Known character | Open: length / pace | Close: length / pace | Pause at the full stop / comma | Clean start and end |
|---|---|---|---|---|---|---|
| Matilda | `XrExE9yKIg1WjnnlVkGX` | warm, friendly, American, audiobook | 4.37 s / 3.5 words a second | 4.78 s / 3.4 w/s | 0.38 s / 0.17 s | yes (−88 dB first and last 10 ms) |
| Eric | `cjVigY5qzO86Huf0OWal` | smooth, friendly, American | 3.95 s / 4.0 w/s | 4.13 s / 4.1 w/s | 0.32 s / 0.02 s | yes (−86 dB) |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | soft, reassuring, American | 4.13 s / 3.6 w/s | 4.64 s / 3.4 w/s | 0.33 s / 0.12 s | start slightly hot (−69 dB in the first 10 ms), speech begins at 30 ms |

**Winner: Matilda.** Clearest of the three by the numbers: the most unhurried pace (3.4 to 3.5
words a second) with real pauses at the full stop and the comma, so every phrase sits apart; warm
and friendly by character, with no announcer push. Eric runs the closing line's "time, money" comma
together (0.02 s); Sarah is close but starts hotter.

"Claude" is not in either audition line; it is checked in line 4's timestamps (see `lines/`).
Before the film is shown outside: regenerate the same lines with the same voice and settings on a
paid plan (`tts.py`, same seed) for the commercial licence.

## After the choice

- The first full read at speed 1.0 ran at about 3.5 words a second (about 210 words a minute):
  clear but not unhurried, and 42 s of voice in a 77 s film. All ten lines were re-rendered once at
  **speed 0.88** (every other setting unchanged): about 3.0 words a second, 0.44 s at the full stops,
  48 s of voice. Those are the final lines; the speed 1.0 takes are in `lines/takes/*_speed100.*`.
- Lines 7 ("Sort the inbox…") and 8 ("Send an agent…") begin with an "S" that the model starts at
  full level on the very first sample. Each got its two retries (seed 4712, then the slower pace);
  line 8 now fades in cleanly, line 7 still starts on the "S" (−38 dB in the first 10 ms, the gentlest
  of its three takes). The 8 ms fade-in on every `lineNN.wav` removes any click; the "S" is intact.
- "Claude" reads as one clean word in line 4's timestamps (0.35 to 0.64 s, 0.29 s long). "Kingdom" is
  not spoken anywhere in the script (it is on the end card only).
