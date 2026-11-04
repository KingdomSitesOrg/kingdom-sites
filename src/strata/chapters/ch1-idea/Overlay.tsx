'use client';

import { facts, useChapterProgress, useChapterTimeline, useReducedMotion, useStoryMode } from '@/strata/story';
import { Eyebrow, GlassPanel } from '@/strata/ui';
import { BBoxBrackets, HudCluster, HudReadout, HudValue, thousands } from '@/strata/hud';
import { BEATS, chipsLanded } from './beats';
import { CHIP_COUNT } from './Prompt';
import { Prompt } from './Prompt';
import { signals } from './signals';

const CONFIDENCE = '0.97';
const CHIP_TEXT = Array.from({ length: CHIP_COUNT + 1 }, (_, i) => `${i} / ${CHIP_COUNT}`);
const mm = (v: number) => `${v.toFixed(1)} mm`;
/** The cluster arrives with Generate; it and the brackets leave as the crossfade into Ch2 begins (p clamps to 1). */
const HUD_WINDOW = [BEATS.press, 0.999] as const;
const BBOX_WINDOW = [BEATS.bbox, 0.999] as const;

/** Fixed-width counter with leading zeros: 00,412 / 24,000. */
const padCount = (v: number, total: number) =>
  String(Math.min(v, total)).padStart(String(total).length, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** HUD getters run on every tick: build each string once, when its value changes. */
const samplesText = { landed: -1, total: -1, text: '' };
function samplesLabel(p: number) {
  if (p < BEATS.samples) return '--,---';
  if (signals.landed !== samplesText.landed || signals.samples !== samplesText.total) {
    samplesText.landed = signals.landed;
    samplesText.total = signals.samples;
    samplesText.text = padCount(signals.landed, signals.samples);
  }
  return samplesText.text;
}

export default function Overlay() {
  const progress = useChapterProgress();
  const mode = useStoryMode();
  const reduced = useReducedMotion();
  const still = mode === 'static' || reduced;
  // Static mode shows the whole prompt and every chip, so the HUD reads its finished state there too.
  const at = (p: number) => (still ? 1 : p);

  useChapterTimeline(
    (tl) => {
      // The panel and its first line arrive together, so the glass never shows empty.
      tl.from('[data-copy]', { opacity: 0, duration: 0.06 }, 0)
        .from('[data-reveal]', { opacity: 0, y: 24, duration: 0.08, stagger: 0.012, ease: 'expo.out' }, 0)
        .to('[data-copy]', { opacity: 0, duration: 0.08 }, BEATS.copyOut);
      tl.fromTo('[data-prompt-shell]', { '--r': '0px' }, { '--r': '4px', duration: 0.004 }, 0.104)
        .to('[data-prompt-shell]', { '--r': '720px', duration: 0.06, ease: 'power2.in' }, 0.108)
        .fromTo('[data-trace]', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.09, ease: 'power1.inOut' }, 0.11)
        .to('[data-prompt]', { opacity: 0, duration: 0.06 }, BEATS.promptOut);
      if (!still) {
        tl.fromTo('[data-generate]', { scale: 1 }, { scale: 0.97, duration: 0.012, ease: 'power2.out' }, BEATS.press)
          .to('[data-generate]', { scale: 1, duration: 0.03, ease: 'back.out(2)' }, BEATS.press + 0.014)
          .fromTo('[data-generate-fill]', { '--fill-r': '100%' }, { '--fill-r': '0%', duration: 0.045, ease: 'power1.inOut' }, BEATS.press + 0.004)
          // Outside the sweep only the label that shows is rendered (contrast checks read both otherwise).
          .fromTo('[data-generate-fill]', { opacity: 0 }, { opacity: 1, duration: 0.001 }, BEATS.press + 0.004)
          .fromTo('[data-generate-base]', { opacity: 1 }, { opacity: 0, duration: 0.001 }, BEATS.press + 0.05)
          .fromTo('[data-prompt-glow]', { opacity: 0 }, { opacity: 1, duration: 0.03, ease: 'power2.out' }, BEATS.press + 0.01)
          .to('[data-prompt-glow]', { opacity: 0, duration: 0.06, ease: 'power1.in' }, BEATS.swarmStart + 0.01);
        BEATS.chips.forEach((at, i) => {
          tl.fromTo(
            `[data-chip]:nth-child(${i + 1})`,
            { opacity: 0, y: -12, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.014, ease: 'back.out(2.2)', immediateRender: true },
            at,
          );
        });
      } else {
        tl.set('[data-generate-fill]', { '--fill-r': '0%', opacity: 1 }, 0).set('[data-generate-base]', { opacity: 0 }, 0);
      }
      tl.set({}, {}, 1);
    },
    [still],
    { rest: 0.6, restInStatic: true },
  );

  return (
    <div className="absolute inset-0">
      <GlassPanel
        data-copy
        className="absolute inset-x-4 top-[10svh] md:inset-x-auto md:left-[6vw] md:top-[12svh] md:w-[min(29vw,420px)]"
      >
        <Eyebrow data-reveal index="01">
          The idea
        </Eyebrow>
        <h2 id="idea-title" data-reveal className="mt-4 text-h2 text-text-1">
          Say what it has to do.
        </h2>
        <p data-reveal className="mt-5 max-w-[34ch] text-body text-text-2">
          Type the job, not the geometry. Loads, fixings, material. STRATA reads the constraints and drafts a part that already knows where it bolts on and what it has to carry.
        </p>
      </GlassPanel>

      <Prompt />

      <HudCluster window={HUD_WINDOW} className="absolute bottom-6 right-4 md:bottom-[8svh] md:right-[4vw]" padding="px-5 py-4">
        <div className="flex gap-9">
          <HudReadout
            live
            className="min-w-[92px]"
            label={<HudValue scrub={(p) => (at(p) < BEATS.press + 0.02 ? 'Parsing' : 'Constraints')} />}
            value={<HudValue scrub={(p) => CHIP_TEXT[chipsLanded(at(p))]} />}
            chars={5}
          />
          <HudReadout
            live
            label="Samples"
            chars={6}
            value={
              <HudValue
                get={() => samplesLabel(progress.current.p)}
                fallback={thousands(signals.samples)}
              />
            }
          />
          <HudReadout
            desktopOnly
            label="Confidence"
            chars={4}
            value={<HudValue scrub={(p) => (at(p) < BEATS.confidence ? '-.--' : CONFIDENCE)} />}
          />
        </div>
      </HudCluster>

      <BBoxBrackets
        bbox={signals.bbox}
        width={mm(facts.part.envelopeMM.x)}
        height={mm(facts.part.envelopeMM.y)}
        window={BBOX_WINDOW}
        className="max-md:hidden"
      />
    </div>
  );
}
