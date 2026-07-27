import { useEffect, useState } from 'react';
import Button from '../../components/core/Button';
import Input, { FieldDisplay } from '../../components/core/Input';
import Modal from '../../components/overlay/Modal';
import Toggle from '../../components/core/Toggle';
import { errorMessage } from '../../components/core/Async';
import { useActivateSemester, useCreateSemester } from '../../hooks/data';
import { addMonths, fromIsoDate, monthLabel, todayIso } from '../../lib/format';

/* Frame 03.4 — Create semester (sheet). Modal, max-width 460.
   POST /v1/semesters, then PATCH /v1/semesters/:id/activate when the sheet's
   "set as current" switch is on and the server didn't auto-activate it. */

/** "Aug 1, 2026" — the drawn field label, now showing the picked day too. */
function dateLabel(iso: string): string {
  const [month, year] = monthLabel(iso).split(' ');
  return `${month.slice(0, 3)} ${fromIsoDate(iso).getDate()}, ${year}`;
}

/** The invisible native picker laid over a drawn FieldDisplay. */
const PICKER_STYLE = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 46,
  width: '100%',
  opacity: 0,
  border: 0,
  padding: 0,
  background: 'transparent',
  cursor: 'pointer',
} as const;

export default function CreateSemester({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateSemester();
  const activate = useActivateSemester();

  const [name, setName] = useState('');
  const [start, setStart] = useState(todayIso);
  const [end, setEnd] = useState(() => addMonths(todayIso(), 4));
  const [asCurrent, setAsCurrent] = useState(true);
  const [error, setError] = useState('');
  const [failure, setFailure] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setStart(todayIso());
    setEnd(addMonths(todayIso(), 4));
    setAsCurrent(true);
    setError('');
    setFailure('');
  }, [open]);

  const pending = create.isPending || activate.isPending;

  function create_() {
    if (!name.trim()) {
      setError('Name the semester.');
      return;
    }
    setError('');
    // `yyyy-MM-dd` compares correctly as text — no Date round-trip needed.
    if (start > end) {
      setFailure('The start date must be on or before the end date.');
      return;
    }
    setFailure('');

    create.mutate(
      { name: name.trim(), start, end },
      {
        onSuccess: (semester) => {
          // The first semester is activated server-side already.
          if (asCurrent && !semester.is_active) {
            activate.mutate(semester.id, {
              onSuccess: () => onClose(),
              onError: (e) => setFailure(errorMessage(e)),
            });
            return;
          }
          onClose();
        },
        onError: (e) => setFailure(errorMessage(e)),
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create semester" maxWidth={460} panelStyle={{ padding: '24px 26px' }}>
      <Input
        label="NAME"
        value={name}
        placeholder="Fall '26"
        focusedStyle
        error={error}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        wrapperStyle={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <FieldDisplay label="STARTS" value={dateLabel(start)} icon="today" />
          <input
            type="date"
            value={start}
            max={end}
            aria-label="Semester start date"
            onChange={(e) => {
              if (!e.target.value) return;
              setStart(e.target.value);
              setFailure('');
            }}
            style={PICKER_STYLE}
          />
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <FieldDisplay label="ENDS" value={dateLabel(end)} icon="today" />
          <input
            type="date"
            value={end}
            min={start}
            aria-label="Semester end date"
            onChange={(e) => {
              if (!e.target.value) return;
              setEnd(e.target.value);
              setFailure('');
            }}
            style={PICKER_STYLE}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 15px',
          borderRadius: 12,
          background: 'var(--surface-page)',
          marginBottom: failure ? 12 : 22,
        }}
      >
        <div>
          <div style={{ font: '800 12.5px var(--font-sans)' }}>Set as current</div>
          <div style={{ font: '600 10px var(--font-sans)', color: 'var(--text-dim)' }}>
            New subjects land here by default
          </div>
        </div>
        <Toggle checked={asCurrent} onChange={setAsCurrent} aria-label="Set as current semester" />
      </div>

      {failure && (
        <div
          role="alert"
          style={{ font: '600 11px/1.5 var(--font-sans)', color: 'var(--aq-danger)', marginBottom: 14 }}
        >
          {failure}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" onClick={onClose} disabled={pending} style={{ padding: '0 22px' }}>
          Cancel
        </Button>
        <Button onClick={create_} loading={pending} style={{ flex: 1 }}>
          Create semester
        </Button>
      </div>
    </Modal>
  );
}
