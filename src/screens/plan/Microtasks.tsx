import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import AdaCube from '../../components/brand/AdaCube';
import Button from '../../components/core/Button';
import Card from '../../components/core/Card';
import { EyebrowLabel } from '../../components/core/Misc';
import { EmptyState, ErrorState, Loading, errorMessage } from '../../components/core/Async';
import { useBreakdownTask, useDayPlan, useTaskLookups, useToggleTask } from '../../hooks/data';
import { splitOccurrenceId, subjectLabel } from '../../lib/mappers';
import { durationLabel, todayIso } from '../../lib/format';
import type { OccurrenceDto } from '../../lib/api';
import type { Microtask } from '../../data/tasks';

/* Frame 02.5 — Task → microtasks (Ada). Centred, max-width 640. */

type Step = Microtask & { id: string };

/**
 * The identity a user can actually see. Breaking a repeating occurrence down
 * materialises an override row with a brand-new uuid, so the id in the URL
 * stops resolving the moment Ada answers — this is the fallback that keeps the
 * screen pointed at the same task across that swap. `part_of_day` is left out
 * on purpose: the override the server writes does not carry it forward.
 */
const occKey = (o: OccurrenceDto) =>
  [o.title.trim().toLowerCase(), o.subject_id ?? '', o.scheduled_at ?? ''].join('|');

