/* View-model shapes for the plan section.

   The static frames data that used to live here is gone — the plan is served by
   `/v1/tasks` and mapped into these shapes by `lib/mappers.ts`. What remains is
   the vocabulary the JSX is written against, plus the pure mood maths the frames
   define (melt amount and expression per rating). */

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

/** The task picker on the Focus screen (frame 04.4). */
export interface LinkableTask {
  id: string;
  title: string;
  meta: string;
  color: string;
}

/** Microtask breakdown (frame 02.5). */
export interface Microtask {
  title: string;
  dur: string;
  state: 'done' | 'current' | 'todo';
  sub?: string;
}

/* ── Week / month scaffolding ────────────────────────────────────────── */

export interface DayCell {
  weekday: string;
  date: number;
  dots: string[];
  today?: boolean;
  /** Trailing weekend days render dim (frame 02.6). */
  dim?: boolean;
}

export interface MonthDay {
  date: number;
  dots?: string[];
  badge?: { label: string; color: string; bg: string };
  today?: boolean;
  muted?: boolean;
}

export const MONTH_WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const MONTH_WEEKDAYS_LONG = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

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
