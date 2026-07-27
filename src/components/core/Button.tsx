import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import Icon from './Icon';

/* ─────────────────────────────────────────────────────────────────────────
   Button (README §2.2). Every variant's height, radius, weight and colour
   is drawn from the frames; interactive states follow the build brief's
   pre-resolved §9 Q1 (darken ~6% on hover, scale .96 on press, --ring-focus
   on keyboard focus, .45 opacity when disabled).
   ───────────────────────────────────────────────────────────────────────── */

export type ButtonVariant = 'ink' | 'ghost' | 'soft' | 'destructive' | 'smallInk' | 'dashed' | 'glass';

const BASE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  whiteSpace: 'nowrap',
};

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  ink: {
    height: 48,
    borderRadius: 100,
    background: 'var(--surface-ink)',
    color: '#fff',
    font: "800 14px var(--font-sans)",
    gap: 8,
  },
  ghost: {
    height: 44,
    borderRadius: 100,
    border: '1.5px solid var(--border-hairline)',
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    font: "800 12.5px var(--font-sans)",
    gap: 9,
  },
  soft: {
    height: 46,
    borderRadius: 100,
    background: 'var(--accent-soft)',
    color: 'var(--accent)',
    font: "800 12.5px var(--font-sans)",
    gap: 8,
  },
  destructive: {
    height: 48,
    borderRadius: 100,
    background: '#e85476',
    color: '#fff',
    font: "800 14px var(--font-sans)",
    gap: 8,
  },
  smallInk: {
    padding: '9px 16px',
    borderRadius: 100,
    background: 'var(--surface-ink)',
    color: '#fff',
    font: "800 12px var(--font-sans)",
    gap: 7,
  },
  dashed: {
    border: '1.5px dashed var(--border-hairline)',
    borderRadius: 12,
    padding: '13px 14px',
    background: 'transparent',
    color: 'var(--text-secondary)',
    font: "800 12.5px var(--font-sans)",
    gap: 7,
  },
  glass: {
    height: 46,
    borderRadius: 100,
    background: 'rgba(255,255,255,.16)',
    border: '1.5px solid rgba(255,255,255,.5)',
    color: '#fff',
    font: "800 13px var(--font-sans)",
    gap: 8,
  },
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  /** Material Icons ligature drawn before the label. */
  icon?: string;
  iconSize?: number;
  /** Material Icons ligature drawn after the label. */
  trailingIcon?: string;
  loading?: boolean;
  full?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

export default function Button({
  variant = 'ink',
  icon,
  iconSize,
  trailingIcon,
  loading = false,
  full = false,
  children,
  style,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const v = VARIANTS[variant];
  const defaultIconSize = variant === 'ink' || variant === 'destructive' ? 18 : 17;

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`aq-press aq-darken focus-ring${className ? ` ${className}` : ''}`}
      style={{ ...BASE, ...v, ...(full ? { width: '100%' } : null), ...style }}
      {...rest}
    >
      {loading ? (
        <Spinner size={variant === 'ink' || variant === 'destructive' ? 18 : 16} />
      ) : (
        icon && <Icon name={icon} size={iconSize ?? defaultIconSize} />
      )}
      {children}
      {!loading && trailingIcon && <Icon name={trailingIcon} size={iconSize ?? defaultIconSize} />}
    </button>
  );
}

/** The loading spinner drawn in frame 01.11 — reused for every loading state. */
export function Spinner({ size = 20, color = 'var(--accent)' }: { size?: number; color?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2.5px solid ${color}`,
        borderTopColor: 'transparent',
        display: 'inline-block',
        flexShrink: 0,
        animation: 'aqSpin .8s linear infinite',
      }}
    />
  );
}
