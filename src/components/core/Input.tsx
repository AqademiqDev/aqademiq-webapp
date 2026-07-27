import { useId, type CSSProperties, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import Icon from './Icon';

/* ─────────────────────────────────────────────────────────────────────────
   Input field + Textarea (README §2.3), with the eyebrow label above and the
   light client-side validation style from the brief's pre-resolved item 3:
   --aq-danger border plus a helper line under the field.
   ───────────────────────────────────────────────────────────────────────── */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label?: string;
  error?: string;
  /** Trailing adornment — usually a Material Icons ligature. */
  trailing?: ReactNode;
  /** The frames draw the active field taller, heavier and accent-bordered. */
  focusedStyle?: boolean;
  style?: CSSProperties;
  wrapperStyle?: CSSProperties;
}

export default function Input({
  label,
  error,
  trailing,
  focusedStyle = false,
  style,
  wrapperStyle,
  id,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errId = `${inputId}-err`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...wrapperStyle }}>
      {label && (
        <label htmlFor={inputId} className="eye" style={{ marginBottom: 7, display: 'block' }}>
          {label}
        </label>
      )}
      <div
        style={{
          height: focusedStyle ? 48 : 46,
          borderRadius: 12,
          border: `1.5px solid ${
            error ? 'var(--aq-danger)' : focusedStyle ? 'var(--accent)' : 'var(--border-hairline)'
          }`,
          background: 'var(--surface-page)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 14px',
          transition: 'border-color var(--dur-fast) var(--ease-standard)',
        }}
      >
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            border: 0,
            outline: 'none',
            background: 'transparent',
            font: focusedStyle ? '700 15px var(--font-sans)' : '600 13px var(--font-sans)',
            color: 'var(--text-primary)',
            ...style,
          }}
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <div
          id={errId}
          style={{ font: '600 10.5px var(--font-sans)', color: 'var(--aq-danger)', marginTop: 6 }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  label?: string;
  error?: string;
  style?: CSSProperties;
  wrapperStyle?: CSSProperties;
}

export function Textarea({ label, error, style, wrapperStyle, id, ...rest }: TextareaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const errId = `${areaId}-err`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...wrapperStyle }}>
      {label && (
        <label htmlFor={areaId} className="eye" style={{ marginBottom: 7, display: 'block' }}>
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        style={{
          minHeight: 88,
          borderRadius: 12,
          border: `1.5px solid ${error ? 'var(--aq-danger)' : 'var(--border-hairline)'}`,
          background: 'var(--surface-page)',
          padding: '12px 14px',
          font: '600 12.5px/1.6 var(--font-sans)',
          color: 'var(--text-primary)',
          outline: 'none',
          resize: 'vertical',
          ...style,
        }}
        {...rest}
      />
      {error && (
        <div
          id={errId}
          style={{ font: '600 10.5px var(--font-sans)', color: 'var(--aq-danger)', marginTop: 6 }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * The static "as-drawn" field the frames use to show a filled or focused
 * value without a live input — a label row plus a value and an optional icon.
 */
export function FieldDisplay({
  label,
  value,
  placeholder,
  icon,
  focused = false,
  onClick,
  style,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  icon?: string;
  focused?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const showPlaceholder = !value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <div className="eye" style={{ marginBottom: 7 }}>{label}</div>}
      <div
        onClick={onClick}
        style={{
          height: focused ? 48 : 46,
          borderRadius: 12,
          border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border-hairline)'}`,
          background: 'var(--surface-page)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '0 14px',
          font: focused ? '700 15px var(--font-sans)' : '600 13px var(--font-sans)',
          color: showPlaceholder ? 'var(--text-dim)' : 'var(--text-primary)',
          cursor: onClick ? 'pointer' : undefined,
          ...style,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          {showPlaceholder ? placeholder : value}
          {focused && <span style={{ color: 'var(--accent)', marginLeft: 1 }}>|</span>}
        </span>
        {icon && <Icon name={icon} size={18} color="var(--text-dim)" />}
      </div>
    </div>
  );
}
