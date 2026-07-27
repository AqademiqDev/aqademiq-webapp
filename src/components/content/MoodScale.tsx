import type { CSSProperties } from 'react';
import AdaCube from '../brand/AdaCube';
import { MOOD_LABELS, moodExpr, moodMelt } from '../../data/tasks';

/* ─────────────────────────────────────────────────────────────────────────
   MoodScale — the five melting-ice mood cubes (frames 01.7, 07.1, 07.2).
   The selected step sits on an accent-soft 16px tile with an accent label.
   ───────────────────────────────────────────────────────────────────────── */

export interface MoodScaleProps {
  value: number | null;
  onChange: (rating: number) => void;
  size?: number;
  style?: CSSProperties;
}

export default function MoodScale({ value, onChange, size = 46, style }: MoodScaleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="How are you feeling?"
      style={{ display: 'flex', justifyContent: 'space-between', gap: 6, ...style }}
    >
      {MOOD_LABELS.map((label, rating) => {
        const selected = value === rating;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(rating)}
            className="aq-press focus-ring"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 7,
              padding: '10px 4px',
              borderRadius: 16,
              background: selected ? 'var(--accent-soft)' : 'transparent',
              transition: 'background var(--dur-fast) var(--ease-standard)',
            }}
          >
            <AdaCube size={size} rating={rating} melt={moodMelt(rating)} expr={moodExpr(rating)} />
            <span
              style={{
                font: '800 9px var(--font-sans)',
                color: selected ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The week strip of logged moods (02.1 "This week", 06.1 "Mood this week").
 * Unlogged days render as a dashed circle.
 */
export function MoodWeek({
  days,
  size = 28,
  dashSize,
  onDayClick,
  style,
}: {
  days: { letter: string; rating: number | null }[];
  size?: number;
  dashSize?: number;
  onDayClick?: (index: number) => void;
  style?: CSSProperties;
}) {
  const dash = dashSize ?? size - 2;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', ...style }}>
      {days.map((d, i) => (
        <div
          key={i}
          onClick={onDayClick ? () => onDayClick(i) : undefined}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
            cursor: onDayClick ? 'pointer' : undefined,
          }}
        >
          {d.rating === null ? (
            <div
              style={{
                width: dash,
                height: dash,
                borderRadius: '50%',
                border: '2px dashed var(--border-hairline)',
              }}
            />
          ) : (
            <AdaCube size={size} rating={d.rating} melt={moodMelt(d.rating)} expr={moodExpr(d.rating)} />
          )}
          <span style={{ font: '700 8px var(--font-sans)', color: 'var(--text-dim)' }}>{d.letter}</span>
        </div>
      ))}
    </div>
  );
}
