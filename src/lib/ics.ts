/* Minimal iCalendar (RFC 5545) reader.

   The API has no calendar integration — there is no OAuth connector and no
   import endpoint — so Settings → Import works off a file the user exports from
   whatever app they already use. Google Calendar, Apple Calendar, Outlook and
   most university timetables all export `.ics`, and Apple Reminders / Google
   Tasks export their to-dos into the same container as `VTODO`.

   That gives both halves of the feature one implementation:
     VEVENT — a scheduled thing        → a task with a time
     VTODO  — a reminder / to-do       → a task on its due date

   Only the fields that survive the trip into a task are read. Recurrence is
   deliberately *not* expanded: `RRULE` is mapped to the app's own repeat kinds
   where it lines up, and ignored where it does not, rather than inventing
   hundreds of rows the user did not ask for. */

import type { RepeatKind } from './api';

export type IcsKind = 'event' | 'todo';

export interface IcsItem {
  kind: IcsKind;
  summary: string;
  /** `yyyy-MM-dd`, local. */
  date: string;
  /** `HH:mm`, or null for an all-day entry / a to-do with no time. */
  time: string | null;
  durationSeconds: number | null;
  note: string | null;
  repeat: { kind: RepeatKind; interval: number } | null;
  /** Already finished before import — offered but unticked by default. */
  completed: boolean;
}

/* ── Line handling ──────────────────────────────────────────────────── */

/** RFC 5545 folds long lines with CRLF + a single leading space or tab. */
function unfold(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
    .filter((l) => l.trim() !== '');
}

interface Prop {
  name: string;
  params: Record<string, string>;
  value: string;
}

function parseLine(line: string): Prop | null {
  const colon = line.indexOf(':');
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const parts = left.split(';');
  const name = (parts.shift() ?? '').toUpperCase();
  const params: Record<string, string> = {};
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq === -1) continue;
    params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name, params, value };
}

