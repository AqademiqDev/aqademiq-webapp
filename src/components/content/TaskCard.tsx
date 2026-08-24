import type { CSSProperties } from 'react';

import Icon from '../core/Icon';
import type { TaskStep } from '../../data/tasks';

/* ─────────────────────────────────────────────────────────────────────────
   TaskCard — a task row on the Planner (README §2.8). Optional coloured left
   bar for timed tasks, a subject/type tag with a colour dot, a duration, and
   a tap-to-complete circle on the right.
   ───────────────────────────────────────────────────────────────────────── */

export interface TaskCardProps {
  title: string;
  dur?: string;
  time?: string;
  tag?: string;
  color?: string;
  /** Shows the timed left rule. */
  bar?: boolean;
  done?: boolean;
  dim?: boolean;
  /** Ada's breakdown. Present = the card shows the badge, count and checklist. */
  steps?: TaskStep[];
  /** Ticking a step. Session-only — the API has no per-step write. */
  onToggleStep?: (stepId: string) => void;
  onToggle?: () => void;
  onClick?: () => void;
  style?: CSSProperties;
}

export default function TaskCard({
  title,
  dur,
  time,
  tag,
  color = 'var(--accent)',
  bar = false,
  done = false,
  dim = false,
  steps,
  onToggleStep,
  onToggle,
  onClick,
  style,
}: TaskCardProps) {
  /* A task Ada has broken down reads differently from one it hasn't: mobile
     badges it, counts the progress and lists the steps on the card itself. The
     web only showed any of this after opening the task, so from the plan the
     two were indistinguishable. */
  const hasSteps = !!steps?.length;
  const doneSteps = steps?.filter((s) => s.done).length ?? 0;
  return (
    <div
      onClick={onClick}
      className={onClick ? 'aq-lift' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '11px 13px',
        opacity: dim ? 0.5 : 1,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
     <div style={{ display: 'flex', alignItems: 'stretch', gap: 11 }}>
      {bar && <div style={{ width: 4, borderRadius: 4, background: color, flexShrink: 0 }} />}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.25, color: 'var(--text-primary)' }}>
            {title}
          </span>
          {hasSteps && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                font: '800 9px var(--font-sans)',
                color: 'var(--accent)',
                background: 'var(--accent-soft)',
                borderRadius: 100,
                padding: '3px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="auto_awesome" size={10} color="var(--accent)" />
              Ada · {steps!.length} steps
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {time && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-primary)' }}>{time}</span>}
          {tag && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              {tag}
            </span>
          )}
          {dur && <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600 }}>{dur}</span>}
          {hasSteps && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-secondary)' }}>
              {doneSteps}/{steps!.length} done
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={
          onToggle
            ? (e) => {
                e.stopPropagation();
                onToggle();
              }
            : undefined
        }
        aria-label={done ? `Mark "${title}" as not done` : `Mark "${title}" as done`}
        aria-pressed={done}
        className="focus-ring"
        style={{
          alignSelf: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${done ? 'var(--accent)' : '#d6d3ce'}`,
          background: done ? 'var(--accent)' : 'transparent',
          flexShrink: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
      </button>
     </div>

      {hasSteps && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          {steps!.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={(e) => {
                // The row itself opens the task; a step tick must not.
                e.stopPropagation();
                onToggleStep?.(s.id);
              }}
              disabled={!onToggleStep}
              aria-pressed={s.done}
              className="focus-ring"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                textAlign: 'left',
                width: '100%',
                borderRadius: 6,
                cursor: onToggleStep ? 'pointer' : 'default',
              }}
            >
              <span
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  border: `1.5px solid ${s.done ? 'var(--accent)' : 'var(--text-dim)'}`,
                  background: s.done ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {s.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>✓</span>}
              </span>
              <span
                style={{
                  font: '600 11.5px/1.4 var(--font-sans)',
                  color: s.done ? 'var(--text-dim)' : 'var(--text-secondary)',
                  textDecoration: s.done ? 'line-through' : undefined,
                }}
              >
                {s.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
