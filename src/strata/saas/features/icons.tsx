'use client';

import { useId } from 'react';
import { animate as tween } from 'framer-motion';
import { cn } from '@/strata/ui';
import { EASE, scatter, useIconPlayer, type Play } from './player';

/*
 * Feature icons (STORYBOARD 7.2): inline SVG, 48 px, Framer Motion. Each component renders its final
 * frame; its play() rewinds to the start and animates back to it.
 */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const all = (list: NodeListOf<Element>) => Array.from(list);

function Svg({ scope, children, className }: { scope: React.Ref<SVGSVGElement>; children: React.ReactNode; className?: string }) {
  return (
    <svg ref={scope} viewBox="4 4 40 40" width={48} height={48} fill="none" aria-hidden className={cn('overflow-visible', className)}>
      {children}
    </svg>
  );
}

/* ---------- AI modeling: scattered dots snap onto a cube, then its edges draw one by one ---------- */

const TOP = [
  [24, 7.5],
  [37.5, 15.25],
  [24, 23],
  [10.5, 15.25],
] as const;
const CUBE = [...TOP, ...TOP.map(([x, y]) => [x, y + 17] as const)];
const EDGES_SEEN = [
  [3, 0],
  [0, 1],
  [3, 2],
  [2, 1],
  [3, 7],
  [2, 6],
  [1, 5],
  [7, 6],
  [6, 5],
] as const;
const EDGES_HIDDEN = [
  [0, 4],
  [4, 7],
  [4, 5],
] as const;
const DRIFT = (() => {
  const r = scatter(7);
  return CUBE.map(() => [(r() - 0.5) * 26, (r() - 0.5) * 26] as const);
})();
const seg = ([a, b]: readonly [number, number]) => `M${CUBE[a][0]} ${CUBE[a][1]}L${CUBE[b][0]} ${CUBE[b][1]}`;

const playModel: Play = async (animate, root) => {
  const dots = all(root.querySelectorAll('.d'));
  const edges = all(root.querySelectorAll('.e'));
  edges.forEach((e) => animate(e, { pathLength: 0 }, { duration: 0 }));
  await Promise.all(
    dots.map((d, i) =>
      animate(d, { x: [DRIFT[i][0], 0], y: [DRIFT[i][1], 0], opacity: [0, 1] }, { duration: 0.8, delay: i * 0.05, ease: EASE }),
    ),
  );
  await Promise.all(edges.map((e, i) => animate(e, { pathLength: [0, 1] }, { duration: 0.26, delay: i * 0.07, ease: 'easeOut' })));
  await wait(700);
};

export function IconModel() {
  const scope = useIconPlayer(playModel);
  return (
    <Svg scope={scope}>
      <g className="stroke-resin/35" strokeWidth={1} strokeDasharray="1.5 2.5">
        {EDGES_HIDDEN.map((e) => (
          <path key={e.join()} d={seg(e)} />
        ))}
      </g>
      <g className="stroke-resin" strokeWidth={1.4} strokeLinecap="round">
        {EDGES_SEEN.map((e) => (
          <path key={e.join()} className="e" d={seg(e)} />
        ))}
      </g>
      {CUBE.map(([x, y], i) => (
        <circle key={i} className={cn('d fill-resin', i === 4 && 'opacity-40')} cx={x} cy={y} r={i === 4 ? 1.4 : 1.9} />
      ))}
    </Svg>
  );
}

/* ---------- Generative optimization: a block erodes to a strut while stress flows through it ---------- */

const playOptimize: Play = async (animate, root) => {
  const grad = root.querySelector('linearGradient')!;
  const block = root.querySelector('.blk')!;
  const struts = all(root.querySelectorAll('.s'));
  const pads = all(root.querySelectorAll('.p'));
  struts.forEach((s) => animate(s, { pathLength: 0 }, { duration: 0 }));
  pads.forEach((p) => animate(p, { scale: 0 }, { duration: 0 }));
  animate(block, { opacity: 0.9 }, { duration: 0 });
  const heat = tween(0, 1, {
    duration: 1.6,
    ease: 'easeInOut',
    // The stress field enters from the mounts at the top, overshoots down the part, then settles.
    onUpdate: (v) => {
      const y1 = v < 0.6 ? 8 + 48 * (v / 0.6) : 56 - 16 * ((v - 0.6) / 0.4);
      grad.setAttribute('y1', String(y1));
      grad.setAttribute('y2', String(y1 - 32));
    },
  });
  await Promise.all([
    heat,
    animate(block, { opacity: [0.9, 0] }, { duration: 1.1, delay: 0.25, ease: 'easeIn' }),
    ...pads.map((p, i) => animate(p, { scale: [0, 1] }, { duration: 0.5, delay: 0.1 + i * 0.08, ease: EASE })),
    ...struts.map((s, i) => animate(s, { pathLength: [0, 1] }, { duration: 0.9, delay: 0.35 + i * 0.08, ease: EASE })),
  ]);
  await wait(700);
};

