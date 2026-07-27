import { useEffect, useState } from 'react';

import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import { MONTH_WEEKDAYS } from '../../data/tasks';
import {
  addDays,
  daysInMonth,
  fromIsoDate,
  longDateLabel,
  mondayIndex,
  monthLabel,
  monthStart,
  addMonths,
  todayIso,
} from '../../lib/format';

/* Frame 02.4 — Month picker. Modal, max-width 440.

   A real picker: the grid is built from the viewed month, the chevrons move
   month by month, tapping a day arms it (accent, named in the legend row) and
   "Jump to date" hands it back to the Plan screen. */

export interface MonthPickerProps {
  open: boolean;
  onClose: () => void;
  /** The day the plan is currently showing. */
  value: string;
  onSelect: (iso: string) => void;
}

interface Cell {
  iso: string;
  day: number;
  muted: boolean;
}

function buildCells(monthIso: string): Cell[] {
  const first = monthStart(monthIso);
  const cells: Cell[] = [];
  for (let i = mondayIndex(first); i > 0; i--) {
    const iso = addDays(first, -i);
    cells.push({ iso, day: fromIsoDate(iso).getDate(), muted: true });
  }
  for (let i = 0; i < daysInMonth(first); i++) {
    cells.push({ iso: addDays(first, i), day: i + 1, muted: false });
  }
  while (cells.length % 7 !== 0) {
    const iso = addDays(cells[cells.length - 1].iso, 1);
    cells.push({ iso, day: fromIsoDate(iso).getDate(), muted: true });
  }
  return cells;
}

export default function MonthPicker({ open, onClose, value, onSelect }: MonthPickerProps) {
  const [pending, setPending] = useState(value);
  const [cursor, setCursor] = useState(() => monthStart(value));

  // Every reopen starts from the day the plan is on.
  useEffect(() => {
    if (!open) return;
    setPending(value);
    setCursor(monthStart(value));
  }, [open, value]);

  const today = todayIso();
  const cells = buildCells(cursor);

  const pick = (iso: string) => {
    setPending(iso);
    setCursor(monthStart(iso));
  };

  return (
    <Modal open={open} onClose={onClose} hideClose maxWidth={440} padding={24} aria-label="Jump to date">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor((c) => addMonths(c, -1))}
          className="aq-press focus-ring"
          style={{ display: 'flex', borderRadius: '50%' }}
        >
          <Icon name="chevron_left" size={22} color="var(--text-secondary)" />
        </button>
        <span style={{ font: '800 17px var(--font-sans)' }}>{monthLabel(cursor)}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="aq-press focus-ring"
          style={{ display: 'flex', borderRadius: '50%' }}
        >
          <Icon name="chevron_right" size={22} color="var(--text-secondary)" />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7,1fr)',
          gap: 6,
          marginBottom: 8,
        }}
      >
        {MONTH_WEEKDAYS.map((w, i) => (
          <div
            key={i}
            style={{ textAlign: 'center', font: '800 9px var(--font-sans)', color: 'var(--text-dim)' }}
          >
            {w}
          </div>
        ))}
        {cells.map((d) => (
          <button
            key={d.iso}
            type="button"
            onClick={() => pick(d.iso)}
            aria-label={longDateLabel(d.iso)}
            aria-pressed={d.iso === pending}
            className="aq-press focus-ring"
            style={{ textAlign: 'center', padding: '9px 0', position: 'relative', borderRadius: 10 }}
          >
            {d.iso === today ? (
              <span
                style={{
                  display: 'inline-flex',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--surface-ink)',
                  color: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '800 12px var(--font-sans)',
                }}
              >
                {d.day}
              </span>
            ) : (
              <span
                style={{
                  font: '700 12px var(--font-sans)',
                  color: d.iso === pending ? 'var(--accent)' : d.muted ? 'var(--text-dim)' : undefined,
                }}
              >
                {d.day}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 20px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ font: '600 11px var(--font-sans)', color: 'var(--text-secondary)' }}>
          {longDateLabel(pending)}
        </span>
      </div>

      <Button
        full
        onClick={() => {
          onSelect(pending);
          onClose();
        }}
      >
        Jump to date
      </Button>
    </Modal>
  );
}
