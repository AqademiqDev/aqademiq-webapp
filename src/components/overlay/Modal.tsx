import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import Icon from '../core/Icon';

/* ─────────────────────────────────────────────────────────────────────────
   Modal / sheet (README §2.11).

   Overlay sits below the nav (inset: 58px 0 0 0) so the TopNav stays legible,
   matching every modal frame. Panel is a card at --shadow-pop with 24px 26px
   padding and a per-screen max-width.
   ───────────────────────────────────────────────────────────────────────── */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Hides the × in the header row. */
  hideClose?: boolean;
  maxWidth?: number;
  /** Modals on shells without a TopNav cover the whole viewport. */
  fullBleed?: boolean;
  /** Anchor the panel to the bottom of the overlay (00b.4 / 00b.5). */
  align?: 'center' | 'bottom';
  padding?: string | number;
  children: ReactNode;
  panelStyle?: CSSProperties;
  scrimStyle?: CSSProperties;
  'aria-label'?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  hideClose = false,
  maxWidth = 460,
  fullBleed = false,
  align = 'center',
  padding = '24px 26px',
  children,
  panelStyle,
  scrimStyle,
  'aria-label': ariaLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes; focus moves into the panel on open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: fullBleed ? 0 : '58px 0 0 0',
        background: 'var(--scrim)',
        display: 'flex',
        alignItems: align === 'bottom' ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 40,
        animation: 'aqScrimIn var(--dur-base) var(--ease-standard)',
        ...scrimStyle,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="aq-scroll"
        style={{
          width: '100%',
          maxWidth,
          background: 'var(--surface-card)',
          borderRadius: 18,
          boxShadow: 'var(--shadow-pop)',
          padding,
          maxHeight: '100%',
          overflow: 'auto',
          outline: 'none',
          animation: 'aqPanelIn var(--dur-base) var(--ease-standard)',
          ...panelStyle,
        }}
      >
        {(title || !hideClose) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div style={{ font: '800 17px var(--font-sans)' }}>{title}</div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="aq-press focus-ring"
                style={{ display: 'flex', borderRadius: '50%' }}
              >
                <Icon name="close" size={20} color="var(--text-dim)" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
