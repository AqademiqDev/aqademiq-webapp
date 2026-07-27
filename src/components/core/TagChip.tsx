import type { CSSProperties, ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   TagChip / filter chip (README §2.7).

   Unselected: hairline border, secondary text. Selected: the tag hue for the
   border and text with the same hue at 18 alpha behind it. Filter chips on a
   card ground carry the card surface + --shadow-card instead of a border.
   ───────────────────────────────────────────────────────────────────────── */

/** The fixed 7-hue study-tag palette (README §1.1). */
export const TAG_COLORS: Record<string, string> = {
  Lecture: '#5cbbff',
  Class: '#6b5cf0',
  Exam: '#e85476',
  Assignment: '#2a9d6b',
  Report: '#e8a430',
  Presentation: '#c0497b',
  Reading: '#7a8699',
};

export interface TagChipProps {
  label: ReactNode;
  color?: string;
  selected?: boolean;
  /** Filter chips are a touch larger and heavier than inline tags. */
  filter?: boolean;
  /** Renders on a card ground (surface + shadow) rather than a hairline border. */
  onCard?: boolean;
  /** Hides the leading colour dot. */
  noDot?: boolean;
  /** "All" style — solid ink when selected. */
  ink?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export default function TagChip({
  label,
  color = 'var(--accent)',
  selected = false,
  filter = false,
  onCard = false,
  noDot = false,
  ink = false,
  onClick,
  style,
}: TagChipProps) {
  const inkActive = ink && selected;

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: filter ? 7 : 6,
    padding: filter ? '7px 15px' : '5px 11px',
    borderRadius: 100,
    font: filter ? '800 11.5px var(--font-sans)' : '600 11px var(--font-sans)',
    whiteSpace: 'nowrap',
    cursor: onClick ? 'pointer' : 'default',
  };

  let skin: CSSProperties;
  if (inkActive) {
    skin = { background: 'var(--surface-ink)', color: '#fff', border: '1.5px solid transparent' };
  } else if (selected) {
    skin = { border: `1.5px solid ${color}`, background: `${color}18`, color };
  } else if (onCard) {
    skin = {
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      border: '1.5px solid transparent',
      color: 'var(--text-secondary)',
    };
  } else {
    skin = { border: '1.5px solid var(--border-hairline)', color: 'var(--text-secondary)' };
  }

  const dotColor = inkActive ? '#fff' : color;

  const content = (
    <>
      {!noDot && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      )}
      {label}
    </>
  );

  if (!onClick) {
    return <span style={{ ...base, ...skin, ...style }}>{content}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="aq-press focus-ring"
      style={{ ...base, ...skin, ...style }}
    >
      {content}
    </button>
  );
}
