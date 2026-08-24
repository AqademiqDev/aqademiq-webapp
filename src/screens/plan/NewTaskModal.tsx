import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import TagChip from '../../components/core/TagChip';
import { EyebrowLabel } from '../../components/core/Misc';
import { ErrorState, Loading, errorMessage } from '../../components/core/Async';
import { useCreateTask, useStudyTags, useSubjects } from '../../hooks/data';
import { useDictation } from '../../hooks/useDictation';
import { ApiError, type OccurrenceDto, type RepeatKind } from '../../lib/api';
import {
  addDays,
  agendaLabel,
  durationLabel,
  formatHhMm,
  pad2,
  toScheduledAt,
  todayIso,
} from '../../lib/format';
import { subjectLabel } from '../../lib/mappers';

/* Frame 02.3 — New task (quick add). Modal, max-width 500.

   The four tiles are the real form: each one keeps its drawn chrome (icon +
   eyebrow + bold value) and carries a native <select> as its value line, so the
   control is keyboard-reachable and the label text stays exactly as drawn
   ("Anytime" / "Today" / "30 min" / "Never"). */

const DURATIONS = [900, 1500, 1800, 2700, 3600, 5400, 7200];

/** All eight repeat kinds, each with the interval it implies. */
const REPEATS: { label: string; kind: RepeatKind; interval: number }[] = [
  { label: 'Never', kind: 'none', interval: 1 },
  { label: 'Daily', kind: 'daily', interval: 1 },
  { label: 'Weekdays', kind: 'weekdays', interval: 1 },
  { label: 'Weekly', kind: 'weekly', interval: 1 },
  { label: 'Monthly', kind: 'monthly', interval: 1 },
  { label: 'Every 2 days', kind: 'everyNDays', interval: 2 },
  { label: 'Every 2 weeks', kind: 'everyNWeeks', interval: 2 },
  { label: 'Every 3 months', kind: 'everyNMonths', interval: 3 },
];

const TIMES: string[] = [];
for (let m = 5 * 60; m <= 23 * 60 + 45; m += 15) {
  TIMES.push(`${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`);
}

const selectStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  font: '800 12px var(--font-sans)',
  color: 'var(--text-primary)',
  background: 'transparent',
  border: 0,
  padding: 0,
  margin: 0,
  appearance: 'none',
  WebkitAppearance: 'none',
  outline: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};

const optionStyle: CSSProperties = { background: 'var(--surface-card)', color: 'var(--text-primary)' };

const rowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 };

const hintStyle: CSSProperties = {
  font: '600 11px var(--font-sans)',
  color: 'var(--text-secondary)',
  marginBottom: 18,
};

const errorStyle: CSSProperties = { font: '600 10.5px var(--font-sans)', color: 'var(--aq-danger)' };

/** One quick-add tile: the drawn shell with a real control on its value line. */
function Tile({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <label
      className="aq-press"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--surface-page)',
        borderRadius: 12,
        padding: '11px 13px',
        cursor: 'pointer',
        minWidth: 0,
      }}
    >
      <Icon name={icon} size={17} color="var(--text-secondary)" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ font: '700 9px var(--font-sans)', color: 'var(--text-dim)' }}>{label}</div>
        {children}
      </div>
    </label>
  );
}

/** Compact loading / error / empty switch for the chip rows inside the sheet. */
function ChipRow({
  query,
  empty,
  children,
}: {
  query: { isLoading: boolean; isError: boolean; error: unknown; refetch: () => void };
  empty?: { when: boolean; node: ReactNode };
  children: ReactNode;
}) {
  if (query.isLoading) return <Loading padding={10} label="Loading…" style={{ marginBottom: 18 }} />;
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        onRetry={() => void query.refetch()}
        padding={10}
        style={{ marginBottom: 18 }}
      />
    );
  }
  if (empty?.when) return <>{empty.node}</>;
  return <>{children}</>;
}