/** TEXT values escape commas, semicolons and newlines. */
function unescapeText(v: string): string {
  return v
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

/* ── Dates ──────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * DATE (`20260824`), floating DATE-TIME (`20260824T090000`) and UTC
 * (`...Z`). A UTC stamp is converted to the reader's own zone, which is what
 * makes an imported 09:00 lecture land at 09:00 on their plan.
 *
 * TZID-qualified times are treated as floating: resolving arbitrary Olson zones
 * needs a tz database this bundle does not carry, and for a timetable the wall
 * clock in the file is the time the user means.
 */
function parseDateValue(prop: Prop): { date: string; time: string | null } | null {
  const v = prop.value.trim();
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  if (dateOnly) return { date: `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`, time: null };

  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(v);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, utc] = m;

  if (utc) {
    const asUtc = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    if (Number.isNaN(asUtc.getTime())) return null;
    return { date: localDate(asUtc), time: localTime(asUtc) };
  }
  if (prop.params.VALUE === 'DATE') return { date: `${y}-${mo}-${d}`, time: null };
  return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}` };
}

/** `PT1H30M` / `P1D` → seconds. */
function parseDuration(v: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim());
  if (!m) return null;
  const [, sign, w, d, h, mi, s] = m;
  const total =
    (+(w ?? 0) * 604800) + (+(d ?? 0) * 86400) + (+(h ?? 0) * 3600) + (+(mi ?? 0) * 60) + +(s ?? 0);
  if (!total) return null;
  return sign === '-' ? 0 : total;
}

function secondsBetween(from: { date: string; time: string | null }, to: { date: string; time: string | null }) {
  const a = new Date(`${from.date}T${from.time ?? '00:00'}:00`);
  const b = new Date(`${to.date}T${to.time ?? '00:00'}:00`);
  const diff = Math.round((b.getTime() - a.getTime()) / 1000);
  return diff > 0 ? diff : null;
}

/** Only the shapes the app itself can express — anything else imports as one-off. */
function parseRepeat(rrule: string): { kind: RepeatKind; interval: number } | null {
  const parts: Record<string, string> = {};
  for (const chunk of rrule.split(';')) {
    const eq = chunk.indexOf('=');
    if (eq > 0) parts[chunk.slice(0, eq).toUpperCase()] = chunk.slice(eq + 1).toUpperCase();
  }
  const interval = Math.max(1, Number(parts.INTERVAL ?? '1') || 1);
  switch (parts.FREQ) {
    case 'DAILY':
      if (parts.BYDAY === 'MO,TU,WE,TH,FR') return { kind: 'weekdays', interval: 1 };
      return interval === 1 ? { kind: 'daily', interval: 1 } : { kind: 'everyNDays', interval };
    case 'WEEKLY':
      if (parts.BYDAY === 'MO,TU,WE,TH,FR') return { kind: 'weekdays', interval: 1 };
      return interval === 1 ? { kind: 'weekly', interval: 1 } : { kind: 'everyNWeeks', interval };
    case 'MONTHLY':
      return interval === 1 ? { kind: 'monthly', interval: 1 } : { kind: 'everyNMonths', interval };
    default:
      return null;
  }
}

/* ── Parse ──────────────────────────────────────────────────────────── */

/**
 * Read every VEVENT and VTODO out of an `.ics` payload.
 *
 * Entries with no usable date are dropped: the plan is a calendar, so a task
 * with nowhere to sit would just vanish into the account.
 */
export function parseIcs(raw: string): IcsItem[] {
  const items: IcsItem[] = [];
  let open: IcsKind | null = null;
  let cur: Record<string, Prop> = {};

  for (const line of unfold(raw)) {
    const prop = parseLine(line);
    if (!prop) continue;

    if (prop.name === 'BEGIN') {
      const v = prop.value.trim().toUpperCase();
      if (v === 'VEVENT') { open = 'event'; cur = {}; }
      else if (v === 'VTODO') { open = 'todo'; cur = {}; }
      continue;
    }

    if (prop.name === 'END') {
      const v = prop.value.trim().toUpperCase();
      if ((v === 'VEVENT' || v === 'VTODO') && open) {
        const item = build(open, cur);
        if (item) items.push(item);
        open = null;
        cur = {};
      }
      continue;
    }

    if (open) cur[prop.name] = prop;
  }

  return items;
}

function build(kind: IcsKind, props: Record<string, Prop>): IcsItem | null {
  const summary = unescapeText(props.SUMMARY?.value ?? '');
  if (!summary) return null;

  // An event is anchored on DTSTART; a to-do prefers DUE, then DTSTART.
  const anchorProp = kind === 'todo' ? (props.DUE ?? props.DTSTART) : (props.DTSTART ?? props.DUE);
  if (!anchorProp) return null;
  const anchor = parseDateValue(anchorProp);
  if (!anchor) return null;

  let durationSeconds: number | null = null;
  if (props.DURATION) durationSeconds = parseDuration(props.DURATION.value);
  else if (props.DTEND) {
    const end = parseDateValue(props.DTEND);
    if (end) durationSeconds = secondsBetween(anchor, end);
  }
  // An all-day block is not a 24-hour study session.
  if (!anchor.time) durationSeconds = null;

  const description = unescapeText(props.DESCRIPTION?.value ?? '');
  const location = unescapeText(props.LOCATION?.value ?? '');
  const note = [description, location && `Location: ${location}`].filter(Boolean).join(' · ') || null;

  const status = (props.STATUS?.value ?? '').toUpperCase();
  const completed = status === 'COMPLETED' || Boolean(props.COMPLETED);

  return {
    kind,
    summary,
    date: anchor.date,
    time: anchor.time,
    durationSeconds,
    note: note ? note.slice(0, 500) : null,
    repeat: props.RRULE ? parseRepeat(props.RRULE.value) : null,
    completed,
  };
}
