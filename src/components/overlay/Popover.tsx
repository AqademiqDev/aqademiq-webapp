import { useEffect, type CSSProperties, type ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   Popover (README §2.12) — an anchored panel with no full scrim; the screen
   behind dims only to rgba(20,15,28,0.22). Rows are separated by hairlines.
   ───────────────────────────────────────────────────────────────────────── */

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  /** Absolute offsets inside the app shell, e.g. { top: 104, right: 30 }. */
  anchor?: Pick<CSSProperties, 'top' | 'right' | 'bottom' | 'left'>;
  /** Blurs as well as dims what's behind (04.2, 04.4). */
  blurBehind?: boolean;
  children: ReactNode;
  panelStyle?: CSSProperties;
  'aria-label'?: string;
}

export default function Popover({
  open,
  onClose,
  width = 320,
  anchor = { top: 70, right: 26 },
  blurBehind = false,
  children,
  panelStyle,
  'aria-label': ariaLabel,
}: PopoverProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: '58px 0 0 0',
        background: 'var(--scrim-popover)',
        backdropFilter: blurBehind ? 'blur(2px)' : undefined,
        zIndex: 40,
        animation: 'aqScrimIn var(--dur-fast) var(--ease-standard)',
      }}
    >
      <div
        role="dialog"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        className="aq-scroll"
        style={{
          position: 'absolute',
          ...anchor,
          width,
          background: 'var(--surface-card)',
          borderRadius: 18,
          boxShadow: 'var(--shadow-pop)',
          maxHeight: 'calc(100% - 40px)',
          overflow: 'auto',
          animation: 'aqPopIn var(--dur-fast) var(--ease-standard)',
          ...panelStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
