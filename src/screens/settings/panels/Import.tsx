import { useMemo, useRef, useState } from 'react';

import Button from '../../../components/core/Button';
import Icon from '../../../components/core/Icon';
import Toggle from '../../../components/core/Toggle';
import { Dropzone } from '../../../components/content/FormBits';
import { EyebrowLabel } from '../../../components/core/Misc';
import { ErrorState, Loading, errorMessage } from '../../../components/core/Async';
import { InlineError, PanelHead, Row } from '../Settings';
import { useCreateTask, useSubjects } from '../../../hooks/data';
import { parseIcs, type IcsItem } from '../../../lib/ics';
import { toScheduledAt } from '../../../lib/format';

/* Settings → Import.

   The API has no calendar connector and no import route, so this is a local
   reader rather than a sync: the user exports an `.ics` from whatever they
   already use and the entries become real tasks through `POST /tasks`.

   One file covers both halves of the feature, because that is how the format
   works — a calendar export carries `VEVENT`, and Apple Reminders / Google
   Tasks put their to-dos in the same file as `VTODO`. See `lib/ics.ts`.

   no endpoint: nothing is stored about the source file, so this is a one-way
   import and not a link that keeps updating. The copy says so. */

const MAX_BYTES = 5 * 1024 * 1024;

/** A single pass is a lot of sequential POSTs; past this we stop and say so. */
const MAX_IMPORT = 250;

