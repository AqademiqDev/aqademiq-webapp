import type { CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   AdaCube — the parametric ice-cube mascot (README §2.9).

   One cube renders both the friendly avatar and the 5-step melt/mood scale
   by tweening `melt` (0 crisp → 1 puddle). Geometry, tones and expressions
   are the design system's own, kept exactly as authored so the mood ramp
   and the melting focus timer stay on-model.
   ───────────────────────────────────────────────────────────────────────── */

export interface CubeTone {
  border: string;
  body: string;
  ink: string;
}

/** Periwinkle "melting ice" ramp — 0 = melted & pale (worst) → 4 = frozen (best). */
export const CUBE_TONES: CubeTone[] = [
  { border: '#a79fc4', body: '#eae8f2', ink: '#938eac' }, // 0 Rough
  { border: '#9286d2', body: '#e4ddf3', ink: '#787299' }, // 1 Tired
  { border: '#7d70d9', body: '#dcd3f7', ink: '#5c5499' }, // 2 OK
  { border: '#6a5ce4', body: '#d2c5fa', ink: '#41358f' }, // 3 Good
  { border: '#5a44f1', body: '#cbbcfd', ink: '#31237c' }, // 4 Great
];

export const MOOD_LABELS = ['Rough', 'Tired', 'OK', 'Good', 'Great'] as const;

export type CubeExpr = 'happy' | 'smile' | 'neutral' | 'meh' | 'sad' | 'focused';

const MOUTHS: Record<Exclude<CubeExpr, 'happy'>, (cx: number, my: number) => string> = {
  smile: (cx, my) => `M ${cx - 6} ${my} Q ${cx} ${my + 4.5} ${cx + 6} ${my}`,
  neutral: (cx, my) => `M ${cx - 6} ${my} L ${cx + 6} ${my}`,
  focused: (cx, my) => `M ${cx - 5} ${my} Q ${cx} ${my + 3} ${cx + 5} ${my}`,
  meh: (cx, my) => `M ${cx - 6} ${my + 2} Q ${cx} ${my - 2} ${cx + 6} ${my + 2}`,
  sad: (cx, my) => `M ${cx - 7} ${my + 3} Q ${cx} ${my - 3.5} ${cx + 7} ${my + 3}`,
};

function cubeBodyPath(
  tL: number,
  tY: number,
  tR: number,
  bL: number,
  bR: number,
  bY: number,
  rTop: number,
  rBot: number,
  sag: number,
): string {
  return [
    `M ${tL + rTop} ${tY}`,
    `L ${tR - rTop} ${tY}`,
    `Q ${tR} ${tY} ${tR} ${tY + rTop}`,
    `L ${bR} ${bY - rBot}`,
    `Q ${bR} ${bY} ${bR - rBot} ${bY}`,
    `Q 30 ${bY + sag} ${bL + rBot} ${bY}`,
    `Q ${bL} ${bY} ${bL} ${bY - rBot}`,
    `L ${tL} ${tY + rTop}`,
    `Q ${tL} ${tY} ${tL + rTop} ${tY} Z`,
  ].join(' ');
}

function Sparkle({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <path
      d={
        `M ${x} ${y - r} Q ${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y} ` +
        `Q ${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r} ` +
        `Q ${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y} ` +
        `Q ${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r} Z`
      }
      fill={fill}
    />
  );
}

export interface AdaCubeProps {
  size?: number;
  /** 0–4, indexes the melting-ice ramp. Ignored when `tone` is given. */
  rating?: number;
  /** 0 crisp → 1 puddle. */
  melt?: number;
  expr?: CubeExpr;
  /** How many of the three interior air bubbles to draw. */
  bubbles?: number;
  cheeks?: boolean;
  sparkles?: boolean;
  sweat?: boolean;
  tone?: CubeTone;
  style?: CSSProperties;
  className?: string;
}

export default function AdaCube({
  size = 60,
  rating = 4,
  melt = 0,
  expr = 'happy',
  bubbles = 3,
  cheeks = false,
  sparkles = false,
  sweat = false,
  tone,
  style,
  className,
}: AdaCubeProps) {
  const t = tone || CUBE_TONES[Math.max(0, Math.min(4, rating))];
  const m = Math.max(0, Math.min(1, melt));

  // Body geometry — the cube spreads and sags as it melts.
  const tY = 8 + 15 * m;
  const bY = 50 + 2 * m;
  const tL = 11 + 7 * m;
  const tR = 49 - 7 * m;
  const bL = 11 - 6 * m;
  const bR = 49 + 6 * m;
  const rTop = 9 + 3 * m;
  const rBot = 9 + 13 * m;
  const sag = 2.5 * m;

  const body = cubeBodyPath(tL, tY, tR, bL, bR, bY, rTop, rBot, sag);
  const inner = cubeBodyPath(
    tL + 5,
    tY + 5,
    tR - 5,
    bL + 5,
    bR - 5,
    bY - 5,
    rTop * 0.55,
    rBot * 0.6,
    sag * 0.6,
  );

  const faceCY = (tY + bY) / 2 + 1;
  const eyeY = faceCY - 2;
  const eyeR = 2.7 - 0.5 * m;
  const eyeDX = 6 - 1.2 * m;
  const mY = faceCY + 5;
  const gloss = 0.5 * (1 - 0.55 * m);
  const bub: [number, number, number][] = [
    [21, tY + 9, 2.7],
    [26.5, tY + 6, 1.5],
    [19.5, tY + 15.5, 1.9],
  ];
  const ink = t.ink;

  let eyes;
  if (expr === 'happy') {
    eyes = (
      <g stroke={ink} strokeWidth="2.1" fill="none" strokeLinecap="round">
        <path d={`M ${30 - eyeDX - 3} ${eyeY + 1.2} Q ${30 - eyeDX} ${eyeY - 3} ${30 - eyeDX + 3} ${eyeY + 1.2}`} />
        <path d={`M ${30 + eyeDX - 3} ${eyeY + 1.2} Q ${30 + eyeDX} ${eyeY - 3} ${30 + eyeDX + 3} ${eyeY + 1.2}`} />
      </g>
    );
  } else if (expr === 'sad') {
    eyes = (
      <g stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d={`M ${30 - eyeDX - 2.5} ${eyeY - 1.5} L ${30 - eyeDX + 2.5} ${eyeY + 1.5}`} />
        <path d={`M ${30 + eyeDX + 2.5} ${eyeY - 1.5} L ${30 + eyeDX - 2.5} ${eyeY + 1.5}`} />
      </g>
    );
  } else {
    eyes = (
      <g fill={ink}>
        <circle cx={30 - eyeDX} cy={eyeY} r={eyeR} />
        <circle cx={30 + eyeDX} cy={eyeY} r={eyeR} />
      </g>
    );
  }

  const mouth =
    expr === 'happy' ? (
      <g>
        <path
          d={`M ${30 - 6.5} ${mY - 1} Q 30 ${mY + 8.5} ${30 + 6.5} ${mY - 1} Q 30 ${mY + 1.5} ${30 - 6.5} ${mY - 1} Z`}
          fill={ink}
        />
        <path
          d={`M ${30 - 3.3} ${mY + 3.4} Q 30 ${mY + 6.4} ${30 + 3.3} ${mY + 3.4} Q 30 ${mY + 5} ${30 - 3.3} ${mY + 3.4} Z`}
          fill="#e8607f"
        />
      </g>
    ) : (
      <path
        d={MOUTHS[expr](30, mY)}
        stroke={ink}
        strokeWidth={2.4 - 0.4 * m}
        fill="none"
        strokeLinecap="round"
      />
    );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={className}
      style={{ flexShrink: 0, overflow: 'visible', ...style }}
      aria-hidden="true"
      focusable="false"
    >
      {sparkles && (
        <g>
          <Sparkle x={46} y={9} r={4.2} fill={t.border} />
          <Sparkle x={53} y={17} r={2.6} fill={t.border} />
          <circle cx={40} cy={6} r={1.6} fill={t.border} />
          <circle cx={50} cy={5} r={1.2} fill={t.border} />
          <circle cx={56} cy={12} r={1.4} fill={t.border} />
        </g>
      )}

      {/* Ground shadow — widens as the cube spreads. */}
      <ellipse cx="30" cy={bY + 3} rx={16 + 4 * m} ry="3.2" fill={t.border} opacity="0.16" />

      <path
        d={body}
        fill={t.body}
        stroke={t.border}
        strokeWidth={3.4 - 1.2 * m}
        strokeLinejoin="round"
      />
      <path d={inner} fill="#fff" opacity={0.32 * (1 - 0.5 * m)} />
      <path
        d={`M ${tL + rTop + 1} ${tY + 2.5} Q ${tL + 3} ${tY + 3} ${tL + 3.2} ${tY + rTop + 5}`}
        stroke="#fff"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        opacity={gloss}
      />

      {bub.slice(0, bubbles).map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" opacity={(0.85 - i * 0.15) * (1 - 0.5 * m)} />
      ))}

      {cheeks && (
        <g fill="#f0a0b6" opacity="0.72">
          <ellipse cx={30 - eyeDX - 2} cy={eyeY + 5.5} rx="3" ry="2" />
          <ellipse cx={30 + eyeDX + 2} cy={eyeY + 5.5} rx="3" ry="2" />
        </g>
      )}

      {eyes}
      {mouth}

      {sweat && (
        <path
          d={`M ${30 + eyeDX + 6} ${eyeY - 3} q -2.4 4 0 6 q 2.4 -2 0 -6 Z`}
          fill="#8fd0ef"
          stroke="#6bb8e0"
          strokeWidth="0.5"
        />
      )}
    </svg>
  );
}
