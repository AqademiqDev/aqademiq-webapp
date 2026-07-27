import type { CSSProperties } from 'react';
import Icon from '../core/Icon';
import { SUBJECT_SWATCHES } from '../../data/subjects';

/* Shared form pieces reused across onboarding, Subjects and Settings. */

/** The dashed accent dropzone (frames 01.8, 03.5). */
export function Dropzone({ hint, style }: { hint: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        border: '2px dashed var(--accent)',
        borderRadius: 18,
        background: 'var(--accent-soft)',
        padding: '34px 20px',
        cursor: 'pointer',
        ...style,
      }}
    >
      <Icon name="cloud_upload" size={36} color="var(--accent)" />
      <div style={{ font: '800 13px var(--font-sans)', marginTop: 10 }}>Drop files here or browse</div>
      <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 3 }}>{hint}</div>
    </div>
  );
}

/** The six-swatch colour picker (frames 01.6, 03.2, 13.11). */
export function SwatchRow({
  value,
  onChange,
  swatches = SUBJECT_SWATCHES,
  size = 30,
  style,
}: {
  value: string;
  onChange: (c: string) => void;
  swatches?: string[];
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div role="radiogroup" aria-label="Colour" style={{ display: 'flex', gap: 10, ...style }}>
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className="aq-press focus-ring"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: c,
            border: value === c ? '3px solid var(--text-primary)' : '3px solid transparent',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

/** A file row with icon, name, meta and a trailing check (01.8, 03.5). */
export function FileRow({
  icon = 'picture_as_pdf',
  name,
  meta,
  trailing = 'check_circle',
  sunken = false,
  onClick,
  style,
}: {
  icon?: string;
  name: string;
  meta: string;
  trailing?: string | null;
  sunken?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: sunken ? 'var(--surface-page)' : 'transparent',
        borderRadius: 12,
        padding: sunken ? '10px 13px' : '9px 0',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      <Icon name={icon} size={19} color="var(--accent)" />
      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <div style={{ font: '800 11.5px var(--font-sans)' }}>{name}</div>
        <div style={{ font: '600 9.5px var(--font-sans)', color: 'var(--text-dim)' }}>{meta}</div>
      </div>
      {trailing && <Icon name={trailing} size={18} color="var(--accent)" />}
    </div>
  );
}
