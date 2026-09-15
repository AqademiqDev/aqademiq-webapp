import { addDays, weekStart } from '../lib/format';
import { toWeeklyReport, type WeeklyReport } from '../lib/weeklyReport';

/* A mid-week weekly report, for the dev gallery only.

   The same fixture as the mobile app's `MockWeeklyReportSource`, deliberately
   mid-week: that is the state the report is in five days out of seven, and the
   one with the most ways to be wrong. Today is treated as Thursday.

   All three band states the design turns on are present — on a week where every
   day is full, none of them is visible and all three are easy to break:
     Mon, Tue      tinted    — a mood was logged
     Wed           untinted  — work happened, no check-in
     Thu           open      — today, and nothing on it yet
     Fri–Sun       not yet   — must never draw as "nothing logged"

   Built through `toWeeklyReport`, so the gallery exercises the real mapper. */

export function midWeekFixture(): WeeklyReport {
  const monday = weekStart();
  const d = (i: number) => addDays(monday, i);
  return toWeeklyReport({
    week_start: d(0),
    week_end: d(6),
    shape: 'clustered',
    active_days: 3,
    elapsed_days: 4,
    days_on_board: 23,
    days: [
      { date: d(0), weekday: 1, mood_index: 1, has_activity: true, is_future: false, tasks_completed: 1, focus_minutes: 25, focus_sessions: 1 },
      { date: d(1), weekday: 2, mood_index: 3, has_activity: true, is_future: false, tasks_completed: 3, focus_minutes: 75, focus_sessions: 2 },
      { date: d(2), weekday: 3, mood_index: null, has_activity: true, is_future: false, tasks_completed: 2, focus_minutes: 50, focus_sessions: 2 },
      { date: d(3), weekday: 4, mood_index: null, has_activity: false, is_future: false, tasks_completed: 0, focus_minutes: 0, focus_sessions: 0 },
      { date: d(4), weekday: 5, mood_index: null, has_activity: false, is_future: true, tasks_completed: 0, focus_minutes: 0, focus_sessions: 0 },
      { date: d(5), weekday: 6, mood_index: null, has_activity: false, is_future: true, tasks_completed: 0, focus_minutes: 0, focus_sessions: 0 },
      { date: d(6), weekday: 7, mood_index: null, has_activity: false, is_future: true, tasks_completed: 0, focus_minutes: 0, focus_sessions: 0 },
    ],
    subjects: [
      { subject_id: 's1', name: 'Machine Learning', color: '#6B5CF0', focus_minutes: 90, tasks_completed: 4, share: 0.6 },
      { subject_id: 's2', name: 'Linear Algebra', color: '#2A9D6B', focus_minutes: 40, tasks_completed: 2, share: 0.27 },
      { subject_id: 's3', name: 'Thermodynamics', color: '#E85476', focus_minutes: 20, tasks_completed: 1, share: 0.13 },
    ],
    subject_basis: 'focus_minutes',
    unattributed_focus_minutes: 0,
    unattributed_tasks_completed: 0,
    moment: { date: d(2), title: 'Finish the reading you moved twice', subject_id: 's1' },
    recovery: { sessions: 4, before_avg: 2.25, after_avg: 3.5, lift: 1.25 },
    longest_session: { minutes: 52, date: d(1), task_title: 'Problem set 4' },
    held_minutes: 18,
    prism_mix: [
      { preset_id: 'p1', name: 'Rain', sessions: 5, share: 0.56 },
      { preset_id: 'p2', name: 'Deep Work', sessions: 3, share: 0.33 },
      { preset_id: 'p3', name: 'Forest', sessions: 1, share: 0.11 },
    ],
    rhythm_weekdays: [2, 3, 5],
    focus_minutes: 150,
    focus_sessions: 5,
    tasks_completed: 6,
  });
}