export default function Microtasks() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // The id is an occurrence id and may carry a `@yyyy-MM-dd` suffix.
  const occId = decodeURIComponent(id ?? '');
  /* `?date=` is what the plan actually had open. Only virtual occurrences carry
     a date in their id, so without this a materialised task on any day but
     today resolved against the wrong plan and rendered the "not on this day"
     dead end. Order: explicit date -> id suffix -> today. */
  const dateParam = params.get('date');
  const date = dateParam || splitOccurrenceId(occId).date || todayIso();

  const day = useDayPlan(date);
  const lookups = useTaskLookups();
  const breakdown = useBreakdownTask();
  const toggle = useToggleTask(date);

  const [actionError, setActionError] = useState('');
  /** Steps are read-only server-side, so ticks live here for the session. */
  const [localDone, setLocalDone] = useState<Record<string, boolean>>({});

  const exact = day.occurrences.find((o) => o.id === occId);
  const identity = useRef<string | null>(null);
  const occ =
    exact ?? (identity.current ? day.occurrences.find((o) => occKey(o) === identity.current) : undefined);

  useEffect(() => {
    if (exact) identity.current = occKey(exact);
  }, [exact]);

  const subject = occ?.subject_id ? lookups.subjects.byId.get(occ.subject_id) : undefined;

  /** An even split of the task's estimate — the server sends steps with none. */
  const stepSeconds = occ && occ.steps.length ? Math.round(occ.duration_seconds / occ.steps.length) : 0;

  const steps = useMemo<Step[]>(() => {
    const src = occ?.steps ?? [];
    const isDone = (s: { id: string; status: string }) => s.status === 'COMPLETE' || Boolean(localDone[s.id]);
    const current = src.findIndex((s) => !isDone(s));
    return src.map((s, i) => ({
      id: s.id,
      title: s.title,
      dur: durationLabel(s.duration_seconds || stepSeconds),
      state: isDone(s) ? 'done' : i === current ? 'current' : 'todo',
      sub: !isDone(s) && i === current ? 'Up next' : undefined,
    }));
  }, [occ, localDone, stepSeconds]);

  const note =
    occ?.note?.trim() ||
    (steps.length
      ? `I broke this into ${steps.length} steps of about ${durationLabel(stepSeconds)}. Start with the first one.`
      : 'This looks big. I can break it into smaller steps whenever you are ready.');

  function runBreakdown() {
    if (!occ) return;
    setActionError('');
    breakdown.mutate(
      { occId: occ.id, date },
      { onError: (err) => setActionError(errorMessage(err)) },
    );
  }

  function toggleTask() {
    if (!occ) return;
    setActionError('');
    toggle.mutate(occ.id, { onError: (err) => setActionError(errorMessage(err)) });
  }

  if (day.isLoading) {
    return (
      <Content padding="24px 26px" style={{ alignItems: 'center' }}>
        <Loading label="Loading this task…" />
      </Content>
    );
  }

  if (day.isError) {
    return (
      <Content padding="24px 26px" style={{ alignItems: 'center' }}>
        <ErrorState error={day.error} onRetry={() => void day.refetch()} />
      </Content>
    );
  }

  if (!occ) {
    return (
      <Content padding="24px 26px" style={{ alignItems: 'center' }}>
        <EmptyState
          icon="search_off"
          title="That task is not on this day"
          caption="It may have been moved or deleted."
          action={<Button variant="soft" onClick={() => navigate('/plan')}>Back to the plan</Button>}
        />
      </Content>
    );
  }

  const complete = occ.status === 'COMPLETE';

  return (
    <Content padding="24px 26px" style={{ alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ font: '800 20px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 16 }}>
          {occ.title}
        </div>

        <Card padding="16px 18px" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <AdaCube size={30} expr="focused" />
            <span style={{ flex: 1, font: '600 12px/1.5 var(--font-sans)' }}>{note}</span>
          </div>
        </Card>

        <EyebrowLabel style={{ marginBottom: 10 }}>MICROTASKS · {subjectLabel(subject)}</EyebrowLabel>

        {steps.length === 0 ? (
          <EmptyState
            icon="auto_awesome"
            title="No steps yet"
            caption="Ada can split this into small pieces you can actually start."
            action={
              <Button variant="soft" icon="auto_awesome" loading={breakdown.isPending} onClick={runBreakdown}>
                Break it down
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {steps.map((s) => {
              const isDone = s.state === 'done';
              const isCurrent = s.state === 'current';
              return (
                <Card
                  key={s.id}
                  padding="13px 15px"
                  hoverable
                  onClick={isCurrent ? () => navigate('/focus') : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: isCurrent ? '1.5px solid var(--accent)' : undefined,
                    cursor: isCurrent ? 'pointer' : undefined,
                  }}
                >
                  <button
                    type="button"
                    aria-label={isDone ? `Mark ${s.title} as not done` : `Mark ${s.title} done`}
                    aria-pressed={isDone}
                    className="aq-press focus-ring"
                    onClick={(e) => {
                      e.stopPropagation();
                      // no endpoint: steps are read-only server-side (breakdown
                      // writes them, nothing patches one), so the tick is local.
                      setLocalDone((prev) => ({ ...prev, [s.id]: !prev[s.id] }));
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `2px solid ${isDone || isCurrent ? 'var(--accent)' : '#d6d3ce'}`,
                      background: isDone ? 'var(--accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {isDone && '✓'}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        font: '800 13px var(--font-sans)',
                        ...(isDone ? { textDecoration: 'line-through', color: 'var(--text-dim)' } : null),
                      }}
                    >
                      {s.title}
                    </div>
                    {s.sub && (
                      <div style={{ font: '600 9.5px var(--font-sans)', color: 'var(--accent)' }}>{s.sub}</div>
                    )}
                  </div>
                  <span style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-dim)' }}>{s.dur}</span>
                </Card>
              );
            })}
          </div>
        )}

        {actionError && (
          <div
            style={{
              font: '600 10.5px var(--font-sans)',
              color: 'var(--aq-danger)',
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            {actionError}
          </div>
        )}

        <Button
          full
          variant={complete ? 'ghost' : 'soft'}
          icon={complete ? 'undo' : 'check_circle'}
          loading={toggle.isPending}
          onClick={toggleTask}
          style={{ marginTop: 16 }}
        >
          {complete ? 'Mark as not done' : 'Mark task done'}
        </Button>
      </div>
    </Content>
  );
}
