import type { CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   PrismGlyph — the Prism mode mark (README §2.13): a ring plus a five-bar
   soundwave, stroked in the mode's colour. "No sound" swaps the bars for a
   single diagonal slash.
   ───────────────────────────────────────────────────────────────────────── */

export type PrismModeId = 'deep' | 'flow' | 'review' | 'wind' | 'none';

export interface PrismMode {
  id: PrismModeId;
  name: string;
  desc: string;
  color: string;
}

/** The five modes and their colours, exactly as the frames draw them. */
export const PRISM_MODES: PrismMode[] = [
  { id: 'deep', name: 'Deep Work', desc: 'Low-freq focus carrier. Hard cognitive tasks.', color: '#6b5cf0' },
  { id: 'flow', name: 'Flow', desc: 'Warm midrange. Creative & writing work.', color: '#2a9d6b' },
  { id: 'review', name: 'Review', desc: 'Bright, alert texture. Revising & recall.', color: '#e8a430' },
  { id: 'wind', name: 'Wind-down', desc: 'Soft, slow ambience. Light tasks & cool-down.', color: '#7a8699' },
  { id: 'none', name: 'No sound', desc: 'Silence — just the timer.', color: '#9aa3b2' },
];

/** Bar geometry: x, then the half-height above/below the 12 centre line. */
const BARS: [number, number, number][] = [
  [6, 10, 14],
  [9, 8.5, 15.5],
  [12, 7, 17],
  [15, 8.5, 15.5],
  [18, 10, 14],
];

export interface PrismGlyphProps {
  size?: number;
  color?: string;
  /** Draws the ring with a single diagonal slash instead of the soundwave. */
  muted?: boolean;
  style?: CSSProperties;
}

export default function PrismGlyph({
  size = 20,
  color = 'var(--accent)',
  muted = false,
  style,
}: PrismGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.8" />
      {muted ? (
        <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        BARS.map(([x, y1, y2]) => (
          <line key={x} x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        ))
      )}
    </svg>
  );
}
