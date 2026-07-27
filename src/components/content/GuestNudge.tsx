import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import AdaCube from '../brand/AdaCube';
import Icon from '../core/Icon';

/* ─────────────────────────────────────────────────────────────────────────
   Guest-mode pieces (Section 00b).

   GuestNudge     — the accent-soft setup bar above the greeting (00b.1).
   GuestLockCard  — the "This week" card with its content blurred behind an
                    amber lock and a caption (00b.1).
   GuestBlurPane  — a whole pane blurred out, used by the locked stats (00b.4).
   ───────────────────────────────────────────────────────────────────────── */

export default function GuestNudge() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--accent-soft)',
        borderRadius: 16,
        padding: '14px 18px',
        marginBottom: 20,
      }}
    >
      <AdaCube size={32} expr="focused" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '800 13px var(--font-sans)' }}>You&apos;re exploring as a guest</div>
        <div style={{ font: '600 11px var(--font-sans)', color: 'var(--text-secondary)' }}>
          Set up so I can plan your week &amp; track grades — it takes 2 minutes.
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/setup')}
        className="aq-press aq-darken focus-ring"
        style={{
          background: 'var(--surface-ink)',
          color: '#fff',
          borderRadius: 100,
          padding: '9px 16px',
          font: '800 12px var(--font-sans)',
          flexShrink: 0,
        }}
      >
        Set up now →
      </button>
    </div>
  );
}

/**
 * A card whose header stays legible while its body is blurred behind an amber
 * lock, with the reason spelled out underneath (frame 00b.1).
 */
export function GuestLockCard({
  title,
  caption,
  children,
  onClick,
}: {
  title: string;
  caption: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-card)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-card)',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ font: '800 12px var(--font-sans)' }}>{title}</span>
        <Icon name="lock" size={15} color="#e8a430" />
      </div>

      <div style={{ filter: 'blur(2.5px)', opacity: 0.55, pointerEvents: 'none' }} aria-hidden="true">
        {children}
      </div>

      <div
        style={{
          font: '700 10px var(--font-sans)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginTop: 10,
        }}
      >
        {caption}
      </div>
    </div>
  );
}

/** A whole pane blurred out behind a bottom-anchored prompt (frame 00b.4). */
export function GuestBlurPane({ children }: { children: ReactNode }) {
  return (
    <div style={{ filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none' }} aria-hidden="true">
      {children}
    </div>
  );
}