export function IconOptimize() {
  const scope = useIconPlayer(playOptimize);
  const id = useId();
  const stroke = `url(#${id})`;
  return (
    <Svg scope={scope}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={40} x2={0} y2={8}>
          <stop offset={0} style={{ stopColor: 'var(--stress-lo)' }} />
          <stop offset={0.5} style={{ stopColor: 'var(--stress-mid)' }} />
          <stop offset={1} style={{ stopColor: 'var(--stress-hi)' }} />
        </linearGradient>
      </defs>
      <rect x={7.5} y={7.5} width={33} height={33} rx={3} className="stroke-text-3/50" strokeWidth={1} strokeDasharray="2 3" />
      <rect className="blk" x={7.5} y={7.5} width={33} height={33} rx={3} fill={stroke} opacity={0} />
      <g stroke={stroke} strokeWidth={2.4} strokeLinecap="round">
        <path className="s" d="M16 12.6C21 15.2 27 15.2 32 12.6" />
        <path className="s" d="M14.8 15.8C18 22 20.8 27 22.6 32" />
        <path className="s" d="M33.2 15.8C30 22 27.2 27 25.4 32" />
        <path className="s" d="M18.4 21.4C22 19.8 26 19.8 29.6 21.4" />
      </g>
      <g stroke={stroke} strokeWidth={2} className="fill-bg-3">
        <circle className="p" cx={13} cy={12.5} r={3.2} />
        <circle className="p" cx={35} cy={12.5} r={3.2} />
        <circle className="p" cx={24} cy={35} r={3.6} />
      </g>
    </Svg>
  );
}

/* ---------- Instant quoting: three odometer digits roll, then lock ---------- */

const ROW = 20;
const COLS = [6, 18.5, 31];

const playQuote: Play = async (animate, root) => {
  const strips = all(root.querySelectorAll('.strip'));
  const lock = root.querySelector('.lock')!;
  animate(lock, { pathLength: 0, opacity: 0 }, { duration: 0 });
  await Promise.all(
    strips.map((s, i) => {
      const to = -Number((s as SVGElement).dataset.to) * ROW;
      return animate(s, { y: [0, to] }, { duration: 1.1 + i * 0.22, ease: EASE });
    }),
  );
  await animate(lock, { pathLength: [0, 1], opacity: 1 }, { duration: 0.35, ease: 'easeOut' });
  await wait(900);
};

