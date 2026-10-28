'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

/* Bunny Stream video cost calculator. Prices read from bunny.net/pricing/stream,
   /storage and /cdn on 2026-10-23 and checked again 2026-10-28 (unchanged).
   Library defaults follow the current library: 240p to 1080p, stored in three
   regions, no kept originals and no MP4 copies (both switched off 2026-10-25). */

type Quality = '480p' | '720p' | '1080p' | 'mix'
type Rendition = { kbps: number; on: boolean }

type State = {
  videos: number
  minutes: number
  people: number
  perWeek: number
  pct: number
  quality: Quality
  pRegion: number
  pExtra: number
  regions: number
  d1: number
  d2: number
  d3: number
  encode: number
  newMin: number
  minimum: number
  rend: Record<string, Rendition>
  mp4: boolean
  orig: boolean
  origKbps: number
  extraMB: number
  m1080: number
  m720: number
  m480: number
  weeks: number
}

type NumKey = { [K in keyof State]: State[K] extends number ? K : never }[keyof State]

const DEFAULTS: State = {
  videos: 250,
  minutes: 20,
  people: 200,
  perWeek: 3,
  pct: 80,
  quality: '1080p',
  pRegion: 0.01,
  pExtra: 0.005,
  regions: 3,
  d1: 0.005,
  d2: 0.004,
  d3: 0.002,
  encode: 0,
  newMin: 0,
  minimum: 1,
  rend: {
    '240p': { kbps: 600, on: true },
    '360p': { kbps: 800, on: true },
    '480p': { kbps: 1400, on: true },
    '720p': { kbps: 2800, on: true },
    '1080p': { kbps: 5000, on: true },
    '1440p': { kbps: 8000, on: false },
    '2160p': { kbps: 25000, on: false },
  },
  mp4: false,
  orig: false,
  origKbps: 8000,
  extraMB: 25,
  m1080: 50,
  m720: 40,
  m480: 10,
  weeks: 52 / 12,
}

const KEY = 'ks-video-cost-v1'
const clone = (s: State): State => JSON.parse(JSON.stringify(s))

// kbps × seconds → GB (1 GB = 1e9 bytes).
const gbFrom = (kbps: number, seconds: number) => ((kbps * 1000) / 8) * seconds / 1e9

function compute(s: State) {
  const libMinutes = s.videos * s.minutes
  const storedKbps = Object.values(s.rend)
    .filter((r) => r.on)
    .reduce((a, r) => a + r.kbps, 0)
  const perMinuteKbps = storedKbps * (s.mp4 ? 2 : 1) + (s.orig ? s.origKbps : 0)
  const storageGB = gbFrom(perMinuteKbps, libMinutes * 60) + (s.videos * s.extraMB) / 1000
  const regionRate =
    s.regions <= 2 ? s.pRegion * s.regions : s.pRegion * 2 + s.pExtra * (s.regions - 2)
  const storage = storageGB * regionRate

  let viewKbps: number
  if (s.quality === 'mix') {
    const w = s.m1080 + s.m720 + s.m480 || 1
    viewKbps =
      (s.rend['1080p'].kbps * s.m1080 + s.rend['720p'].kbps * s.m720 + s.rend['480p'].kbps * s.m480) / w
  } else viewKbps = s.rend[s.quality].kbps
  const watchMinutes = s.people * s.perWeek * s.minutes * (s.pct / 100) * s.weeks
  const deliveryGB = gbFrom(viewKbps, watchMinutes * 60)
  const t1 = 500_000
  const t2 = 1_000_000 // GB
  const delivery =
    Math.min(deliveryGB, t1) * s.d1 +
    Math.max(0, Math.min(deliveryGB, t2) - t1) * s.d2 +
    Math.max(0, deliveryGB - t2) * s.d3
  const encoding = s.encode * s.newMin
  const usage = storage + delivery + encoding
  const topUp = Math.max(0, s.minimum - usage)
  const total = usage + topUp
  const perStudent = s.people ? total / s.people : 0
  return {
    storageGB,
    storage,
    viewKbps,
    watchMinutes,
    deliveryGB,
    delivery,
    encoding,
    topUp,
    total,
    perStudent,
    perStudentYear: perStudent * 12,
    perYear: total * 12,
  }
}

