/* Static mock data — the plan (frames 02.1–02.7, 04.4, 05.2). */

import type { CubeExpr } from '../components/brand/AdaCube';

export interface Task {
  id: string;
  title: string;
  dur: string;
  tag: string;
  color: string;
  /** Shows the timed left rule. */
  bar?: boolean;
  /** Absent = "Anytime". */
  time?: string;
  done?: boolean;
}

export const TASKS: Task[] = [
  { id: 't1', title: 'Read chapter 4', dur: '10 min', tag: 'CC 401', color: '#6b5cf0' },
  { id: 't2', title: 'Review lecture slides', dur: '5 min', tag: 'NLP 302', color: '#5cbbff' },
  { id: 't3', title: 'LL(1) parsing notes', dur: '30 min', tag: 'CC 401', color: '#6b5cf0', bar: true, time: '11:30 AM' },
  { id: 't4', title: 'Assignment 3 draft', dur: '30 min', tag: 'NLP 302', color: '#5cbbff', bar: true, time: '2:00 PM' },
];

export const ANYTIME_TASKS = TASKS.filter((t) => !t.time);
export const PLANNED_TASKS = TASKS.filter((t) => t.time);

/** A guest hasn't added subjects yet, so 00b.1 draws a lighter plan. */
export const GUEST_PLANNED_TASKS: Task[] = [
  { id: 'g1', title: 'LL(1) parsing notes', dur: '30 min', tag: 'CC 401', color: '#6b5cf0', bar: true, time: '2:00 PM' },
];

/** The task picker on the Focus screen (frame 04.4). */
export interface LinkableTask {
  id: string;
  title: string;
  meta: string;
  color: string;
}

export const LINKABLE_TASKS: LinkableTask[] = [
  { id: 't3', title: 'LL(1) parsing notes', meta: 'CC 401 · Planned 11:30 AM', color: '#6b5cf0' },
  { id: 't4', title: 'Assignment 3 draft', meta: 'NLP 302 · Planned 2:00 PM', color: '#5cbbff' },
  { id: 't5', title: 'NET lab prep', meta: 'NET 305 · Anytime', color: '#2a9d6b' },
  { id: 't1', title: 'Read chapter 4', meta: 'CC 401 · Anytime', color: '#6b5cf0' },
];

/** Microtask breakdown (frame 02.5). */
export interface Microtask {
  title: string;
  dur: string;
  state: 'done' | 'current' | 'todo';
  sub?: string;
}

export const MICROTASKS: Record<string, { title: string; subject: string; note: string; steps: Microtask[] }> = {
  t4: {
    title: 'Assignment 3 draft',
    subject: 'NLP 302',
    note: 'This looks big. I broke it into three 20-minute steps you can knock out today.',
    steps: [
      { title: 'Outline the argument', dur: '20 min', state: 'done' },
      { title: 'Draft sections 1–2', dur: '20 min', state: 'current', sub: 'Up next · Deep Work' },
      { title: 'Review & cite sources', dur: '20 min', state: 'todo' },
    ],
  },
};

/** The tag options offered in the quick-add sheet (frame 02.3). */
export const TASK_TAGS = ['Class', 'Exam', 'Assignment', 'Lecture'] as const;

/* ── Week / month scaffolding ────────────────────────────────────────── */

export interface DayCell {
  weekday: string;
  date: number;
  dots: string[];
  today?: boolean;
  /** Trailing weekend days render dim (frame 02.6). */
  dim?: boolean;
}

export const WEEK_DAYS: DayCell[] = [
  { weekday: 'MON', date: 18, dots: ['#6b5cf0'] },
  { weekday: 'TUE', date: 19, dots: ['#5cbbff'] },
  { weekday: 'WED', date: 20, dots: [], today: true },
  { weekday: 'THU', date: 21, dots: ['#6b5cf0'] },
  { weekday: 'FRI', date: 22, dots: ['#e85476'] },
  { weekday: 'SAT', date: 23, dots: [], dim: true },
  { weekday: 'SUN', date: 24, dots: [], dim: true },
];

