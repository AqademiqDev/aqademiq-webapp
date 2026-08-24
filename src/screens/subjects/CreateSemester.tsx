import { useEffect, useState } from 'react';
import Button from '../../components/core/Button';
import Input, { FieldDisplay } from '../../components/core/Input';
import Modal from '../../components/overlay/Modal';
import Toggle from '../../components/core/Toggle';
import { errorMessage } from '../../components/core/Async';
import {
  useActivateSemester,
  useCreateSemester,
  useSemesterCards,
  useUpdateSemester,
} from '../../hooks/data';
import { addMonths, fromIsoDate, monthLabel, todayIso } from '../../lib/format';

/* Frame 03.4 — Create semester (sheet). Modal, max-width 460.
   POST /v1/semesters, then PATCH /v1/semesters/:id/activate when the sheet's
   "set as current" switch is on and the server didn't auto-activate it. */

/**
 * The name the API gives the term it invents when a subject is created before
 * any semester exists (same default the onboarding wizard documents).
 *
 * Creating a subject first is the common path, so by the time someone opens
 * this sheet they usually already own one of these — and POSTing on top of it
 * left them with two terms, their subjects stranded in the placeholder and
 * their "real" semester empty. When the placeholder is the *only* term and
 * still carries that name, this sheet renames it in place instead.
 */
const SERVER_DEFAULT_NAME = 'My Semester';

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

/**
 * Open the native calendar on any click on the field.
 *
 * The input is `opacity: 0` so the drawn FieldDisplay shows through, which also
 * hides the browser's calendar indicator — the only part of a date input that
 * opens the picker on click. Without this the field silently took focus and the
 * dates could not be changed at all. `showPicker` throws on browsers that
 * refuse it outside a user gesture, so the failure is swallowed: the field is
 * still keyboard-editable.
 */
function openPicker(e: React.MouseEvent<HTMLInputElement>) {
  const el = e.currentTarget;
  if (typeof el.showPicker !== 'function') return;
  try {
    el.showPicker();
  } catch {
    /* keyboard entry still works */
  }
}

export default function CreateSemester({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateSemester();
  const update = useUpdateSemester();
  const activate = useActivateSemester();
  const semesters = useSemesterCards();

  /** The lone server-invented placeholder, if that is all the account has. */
  const placeholder =
    semesters.raw.length === 1 && semesters.raw[0].name === SERVER_DEFAULT_NAME
      ? semesters.raw[0]
      : null;

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

  const pending = create.isPending || update.isPending || activate.isPending;

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

    // Adopt the placeholder rather than adding a second term beside it, so the
    // subjects already filed under it come along.
    if (placeholder) {
      update.mutate(
        { id: placeholder.id, patch: { name: name.trim(), start, end } },
        {
          onSuccess: (semester) => {
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
      return;
    }

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
            onClick={openPicker}
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
            onClick={openPicker}
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

      {placeholder && (
        <div
          style={{
            font: '600 10.5px/1.5 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginTop: -10,
            marginBottom: 14,
          }}
        >
          This renames your current “{SERVER_DEFAULT_NAME}” term, so the{' '}
          {placeholder.name === SERVER_DEFAULT_NAME ? 'subjects already in it' : 'subjects'} stay
          put.
        </div>
      )}

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
