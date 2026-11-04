'use client';

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type Step = { n: string; title: string; line: string };

/*
 * STORYBOARD 7.3: three nodes on a hairline rail; a molten pellet travels it, dwelling at each node,
 * and each node's ring fills and its icon plays on arrival. Desktop scrubs with the section's scroll.
 * The markup is the finished state (rings full, pellet hidden), which is also reduced motion.
 */
export function Rail({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const el = root.current!;
        const q = gsap.utils.selector(el);
        const rail = q('[data-rail]')[0] as HTMLElement;
        const css = getComputedStyle(el);
        const dim = css.getPropertyValue('--text-3').trim();
        const lit = css.getPropertyValue('--text-1').trim();
        const nodes = q('[data-node]');
        const rings = q('[data-ring]');
        const glows = q('[data-glow]');

        gsap.set(rings, { strokeDashoffset: 1 });
        gsap.set(nodes, { color: dim });
        gsap.set(glows, { opacity: 0 });
        gsap.set(q('[data-fill]'), { scaleX: 0 });
        gsap.set(q('[data-pellet]'), { x: 0, opacity: 1 });
        gsap.set(q('[data-type]'), { scaleX: 0, transformOrigin: '0% 50%' });
        gsap.set(q('[data-caret]'), { x: -17 });
        gsap.set(q('[data-block]'), { opacity: 0.22 });
        gsap.set(q('[data-draw]'), { strokeDashoffset: 1 });
        gsap.set(q('[data-check]'), { strokeDashoffset: 1 });
        gsap.set(q('[data-badge]'), { scale: 0, transformOrigin: '50% 50%' });

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el.closest('section') ?? el,
            start: 'top 70%',
            end: 'bottom 50%',
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        const arrive = (i: number, at: number) => {
          tl.to(rings[i], { strokeDashoffset: 0, duration: 0.08, ease: 'power2.out' }, at)
            .to(nodes[i], { color: lit, duration: 0.05 }, at)
            .to(glows[i], { opacity: 1, duration: 0.04 }, at)
            .to(glows[i], { opacity: 0.35, duration: 0.08 }, at + 0.05);
        };
        const move = (to: number, at: number) => {
          tl.to(q('[data-pellet]'), { x: () => rail.offsetWidth * to, duration: 0.3, ease: 'sine.inOut' }, at)
            .to(q('[data-fill]'), { scaleX: to, duration: 0.3, ease: 'sine.inOut' }, at)
            .to(q('[data-tail]'), { opacity: 1, duration: 0.15, ease: 'sine.in' }, at)
            .to(q('[data-tail]'), { opacity: 0, duration: 0.15, ease: 'sine.out' }, at + 0.15);
        };

        arrive(0, 0);
        tl.to(q('[data-step="0"] [data-type]'), { scaleX: 1, duration: 0.08 }, 0.02).to(
          q('[data-step="0"] [data-caret]'),
          { x: 0, duration: 0.08 },
          0.02,
        );
        move(0.5, 0.1);
        arrive(1, 0.4);
        tl.to(q('[data-step="1"] [data-block]'), { opacity: 0, duration: 0.12 }, 0.42).to(
          q('[data-step="1"] [data-draw]'),
          { strokeDashoffset: 0, duration: 0.14, stagger: 0.02 },
          0.42,
        );
        move(1, 0.6);
        arrive(2, 0.9);
        tl.to(q('[data-step="2"] [data-badge]'), { scale: 1, duration: 0.04, ease: 'back.out(2)' }, 0.92).to(
          q('[data-step="2"] [data-check]'),
          { strokeDashoffset: 0, duration: 0.05 },
          0.95,
        );
        tl.set({}, {}, 1);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative mt-20">
      <div
        data-rail
        aria-hidden
        className="absolute left-10 right-[calc((100%-4rem)/3-2.5rem)] top-10 hidden h-px bg-line-strong md:block"
      >
        <div data-fill className="absolute inset-0 origin-left bg-molten shadow-[0_0_8px_var(--molten)]" />
        <div data-pellet className="absolute left-0 top-0 opacity-0">
          <span
            data-tail
            className="absolute right-0 top-1/2 h-0.5 w-16 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,var(--molten))] opacity-0"
          />
          <span className="absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-molten-core shadow-[0_0_6px_2px_var(--molten-hot),0_0_22px_6px_var(--molten)]" />
        </div>
      </div>
      {/* The rail runs on past the last node to the container edge and ends on a tick. */}
      <div
        aria-hidden
        className="absolute right-0 top-10 hidden h-px w-[calc((100%-4rem)/3-2.5rem)] bg-[linear-gradient(90deg,var(--line-strong),var(--line))] md:block"
      >
        <span className="absolute right-0 top-1/2 h-2.5 w-px -translate-y-1/2 bg-line-strong" />
      </div>
      <ol className="relative grid gap-14 md:grid-cols-3 md:gap-8">
        {steps.map((s, i) => (
          <li key={s.n} data-step={i} className="relative">
            <Node>{ICONS[i]}</Node>
            <p className="hud-label mt-10 tabular text-text-3">Step {s.n}</p>
            <h3 className="mt-3 text-h3 text-text-1">{s.title}</h3>
            <p className="mt-3 max-w-[34ch] text-[15px] leading-6 text-text-2">{s.line}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Node({ children }: { children: ReactNode }) {
  return (
    <div data-node className="relative z-10 grid size-20 place-items-center rounded-full bg-bg-3 text-text-1">
      <span
        data-glow
        aria-hidden
        className="absolute -inset-3 -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--molten)_35%,transparent),transparent)] opacity-35"
      />
      <svg aria-hidden viewBox="0 0 80 80" className="absolute inset-0 size-full -rotate-90" fill="none">
        <circle cx={40} cy={40} r={39.25} className="stroke-line-strong" strokeWidth={1.5} />
        <circle
          data-ring
          cx={40}
          cy={40}
          r={39.25}
          pathLength={1}
          strokeDasharray="1 1"
          className="stroke-molten"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
      {children}
    </div>
  );
}

const ICONS = [
  <svg key="describe" aria-hidden viewBox="0 0 40 40" className="size-10" fill="none">
    <rect x={4.5} y={12.5} width={31} height={15} rx={4} stroke="currentColor" strokeWidth={1.5} />
    <path data-type d="M9.5 20h15" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeDasharray="2 3.2" />
    <rect data-caret x={27} y={15.5} width={1.8} height={9} rx={0.9} className="fill-molten" />
  </svg>,
  <svg key="refine" aria-hidden viewBox="0 0 40 40" className="size-10" fill="none">
    <rect data-block x={7} y={7} width={26} height={26} rx={2.5} fill="currentColor" opacity={0} />
    <rect x={7.5} y={7.5} width={25} height={25} rx={2.5} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="1.5 2.5" />
    <path
      data-draw
      pathLength={1}
      strokeDasharray="1 1"
      d="M16.57 25.98 25.98 16.57A5 5 0 1 0 23.43 14.02L14.02 23.43A5 5 0 1 0 16.57 25.98Z"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <circle cx={12} cy={28} r={2.1} className="fill-bg-3 stroke-molten" strokeWidth={1.5} />
    <circle cx={28} cy={12} r={2.1} className="fill-bg-3 stroke-molten" strokeWidth={1.5} />
  </svg>,
  <svg key="receive" aria-hidden viewBox="0 0 40 40" className="size-10" fill="none">
    <g stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
      <path d="M20 8.5 32 14.5v12.5L20 33 8 27V14.5Z" />
      <path d="M8 14.5 20 20.5 32 14.5M20 20.5V33" />
    </g>
    <path d="M14 11.5 26 17.5V22" className="stroke-molten" strokeWidth={1.5} strokeLinecap="round" />
    <g data-badge>
      <circle cx={31} cy={9} r={6} className="fill-bg-3 stroke-ok" strokeWidth={1.4} />
      <path data-check pathLength={1} strokeDasharray="1 1" d="M28.4 9.2 30.3 11 33.6 7.4" className="stroke-ok" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>,
];