const money = (v: number) =>
  v >= 100
    ? '$' + Math.round(v).toLocaleString('en-US')
    : v >= 1
      ? '$' + v.toFixed(2)
      : v > 0
        ? v * 100 < 1
          ? '<1¢'
          : Math.round(v * 100) + '¢'
        : '$0'
const gb = (v: number) =>
  v >= 1000
    ? (v / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' TB'
    : v.toLocaleString('en-US', { maximumFractionDigits: v < 10 ? 1 : 0 }) + ' GB'
const n = (v: number) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })

/* A number box that lets the visitor type freely ("1.", "") while the
   calculator only ever sees a clean number. */
function NumberBox({
  id,
  value,
  onChange,
  className,
  label,
}: {
  id: string
  value: number
  onChange: (v: number) => void
  className: string
  label?: string
}) {
  const [text, setText] = useState(String(value))
  const [shown, setShown] = useState(value)
  if (value !== shown) {
    // Follow outside changes (the − / + buttons, a reset), but leave a
    // half-typed entry alone while it still means the same number.
    setShown(value)
    if (parseFloat(text) !== value && !(text === '' && value === 0)) setText(String(value))
  }
  return (
    <input
      id={id}
      aria-label={label}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '')
        setText(raw)
        const v = parseFloat(raw)
        onChange(isFinite(v) && v >= 0 ? v : 0)
      }}
      className={className}
    />
  )
}

const STEP_BTN =
  'flex min-h-[52px] items-center justify-center rounded-xl border border-line-strong bg-surface text-2xl font-medium text-ink transition-colors hover:border-ink'

function Stepper({
  id,
  label,
  value,
  by,
  max,
  unit,
  set,
}: {
  id: NumKey
  label: string
  value: number
  by: number
  max?: number
  unit: string
  set: (id: NumKey, v: number) => void
}) {
  const clamp = (v: number) => Math.max(0, max === undefined ? v : Math.min(max, v))
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-medium text-ink">
        {label}
      </label>
      <div className="grid grid-cols-[52px_1fr_52px] gap-2">
        <button
          type="button"
          className={STEP_BTN}
          aria-label={`${by} ${unit} less`}
          onClick={() => set(id, clamp(value - by))}
        >
          −
        </button>
        <NumberBox
          id={id}
          value={value}
          onChange={(v) => set(id, clamp(v))}
          className="min-h-[52px] w-full min-w-0 rounded-xl border border-line-strong bg-surface text-center text-[22px] font-semibold tabular-nums text-ink focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          className={STEP_BTN}
          aria-label={`${by} ${unit} more`}
          onClick={() => set(id, clamp(value + by))}
        >
          +
        </button>
      </div>
    </div>
  )
}

const SMALL_NUM =
  'min-h-[44px] w-full min-w-0 rounded-lg border border-line-strong bg-surface px-3 text-right text-base tabular-nums text-ink focus:border-accent focus:outline-none'

function KV({ id, label, value, set }: { id: NumKey; label: string; value: number; set: (id: NumKey, v: number) => void }) {
  return (
    <>
      <label htmlFor={id} className="min-w-0 text-[15px] text-body">
        {label}
      </label>
      <NumberBox id={id} value={value} onChange={(v) => set(id, v)} className={SMALL_NUM} />
    </>
  )
}

/* Numbers typed in earlier stay on this device only. They are read once, after
   the page has loaded, so the server and the first paint agree on the defaults. */
let savedOnce: string | null | undefined
const readSaved = () => {
  if (savedOnce === undefined) {
    try {
      savedOnce = localStorage.getItem(KEY)
    } catch {
      savedOnce = null
    }
  }
  return savedOnce
}
// Read before anything renders: the page writes its state back as it mounts.
if (typeof window !== 'undefined') readSaved()
const noSubscribe = () => () => {}

function fromSaved(saved: string | null): State {
  try {
    const s = JSON.parse(saved || 'null')
    if (s) return { ...clone(DEFAULTS), ...s, rend: { ...clone(DEFAULTS).rend, ...s.rend } }
  } catch {}
  return clone(DEFAULTS)
}

export default function Calculator() {
  const saved = useSyncExternalStore(noSubscribe, readSaved, () => null)
  return <CalculatorBody key={saved === null ? 'defaults' : 'saved'} initial={fromSaved(saved)} />
}