export default function NewTaskModal({
  open,
  onClose,
  date = todayIso(),
  initialTime = '',
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  /** The day the plan is showing — the new task lands there by default. */
  date?: string;
  /** `HH:mm` to preselect, so the timeline's per-slot add lands on its own row. */
  initialTime?: string;
  onCreated?: (task: OccurrenceDto) => void;
}) {
  const subjects = useSubjects();
  const tags = useStudyTags();
  const create = useCreateTask();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [tagId, setTagId] = useState('');
  const [day, setDay] = useState(date);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1800);
  const [repeatIdx, setRepeatIdx] = useState(0);
  const [titleError, setTitleError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [needsSubject, setNeedsSubject] = useState(false);

  /* Voice input. The base is whatever was typed before the mic opened, so
     interim results replace only the dictated tail instead of wiping the
     field on every partial. */
  const dictationBase = useRef('');
  const dictation = useDictation((text, final) => {
    const base = dictationBase.current;
    const next = base ? `${base} ${text}` : text;
    setTitle(next.slice(0, 140));
    setTitleError('');
    if (final) dictationBase.current = next;
  });
  const dictationStop = dictation.stop;

  // A fresh sheet every time it opens, anchored on the day the plan is showing.
  useEffect(() => {
    if (!open) return;
    setTitle('');
    setSubjectId('');
    setTagId('');
    setDay(date);
    setTime(initialTime);
    setDuration(1800);
    setRepeatIdx(0);
    setTitleError('');
    setSubmitError('');
    setNeedsSubject(false);
    dictationBase.current = '';
  }, [open, date, initialTime]);

  /* The sheet is never unmounted — `open` only toggles — so without this a mic
     left running stayed running behind a closed sheet, and reopening showed a
     stuck "Listening…" field. */
  useEffect(() => {
    if (!open) dictationStop();
  }, [open, dictationStop]);

  const today = todayIso();
  const dayOptions = useMemo(() => {
    const list = Array.from({ length: 14 }, (_, i) => addDays(today, i));
    if (!list.includes(day)) list.unshift(day);
    return list;
  }, [today, day]);

  const dayLabel = (iso: string) =>
    iso === today ? 'Today' : iso === addDays(today, 1) ? 'Tomorrow' : agendaLabel(iso);

  function add() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Give the task a title.');
      return;
    }
    setTitleError('');
    setSubmitError('');
    setNeedsSubject(false);

    const repeat = REPEATS[repeatIdx];
    create.mutate(
      {
        title: trimmed,
        subject_id: subjectId || undefined,
        // The backend stores the study-tag id in `category`, which is what
        // colours the chip on the task card.
        category: tagId || undefined,
        duration_seconds: duration,
        date: day,
        scheduled_at: time ? toScheduledAt(day, time) : undefined,
        repeat: repeat.kind === 'none' ? undefined : { kind: repeat.kind, interval: repeat.interval },
      },
      {
        onSuccess: (task) => {
          onCreated?.(task);
          onClose();
        },
        onError: (err) => {
          setNeedsSubject(err instanceof ApiError && err.status === 422 && /subject/i.test(err.message));
          setSubmitError(errorMessage(err));
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="New task" maxWidth={500}>
      {/* The mic only renders where the Web Speech API actually exists — a dead
          mic button was the whole complaint. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: `1.5px solid ${titleError ? 'var(--aq-danger)' : 'var(--accent)'}`,
          marginBottom: titleError || dictation.error ? 6 : 18,
        }}
      >
        <input
          value={title}
          autoFocus
          aria-label="Task title"
          placeholder={dictation.listening ? 'Listening…' : 'Task title'}
          onChange={(e) => {
            setTitle(e.target.value);
            // Typing re-anchors what dictation appends to.
            dictationBase.current = e.target.value;
            setTitleError('');
          }}
          className="focus-ring"
          style={{
            flex: 1,
            minWidth: 0,
            font: '700 18px var(--font-sans)',
            padding: '10px 0',
            border: 0,
            background: 'transparent',
            outline: 'none',
            color: 'var(--text-primary)',
            borderRadius: 0,
          }}
        />

        {dictation.supported && (
          <button
            type="button"
            onClick={() => {
              dictationBase.current = title.trim();
              dictation.toggle();
            }}
            aria-label={dictation.listening ? 'Stop dictating' : 'Dictate the task title'}
            aria-pressed={dictation.listening}
            title={dictation.listening ? 'Stop dictating' : 'Dictate the task title'}
            className="aq-press focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: '50%',
              background: dictation.listening ? 'var(--accent)' : 'var(--surface-page)',
              animation: dictation.listening ? 'aqShimmer 1.4s ease-in-out infinite' : undefined,
            }}
          >
            <Icon
              name={dictation.listening ? 'stop_circle' : 'mic'}
              size={18}
              color={dictation.listening ? '#fff' : 'var(--text-secondary)'}
            />
          </button>
        )}
      </div>

      {titleError && <div style={{ ...errorStyle, marginBottom: 14 }}>{titleError}</div>}
      {!titleError && dictation.error && (
        <div style={{ ...errorStyle, marginBottom: 14 }}>{dictation.error}</div>
      )}

      <EyebrowLabel style={{ marginBottom: 9 }}>SUBJECT</EyebrowLabel>
      <ChipRow
        query={subjects}
        empty={{
          when: (subjects.data ?? []).length === 0,
          node: (
            <div style={hintStyle}>
              No subjects yet —{' '}
              <Link to="/subjects" style={{ color: 'var(--accent)', font: '800 11px var(--font-sans)' }}>
                add one
              </Link>
              .
            </div>
          ),
        }}
      >
        <div style={rowStyle}>
          {(subjects.data ?? []).map((s) => (
            <TagChip
              key={s.id}
              label={subjectLabel(s)}
              color={s.color_hex}
              selected={subjectId === s.id}
              onClick={() => setSubjectId((prev) => (prev === s.id ? '' : s.id))}
            />
          ))}
        </div>
      </ChipRow>

      <EyebrowLabel style={{ marginBottom: 9 }}>TAG</EyebrowLabel>
      <ChipRow
        query={tags}
        empty={{
          when: (tags.data ?? []).length === 0,
          node: <div style={hintStyle}>No tags yet.</div>,
        }}
      >
        <div style={rowStyle}>
          {(tags.data ?? []).map((t) => (
            <TagChip
              key={t.id}
              label={t.label}
              color={t.color}
              selected={tagId === t.id}
              onClick={() => setTagId((prev) => (prev === t.id ? '' : t.id))}
            />
          ))}
        </div>
      </ChipRow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        <Tile icon="schedule" label="TIME">
          <select
            value={time}
            aria-label="Time"
            className="focus-ring"
            onChange={(e) => setTime(e.target.value)}
            style={selectStyle}
          >
            <option value="" style={optionStyle}>
              Anytime
            </option>
            {TIMES.map((t) => (
              <option key={t} value={t} style={optionStyle}>
                {formatHhMm(t)}
              </option>
            ))}
          </select>
        </Tile>

        <Tile icon="today" label="DATE">
          <select
            value={day}
            aria-label="Date"
            className="focus-ring"
            onChange={(e) => setDay(e.target.value)}
            style={selectStyle}
          >
            {dayOptions.map((iso) => (
              <option key={iso} value={iso} style={optionStyle}>
                {dayLabel(iso)}
              </option>
            ))}
          </select>
        </Tile>

        <Tile icon="hourglass_empty" label="DURATION">
          <select
            value={duration}
            aria-label="Duration"
            className="focus-ring"
            onChange={(e) => setDuration(Number(e.target.value))}
            style={selectStyle}
          >
            {DURATIONS.map((secs) => (
              <option key={secs} value={secs} style={optionStyle}>
                {durationLabel(secs)}
              </option>
            ))}
          </select>
        </Tile>

        <Tile icon="repeat" label="REPEAT">
          <select
            value={repeatIdx}
            aria-label="Repeat"
            className="focus-ring"
            onChange={(e) => setRepeatIdx(Number(e.target.value))}
            style={selectStyle}
          >
            {REPEATS.map((r, i) => (
              <option key={r.label} value={i} style={optionStyle}>
                {r.label}
              </option>
            ))}
          </select>
        </Tile>
      </div>

      {submitError && (
        <div style={{ ...errorStyle, marginBottom: 12 }}>
          {submitError}
          {needsSubject && (
            <>
              {' '}
              <Link to="/subjects" style={{ color: 'var(--accent)', font: '800 10.5px var(--font-sans)' }}>
                Add a subject
              </Link>
            </>
          )}
        </div>
      )}

      <Button full onClick={add} loading={create.isPending}>
        Add task
      </Button>
    </Modal>
  );
}
