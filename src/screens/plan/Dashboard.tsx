import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import IceTimer from '../../components/brand/IceTimer';
import Button from '../../components/core/Button';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import Segmented from '../../components/core/Segmented';
import { EyebrowLabel, SectionHeader } from '../../components/core/Misc';
import TaskCard from '../../components/content/TaskCard';
import { MoodWeek } from '../../components/content/MoodScale';
import { AsyncSection, EmptyState, ErrorState, Loading, errorMessage } from '../../components/core/Async';
import NewTaskModal from './NewTaskModal';
import MonthPicker from './MonthPicker';
import MorningCheckIn from '../mood/MorningCheckIn';
import EveningReflection from '../mood/EveningReflection';
import GuestNudge, { GuestLockCard } from '../../components/content/GuestNudge';
import { MONTH_WEEKDAYS_LONG, type Task } from '../../data/tasks';
import {
  useCompletionHistory,
  useDayPlan,
  useMoodWeek,
  useStreak,
  useTaskLookups,
  useTaskRange,
  useToggleTask,
} from '../../hooks/data';
import { useAppState } from '../../hooks/useAppState';
import type { OccurrenceDto } from '../../lib/api';
import {
  addDays,
  addMonths,
  agendaLabel,
  daysInMonth,
  durationLabel,
  formatClock,
  fromIsoDate,
  greeting,
  isEvening,
  longDateLabel,
  mondayIndex,
  monthEnd,
  monthLabel,
  monthStart,
  shortWeekday,
  todayIso,
  weekRangeLabel,
  weekStart,
} from '../../lib/format';
import { splitOccurrenceId, taskChip, toTask } from '../../lib/mappers';
import type { SubjectLookup, TagLookup } from '../../lib/mappers';

/* ─────────────────────────────────────────────────────────────────────────
   Section 02 — Plan / Home.

   One screen, four views selected by ?view= (README §4.2):
     (none)    02.1 Dashboard — Today's plan + Focus + This week
     timeline  02.2 Day timeline — the same shell, plan card in timeline mode
     week      02.6 Week agenda
     month     02.7 Month view

   The viewed day lives in component state; the ‹ › buttons step it by the
   granularity of the current view and every view reads `/v1/tasks` for it.
   ───────────────────────────────────────────────────────────────────────── */

type View = 'day' | 'week' | 'month';

type Lookups = { subjects: SubjectLookup; tags: TagLookup };

/**
 * The calendar day a *range* occurrence belongs to.
 *
 * A virtual occurrence carries it in its id (`<series>@<date>`) and a timed one
 * in `scheduled_at`; a materialised anytime task carries neither, so the week
 * agenda lists those under their own heading rather than dropping them.
 */
function occurrenceDate(occ: OccurrenceDto): string | null {
  const { date } = splitOccurrenceId(occ.id);
  if (date) return date;
  return occ.scheduled_at ? occ.scheduled_at.slice(0, 10) : null;
}

/** Timed first, ascending; anytime after, alphabetically. */
function bySchedule(a: OccurrenceDto, b: OccurrenceDto): number {
  const left = a.scheduled_at ?? '';
  const right = b.scheduled_at ?? '';
  if (left && right) return left.localeCompare(right);
  if (left) return -1;
  if (right) return 1;
  return a.title.localeCompare(b.title);
}

function groupByDate(items: OccurrenceDto[]) {
  const byDate = new Map<string, OccurrenceDto[]>();
  const undated: OccurrenceDto[] = [];
  for (const occ of items) {
    const iso = occurrenceDate(occ);
    if (!iso) {
      undated.push(occ);
      continue;
    }
    const list = byDate.get(iso);
    if (list) list.push(occ);
    else byDate.set(iso, [occ]);
  }
  for (const list of byDate.values()) list.sort(bySchedule);
  undated.sort(bySchedule);
  return { byDate, undated };
}