/** The week agenda's grouped task list (frame 02.6). */
export const WEEK_AGENDA: { label: string; tasks: Task[] }[] = [
  {
    label: 'TODAY · WEDNESDAY 20',
    tasks: [
      { id: 'w1', title: 'LL(1) parsing notes', time: '11:30 AM', dur: '30 min', tag: 'CC 401', color: '#6b5cf0', bar: true },
      { id: 'w2', title: 'NET lab prep', time: '2:00 PM', dur: '20 min', tag: 'NET 305', color: '#2a9d6b', bar: true },
    ],
  },
  {
    label: 'THURSDAY 21',
    tasks: [
      { id: 'w3', title: 'Viva prep — Deep Work', time: '10:00 AM', dur: '45 min', tag: 'CC 401', color: '#6b5cf0', bar: true },
    ],
  },
  {
    label: 'FRIDAY 22',
    tasks: [
      { id: 'w4', title: 'NLP assignment due', time: '11:59 PM', dur: 'Deadline', tag: 'NLP 302', color: '#e85476', bar: true },
    ],
  },
];

/** The timeline's time gutter groups (frame 02.2). */
export const TIMELINE_GROUPS: { label: string; sub?: string; timed: boolean; tasks: Task[] }[] = [
  { label: 'ANYTIME', timed: false, tasks: ANYTIME_TASKS },
  { label: '11:30', sub: 'AM', timed: true, tasks: [TASKS[2]] },
  { label: '2:00', sub: 'PM', timed: true, tasks: [TASKS[3]] },
];

/** Month grid — June 2026 starts on a Monday (frames 02.4, 02.7). */
export interface MonthDay {
  date: number;
  dots?: string[];
  badge?: { label: string; color: string; bg: string };
  today?: boolean;
  muted?: boolean;
}

export const MONTH_LABEL = 'June 2026';
export const MONTH_WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const MONTH_WEEKDAYS_LONG = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const MONTH_DAYS: MonthDay[] = Array.from({ length: 30 }, (_, i) => {
  const date = i + 1;
  const day: MonthDay = { date };
  if (date === 1) day.muted = true;
  if (date === 16 || date === 18) day.dots = ['#6b5cf0'];
  if (date === 17 || date === 19) day.dots = ['#5cbbff'];
  if (date === 20) {
    day.today = true;
    day.dots = ['#6b5cf0', '#2a9d6b'];
  }
  if (date === 21) day.dots = ['#6b5cf0'];
  if (date === 22) day.badge = { label: 'NLP due', color: '#c0405f', bg: '#e8547618' };
  if (date === 25) day.dots = ['#6b5cf0'];
  return day;
});

/** The month picker's legend row (frame 02.4). */
export const MONTH_LEGEND = { date: 25, text: '25 — NLP assignment due' };

/* ── Mood ────────────────────────────────────────────────────────────── */

export const MOOD_LABELS = ['Rough', 'Tired', 'OK', 'Good', 'Great'] as const;

/** The frames tie every mood rating to a melt amount and an expression. */
export const MOOD_EXPR: CubeExpr[] = ['sad', 'meh', 'neutral', 'smile', 'happy'];
export const moodMelt = (rating: number) => (4 - Math.max(0, Math.min(4, rating))) / 4;
export const moodExpr = (rating: number) => MOOD_EXPR[Math.max(0, Math.min(4, rating))];

export interface MoodDay {
  letter: string;
  rating: number | null;
}

/** This week's check-ins — M–F logged, S/S still open (02.1, 06.1). */
export const WEEK_MOODS: MoodDay[] = [
  { letter: 'M', rating: 4 },
  { letter: 'T', rating: 3 },
  { letter: 'W', rating: 4 },
  { letter: 'T', rating: 2 },
  { letter: 'F', rating: 3 },
  { letter: 'S', rating: null },
  { letter: 'S', rating: null },
];
