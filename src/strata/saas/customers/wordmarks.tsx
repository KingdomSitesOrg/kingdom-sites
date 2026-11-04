import { useId, type ReactNode, type SVGProps } from 'react';

/*
 * Eight original wordmarks for the fictional customers (STORYBOARD 7.1). Monochrome, currentColor,
 * 40-unit-tall viewBoxes. Tracking is letter-spacing in em, never textLength: Chromium spreads a
 * textLength adjustment unevenly at small sizes, which broke up the tracked sub-labels.
 */

type P = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>;

const DISPLAY = { fontFamily: 'var(--font-display)' } as const;
const TEXT = { fontFamily: 'var(--font-text)' } as const;
const MONO = { fontFamily: 'var(--font-mono)' } as const;

type MarkProps = { width: number; title: string; children: ReactNode } & P;

function Mark({ width, title, children, className, ...rest }: MarkProps) {
  return (
    <svg
      role="img"
      viewBox={`0 0 ${width} 40`}
      width={width}
      height={40}
      fill="currentColor"
      className={className}
      {...rest}
    >
      <title>{title}</title>
      {children}
    </svg>
  );
}

type Run = {
  x: number;
  y: number;
  size: number;
  weight: number;
  track?: number;
  font?: typeof DISPLAY | typeof TEXT | typeof MONO;
  children: string;
};

function T({ x, y, size, weight, track, font = DISPLAY, children }: Run) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} letterSpacing={track ? `${track}em` : undefined} style={font}>
      {children}
    </text>
  );
}

export function Halvard(props: P) {
  return (
    <Mark width={147} title="Halvard Aerostructures" {...props}>
      <path
        d="M2.5 31 14 10.5 25.5 31M9 31l5-9 5 9"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinejoin="miter"
      />
      <T x={38} y={23} size={22} weight={600} track={0.08}>
        HALVARD
      </T>
      <T x={38.5} y={34.4} size={8.6} weight={500} track={0.237} font={TEXT}>
        AEROSTRUCTURES
      </T>
    </Mark>
  );
}

export function Northvane(props: P) {
  const id = useId();
  const ring = 'rotate(-20 24.5 19.8)';
  return (
    <Mark width={201} title="Northvane Orbital" {...props}>
      <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={60} height={40}>
        <rect width={60} height={40} fill="#fff" />
        <ellipse cx={24.5} cy={19.8} rx={10.6} ry={3.2} transform={ring} fill="none" stroke="#000" strokeWidth={4.4} />
      </mask>
      <T x={0} y={27} size={25} weight={600}>
        n
      </T>
      <circle cx={24.5} cy={19.8} r={6.1} fill="none" stroke="currentColor" strokeWidth={2.9} mask={`url(#${id})`} />
      <ellipse cx={24.5} cy={19.8} rx={10.6} ry={3.2} transform={ring} fill="none" stroke="currentColor" strokeWidth={1.4} />
      <T x={34} y={27} size={25} weight={600} track={0.018}>
        rthvane
      </T>
      <T x={132} y={27} size={25} weight={500}>
        orbital
      </T>
    </Mark>
  );
}

export function Meridell(props: P) {
  return (
    <Mark width={184} title="Meridell Ortho Labs" {...props}>
      <path d="M8.5 29C8.2 21 11.6 14.6 18.6 11" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" />
      <circle cx={20.8} cy={12.6} r={2.9} />
      <circle cx={18} cy={8.7} r={2.9} />
      <circle cx={10.9} cy={30.4} r={2.9} />
      <circle cx={6.1} cy={30.2} r={2.9} />
      <T x={33} y={27} size={25} weight={400} track={-0.01} font={TEXT}>
        Meridell
      </T>
      <path d="M136.5 11v18" stroke="currentColor" strokeWidth={1} />
      <T x={145} y={18.6} size={8.5} weight={500} track={0.165} font={TEXT}>
        ORTHO
      </T>
      <T x={145} y={28.6} size={8.5} weight={500} track={0.24} font={TEXT}>
        LABS
      </T>
    </Mark>
  );
}