/** Up to three distinct subject colours — the day-cell dots (02.6 / 02.7). */
function dotsFor(items: OccurrenceDto[] | undefined, lookups: Lookups): string[] {
  const out: string[] = [];
  for (const occ of items ?? []) {
    const { color } = taskChip(occ, lookups.subjects, lookups.tags);
    if (!out.includes(color)) out.push(color);
    if (out.length === 3) break;
  }
  return out;
}

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { guest, name } = useAppState();

  const raw = params.get('view');
  const timeline = raw === 'timeline';
  const view: View = raw === 'week' ? 'week' : raw === 'month' ? 'month' : 'day';

  const [date, setDate] = useState(todayIso());
  const [anytimeOpen, setAnytimeOpen] = useState(true);
  const [plannedOpen, setPlannedOpen] = useState(true);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  /** `HH:mm` the timeline's per-slot add should preselect ('' = Anytime). */
  const [newTaskTime, setNewTaskTime] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [morningOpen, setMorningOpen] = useState(false);
  const [eveningOpen, setEveningOpen] = useState(false);

  const ws = weekStart(date);

  const lookups = useTaskLookups();
  const plan = useDayPlan(date);
  const toggle = useToggleTask(date);
  const streak = useStreak();
  const moodWeek = useMoodWeek();
  const week = useTaskRange(ws, addDays(ws, 6), view === 'week');
  const month = useTaskRange(monthStart(date), monthEnd(date), view === 'month');
  const completions = useCompletionHistory();

  const firstName = name.trim().split(' ')[0] || 'there';
  const streakLine = streak.data ? `${streak.data.current_streak}-day streak — keep it frozen` : '';

  /* ── Day / timeline data ─────────────────────────────────────────── */

  const scheduledById = useMemo(
    () => new Map(plan.occurrences.map((o) => [o.id, o.scheduled_at])),
    [plan.occurrences],
  );

  // `useDayPlan` sorts on the *formatted* clock, which orders "9:00 AM" after
  // "11:30 AM" — re-sort on the wire value so the plan reads chronologically.
  const planned = useMemo(
    () =>
      [...plan.planned].sort((a, b) =>
        (scheduledById.get(a.id) ?? '').localeCompare(scheduledById.get(b.id) ?? ''),
      ),
    [plan.planned, scheduledById],
  );
  const anytime = plan.anytime;

  const earliestPlanned = formatClock(planned[0] ? scheduledById.get(planned[0].id) : null);
  const plannedLabel = earliestPlanned ? `PLANNED · ${earliestPlanned}` : 'PLANNED';

  /** One ANYTIME group, then one group per distinct clock time, ascending. */
  const timelineGroups = useMemo(() => {
    const groups: { key: string; label: string; sub?: string; timed: boolean; tasks: Task[] }[] = [];
    if (anytime.length) groups.push({ key: 'anytime', label: 'ANYTIME', timed: false, tasks: anytime });

    const timed = new Map<string, Task[]>();
    for (const task of planned) {
      const clock = task.time ?? '';
      const list = timed.get(clock);
      if (list) list.push(task);
      else timed.set(clock, [task]);
    }
    for (const [clock, tasks] of timed) {
      const [hhmm, suffix] = clock.split(' ');
      groups.push({ key: clock, label: hhmm, sub: suffix, timed: true, tasks });
    }
    return groups;
  }, [anytime, planned]);

  /* ── Week data ───────────────────────────────────────────────────── */

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const iso = addDays(ws, i);
        return {
          iso,
          weekday: shortWeekday(iso),
          day: fromIsoDate(iso).getDate(),
          today: iso === todayIso(),
          dim: i >= 5,
        };
      }),
    [ws],
  );

  const weekGroups = useMemo(() => groupByDate(week.data ?? []), [week.data]);
  const weekFocus = useMemo(
    () => (week.data ?? []).reduce((sum, o) => sum + (o.duration_seconds || 0), 0),
    [week.data],
  );

  /* ── Month data ──────────────────────────────────────────────────── */

  const monthCells = useMemo(() => {
    const first = monthStart(date);
    const lead = mondayIndex(first);
    const cells: { iso: string; day: number; muted: boolean }[] = [];
    for (let i = lead; i > 0; i--) {
      const iso = addDays(first, -i);
      cells.push({ iso, day: fromIsoDate(iso).getDate(), muted: true });
    }
    for (let i = 0; i < daysInMonth(date); i++) {
      const iso = addDays(first, i);
      cells.push({ iso, day: i + 1, muted: false });
    }
    while (cells.length % 7 !== 0) {
      const iso = addDays(cells[cells.length - 1].iso, 1);
      cells.push({ iso, day: fromIsoDate(iso).getDate(), muted: true });
    }
    return cells;
  }, [date]);

  const monthByDate = useMemo(() => groupByDate(month.data ?? []).byDate, [month.data]);

  /* ── Actions ─────────────────────────────────────────────────────── */

  const setView = (v: View) => {
    if (v === 'day') setParams({}, { replace: true });
    else setParams({ view: v }, { replace: true });
  };

  const openDay = (iso: string) => {
    setDate(iso);
    setParams({}, { replace: true });
  };

  /** ±1 day, ±1 week or ±1 month, by the view being read. */
  const step = (dir: -1 | 1) => {
    if (view === 'week') setDate((d) => addDays(d, dir * 7));
    else if (view === 'month') setDate((d) => addMonths(monthStart(d), dir));
    else setDate((d) => addDays(d, dir));
  };

  /* The occurrence id only carries a date for *virtual* (repeating) rows, so a
     materialised task arrived at Microtasks with nothing to say which day it
     belonged to and the screen fell back to today — a task planned for any
     other day opened straight onto "That task is not on this day". The viewed
     day rides along in the query string instead. */
  const openTask = (id: string) =>
    navigate(`/plan/task/${encodeURIComponent(id)}?date=${date}`);

  /** Every add control routes through here so the sheet's time is explicit. */
  const openNewTask = (time = '') => {
    setNewTaskTime(time);
    setNewTaskOpen(true);
  };

  const renderTask = (t: Task) => (
    <TaskCard
      key={t.id}
      title={t.title}
      time={t.time && view !== 'day' ? t.time : undefined}
      dur={t.dur}
      tag={t.tag}
      color={t.color}
      bar={t.bar}
      done={t.done}
      onToggle={() => toggle.mutate(t.id)}
      onClick={() => openTask(t.id)}
    />
  );

  const toggleError = toggle.isError && (
    <div
      role="alert"
      style={{ font: '700 11px var(--font-sans)', color: 'var(--aq-danger)', marginTop: 10 }}
    >
      {errorMessage(toggle.error)}
    </div>
  );

  const emptyPlan = (withAction: boolean) => (
    <EmptyState
      icon="event_available"
      title="Nothing planned yet"
      caption={
        date === todayIso()
          ? "Add one small thing — that's enough to start."
          : 'Nothing scheduled for this day.'
      }
      action={
        withAction ? (
          <Button variant="soft" icon="add" iconSize={16} onClick={() => openNewTask()}>
            New task
          </Button>
        ) : undefined
      }
    />
  );

  /* ── Header row — greeting + chevrons + Day/Week/Month ─────────── */
  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 20,
        marginBottom: view === 'month' ? 16 : 20,
      }}
    >
      <div>
        {view === 'week' ? (
          <>
            <div className="h-serif" style={{ fontSize: 28 }}>
              This week
            </div>
            <div style={{ font: '700 12.5px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 5 }}>
              {weekRangeLabel(ws)}
              {week.data && (
                <>
                  {' · '}
                  <span style={{ color: 'var(--accent)' }}>
                    {week.data.length} {week.data.length === 1 ? 'task' : 'tasks'} ·{' '}
                    {durationLabel(weekFocus)} focus planned
                  </span>
                </>
              )}
            </div>
          </>
        ) : view === 'month' ? (
          <>
            {/* The month name is the drawn control that opens the picker (02.4). */}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-label="Jump to date"
              className="h-serif focus-ring"
              style={{ fontSize: 32, borderRadius: 6 }}
            >
              {monthLabel(date)}
            </button>
            <div style={{ font: '700 13px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 6 }}>
              <span style={{ color: 'var(--accent)' }}>{guest ? 'Guest session' : streakLine}</span>
            </div>
          </>
        ) : (
          <>
            {/* Guests have no name yet, so the greeting drops it (frame 00b.1). */}
            <div className="h-serif" style={{ fontSize: 32 }}>
              {guest ? `${greeting()}.` : `${greeting()}, ${firstName}.`}
            </div>
            <div style={{ font: '700 13px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 6 }}>
              {longDateLabel(date)}
              {(guest || streakLine) && (
                <>
                  {' · '}
                  <span style={{ color: 'var(--accent)' }}>{guest ? 'Guest session' : streakLine}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <RoundButton icon="chevron_left" label="Previous" onClick={() => step(-1)} />
          <RoundButton icon="chevron_right" label="Next" onClick={() => step(1)} />
        </div>
        <Segmented
          aria-label="Plan range"
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        />
      </div>
    </div>
  );

  /* ── 02.6 Week agenda ──────────────────────────────────────────── */
  if (view === 'week') {
    const agendaDays = weekDays.filter((d) => (weekGroups.byDate.get(d.iso)?.length ?? 0) > 0);

    return (
      <Content padding="24px 26px" style={{ alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column' }}>
          {header}

          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {weekDays.map((d) => (
              <div
                key={d.iso}
                onClick={() => openDay(d.iso)}
                className="aq-press"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px 0',
                  borderRadius: 15,
                  cursor: 'pointer',
                  ...(d.today
                    ? { background: 'var(--surface-ink)', color: '#fff' }
                    : { background: 'var(--surface-card)', boxShadow: 'var(--shadow-card)' }),
                }}
              >
                <div
                  style={{
                    font: '800 9px var(--font-sans)',
                    ...(d.today ? { opacity: 0.7 } : { color: 'var(--text-dim)' }),
                  }}
                >
                  {d.weekday}
                </div>
                <div
                  style={{
                    font: '800 16px var(--font-sans)',
                    marginTop: 3,
                    ...(d.dim ? { color: 'var(--text-dim)' } : null),
                  }}
                >
                  {d.day}
                </div>
                {d.today ? (
                  <div style={{ font: '800 8px var(--font-sans)', marginTop: 4, opacity: 0.85 }}>TODAY</div>
                ) : (
                  dotsFor(weekGroups.byDate.get(d.iso), lookups).map((c) => (
                    <div
                      key={c}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: c, margin: '5px auto 0' }}
                    />
                  ))
                )}
              </div>
            ))}
          </div>

          <AsyncSection
            query={week}
            loadingLabel="Loading this week…"
            empty={{
              when: (week.data?.length ?? 0) === 0,
              node: (
                <EmptyState
                  icon="event_available"
                  title="Nothing planned this week"
                  caption="Pick a day and add the first thing — small counts."
                />
              ),
            }}
          >
            {agendaDays.map((d) => (
              <div key={d.iso}>
                <EyebrowLabel style={{ marginBottom: 10 }}>{agendaLabel(d.iso)}</EyebrowLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {(weekGroups.byDate.get(d.iso) ?? []).map((occ) => {
                    const t = toTask(occ, lookups.subjects, lookups.tags);
                    return (
                      <TaskCard
                        key={t.id}
                        title={t.title}
                        time={t.time}
                        dur={t.dur}
                        tag={t.tag}
                        color={t.color}
                        bar={t.bar}
                        done={t.done}
                        onToggle={() => toggle.mutate(t.id)}
                        onClick={() => openTask(t.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Range rows carry no day of their own unless they are timed or
                recurring, so undated ones are listed for the week instead of
                being silently dropped. */}
            {weekGroups.undated.length > 0 && (
              <div>
                <EyebrowLabel style={{ marginBottom: 10 }}>ANYTIME THIS WEEK</EyebrowLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {weekGroups.undated.map((occ) => {
                    const t = toTask(occ, lookups.subjects, lookups.tags);
                    return (
                      <TaskCard
                        key={t.id}
                        title={t.title}
                        dur={t.dur}
                        tag={t.tag}
                        color={t.color}
                        done={t.done}
                        onToggle={() => toggle.mutate(t.id)}
                        onClick={() => openTask(t.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </AsyncSection>

          {toggleError}
        </div>
      </Content>
    );
  }

  /* ── 02.7 Month view ───────────────────────────────────────────── */
  if (view === 'month') {
    return (
      <>
        <Content padding="24px 26px" style={{ display: 'flex', flexDirection: 'column' }}>
          {header}

          {month.isLoading && <Loading label="Loading this month…" padding="0 0 12px" />}
          {month.isError && (
            <ErrorState error={month.error} onRetry={month.refetch} padding="0 0 12px" />
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7,1fr)',
              gap: 1,
              background: 'var(--border-hairline)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 14,
              overflow: 'hidden',
              flex: 1,
              minHeight: 380,
            }}
          >
            {MONTH_WEEKDAYS_LONG.map((w, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface-card)',
                  textAlign: 'center',
                  padding: '7px 0',
                  font: '800 9px var(--font-sans)',
                  color: 'var(--text-dim)',
                }}
              >
                {w}
              </div>
            ))}
            {monthCells.map((cell) => {
              const today = cell.iso === todayIso();
              const dots = dotsFor(monthByDate.get(cell.iso), lookups);
              const completed = completions.data?.[cell.iso] ?? 0;
              return (
                <div
                  key={cell.iso}
                  onClick={() => openDay(cell.iso)}
                  className="aq-press"
                  style={{
                    background: today ? 'var(--accent-soft)' : 'var(--surface-card)',
                    padding: '6px 8px',
                    cursor: 'pointer',
                  }}
                >
                  {today ? (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--surface-ink)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        font: '800 11px var(--font-sans)',
                      }}
                    >
                      {cell.day}
                    </div>
                  ) : (
                    <div
                      style={{
                        font: '700 11px var(--font-sans)',
                        ...(cell.muted ? { color: 'var(--text-dim)' } : null),
                      }}
                    >
                      {cell.day}
                    </div>
                  )}
                  {dots.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                      {dots.map((c) => (
                        <span key={c} style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                      ))}
                    </div>
                  )}
                  {completed > 0 && (
                    <div
                      style={{
                        marginTop: 4,
                        font: '800 8px var(--font-sans)',
                        color: 'var(--aq-success)',
                        background: 'var(--surface-page)',
                        borderRadius: 5,
                        padding: '2px 5px',
                        display: 'inline-block',
                      }}
                    >
                      {completed} DONE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Content>

        <MonthPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          value={date}
          onSelect={openDay}
        />
      </>
    );
  }

  /* ── 02.1 Dashboard / 02.2 Day timeline ────────────────────────── */
  return (
    <>
      <Content padding="24px 26px">
        {guest && <GuestNudge />}
        {header}

        <div className="aq-plan-cols aq-cols" style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
          {/* Left — Today's plan */}
          <Card
            padding="20px 20px 16px"
            className="aq-plan-main"
            style={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: timeline ? 'center' : 'baseline',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <span style={{ font: '800 16px var(--font-sans)' }}>
                {date === todayIso() ? "Today's plan" : 'Your plan'}
              </span>
              {timeline ? (
                <div style={{ display: 'flex', background: 'var(--surface-page)', borderRadius: 100, padding: 3 }}>
                  {(['List', 'Timeline'] as const).map((label) => {
                    const on = (label === 'Timeline') === timeline;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setParams(label === 'Timeline' ? { view: 'timeline' } : {}, { replace: true })}
                        className="aq-press focus-ring"
                        style={{
                          padding: '5px 13px',
                          borderRadius: 100,
                          font: '800 10.5px var(--font-sans)',
                          background: on ? 'var(--surface-ink)' : 'transparent',
                          color: on ? '#fff' : 'var(--text-secondary)',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setParams({ view: 'timeline' }, { replace: true })}
                  className="focus-ring"
                  style={{ font: '700 11px var(--font-sans)', color: 'var(--text-dim)', borderRadius: 4 }}
                >
                  {plan.isLoading
                    ? '…'
                    : `${plan.tasks.length} ${plan.tasks.length === 1 ? 'task' : 'tasks'} · ${plan.doneCount} done`}
                </button>
              )}
            </div>

            {timeline ? (
              /* 02.2 — right-aligned 58px time gutter, timed groups get a rule */
              <AsyncSection
                query={plan}
                loadingLabel="Loading your plan…"
                empty={{ when: plan.tasks.length === 0, node: emptyPlan(true) }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {timelineGroups.map((g, gi) => (
                    <div
                      key={g.key}
                      style={{
                        display: 'flex',
                        gap: 14,
                        marginBottom: g.timed ? undefined : 4,
                        marginTop: g.timed && gi > 0 && !timelineGroups[gi - 1].timed ? 12 : undefined,
                      }}
                    >
                      <div
                        style={{
                          width: 58,
                          flexShrink: 0,
                          textAlign: 'right',
                          paddingTop: 6,
                          ...(g.timed
                            ? { font: '800 11px var(--font-sans)' }
                            : { font: '800 9px var(--font-sans)', color: 'var(--text-dim)' }),
                        }}
                      >
                        {g.label}
                        {g.sub && <div style={{ font: '700 8px var(--font-sans)', color: 'var(--text-dim)' }}>{g.sub}</div>}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          ...(g.timed
                            ? {
                                borderLeft: '2px solid var(--border-hairline)',
                                paddingLeft: 16,
                                marginLeft: -9,
                                paddingBottom: 10,
                              }
                            : null),
                        }}
                      >
                        {g.tasks.map(renderTask)}
                      </div>

                      {/* Timeline grouping had no add control at all — the
                          dashed row only ever rendered in the List branch. This
                          adds into the slot it sits beside, so a 9:00 AM "+"
                          opens the sheet already set to 9:00 AM. */}
                      <AddSlotButton
                        label={g.timed ? `New task at ${g.label}${g.sub ? ` ${g.sub}` : ''}` : 'New anytime task'}
                        onClick={() => openNewTask(g.timed ? toHhMm(g.tasks[0]?.time) : '')}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  variant="dashed"
                  icon="add"
                  iconSize={18}
                  full
                  onClick={() => openNewTask()}
                  style={{ borderRadius: 14, padding: 12, marginTop: 12 }}
                >
                  New task
                </Button>
              </AsyncSection>
            ) : (
              /* 02.1 — collapsible ANYTIME / PLANNED sections */
              <>
                <AsyncSection
                  query={plan}
                  loadingLabel="Loading your plan…"
                  empty={{ when: plan.tasks.length === 0, node: emptyPlan(false) }}
                >
                  <SectionHeader
                    label="ANYTIME"
                    count={anytime.length}
                    open={anytimeOpen}
                    onToggle={() => setAnytimeOpen((v) => !v)}
                  />
                  {anytimeOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {anytime.map(renderTask)}
                    </div>
                  )}

                  <SectionHeader
                    label={plannedLabel}
                    count={planned.length}
                    open={plannedOpen}
                    onToggle={() => setPlannedOpen((v) => !v)}
                  />
                  {plannedOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{planned.map(renderTask)}</div>
                  )}
                </AsyncSection>

                {/* Flow-graph edge "Dashboard → New task" (README §4.3). 02.1 draws
                    no add control, so this uses the design system's dashed-add row
                    exactly as 01.5 and 03.1 do. Noted in BUILD_NOTES.md. */}
                <Button
                  variant="dashed"
                  icon="add"
                  iconSize={18}
                  full
                  onClick={() => openNewTask()}
                  style={{ borderRadius: 14, padding: 12, marginTop: 12 }}
                >
                  New task
                </Button>
              </>
            )}

            {toggleError}
          </Card>

          {/* Right — Focus card + This week */}
          <div
            className="aq-plan-side"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}
          >
            <Card padding={20} style={{ display: 'flex', alignItems: 'center', gap: 18, overflow: 'hidden' }}>
              <div
                style={{
                  flexShrink: 0,
                  width: 108,
                  height: 108,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IceTimer progress={0} expr="happy" size={108} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <EyebrowLabel style={{ marginBottom: 6 }}>FOCUS · DEEP WORK</EyebrowLabel>
                <div className="h-serif" style={{ fontSize: 20, lineHeight: 1.1, marginBottom: 4 }}>
                  Ready when
                  <br />
                  you are.
                </div>
                <Button
                  variant="smallInk"
                  icon="play_arrow"
                  iconSize={15}
                  onClick={() => navigate('/focus')}
                  style={{ padding: '8px 14px', font: '800 11px var(--font-sans)', marginTop: 6, gap: 6 }}
                >
                  Start focus
                </Button>
              </div>
            </Card>

            {guest ? (
              <GuestLockCard
                title="This week"
                caption="Create an account to track your mood & streak"
                onClick={() => navigate('/setup')}
              >
                <MoodWeek days={moodWeek.days.filter((d) => d.rating !== null)} size={28} dashSize={26} />
              </GuestLockCard>
            ) : (
              <Card padding={16}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <span style={{ font: '800 12px var(--font-sans)' }}>This week</span>
                  {/* "Log today ›" is the drawn entry to both check-ins — morning
                      before 17:00, the evening reflection after (README §4.3). */}
                  <button
                    type="button"
                    onClick={() => (isEvening() ? setEveningOpen(true) : setMorningOpen(true))}
                    className="focus-ring"
                    style={{ font: '700 10px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}
                  >
                    Log today ›
                  </button>
                </div>
                {moodWeek.isError ? (
                  <ErrorState error={moodWeek.error} onRetry={moodWeek.refetch} padding={12} />
                ) : moodWeek.isLoading ? (
                  <Loading label="Loading moods…" padding={12} />
                ) : (
                  <MoodWeek days={moodWeek.days} size={28} dashSize={26} />
                )}
              </Card>
            )}
          </div>
        </div>
      </Content>

      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        date={date}
        initialTime={newTaskTime}
      />
      <MorningCheckIn open={morningOpen} onClose={() => setMorningOpen(false)} />
      <EveningReflection open={eveningOpen} onClose={() => setEveningOpen(false)} />
    </>
  );
}

/**
 * "12:00 PM" / "9:00 AM" back to the `HH:mm` the new-task sheet expects.
 * The timeline groups key on the formatted clock, not the wire value.
 */
function toHhMm(clock: string | undefined): string {
  if (!clock) return '';
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(clock.trim());
  if (!m) return '';
  let hour = Number(m[1]);
  const suffix = m[3]?.toUpperCase();
  if (suffix === 'PM' && hour !== 12) hour += 12;
  if (suffix === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${m[2]}`;
}

/** The small "+" that sits to the right of a timeline slot. */
function AddSlotButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="aq-press aq-darken focus-ring"
      style={{
        alignSelf: 'flex-start',
        marginTop: 4,
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: 'var(--surface-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name="add" size={16} color="var(--text-secondary)" />
    </button>
  );
}

function RoundButton({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="aq-press aq-darken focus-ring"
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={18} color="var(--text-secondary)" />
    </button>
  );
}
