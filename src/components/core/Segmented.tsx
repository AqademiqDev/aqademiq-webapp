import type { CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   Segmented control (README §2.5). Two grounds: the default floating card
   track, and the "sunken" variant used in Settings.
   ───────────────────────────────────────────────────────────────────────── */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'card' | 'sunken';
  style?: CSSProperties;
  'aria-label'?: string;
}

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  variant = 'card',
  style,
  'aria-label': ariaLabel,
}: SegmentedProps<T>) {
  const sunken = variant === 'sunken';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        background: sunken ? 'var(--surface-page)' : 'var(--surface-card)',
        borderRadius: sunken ? 12 : 100,
        padding: sunken ? 4 : 3,
        boxShadow: sunken ? undefined : 'var(--shadow-card)',
        flexShrink: 0,
        ...style,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className="aq-press focus-ring"
            style={{
              flex: sunken ? 1 : undefined,
              padding: sunken ? '9px 0' : '7px 16px',
              borderRadius: sunken ? 9 : 100,
              font: '800 11px var(--font-sans)',
              background: active ? 'var(--surface-ink)' : 'transparent',
              color: active ? '#fff' : 'var(--text-secondary)',
              transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
