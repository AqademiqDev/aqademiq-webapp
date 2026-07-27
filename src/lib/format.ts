/* Date, time and label helpers shared by every screen.

   Calendar dates on the wire are plain `yyyy-MM-dd` strings interpreted at UTC
   midnight, and `scheduled_at` is a *naive* local wall-clock ISO string that is
   echoed back verbatim. So: never round-trip either through `new Date()` in the
   browser's timezone — parse and format them as text. */

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** `yyyy-MM-dd` for a local calendar date (never shifted by the timezone). */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export const todayIso = (): string => toIsoDate(new Date());

/** Parse `yyyy-MM-dd` into a *local* Date at midnight — safe for arithmetic. */
export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = fromIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function addMonths(iso: string, months: number): string {
  const d = fromIsoDate(iso);
  d.setMonth(d.getMonth() + months);
  return toIsoDate(d);
}

/** Monday-start week containing `iso` — matches `/mood-entries/week`. */
export function weekStart(iso: string = todayIso()): string {
  const d = fromIsoDate(iso);
  const shift = (d.getDay() + 6) % 7; // Sunday(0) → 6
  d.setDate(d.getDate() - shift);
  return toIsoDate(d);
}

export function monthStart(iso: string = todayIso()): string {
  const d = fromIsoDate(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}

export function monthEnd(iso: string = todayIso()): string {
  const d = fromIsoDate(iso);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return toIsoDate(last);
}

export const daysInMonth = (iso: string): number => fromIsoDate(monthEnd(iso)).getDate();

/** 0 = Monday … 6 = Sunday, for laying out a Monday-start grid. */
export const mondayIndex = (iso: string): number => (fromIsoDate(iso).getDay() + 6) % 7;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const monthLabel = (iso: string): string => {
  const d = fromIsoDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** "Wednesday, June 20" — the dashboard greeting line. */
export const longDateLabel = (iso: string): string => {
  const d = fromIsoDate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

/** "TUESDAY 21", or "TODAY · TUESDAY 21" for today — the week agenda headings. */
export const agendaLabel = (iso: string): string => {
  const d = fromIsoDate(iso);
  const base = `${WEEKDAYS[d.getDay()].toUpperCase()} ${d.getDate()}`;
  return iso === todayIso() ? `TODAY · ${base}` : base;
};

export const shortWeekday = (iso: string): string => WEEKDAYS[fromIsoDate(iso).getDay()].slice(0, 3).toUpperCase();

/** "June 18 – 24" — the week header subtitle. */
export function weekRangeLabel(startIso: string): string {
  const s = fromIsoDate(startIso);
  const e = fromIsoDate(addDays(startIso, 6));
  return s.getMonth() === e.getMonth()
    ? `${MONTHS[s.getMonth()]} ${s.getDate()} – ${e.getDate()}`
    : `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}`;
}

/**
 * "11:30 AM" from a naive `2026-07-27T11:30:00`. Reads the characters rather
 * than constructing a Date, so the displayed time never drifts with the
 * viewer's timezone.
 */
export function formatClock(scheduledAt: string | null | undefined): string | undefined {
  if (!scheduledAt) return undefined;
  const m = /T(\d{2}):(\d{2})/.exec(scheduledAt);
  if (!m) return undefined;
  return formatHhMm(`${m[1]}:${m[2]}`);
}

/** "14:00" → "2:00 PM". */
export function formatHhMm(hhmm: string): string {
  const [hRaw, minRaw] = hhmm.split(':');
  const h = Number(hRaw);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${minRaw ?? '00'} ${suffix}`;
}

/** "11:30" from a naive scheduled_at — the value a `<input type="time">` wants. */
export function toHhMm(scheduledAt: string | null | undefined): string {
  const m = scheduledAt ? /T(\d{2}):(\d{2})/.exec(scheduledAt) : null;
  return m ? `${m[1]}:${m[2]}` : '';
}

/** Build the naive wall-clock ISO the API stores verbatim. */
export const toScheduledAt = (dateIso: string, hhmm: string): string => `${dateIso}T${hhmm}:00`;

/** 1800 → "30 min"; 5400 → "1h 30m". */
export function durationLabel(seconds: number | null | undefined): string {
  const s = Math.max(0, Math.round(seconds ?? 0));
  const mins = Math.round(s / 60);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

/** 1_234_567 → "1.2 MB" — the subject file row meta. */
export function sizeLabel(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "3 days ago" / "2 weeks ago" — relative labels for files and comments. */
export function relativeLabel(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return '';
  const then = new Date(isoTimestamp).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

/** The greeting swaps at noon and 17:00 (the evening-reflection cutover). */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const isEvening = (now: Date = new Date()): boolean => now.getHours() >= 17;
