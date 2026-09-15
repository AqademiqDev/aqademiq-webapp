import { fromIsoDate } from './format';
import type { WeeklyReportDto } from './api/types';

/* ─────────────────────────────────────────────────────────────────────────
   The weekly report — an ice core drilled out of the last seven days.

   The view model the screens read, and a port of the mobile app's
   `models/weekly_report.dart` + its adapter. It exists rather than the screens
   reading the DTO because two things here are load-bearing and must not be
   decided in a component:

   * `WeekShape` — the wire sends a string. An unknown value has to become
     something safe instead of throwing halfway through a screen the student
     is already looking at.
   * `isUntinted` / `isGap` — a day with no mood is an *empty band*, never a
     tinted one. That is the difference between "nothing logged" and a bad day,
     and the single easiest way for this feature to say something false about
     someone.

   Every field parses defensively. The payload is drawn as one whole screen with
   no partial state, so one unexpected null must not take the report down; a
   missing card is a card that does not render, which is what the design asks
   for anyway.
   ───────────────────────────────────────────────────────────────────────── */

/** Deliberately about the week, never the person: none is better than another. */
export type WeekShape =
  | 'empty'
  | 'single'
  | 'steady'
  | 'frontLoaded'
  | 'backLoaded'
  | 'clustered'
  | 'scattered';

/**
 * Wire value → shape. Unknown values fall back to `scattered`, the only value
 * that claims nothing: a new server shape must not crash the screen or, worse,
 * silently render as `empty` and tell someone their week was blank when it was not.
 */
export function weekShapeFromWire(wire: unknown): WeekShape {
  switch (wire) {
    case 'empty':
      return 'empty';
    case 'single':
      return 'single';
    case 'steady':
      return 'steady';
    case 'front_loaded':
      return 'frontLoaded';
    case 'back_loaded':
      return 'backLoaded';
    case 'clustered':
      return 'clustered';
    default:
      return 'scattered';
  }
}

export type SubjectBasis = 'focusMinutes' | 'tasksCompleted';

/** One band of the core. */
export interface ReportDay {
  /** `yyyy-MM-dd`, a local calendar day. */
  date: string;
  /** 1 = Monday … 7 = Sunday. */
  weekday: number;
  /** 0–4 on the shipped ramp, or null when nothing was logged. */
  moodIndex: number | null;
  /** Whether anything at all happened — tasks, focus, or a check-in. */
  hasActivity: boolean;
  /**
   * A day later in the week than today. It has not happened, so it is neither
   * active nor a gap: drawing it as "nothing logged" would tell someone on
   * Thursday that they had already missed Friday, Saturday and Sunday.
   */
  isFuture: boolean;
  tasksCompleted: number;
  focusMinutes: number;
  focusSessions: number;
}

/** A day that happened but carries no mood: drawn solid, never tinted. */
export const isUntinted = (d: ReportDay): boolean => d.hasActivity && d.moodIndex === null;

/** A day that has happened and carries nothing. The only state drawn as an open band. */
export const isGap = (d: ReportDay): boolean => !d.hasActivity && !d.isFuture;

export interface ReportSubject {
  id: string;
  /** Null when the subject was deleted after the work happened — never named in copy. */
  name: string | null;
  colorHex: string | null;
  focusMinutes: number;
  tasksCompleted: number;
  /** 0–1. */
  share: number;
}

export interface ReportMoment {
  date: string;
  weekday: number;
  title: string;
  subjectId: string | null;
}

export interface ReportRecovery {
  sessions: number;
  beforeAvg: number;
  afterAvg: number;
  /** Always > 0. */
  lift: number;
}

export interface ReportLongest {
  minutes: number;
  date: string;
  weekday: number;
  taskTitle: string | null;
}

