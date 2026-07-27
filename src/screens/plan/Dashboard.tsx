import { useState } from 'react';
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
import NewTaskModal from './NewTaskModal';
import MonthPicker from './MonthPicker';
import MorningCheckIn from '../mood/MorningCheckIn';
import EveningReflection from '../mood/EveningReflection';
import GuestNudge, { GuestLockCard } from '../../components/content/GuestNudge';
import {
  ANYTIME_TASKS,
  GUEST_PLANNED_TASKS,
  MONTH_DAYS,
  MONTH_LABEL,
  MONTH_WEEKDAYS_LONG,
  PLANNED_TASKS,
  TIMELINE_GROUPS,
  WEEK_AGENDA,
  WEEK_DAYS,
  WEEK_MOODS,
  type Task,
} from '../../data/tasks';
import { useAppState } from '../../hooks/useAppState';

/* ─────────────────────────────────────────────────────────────────────────
   Section 02 — Plan / Home.

   One screen, four views selected by ?view= (README §4.2):
     (none)    02.1 Dashboard — Today's plan + Focus + This week
     timeline  02.2 Day timeline — the same shell, plan card in timeline mode
     week      02.6 Week agenda
     month     02.7 Month view
   ───────────────────────────────────────────────────────────────────────── */

type View = 'day' | 'week' | 'month';

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { guest, name } = useAppState();

  const raw = params.get('view');
  const timeline = raw === 'timeline';
  const view: View = raw === 'week' ? 'week' : raw === 'month' ? 'month' : 'day';

  const [anytimeOpen, setAnytimeOpen] = useState(true);
  const [plannedOpen, setPlannedOpen] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [morningOpen, setMorningOpen] = useState(false);
  const [eveningOpen, setEveningOpen] = useState(false);

  const doneCount = Object.values(done).filter(Boolean).length;
  const firstName = name.trim().split(' ')[0] || 'there';
  const isEvening = new Date().getHours() >= 17;
  const planned = guest ? GUEST_PLANNED_TASKS : PLANNED_TASKS;
  const taskCount = ANYTIME_TASKS.length + planned.length;

  const setView = (v: View) => {
    if (v === 'day') setParams({}, { replace: true });
    else setParams({ view: v }, { replace: true });
  };

  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));

  const renderTask = (t: Task) => (
    <TaskCard
      key={t.id}
      title={t.title}
      time={t.time && view !== 'day' ? t.time : undefined}
      dur={t.dur}
      tag={t.tag}
      color={t.color}
      bar={t.bar}
      done={!!done[t.id]}
      onToggle={() => toggle(t.id)}
      onClick={() => navigate(`/plan/task/${t.id}`)}
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
              June 18 – 24 · <span style={{ color: 'var(--accent)' }}>4 tasks · 2h focus planned</span>
            </div>
          </>
        ) : view === 'month' ? (
          <>
            <div className="h-serif" style={{ fontSize: 32 }}>
              {MONTH_LABEL}
            </div>
            <div style={{ font: '700 13px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 6 }}>
              <span style={{ color: 'var(--accent)' }}>3-day streak — keep it frozen</span>
            </div>
          </>
        ) : (
          <>
            {/* Guests have no name yet, so the greeting drops it (frame 00b.1). */}
            <div className="h-serif" style={{ fontSize: 32 }}>
              {guest ? 'Good morning.' : `Good morning, ${firstName}.`}
            </div>
            <div style={{ font: '700 13px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 6 }}>
              Wednesday, June 20 ·{' '}
              <span style={{ color: 'var(--accent)' }}>
                {guest ? 'Guest session' : '3-day streak — keep it frozen'}
              </span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <RoundButton icon="chevron_left" label="Previous" />
          <RoundButton
            icon="chevron_right"
            label="Next"
            onClick={view === 'month' ? () => setPickerOpen(true) : undefined}
          />
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
    return (
      <Content padding="24px 26px" style={{ alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column' }}>
          {header}

          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {WEEK_DAYS.map((d) => (
              <div
                key={d.date}
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
                  {d.date}
                </div>
                {d.today ? (
                  <div style={{ font: '800 8px var(--font-sans)', marginTop: 4, opacity: 0.85 }}>TODAY</div>
                ) : (
                  d.dots.map((c) => (
                    <div
                      key={c}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: c, margin: '5px auto 0' }}
                    />
                  ))
                )}
              </div>
            ))}
          </div>

          {WEEK_AGENDA.map((group) => (
            <div key={group.label}>
              <EyebrowLabel style={{ marginBottom: 10 }}>{group.label}</EyebrowLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {group.tasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    title={t.title}
                    time={t.time}
                    dur={t.dur}
                    tag={t.tag}
                    color={t.color}
                    bar={t.bar}
                    done={!!done[t.id]}
                    onToggle={() => toggle(t.id)}
                  />
                ))}
              </div>
            </div>
          ))}
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
            {MONTH_DAYS.map((d) => (
              <div
                key={d.date}
                className="aq-press"
                style={{
                  background: d.today ? 'var(--accent-soft)' : 'var(--surface-card)',
                  padding: '6px 8px',
                  cursor: 'pointer',
                }}
              >
                {d.today ? (
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
                    {d.date}
                  </div>
                ) : (
                  <div
                    style={{
                      font: '700 11px var(--font-sans)',
                      ...(d.muted ? { color: 'var(--text-dim)' } : null),
                    }}
                  >
                    {d.date}
                  </div>
                )}
                {d.dots && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                    {d.dots.map((c) => (
                      <span key={c} style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                )}
                {d.badge && (
                  <div
                    style={{
                      marginTop: 4,
                      font: '800 8px var(--font-sans)',
                      color: d.badge.color,
                      background: d.badge.bg,
                      borderRadius: 5,
                      padding: '2px 5px',
                      display: 'inline-block',
                    }}
                  >
                    {d.badge.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Content>
        <MonthPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
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
              <span style={{ font: '800 16px var(--font-sans)' }}>Today&apos;s plan</span>
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
                  {taskCount} tasks · {doneCount} done
                </button>
              )}
            </div>

            {timeline ? (
              /* 02.2 — right-aligned 58px time gutter, timed groups get a rule */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {TIMELINE_GROUPS.map((g, gi) => (
                  <div
                    key={g.label}
                    style={{
                      display: 'flex',
                      gap: 14,
                      marginBottom: gi === 0 ? 4 : undefined,
                      marginTop: gi === 1 ? 12 : undefined,
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
                              paddingBottom: gi === 1 ? 10 : undefined,
                            }
                          : null),
                      }}
                    >
                      {g.tasks.map(renderTask)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 02.1 — collapsible ANYTIME / PLANNED sections */
              <>
                <SectionHeader
                  label="ANYTIME"
                  count={ANYTIME_TASKS.length}
                  open={anytimeOpen}
                  onToggle={() => setAnytimeOpen((v) => !v)}
                />
                {anytimeOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {ANYTIME_TASKS.map(renderTask)}
                  </div>
                )}

                <SectionHeader
                  label={guest ? 'PLANNED · 2:00 PM' : 'PLANNED · 11:30 AM'}
                  count={planned.length}
                  open={plannedOpen}
                  onToggle={() => setPlannedOpen((v) => !v)}
                />
                {plannedOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{planned.map(renderTask)}</div>
                )}

                {/* Flow-graph edge "Dashboard → New task" (README §4.3). 02.1 draws
                    no add control, so this uses the design system's dashed-add row
                    exactly as 01.5 and 03.1 do. Noted in BUILD_NOTES.md. */}
                <Button
                  variant="dashed"
                  icon="add"
                  iconSize={18}
                  full
                  onClick={() => setNewTaskOpen(true)}
                  style={{ borderRadius: 14, padding: 12, marginTop: 12 }}
                >
                  New task
                </Button>
              </>
            )}
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
                <MoodWeek days={WEEK_MOODS.filter((d) => d.rating !== null)} size={28} dashSize={26} />
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
                    onClick={() => (isEvening ? setEveningOpen(true) : setMorningOpen(true))}
                    className="focus-ring"
                    style={{ font: '700 10px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}
                  >
                    Log today ›
                  </button>
                </div>
                <MoodWeek days={WEEK_MOODS} size={28} dashSize={26} />
              </Card>
            )}
          </div>
        </div>
      </Content>

      <NewTaskModal open={newTaskOpen} onClose={() => setNewTaskOpen(false)} />
      <MorningCheckIn open={morningOpen} onClose={() => setMorningOpen(false)} />
      <EveningReflection open={eveningOpen} onClose={() => setEveningOpen(false)} />
    </>
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
