import type { CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   LockBadge — the amber lock dot marking features gated behind an account
   (guest mode). Overlay it on nav tabs, cards or the mascot.
   ───────────────────────────────────────────────────────────────────────── */

export interface LockBadgeProps {
  size?: number;
  /** Ring colour — the badge is normally cut out of the surface behind it. */
  ringColor?: string;
  ringWidth?: number;
  style?: CSSProperties;
}

export default function LockBadge({
  size = 14,
  ringColor = 'var(--surface-card)',
  ringWidth = 2,
  style,
}: LockBadgeProps) {
  const glyph = size * 0.58;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--aq-warning)',
        border: `${ringWidth}px solid ${ringColor}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" fill="#fff" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