export interface ReportPrismSlice {
  presetId: string;
  name: string;
  sessions: number;
  /** 0–1. */
  share: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  /** Monday first. */
  days: ReportDay[];
  shape: WeekShape;
  /** The hero numeral: days **this week** that carried work. */
  activeDays: number;
  /** Days the week has had so far — 4 on a Thursday, 7 once it is over. */
  elapsedDays: number;
  /** Lifetime days on the board. Not headlined anywhere. */
  daysOnBoard: number;
  subjects: ReportSubject[];
  subjectBasis: SubjectBasis;
  unattributedFocusMinutes: number;
  unattributedTasksCompleted: number;
  moment: ReportMoment | null;
  recovery: ReportRecovery | null;
  longestSession: ReportLongest | null;
  /** Minutes held frozen — paused, not lost. */
  heldMinutes: number;
  prismMix: ReportPrismSlice[];
  rhythmWeekdays: number[];
  focusMinutes: number;
  focusSessions: number;
  tasksCompleted: number;
}

/** An empty week still renders — it is a real week — but beats with nothing to say stay out. */
export const isEmptyWeek = (r: WeeklyReport): boolean => r.activeDays === 0;

/* ── parsing ─────────────────────────────────────────────────────────── */

type Loose = Record<string, unknown>;

const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const int = (v: unknown, fallback = 0): number => Math.trunc(num(v, fallback));
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const strOrNull = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const obj = (v: unknown): Loose | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Loose) : null;
const list = <T>(v: unknown, parse: (o: Loose) => T): T[] =>
  Array.isArray(v) ? v.map(obj).filter((o): o is Loose => o !== null).map(parse) : [];

/**
 * 1 = Monday … 7 = Sunday for a `yyyy-MM-dd` string, read as a *local* calendar
 * day. The report is about days the student lived through, so a UTC parse would
 * shift the whole core by a band for anyone west of Greenwich.
 */
function weekdayOf(ymd: string): number {
  if (!/^\d{4}-\d{2}-\d{2}/.test(ymd)) return 1;
  return ((fromIsoDate(ymd.slice(0, 10)).getDay() + 6) % 7) + 1;
}

function toDay(j: Loose): ReportDay {
  const mood = j.mood_index;
  return {
    date: str(j.date),
    weekday: int(j.weekday, 1),
    moodIndex: typeof mood === 'number' && Number.isInteger(mood) ? mood : null,
    hasActivity: j.has_activity === true,
    isFuture: j.is_future === true,
    tasksCompleted: int(j.tasks_completed),
    focusMinutes: int(j.focus_minutes),
    focusSessions: int(j.focus_sessions),
  };
}

function toSubject(j: Loose): ReportSubject {
  return {
    id: str(j.subject_id),
    name: strOrNull(j.name),
    colorHex: strOrNull(j.color),
    focusMinutes: int(j.focus_minutes),
    tasksCompleted: int(j.tasks_completed),
    share: num(j.share),
  };
}

function toMoment(j: Loose): ReportMoment {
  const date = str(j.date);
  return { date, weekday: weekdayOf(date), title: str(j.title), subjectId: strOrNull(j.subject_id) };
}

function toRecovery(j: Loose): ReportRecovery {
  return {
    sessions: int(j.sessions),
    beforeAvg: num(j.before_avg),
    afterAvg: num(j.after_avg),
    lift: num(j.lift),
  };
}

function toLongest(j: Loose): ReportLongest {
  const date = str(j.date);
  return { minutes: int(j.minutes), date, weekday: weekdayOf(date), taskTitle: strOrNull(j.task_title) };
}

function toPrismSlice(j: Loose): ReportPrismSlice {
  return {
    presetId: str(j.preset_id),
    name: str(j.name),
    sessions: int(j.sessions),
    share: num(j.share),
  };
}

/**
 * DTO → model.
 *
 * A missing `shape` becomes `scattered`, not `empty`: a payload we could not read
 * must not be rendered as "nothing happened this week", which states something
 * false about the student. `empty` only ever arrives because the server said so.
 */
