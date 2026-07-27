import type { CSSProperties } from 'react';

/* Toggle (README §2.6) — 46×27 track, 21px knob. Focus uses a small
   40×23 variant (frame 04.2). */

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  small?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  style?: CSSProperties;
}

export default function Toggle({
  checked,
  onChange,
  small = false,
  disabled = false,
  'aria-label': ariaLabel,
  style,
}: ToggleProps) {
  const w = small ? 40 : 46;
  const h = small ? 23 : 27;
  const knob = small ? 17 : 21;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="aq-press focus-ring"
      style={{
        width: w,
        height: h,
        borderRadius: 100,
        padding: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        background: checked ? 'var(--accent)' : 'var(--text-dim)',
        flexShrink: 0,
        transition: 'background var(--dur-fast) var(--ease-standard)',
        ...style,
      }}
    >
      <span
        style={{
          width: knob,
          height: knob,
          borderRadius: '50%',
          background: '#fff',
          display: 'block',
          transition: 'transform var(--dur-fast) var(--ease-standard)',
        }}
      />
    </button>
  );
}