function CalculatorBody({ initial }: { initial: State }) {
  const [state, setState] = useState<State>(initial)
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const r = useMemo(() => compute(state), [state])
  const set = (id: NumKey, v: number) =>
    setState((s) => ({ ...s, [id]: id === 'regions' ? Math.max(1, Math.round(v)) : v }))

  const qText = state.quality === 'mix' ? 'a mix of 480p to 1080p' : state.quality
  const sentence = `About ${money(r.total)} a month for ${n(state.people)} students, each watching ${n(state.perWeek)} ${
    state.perWeek === 1 ? 'video' : 'videos'
  } a week (${n(state.minutes)} minutes long, ${n(state.pct)}% watched, in ${qText}), with ${n(state.videos)} videos in the library. That is about ${money(
    r.perStudent,
  )} per student a month (${money(r.perStudentYear)} a year), or ${money(r.perYear)} a year in total.`

  const summary = [
    'Video cost (Bunny Stream)',
    `Cost a month: ${money(r.total)}`,
    `  Streaming: ${money(r.delivery)} (${gb(r.deliveryGB)}, ${n(Math.round(r.watchMinutes / 60))} hours watched)`,
    `  Storage: ${money(r.storage)} (${gb(r.storageGB)} in ${state.regions} ${state.regions === 1 ? 'region' : 'regions'})`,
    `  Encoding: ${r.encoding > 0 ? money(r.encoding) : 'free'}`,
    ...(r.topUp > 0 ? [`  Monthly minimum top-up: ${money(r.topUp)}`] : []),
    `Per student: ${money(r.perStudent)} a month, ${money(r.perStudentYear)} a year`,
    `Per year: ${money(r.perYear)}`,
    '',
    sentence,
  ].join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied('done')
    } catch {
      setCopied('failed')
    }
    setTimeout(() => setCopied('idle'), 2000)
  }

  const reset = () =>
    setState((s) => ({
      ...clone(DEFAULTS),
      videos: s.videos,
      minutes: s.minutes,
      people: s.people,
      perWeek: s.perWeek,
      pct: s.pct,
      quality: s.quality === 'mix' || DEFAULTS.rend[s.quality].on ? s.quality : '1080p',
    }))

  const rows: [string, string, string][] = [
    ['Streaming', `${gb(r.deliveryGB)} a month, ${n(Math.round(r.watchMinutes / 60))} hours watched`, money(r.delivery)],
    ['Storage', `${gb(r.storageGB)} kept in ${state.regions} ${state.regions === 1 ? 'region' : 'regions'}`, money(r.storage)],
    ['Encoding', state.encode > 0 ? `${n(state.newMin)} new minutes a month` : 'Free on Bunny', r.encoding > 0 ? money(r.encoding) : '$0'],
  ]

  return (
    <div className="hero-wash min-h-screen min-h-dvh w-full overflow-x-clip px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 sm:mb-8">
          <p className="eyebrow eyebrow-blue">Kingdom Sites</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Video cost calculator
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-body">
            What class videos cost on Bunny Stream each month. Bunny prices as of 28 Oct 2026.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          {/* Result first: on a phone it sits on top, on a laptop it stays in view on the right. */}
          <section aria-live="polite" className="tile-elevated p-6 sm:p-8 lg:sticky lg:top-6 lg:order-2">
            <p className="text-[15px] text-muted">Cost per month</p>
            <p className="mt-1 text-6xl font-semibold leading-none tracking-tight tabular-nums text-ink sm:text-7xl">
              {money(r.total)}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[13px] text-muted">Per student, a year</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-ink sm:text-3xl">{money(r.perStudentYear)}</p>
                <p className="mt-0.5 text-[13px] text-muted">{money(r.perStudent)} a month</p>
              </div>
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[13px] text-muted">Per year, in total</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-ink sm:text-3xl">{money(r.perYear)}</p>
                <p className="mt-0.5 text-[13px] text-muted">12 months</p>
              </div>
            </div>

            <div className="mt-6 border-t border-line">
              {rows.map(([what, detail, amt]) => (
                <div key={what} className="flex justify-between gap-3 border-b border-line py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{what}</p>
                    <p className="text-[13px] text-muted">{detail}</p>
                  </div>
                  <p className="whitespace-nowrap font-medium tabular-nums text-ink">{amt}</p>
                </div>
              ))}
              {r.topUp > 0 && (
                <div className="flex justify-between gap-3 border-b border-line py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-warm">Monthly minimum</p>
                    <p className="text-[13px] text-muted">Bunny charges at least {money(state.minimum)} a month</p>
                  </div>
                  <p className="whitespace-nowrap font-medium tabular-nums text-warm">+{money(r.topUp)}</p>
                </div>
              )}
            </div>

            <p className="mt-5 text-pretty text-[16px] leading-relaxed text-ink">{sentence}</p>

            <button type="button" onClick={copy} className="btn-primary mt-5 w-full sm:w-auto">
              {copied === 'done' ? 'Copied' : copied === 'failed' ? 'Copy failed, select the text above' : 'Copy summary'}
            </button>
          </section>

          <div className="flex min-w-0 flex-col gap-5 lg:order-1">
            <section className="tile p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-ink">The numbers</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Stepper id="people" label="Students watching" value={state.people} by={50} unit="students" set={set} />
                <Stepper id="videos" label="Videos in the library" value={state.videos} by={10} unit="videos" set={set} />
                <Stepper id="minutes" label="Average video length, minutes" value={state.minutes} by={1} unit="minutes" set={set} />
                <Stepper id="perWeek" label="Videos each student watches a week" value={state.perWeek} by={1} unit="videos a week" set={set} />
                <Stepper id="pct" label="How much of each video they watch, %" value={state.pct} by={10} max={100} unit="percent" set={set} />
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <span id="qLbl" className="text-[15px] font-medium text-ink">
                  Quality they watch in
                </span>
                <div role="group" aria-labelledby="qLbl" className="grid grid-cols-4 gap-2">
                  {(['480p', '720p', '1080p', 'mix'] as Quality[]).map((q) => {
                    const disabled = q !== 'mix' && !state.rend[q].on
                    const pressed = state.quality === q
                    return (
                      <button
                        key={q}
                        type="button"
                        disabled={disabled}
                        aria-pressed={pressed}
                        onClick={() => setState((s) => ({ ...s, quality: q }))}
                        className={`btn-ghost-sm w-full ${pressed ? "is-active" : ""}`}
                        style={{ minHeight: 48, fontSize: 15 }}
                      >
                        {q === 'mix' ? 'Mix' : q}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[13px] text-muted">
                  {state.quality === 'mix'
                    ? `Mix: ${state.m1080}% 1080p, ${state.m720}% 720p, ${state.m480}% 480p, about ${n(Math.round(r.viewKbps))} kbps.`
                    : `${state.quality} streams at ${n(state.rend[state.quality].kbps)} kbps, about ${n(
                        gbFrom(state.rend[state.quality].kbps, 60) * 1000,
                      )} MB a minute. Big screens on good wifi pick 1080p; phones often drop lower.`}
                </p>
              </div>
            </section>

            <details className="tile group p-6 sm:p-8">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-lg font-semibold tracking-tight text-ink [&::-webkit-details-marker]:hidden">
                Assumptions
                <span className="text-[14px] font-medium text-accent group-open:hidden">Edit</span>
                <span className="hidden text-[14px] font-medium text-accent group-open:inline">Close</span>
              </summary>

              <div className="mt-4 flex flex-col gap-6">
                <p className="text-[13px] leading-relaxed text-muted">
                  Change any number here and the cost updates. Changes stay on this device. Prices from{' '}
                  <a className="link-accent" href="https://bunny.net/pricing/stream/" target="_blank" rel="noopener noreferrer">
                    bunny.net/pricing/stream
                  </a>
                  ,{' '}
                  <a className="link-accent" href="https://bunny.net/pricing/storage/" target="_blank" rel="noopener noreferrer">
                    /storage
                  </a>{' '}
                  and{' '}
                  <a className="link-accent" href="https://bunny.net/pricing/cdn/" target="_blank" rel="noopener noreferrer">
                    /cdn
                  </a>
                  . The library is set up with 5 qualities (240p to 1080p), stored in Germany plus New York and Los Angeles,
                  on Bunny&apos;s Volume network, with no kept originals and no MP4 copies. Encoding is free.
                </p>

                <Group title="Storage">
                  <KV id="pRegion" label="Per GB a month, each of the first two regions" value={state.pRegion} set={set} />
                  <KV id="pExtra" label="Per GB a month, each region after two" value={state.pExtra} set={set} />
                  <KV id="regions" label="Regions the video is stored in" value={state.regions} set={set} />
                </Group>

                <Group title="Streaming (Volume network, one price worldwide)">
                  <KV id="d1" label="Per GB, first 500 TB a month" value={state.d1} set={set} />
                  <KV id="d2" label="Per GB, 500 TB to 1 PB" value={state.d2} set={set} />
                  <KV id="d3" label="Per GB, 1 PB to 2 PB" value={state.d3} set={set} />
                </Group>

                <Group title="Other charges">
                  <KV id="encode" label="Encoding, per minute of video added" value={state.encode} set={set} />
                  <KV id="newMin" label="Minutes of new video added a month" value={state.newMin} set={set} />
                  <KV id="minimum" label="Monthly minimum" value={state.minimum} set={set} />
                </Group>

                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Qualities stored, and their bitrate (kbps)</h3>
                  <p className="mt-1 text-[13px] text-muted">
                    Storage keeps every ticked quality. A viewer streams only one.
                  </p>
                  <div className="mt-3 grid grid-cols-[1fr_120px] items-center gap-x-3 gap-y-2">
                    {Object.keys(DEFAULTS.rend).map((q) => (
                      <RenditionRow key={q} q={q} r={state.rend[q]} setState={setState} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Extra copies Bunny keeps</h3>
                  <Check
                    label="MP4 copy of every quality (about doubles the stored qualities)"
                    checked={state.mp4}
                    onChange={(v) => setState((s) => ({ ...s, mp4: v }))}
                  />
                  <Check
                    label="Keep the uploaded original"
                    checked={state.orig}
                    onChange={(v) => setState((s) => ({ ...s, orig: v }))}
                  />
                  <div className="mt-2 grid grid-cols-[1fr_120px] items-center gap-x-3 gap-y-2">
                    <KV id="origKbps" label="Original upload bitrate (kbps)" value={state.origKbps} set={set} />
                    <KV id="extraMB" label="Previews and thumbnails per video (MB)" value={state.extraMB} set={set} />
                  </div>
                </div>

                <Group title="Mix, % of watching time">
                  <KV id="m1080" label="1080p" value={state.m1080} set={set} />
                  <KV id="m720" label="720p" value={state.m720} set={set} />
                  <KV id="m480" label="480p" value={state.m480} set={set} />
                  <KV id="weeks" label="Weeks in a month" value={Number(state.weeks.toFixed(2))} set={set} />
                </Group>

                <p className="text-[13px] leading-relaxed text-muted">
                  1 GB = 1,000 MB here. Streaming is counted from the bitrate, so a video watched twice is counted twice.
                  A short test clip came out about 1.6 times its set bitrate; measure a real class video before quoting firmly.
                </p>
                <button type="button" onClick={reset} className="btn-ghost self-start">
                  Put back Bunny&apos;s prices
                </button>
              </div>
            </details>

            <p className="text-[13px] text-muted">Video hosting is passed on at cost. This page changes nothing on Bunny.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <div className="mt-3 grid grid-cols-[1fr_120px] items-center gap-x-3 gap-y-2">{children}</div>
    </div>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-3 text-[15px] text-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[22px] w-[22px] shrink-0 cursor-pointer accent-accent"
      />
      {label}
    </label>
  )
}

function RenditionRow({
  q,
  r,
  setState,
}: {
  q: string
  r: Rendition
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  const update = (patch: Partial<Rendition>) =>
    setState((s) => {
      const rend = { ...s.rend, [q]: { ...s.rend[q], ...patch } }
      // A quality no longer stored can't be the one people watch in.
      const quality = s.quality === q && patch.on === false ? 'mix' : s.quality
      return { ...s, rend, quality }
    })
  return (
    <>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[15px] text-body">
        <input
          type="checkbox"
          checked={r.on}
          onChange={(e) => update({ on: e.target.checked })}
          className="h-[22px] w-[22px] shrink-0 cursor-pointer accent-accent"
        />
        {q}
      </label>
      <NumberBox id={`kb-${q}`} label={`${q} bitrate in kbps`} value={r.kbps} onChange={(v) => update({ kbps: v })} className={SMALL_NUM} />
    </>
  )
}