export function toWeeklyReport(dto: WeeklyReportDto | unknown): WeeklyReport {
  const j = obj(dto) ?? {};
  const moment = obj(j.moment);
  const recovery = obj(j.recovery);
  const longest = obj(j.longest_session);

  return {
    weekStart: str(j.week_start),
    weekEnd: str(j.week_end),
    days: list(j.days, toDay),
    shape: weekShapeFromWire(j.shape),
    activeDays: int(j.active_days),
    elapsedDays: int(j.elapsed_days, 7),
    daysOnBoard: int(j.days_on_board),
    subjects: list(j.subjects, toSubject),
    subjectBasis: j.subject_basis === 'tasks_completed' ? 'tasksCompleted' : 'focusMinutes',
    unattributedFocusMinutes: int(j.unattributed_focus_minutes),
    unattributedTasksCompleted: int(j.unattributed_tasks_completed),
    moment: moment ? toMoment(moment) : null,
    recovery: recovery ? toRecovery(recovery) : null,
    longestSession: longest ? toLongest(longest) : null,
    heldMinutes: int(j.held_minutes),
    prismMix: list(j.prism_mix, toPrismSlice),
    rhythmWeekdays: Array.isArray(j.rhythm_weekdays)
      ? j.rhythm_weekdays.filter((n): n is number => typeof n === 'number').map((n) => Math.trunc(n))
      : [],
    focusMinutes: int(j.focus_minutes),
    focusSessions: int(j.focus_sessions),
    tasksCompleted: int(j.tasks_completed),
  };
}

/** Seven open bands, for the moments before a week has loaded. The tube is the same object either way. */
export function blankWeek(): ReportDay[] {
  return Array.from({ length: 7 }, (_, i) => ({
    date: '',
    weekday: i + 1,
    moodIndex: null,
    hasActivity: false,
    isFuture: false,
    tasksCompleted: 0,
    focusMinutes: 0,
    focusSessions: 0,
  }));
}

/**
 * The week with mood removed — for "Share the shape".
 *
 * Mood is health data, so nothing exported may encode it. Stripping the *data*
 * rather than the drawing is deliberate: a share card that merely chose not to
 * paint the tint would be one styling change away from leaking it, while one
 * built from data that no longer contains a mood cannot leak what it does not
 * have. `isFuture` is preserved — a day that has not happened must not become an
 * open band on a card someone sends to their friends.
 */
export function shapeOnly(r: WeeklyReport): WeeklyReport {
  return {
    weekStart: r.weekStart,
    weekEnd: r.weekEnd,
    shape: r.shape,
    activeDays: r.activeDays,
    elapsedDays: r.elapsedDays,
    daysOnBoard: r.daysOnBoard,
    days: r.days.map((d) => ({ ...d, moodIndex: null })),
    subjects: [],
    subjectBasis: r.subjectBasis,
    unattributedFocusMinutes: 0,
    unattributedTasksCompleted: 0,
    moment: null,
    recovery: null,
    longestSession: null,
    heldMinutes: 0,
    prismMix: [],
    rhythmWeekdays: [],
    focusMinutes: 0,
    focusSessions: 0,
    tasksCompleted: 0,
  };
}

/* ── the mood ramp ───────────────────────────────────────────────────── */

/**
 * The shipped mood ramp, low to high — the same five colours as the check-in
 * screens (`--aq-ice-N-border`, `CUBE_TONES[n].border`) and the mobile app's
 * `AppMood.ramp`. The core is read by comparing a band's tint to the colour the
 * student remembers tapping, so this must never drift from those.
 */
export const MOOD_RAMP = ['#a79fc4', '#9286d2', '#7d70d9', '#6a5ce4', '#5a44f1'] as const;

/** The tint for a logged mood, or null — null is the important return. */
export function moodTint(moodIndex: number | null): string | null {
  if (moodIndex === null || moodIndex < 0 || moodIndex >= MOOD_RAMP.length) return null;
  return MOOD_RAMP[moodIndex];
}
