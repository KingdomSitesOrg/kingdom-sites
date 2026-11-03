import type { QuoteObject } from '@/strata/story/quote';

/* Side silhouettes for the four quotable parts: 56 x 40, 1.5 px strokes, currentColor. */

const common = {
  viewBox: '0 0 56 40',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function Bracket({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <rect x={4} y={8} width={10} height={24} rx={2} />
      <circle cx={9} cy={14} r={1.8} />
      <circle cx={9} cy={26} r={1.8} />
      <path d="M14 11.5C23 12 29.5 12.4 36.2 14.4M14 28.5C23 28 29.5 27.6 36.2 25.6" />
      <rect x={18.5} y={17.5} width={12} height={5} rx={2.5} />
      <circle cx={44} cy={20} r={8.5} />
      <circle cx={44} cy={20} r={4.2} />
    </svg>
  );
}

function Finger({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <path d="M6.5 30.5c0-4.4 3-7 7.6-9.2L39.6 9.6c4.6-2.2 9.6-1.6 11 1.6 1.2 2.8-.8 5-4 6.4L20.8 29.6c-4 1.9-6.8 4.6-9.6 4.6-2.6 0-4.7-1.4-4.7-3.7Z" />
      <circle cx={11.6} cy={30} r={2.2} />
      <path d="M43.4 17.4 45 20M38.6 19.6l1.6 2.6M33.8 21.8l1.6 2.6" />
    </svg>
  );
}

function Manifold({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <rect x={5} y={7} width={46} height={26} rx={3} />
      <circle cx={16} cy={17} r={4.6} />
      <circle cx={16} cy={17} r={1.9} />
      <circle cx={32} cy={24.5} r={3.4} />
      <circle cx={43} cy={14} r={2.8} />
      <path d="M20.6 17H32v4M34.6 15.4 40.2 14.2" strokeDasharray="1.5 2.2" />
      <path d="M8.5 10.5h.01M47.5 10.5h.01M8.5 29.5h.01M47.5 29.5h.01" strokeWidth={2.4} />
    </svg>
  );
}

function Knuckle({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <path d="M40 11H9a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h31" />
      <circle cx={14} cy={20} r={2} />
      <circle cx={25} cy={20} r={2} />
      <circle cx={41} cy={20} r={9.5} />
      <circle cx={41} cy={20} r={3.6} />
      <path d="M41 10.5v-3M41 32.5v-3" />
    </svg>
  );
}

export const SILHOUETTES: Record<QuoteObject, (p: { className?: string }) => React.JSX.Element> = {
  bracket: Bracket,
  finger: Finger,
  manifold: Manifold,
  knuckle: Knuckle,
};
