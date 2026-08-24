import type { CSSProperties } from 'react';
import AdaCube, { CUBE_TONES, type CubeExpr } from './AdaCube';

/* ─────────────────────────────────────────────────────────────────────────
   IceTimer — the melting focus gauge (README §2.10).

   A thin progress ring depletes while Ada melts from a crisp cube toward a
   puddle. `drip` adds the falling melt-drops (running); `frost` swaps the
   ring to the frost hue and lays a shimmering rime over it (paused).
   ───────────────────────────────────────────────────────────────────────── */

export interface IceTimerProps {
  /** 0 → 1, elapsed fraction. The accent ring shows what is left. */
  progress?: number;
  size?: number;
  expr?: CubeExpr;
  /** Running — falling melt-drops. */
  drip?: boolean;
  /** Paused — frozen ring + rime shimmer. */
  frost?: boolean;
  style?: CSSProperties;
}

export default function IceTimer({
  progress = 0,
  size = 184,
  expr = 'happy',
  drip = false,
  frost = false,
  style,
}: IceTimerProps) {
  const stroke = 7;
  const r = (size - stroke) / 2 - 1;
  const c = 2 * Math.PI * r;
  const p = Math.min(Math.max(progress, 0), 1);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-sunken)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={frost ? 'var(--aq-frost)' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * p}
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
      </svg>

      {/* The melt fraction advances ~1/1500 per tick on a 25-minute session, so
          on its own the cube looks frozen. `aq-ice-alive` adds the slow breath
          that makes a running timer read as *running*; the melt itself still
          carries the real progress. */}
      <div className={drip ? 'aq-ice-alive' : undefined} style={{ display: 'flex' }}>
        <AdaCube size={size * 0.6} tone={CUBE_TONES[4]} melt={p} expr={expr} bubbles={3} />
      </div>

      {/* Drops used to wait for p > 0.08 — two full minutes of a 25-minute
          session with nothing moving. They now start with the clock. */}
      {drip &&
        [0, 1].map((i) => (
          <div
            key={i}
            className="aq-drip"
            style={{
              position: 'absolute',
              bottom: size * 0.27 - i * 4,
              left: `${49 + i * 7}%`,
              width: 5,
              height: 8,
              borderRadius: '50% 50% 60% 60%',
              background: 'var(--aq-drip)',
              animation: `aqDrip ${1.6 + i * 0.4}s ${i * 0.6}s infinite ease-in`,
            }}
          />
        ))}

      {frost && (
        <div
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            boxShadow: 'inset 0 0 20px rgba(159,214,239,0.65)',
            animation: 'aqShimmer 2.2s infinite',
          }}
        />
      )}
    </div>
  );
}