export function Suturion(props: P) {
  return (
    <Mark width={151} title="Suturion Medical" {...props}>
      <circle cx={13} cy={20} r={10.6} fill="none" stroke="currentColor" strokeWidth={2} />
      <path d="M13 13.6v12.8M6.6 20h12.8" stroke="currentColor" strokeWidth={2.6} />
      <T x={34} y={22} size={17} weight={500} track={0.229} font={TEXT}>
        SUTURION
      </T>
      <T x={34.4} y={33} size={8.6} weight={500} track={0.53} font={TEXT}>
        MEDICAL
      </T>
    </Mark>
  );
}

export function Ferrowing(props: P) {
  return (
    <Mark width={207} title="Ferrowing Robotics" {...props}>
      <path d="M2.5 33.5h13" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <path d="M9 30.5 11.4 16.5 23.6 11.4" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinejoin="round" />
      <circle cx={9} cy={30.5} r={3.1} />
      <circle cx={11.4} cy={16.5} r={3.1} />
      <circle cx={23.6} cy={11.4} r={2.5} />
      <path d="M23.6 11.4 28.8 7.2M23.6 11.4l5.6 3.6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
      <T x={38} y={28} size={25} weight={600}>
        Ferrowing
      </T>
      <T x={157} y={28} size={9} weight={500} track={0.064} font={TEXT}>
        ROBOTICS
      </T>
    </Mark>
  );
}

const hex = (cx: number, cy: number, r: number) => {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
};

export function Antlerline(props: P) {
  return (
    <Mark width={180} title="Antlerline Motion" {...props}>
      <path
        d={[hex(6, 27.6, 4.9), hex(16, 27.6, 4.9), hex(11, 19, 4.9), hex(21, 19, 4.9)].join('')}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d={hex(16, 10.4, 4.9)} />
      <T x={34} y={27.5} size={24} weight={500}>
        Antlerline
      </T>
      <T x={141} y={16.5} size={9} weight={500} track={0.125} font={MONO}>
        MOTION
      </T>
    </Mark>
  );
}

export function Corvane(props: P) {
  return (
    <Mark width={160} title="Corvane Motorsport" {...props}>
      <g transform="translate(8 0) skewX(-12)">
        <path d="M4 7.5v26" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <path
          fillRule="evenodd"
          d="M4.6 8H26l-6 7.5 6 7.5H4.6ZM8.6 11.2l4.3 4.3-4.3 4.3h2.9l4.3-4.3-4.3-4.3Z"
        />
        <T x={35} y={24} size={24} weight={600} track={0.046}>
          CORVANE
        </T>
        <T x={76} y={34.4} size={8.6} weight={500} track={0.25}>
          MOTORSPORT
        </T>
      </g>
    </Mark>
  );
}

export function Vantrel(props: P) {
  const nut = [0, 60, 120, 180, 240, 300]
    .map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      return `${i ? 'L' : 'M'}${(13 + 12 * Math.cos(a)).toFixed(2)} ${(20 + 12 * Math.sin(a)).toFixed(2)}`;
    })
    .join('');
  return (
    <Mark width={206} title="Vantrel Mobility" {...props}>
      <path fillRule="evenodd" d={`${nut}ZM13 15a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z`} />
      <T x={34} y={27.5} size={24} weight={600} track={0.012}>
        vantrel
      </T>
      <T x={116} y={27.5} size={24} weight={400} font={TEXT}>
        mobility
      </T>
    </Mark>
  );
}

export const WORDMARKS = [
  { name: 'Halvard Aerostructures', sector: 'Aerospace', Mark: Halvard },
  { name: 'Northvane Orbital', sector: 'Aerospace', Mark: Northvane },
  { name: 'Meridell Ortho Labs', sector: 'Medical', Mark: Meridell },
  { name: 'Suturion Medical', sector: 'Medical', Mark: Suturion },
  { name: 'Ferrowing Robotics', sector: 'Robotics', Mark: Ferrowing },
  { name: 'Antlerline Motion', sector: 'Robotics', Mark: Antlerline },
  { name: 'Corvane Motorsport', sector: 'Automotive', Mark: Corvane },
  { name: 'Vantrel Mobility', sector: 'Automotive', Mark: Vantrel },
] as const;