export default function ImportPanel() {
  const subjects = useSubjects();
  const createTask = useCreateTask();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [items, setItems] = useState<IcsItem[] | null>(null);
  const [parseError, setParseError] = useState('');

  const [takeEvents, setTakeEvents] = useState(true);
  const [takeTodos, setTakeTodos] = useState(true);
  const [skipCompleted, setSkipCompleted] = useState(true);
  const [subjectId, setSubjectId] = useState('');

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ added: number; failed: number; firstError: string } | null>(null);

  const events = useMemo(() => (items ?? []).filter((i) => i.kind === 'event'), [items]);
  const todos = useMemo(() => (items ?? []).filter((i) => i.kind === 'todo'), [items]);

  const selected = useMemo(() => {
    const picked = [
      ...(takeEvents ? events : []),
      ...(takeTodos ? todos : []),
    ].filter((i) => !(skipCompleted && i.completed));
    return picked.sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`));
  }, [events, todos, takeEvents, takeTodos, skipCompleted]);

  const overflow = Math.max(0, selected.length - MAX_IMPORT);
  const importing = progress !== null;

  const subjectList = subjects.data ?? [];
  const effectiveSubject = subjectId || subjectList[0]?.id || '';

  function reset() {
    setItems(null);
    setFileName('');
    setParseError('');
    setResult(null);
    setProgress(null);
  }

  async function read(file: File | null | undefined) {
    if (!file) return;
    reset();
    if (file.size > MAX_BYTES) {
      setParseError('That file is over the 5 MB limit.');
      return;
    }
    setFileName(file.name);
    try {
      const parsed = parseIcs(await file.text());
      if (!parsed.length) {
        setParseError(
          'No events or reminders with a date were found. Export as iCalendar (.ics) and try again.',
        );
        return;
      }
      setItems(parsed);
    } catch (e) {
      setParseError(errorMessage(e));
    }
  }

  /** Sequential on purpose — the API rate-limits and order keeps the plan sane. */
  async function runImport() {
    const batch = selected.slice(0, MAX_IMPORT);
    if (!batch.length) return;
    setResult(null);
    setProgress({ done: 0, total: batch.length });

    let added = 0;
    let failed = 0;
    let firstError = '';

    for (let i = 0; i < batch.length; i += 1) {
      const item = batch[i];
      try {
        await createTask.mutateAsync({
          title: item.summary.slice(0, 140),
          subject_id: effectiveSubject || undefined,
          date: item.date,
          scheduled_at: item.time ? toScheduledAt(item.date, item.time) : undefined,
          duration_seconds: item.durationSeconds ?? undefined,
          note: item.note ?? undefined,
          repeat: item.repeat ? { kind: item.repeat.kind, interval: item.repeat.interval } : undefined,
        });
        added += 1;
      } catch (e) {
        failed += 1;
        if (!firstError) firstError = errorMessage(e);
      }
      setProgress({ done: i + 1, total: batch.length });
    }

    setProgress(null);
    setResult({ added, failed, firstError });
  }

  return (
    <>
      <PanelHead
        title="Import"
        sub="Bring a calendar or your reminders in from another app."
        gap={18}
      />

      <div
        style={{
          font: '600 11.5px/1.6 var(--font-sans)',
          color: 'var(--text-secondary)',
          marginTop: -8,
          marginBottom: 18,
          maxWidth: 560,
        }}
      >
        Export an <strong>.ics</strong> file from Google Calendar, Apple Calendar, Outlook or your
        timetable and drop it here. Calendar entries become planned tasks; reminders and to-dos come
        in on their due date. This copies them in once — it does not stay connected.
      </div>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (importing) return;
          void read(e.dataTransfer.files?.[0]);
        }}
        style={{
          display: 'block',
          maxWidth: 560,
          marginBottom: 18,
          pointerEvents: importing ? 'none' : undefined,
          opacity: importing ? 0.5 : undefined,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".ics,text/calendar"
          aria-label="Choose an .ics file"
          disabled={importing}
          onChange={(e) => {
            void read(e.target.files?.[0]);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />
        <Dropzone
          hint="Calendar or reminders export · .ics up to 5 MB"
          style={{ borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}
        />
      </label>

      {parseError && (
        <div
          role="alert"
          style={{
            font: '600 11px/1.5 var(--font-sans)',
            color: 'var(--aq-danger)',
            marginBottom: 16,
            maxWidth: 560,
          }}
        >
          {parseError}
        </div>
      )}

      {items && (
        <div style={{ maxWidth: 560 }}>
          <EyebrowLabel style={{ marginBottom: 4 }}>FOUND IN {fileName.toUpperCase()}</EyebrowLabel>

          <Row
            title="Calendar entries"
            sub={events.length ? `${events.length} event${events.length === 1 ? '' : 's'}` : 'None in this file'}
            control={
              <Toggle
                checked={takeEvents && events.length > 0}
                disabled={!events.length || importing}
                onChange={setTakeEvents}
                aria-label="Import calendar entries"
              />
            }
          />
          <Row
            title="Reminders & to-dos"
            sub={todos.length ? `${todos.length} reminder${todos.length === 1 ? '' : 's'}` : 'None in this file'}
            control={
              <Toggle
                checked={takeTodos && todos.length > 0}
                disabled={!todos.length || importing}
                onChange={setTakeTodos}
                aria-label="Import reminders"
              />
            }
          />
          <Row
            title="Skip finished ones"
            sub="Leave out anything already marked complete"
            control={
              <Toggle
                checked={skipCompleted}
                disabled={importing}
                onChange={setSkipCompleted}
                aria-label="Skip completed entries"
              />
            }
            last={subjectList.length === 0}
          />

          {subjects.isLoading && <Loading label="Loading subjects…" padding="10px 0" />}
          {subjects.isError && (
            <ErrorState error={subjects.error} onRetry={subjects.refetch} padding="10px 0" />
          )}

          {subjectList.length > 0 && (
            <Row
              title="File them under"
              sub="Imported tasks need a subject, same as any other"
              last
              control={
                <select
                  value={effectiveSubject}
                  disabled={importing}
                  aria-label="Subject for imported tasks"
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="focus-ring"
                  style={{
                    height: 32,
                    maxWidth: 200,
                    borderRadius: 100,
                    border: '1.5px solid var(--border-hairline)',
                    background: 'var(--surface-page)',
                    color: 'var(--text-primary)',
                    padding: '0 10px',
                    font: '700 11px var(--font-sans)',
                    outline: 'none',
                  }}
                >
                  {subjectList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `${s.code} — ${s.name}` : s.name}
                    </option>
                  ))}
                </select>
              }
            />
          )}

          {subjectList.length === 0 && !subjects.isLoading && (
            <div
              style={{
                font: '600 11px/1.5 var(--font-sans)',
                color: 'var(--aq-danger)',
                margin: '12px 0',
              }}
            >
              Add a subject first — imported tasks are filed under one, same as any other task.
            </div>
          )}

          <Preview items={selected} />

          {overflow > 0 && (
            <div
              style={{
                font: '600 11px/1.5 var(--font-sans)',
                color: 'var(--text-secondary)',
                marginBottom: 12,
              }}
            >
              Importing the first {MAX_IMPORT}. {overflow} more will be left out — narrow the export
              and run it again for the rest.
            </div>
          )}

          {importing && (
            <div
              role="status"
              style={{
                font: '700 11.5px var(--font-sans)',
                color: 'var(--text-secondary)',
                marginBottom: 12,
              }}
            >
              Importing {progress.done} of {progress.total}…
            </div>
          )}

          {result && (
            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                font: '700 12px var(--font-sans)',
                color: result.failed ? 'var(--text-primary)' : 'var(--aq-success)',
                marginBottom: 12,
              }}
            >
              <Icon
                name={result.failed ? 'error_outline' : 'check_circle'}
                size={17}
                color={result.failed ? 'var(--aq-danger)' : 'var(--aq-success)'}
              />
              Added {result.added} to your plan
              {result.failed > 0 && ` · ${result.failed} failed — ${result.firstError}`}
            </div>
          )}

          <InlineError error={createTask.error} style={{ marginBottom: 10 }} />

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button variant="ghost" onClick={reset} disabled={importing} style={{ padding: '0 20px' }}>
              Clear
            </Button>
            <Button
              onClick={() => void runImport()}
              loading={importing}
              disabled={!selected.length || !effectiveSubject}
              style={{ flex: 1 }}
            >
              {selected.length
                ? `Import ${Math.min(selected.length, MAX_IMPORT)} into my plan`
                : 'Nothing selected'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/** First few rows, so the user can see it read the file the way they expect. */
function Preview({ items }: { items: IcsItem[] }) {
  if (!items.length) return null;
  const shown = items.slice(0, 5);

  return (
    <div style={{ margin: '16px 0 14px' }}>
      <EyebrowLabel style={{ marginBottom: 6 }}>PREVIEW</EyebrowLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {shown.map((i, n) => (
          <div
            key={`${i.date}-${i.summary}-${n}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface-page)',
              borderRadius: 10,
              padding: '9px 12px',
            }}
          >
            <Icon
              name={i.kind === 'event' ? 'calendar_today' : 'task_alt'}
              size={15}
              color="var(--text-dim)"
            />
            <span style={{ font: '700 12px var(--font-sans)', flex: 1, minWidth: 0 }}>{i.summary}</span>
            <span style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
              {i.date}
              {i.time ? ` · ${i.time}` : ''}
              {i.repeat ? ' · repeats' : ''}
            </span>
          </div>
        ))}
      </div>
      {items.length > shown.length && (
        <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-dim)', marginTop: 6 }}>
          + {items.length - shown.length} more
        </div>
      )}
    </div>
  );
}
