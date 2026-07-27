import { useState, type CSSProperties, type ReactNode } from 'react';
import Icon from './Icon';

/* Small shared primitives: eyebrow label, progress bar, collapsible section
   header, and the plain section header used across panels. */

/** EyebrowLabel (README §2.16). */
export function EyebrowLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="eye" style={style}>
      {children}
    </div>
  );
}

/** ProgressBar (README §2.19) — onboarding step track. */
export function ProgressBar({
  value,
  height = 5,
  track = 'var(--border-hairline)',
  fill = 'var(--accent)',
  style,
}: {
  /** 0–1. */
  value: number;
  height?: number;
  track?: string;
  fill?: string;
  style?: CSSProperties;
}) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ flex: 1, height, borderRadius: 100, background: track, overflow: 'hidden', ...style }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 100,
          background: fill,
          transition: 'width var(--dur-base) var(--ease-standard)',
        }}
      />
    </div>
  );
}

/**
 * Collapsible section header (README §2.17) — the centred ANYTIME / PLANNED
 * rules on the Plan dashboard. Chevron rotates 180° when collapsed.
 */
export function SectionHeader({
  label,
  count,
  open,
  onToggle,
  style,
}: {
  label: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 11,
        cursor: 'pointer',
        width: '100%',
        background: 'transparent',
        ...style,
      }}
    >
      <Icon
        name="expand_more"
        size={18}
        color="var(--text-secondary)"
        style={{
          transform: open ? 'none' : 'rotate(-90deg)',
          transition: 'transform var(--dur-fast) var(--ease-standard)',
        }}
      />
      <span
        style={{
          font: '800 11px var(--font-sans)',
          letterSpacing: '.1em',
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          style={{
            font: '800 10px var(--font-sans)',
            color: 'var(--accent)',
            background: 'var(--accent-soft)',
            borderRadius: 100,
            padding: '2px 8px',
            minWidth: 18,
            textAlign: 'center',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Panel heading + subtitle, as used across Settings and detail panes. */
export function PanelTitle({
  title,
  sub,
  style,
}: {
  title: string;
  sub?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={style}>
      <div style={{ font: '800 17px var(--font-sans)', letterSpacing: '-.2px' }}>{title}</div>
      {sub && (
        <div
          style={{
            font: '600 12px/1.5 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginTop: 5,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/** A setting row: label + sub on the left, control on the right (README §2.15). */
export function SettingRow({
  title,
  sub,
  control,
  last = false,
  style,
}: {
  title: ReactNode;
  sub?: ReactNode;
  control?: ReactNode;
  last?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '15px 0',
        borderBottom: last ? undefined : '1px solid var(--border-hairline)',
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ font: '800 13px var(--font-sans)' }}>{title}</div>
        {sub && (
          <div
            style={{
              font: '600 11px var(--font-sans)',
              color: 'var(--text-secondary)',
              marginTop: 3,
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {control}
    </div>
  );
}

/**
 * A slider on the app's own track geometry: 6px sunken rail, accent fill and
 * an 18px white knob with a 2px accent border.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  trackHeight = 6,
  style,
  'aria-label': ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  trackHeight?: number;
  style?: CSSProperties;
  'aria-label'?: string;
}) {
  const [hover, setHover] = useState(false);
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div
      style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', height: 20, ...style }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: trackHeight,
          borderRadius: 100,
          background: 'var(--surface-sunken)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: `${pct}%`,
          height: trackHeight,
          borderRadius: 100,
          background: 'var(--accent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `calc(${pct}% - 9px)`,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          border: '2px solid var(--accent)',
          boxShadow: hover ? 'var(--shadow-card)' : undefined,
          pointerEvents: 'none',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="focus-ring"
        style={{
          position: 'relative',
          width: '100%',
          height: 20,
          opacity: 0,
          margin: 0,
          cursor: 'pointer',
          zIndex: 1,
        }}
      />
    </div>
  );
}

/** The +/− stepper drawn in onboarding (01.4) and the Set-time dialog (04.3). */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  size = 44,
  children,
  boxStyle,
  'aria-label': ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  children: ReactNode;
  boxStyle?: CSSProperties;
  'aria-label'?: string;
}) {
  const btn = (name: string, delta: number, label: string) => (
    <button
      type="button"
      onClick={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      disabled={delta < 0 ? value <= min : value >= max}
      aria-label={label}
      className="aq-press aq-darken focus-ring"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={name} size={20} />
    </button>
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}
    >
      {btn('remove', -step, 'Decrease')}
      <div style={boxStyle}>{children}</div>
      {btn('add', step, 'Increase')}
    </div>
  );
}
