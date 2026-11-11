/* The page's clicks: short, quiet sounds made in the browser (no audio files),
   and a tiny buzz on phones that support it. Only ever played from a tap or a
   click, and switched off for good by the Sound switch in the header. */

const KEY = 'mural-sound'

type Kind = 'tick' | 'snap' | 'flip' | 'on'

let ctx: AudioContext | null = null
let on: boolean | null = null
const listeners = new Set<() => void>()

/** For the Sound switch: tells it when the setting changes. */
export function watchSound(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function soundOn(): boolean {
  if (on === null) {
    try {
      on = localStorage.getItem(KEY) !== 'off'
    } catch {
      on = true
    }
  }
  return on
}

export function setSound(next: boolean) {
  on = next
  try {
    localStorage.setItem(KEY, next ? 'on' : 'off')
  } catch {
    /* Private windows may refuse storage; the switch still works for this visit. */
  }
  listeners.forEach((listener) => listener())
  if (next) play('on')
}

/** A pitched blip that falls fast, like a key bottoming out. */
function blip(ac: AudioContext, at: number, from: number, to: number, length: number, level: number, type: OscillatorType = 'triangle') {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(to, at + length)
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain).connect(ac.destination)
  osc.start(at)
  osc.stop(at + length + 0.01)
}

/** The dry "tk" on top: a few milliseconds of hiss. */
function hiss(ac: AudioContext, at: number, length: number, level: number) {
  const frames = Math.max(1, Math.floor(ac.sampleRate * length))
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = ac.createBufferSource()
  const filter = ac.createBiquadFilter()
  const gain = ac.createGain()
  filter.type = 'highpass'
  filter.frequency.value = 2600
  gain.gain.value = level
  src.buffer = buffer
  src.connect(filter).connect(gain).connect(ac.destination)
  src.start(at)
}

export function play(kind: Kind = 'tick') {
  if (typeof window === 'undefined' || !soundOn()) return
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    const at = ctx.currentTime + 0.001
    if (kind === 'tick') {
      blip(ctx, at, 1700, 700, 0.03, 0.05)
      hiss(ctx, at, 0.012, 0.035)
    } else if (kind === 'snap') {
      blip(ctx, at, 520, 150, 0.06, 0.1, 'sine')
      blip(ctx, at, 2100, 900, 0.02, 0.03)
      hiss(ctx, at, 0.018, 0.05)
    } else if (kind === 'flip') {
      blip(ctx, at, 300, 120, 0.07, 0.09, 'sine')
      hiss(ctx, at + 0.05, 0.014, 0.04)
      blip(ctx, at + 0.05, 1500, 600, 0.03, 0.04)
    } else {
      blip(ctx, at, 900, 880, 0.04, 0.04)
      blip(ctx, at + 0.06, 1350, 1300, 0.05, 0.04)
    }
  } catch {
    /* A browser that will not play sound just stays silent. */
  }
  try {
    navigator.vibrate?.(kind === 'tick' ? 6 : 10)
  } catch {
    /* No buzz on this device. */
  }
}