export function IconQuote({ digits }: { digits: string }) {
  const scope = useIconPlayer(playQuote);
  const id = useId();
  return (
    <Svg scope={scope}>
      <defs>
        {COLS.map((x, i) => (
          <clipPath key={i} id={`${id}-${i}`}>
            <rect x={x} y={12} width={11} height={20} rx={2.2} />
          </clipPath>
        ))}
      </defs>
      {COLS.map((x, i) => {
        const to = 10 + Number(digits[i]);
        return (
          <g key={i}>
            <rect x={x + 0.5} y={12.5} width={10} height={19} rx={2} className="fill-bg-0/70 stroke-line-strong" strokeWidth={1} />
            <g clipPath={`url(#${id}-${i})`}>
              <g className="strip" data-to={to} style={{ transform: `translateY(${-to * ROW}px)` }}>
                {Array.from({ length: 20 }, (_, k) => (
                  <text key={k} x={x + 5.5} y={27.1 + k * ROW} fontSize={14} textAnchor="middle" className="fill-text-1 font-mono">
                    {k % 10}
                  </text>
                ))}
              </g>
            </g>
          </g>
        );
      })}
      <path className="lock stroke-molten" d="M6.5 37H41.5" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/* ---------- Fleet printing: a 4 x 4 grid lights up in a dispatch wave ---------- */

const CELL = 7;
const GAP = 3;
const ORIGIN = (48 - (4 * CELL + 3 * GAP)) / 2;

const playFleet: Play = async (animate, root) => {
  const lights = all(root.querySelectorAll('.l'));
  lights.forEach((l) => animate(l, { opacity: 0 }, { duration: 0 }));
  await Promise.all(
    lights.map((l) => {
      const wave = Number((l as SVGElement).dataset.wave);
      return animate(l, { opacity: [0, 1, 0.8], scale: [0.4, 1.12, 1] }, { duration: 0.7, delay: wave * 0.085, ease: EASE });
    }),
  );
  await wait(900);
};

export function IconFleet({ lit }: { lit: number }) {
  const scope = useIconPlayer(playFleet);
  // Light `lit` of 16 cells; the idle ones sit where the wave arrives last.
  const order = Array.from({ length: 16 }, (_, k) => k).sort((a, b) => (a % 4) + (a >> 2) - ((b % 4) + (b >> 2)) || a - b);
  const idle = new Set(order.slice(lit));
  return (
    <Svg scope={scope}>
      {Array.from({ length: 16 }, (_, k) => {
        const c = k % 4;
        const r = k >> 2;
        const x = ORIGIN + c * (CELL + GAP);
        const y = ORIGIN + r * (CELL + GAP);
        return (
          <g key={k}>
            <rect x={x + 0.5} y={y + 0.5} width={CELL - 1} height={CELL - 1} rx={1.2} className="stroke-line-strong" strokeWidth={1} />
            {idle.has(k) ? null : (
              <rect className="l fill-molten" data-wave={c + r} x={x} y={y} width={CELL} height={CELL} rx={1.4} opacity={0.8} />
            )}
          </g>
        );
      })}
    </Svg>
  );
}

/* ---------- Material library: three swatch discs fan out on a shared pin ---------- */

const PIVOT = [24.6, 29.6] as const;
const FAN = [-165, -100, -35];

const playMaterial: Play = async (_animate, root) => {
  const discs = all(root.querySelectorAll('.disc'));
  await Promise.all(
    discs.map((d, i) =>
      tween(FAN[1] + 25, FAN[i], {
        duration: 1.1,
        delay: i * 0.06,
        ease: EASE,
        onUpdate: (a) => d.setAttribute('transform', `translate(${PIVOT[0]} ${PIVOT[1]}) rotate(${a})`),
      }),
    ),
  );
  await wait(900);
};

export function IconMaterial() {
  const scope = useIconPlayer(playMaterial);
  const id = useId();
  const at = (a: number) => `translate(${PIVOT[0]} ${PIVOT[1]}) rotate(${a})`;
  return (
    <Svg scope={scope}>
      <defs>
        <linearGradient id={id} x1={0} y1={0} x2={1} y2={1}>
          <stop offset={0} style={{ stopColor: 'var(--text-1)' }} />
          <stop offset={0.55} style={{ stopColor: 'var(--text-3)' }} />
          <stop offset={1} style={{ stopColor: 'var(--text-2)' }} />
        </linearGradient>
      </defs>
      <g className="disc" transform={at(FAN[0])}>
        <circle cx={9} cy={0} r={8.5} fill={`url(#${id})`} />
        <circle cx={9} cy={0} r={5.8} className="stroke-bg-0/20" strokeWidth={0.7} />
        <circle cx={9} cy={0} r={3.2} className="stroke-bg-0/20" strokeWidth={0.7} />
      </g>
      <g className="disc" transform={at(FAN[1])}>
        <circle cx={9} cy={0} r={8.5} className="fill-bg-0 stroke-text-3" strokeWidth={1.1} />
      </g>
      <g className="disc" transform={at(FAN[2])}>
        <circle cx={9} cy={0} r={8.5} className="fill-resin/15 stroke-resin" strokeWidth={1.1} />
        <path d="M12.2 -5.4A6 6 0 0 1 15 -1.2" className="stroke-text-1/70" strokeWidth={1} strokeLinecap="round" />
      </g>
      <circle cx={PIVOT[0]} cy={PIVOT[1]} r={2} className="fill-text-1 stroke-bg-3" strokeWidth={1.4} />
    </Svg>
  );
}

/* ---------- API & integrations: a pulse runs from { } along a connector into a socket ---------- */

const playApi: Play = async (animate, root) => {
  const pulse = root.querySelector('.pulse')!;
  const wire = root.querySelector('.wire')!;
  const pins = all(root.querySelectorAll('.pin'));
  const socket = root.querySelector('.socket')!;
  pins.forEach((p) => animate(p, { opacity: 0.25 }, { duration: 0 }));
  animate(wire, { pathLength: 0, opacity: 1 }, { duration: 0 });
  await Promise.all([
    animate(pulse, { x: [0, 9], opacity: [0, 1, 1, 0] }, { duration: 0.75, ease: 'easeInOut' }),
    animate(wire, { pathLength: [0, 1] }, { duration: 0.75, ease: 'easeInOut' }),
  ]);
  await Promise.all([
    animate(socket, { opacity: [1, 0.5, 1] }, { duration: 0.35 }),
    ...pins.map((p, i) => animate(p, { opacity: [0.25, 1] }, { duration: 0.3, delay: i * 0.08 })),
    animate(wire, { opacity: [1, 0.55] }, { duration: 0.6, delay: 0.2 }),
  ]);
  await wait(900);
};

export function IconApi() {
  const scope = useIconPlayer(playApi);
  return (
    <Svg scope={scope}>
      <g className="stroke-resin" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 15c-2.2 0-3 .9-3 2.6v3.6c0 1.5-.7 2.4-2.2 2.8 1.5.4 2.2 1.3 2.2 2.8v3.6c0 1.7.8 2.6 3 2.6" />
        <path d="M15 15c2.2 0 3 .9 3 2.6v3.6c0 1.5.7 2.4 2.2 2.8-1.5.4-2.2 1.3-2.2 2.8v3.6c0 1.7-.8 2.6-3 2.6" />
      </g>
      <path d="M22.5 24H31" className="stroke-line-strong" strokeWidth={1.5} />
      <path className="wire stroke-molten" d="M22.5 24H31" strokeWidth={1.5} opacity={0.55} />
      <circle className="pulse fill-molten-hot" cx={22} cy={24} r={2.2} opacity={0} />
      <rect className="socket stroke-text-2" x={31} y={15} width={11} height={18} rx={3} strokeWidth={1.5} />
      <path className="pin stroke-molten" d="M34.5 21H38.5" strokeWidth={1.6} strokeLinecap="round" />
      <path className="pin stroke-molten" d="M34.5 27H38.5" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
