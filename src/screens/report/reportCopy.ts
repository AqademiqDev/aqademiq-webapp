import type { ReportDay, ReportLongest, ReportMoment, ReportRecovery, WeekShape } from '../../lib/weeklyReport';

/* ─────────────────────────────────────────────────────────────────────────
   Every sentence the weekly report can say, in one file.

   A port of the mobile app's `features/report/report_copy.dart`, word for word —
   the two clients must say the same things about the same week.

   The report's safety contract is a vocabulary rule, and a vocabulary rule is
   only worth what it can be checked against. Copy scattered across a dozen
   components cannot be checked; copy in one file with a banned list beside it
   can, and `scripts/check-report-copy.ts` does exactly that.

   Two rules shape all of it:

   * Describe the week, never the person. "The weight sat early" is a finding
     about a distribution. "You started strong" is a claim about someone, and the
     same sentence read after a hard week becomes a comparison to a version of
     themselves they did not manage to be.
   * The register does not change with the week. A full week and an empty one
     are narrated in the same voice. Warming the tone for a bad week is how a
     report tells someone it noticed.

   Only `import type` above, on purpose: the copy check loads this file straight
   into Node, which strips types but resolves no imports.
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Metric shapes and words that must never render, kept next to the copy they
 * constrain.
 *
 * `only` is here because it turns a count into a shortfall ("only three days").
 * That costs the natural phrasing in a couple of places — the share note reads
 * "Just your shape" rather than "your shape only" — and the trade is worth it,
 * because the check is worthless the first time it gets an exception.
 */
export const REPORT_BANNED_WORDS = [
  'streak',
  'goal',
  'target',
  'consistency',
  'productive',
  'wasted',
  'reserve',
  'low',
  'behind',
  'missed',
  'unbroken',
  'average',
  'percent',
  'score',
  'rank',
  'should',
  'failed',
  'only',
] as const;

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** 1 = Monday … 7 = Sunday. Out of range returns '' rather than throwing mid-screen. */
export const weekdayName = (weekday: number): string =>
  weekday >= 1 && weekday <= 7 ? WEEKDAY_NAMES[weekday - 1] : '';

/** `48m`, `1h 12m`. Never a decimal — a fractional hour reads as a measurement of the person. */
function minutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const ReportCopy = {
  // ---- the way in, from Profile ----------------------------------------
  entryEyebrow: 'YOUR WEEK',
  coreName: 'The Core',
  entryTagline: 'Seven days, drilled and read.',

  // ---- beat 1 — the core freezes in ------------------------------------
  drilling: 'Drilling your week…',

  // ---- beat 2 — the shape of the week ----------------------------------
  shapeLabel: 'THE SHAPE OF THE WEEK',

  /** One sentence about the shape, before a single number appears anywhere. */
  shape(shape: WeekShape): string {
    switch (shape) {
      case 'empty':
        return 'An open core, all the way down.';
      case 'single':
        return 'One band, and a lot of open core.';
      case 'steady':
        return 'Layers right through the week.';
      case 'frontLoaded':
        return 'A thick start, then open core.';
      case 'backLoaded':
        return 'Open core, then it gathered.';
      case 'clustered':
        return 'A quiet start, then days that held.';
      case 'scattered':
        return 'Thin bands, spread out.';
    }
  },

  // ---- beat 3 — the core itself ----------------------------------------
  coreCaption: 'Each band is a day, Monday at the top. Tint is that day’s mood.',

  /** Said only when at least one band is empty, and names the day to make the rule concrete. */
  gapCaption: (dayName: string): string => `${dayName} has nothing logged, so it stays an open band.`,

  gapCaptionPlain: 'A day with nothing logged stays an open band.',

  // ---- beat 4 — one thing that happened --------------------------------
  momentTitle: 'ONE THING THAT HAPPENED',

  /** A named task on a named day, never an aggregate. */
  moment: (m: ReportMoment): string => `${weekdayName(m.weekday)}, you finished “${m.title}”.`,

  momentWhere(m: ReportMoment, subjectName: string | null): string {
    const day = weekdayName(m.weekday);
    return subjectName ? `${subjectName} · ${day}` : day;
  },

  /** A week with nothing completed still gets a concrete line. */
  smallestTrueThing: (day: ReportDay): string =>
    `${weekdayName(day.weekday)}, you opened the app and put something down. That’s on the board.`,

  // ---- beat 5 — the one numeral ----------------------------------------
  heroLabel: 'DAYS ON THE BOARD',

  // ---- beat 6 — where attention went -----------------------------------
  attentionTitle: 'WHERE ATTENTION WENT',

  /** Names the subject that took the most. Never ranks the rest, never names one that got nothing. */
  attentionCaption: (topName: string | null): string =>
    topName
      ? `${topName} took the most of your week. The crisper the cube, the more of your attention it held.`
      : 'The crisper the cube, the more of your attention it held.',

  // ---- beat 7 — what the week gave back --------------------------------
  recoveryTitle: 'WHAT THE WEEK GAVE BACK',

  /** Renders only when it points positive — the server sends nothing otherwise. */
  recovery: (r: ReportRecovery): string =>
    r.sessions === 1
      ? 'You finished your session feeling better than you started it.'
      : 'You finished most sessions feeling better than you started them.',

  goingIn: 'GOING IN',
  comingOut: 'COMING OUT',

  // ---- the quieter cards -----------------------------------------------
  longestTitle: 'YOUR LONGEST STRETCH',
  heldTitle: 'HELD TIME COUNTS',
  rhythmTitle: 'YOUR RHYTHM',
  prismTitle: 'WHAT THE WEEK SOUNDED LIKE',

  /** Length and the task — never "unbroken": that makes freezing a flaw, and freezing is the product. */
  longest(l: ReportLongest): string {
    const when = weekdayName(l.weekday);
    if (!l.taskTitle) return `${when} · ${minutes(l.minutes)}`;
    return `${when} · ${minutes(l.minutes)} on “${l.taskTitle}”`;
  },

  /** Frozen minutes reported as a kept quantity. */
  held: (mins: number): string => `${minutes(mins)} held frozen, and kept.`,

  /** Names the weekdays that reliably carry work — never the thin ones, never a count of weeks. */
  rhythm(weekdays: number[]): string {
    const plural = weekdays
      .map(weekdayName)
      .filter((n) => n.length > 0)
      .map((n) => `${n}s`);
    if (plural.length === 0) return '';
    if (plural.length === 1) return `${plural[0]} carry your work.`;
    const last = plural.pop();
    return `${plural.join(', ')} and ${last} carry your work.`;
  },

  // ---- beat 8 — the landing --------------------------------------------
  closing: 'One small thing for next week — or just tomorrow’s check-in, if that’s the size that fits.',

  /** The empty-week landing. Same register, nothing asked for. */
  closingEmpty: 'Next week starts whenever you do. Tomorrow’s check-in is enough to begin one.',

  suggestionTitle: 'Tomorrow’s check-in',
  suggestionSub: 'Two taps, in the morning.',
  keepIt: 'Keep it',
  notThisTime: 'Not this time',

  // ---- sharing ---------------------------------------------------------
  shareLabel: 'Share the shape',
  sharePrivacy: 'Just your shape. Nothing about how you felt is in this image.',
  shareAction: 'Share',
  shareBrand: 'Aqademiq',
  /** Held to the same rule as the image: a count of days, nothing about how the week felt. */
  shareText: (activeDays: number): string => `${activeDays} days on the board. — Aqademiq`,
  shareCopied: 'Copied to your clipboard.',

  // ---- the off switch, and what the report never does ------------------
  settingsTitle: 'Weekly report',
  settingsToggle: 'Show me The Core',
  settingsToggleNote: 'One tap turns it off, immediately. We won’t ask again.',
  neverDoesTitle: 'What it never does',

  neverNotify: 'Notify you',
  neverNotifySub: 'It waits in the tab, the same way every week.',
  neverBackBrowse: 'Open on a past week',
  neverBackBrowseSub: 'The current week, never an older one.',
  neverShowWriting: 'Show what you wrote',
  neverShowWritingSub: 'Never shown, never exported.',

  // ---- a bad season, not a bad week ------------------------------------
  supportBanner: 'Support resources are available any time, if you’d like them.',
  supportAction: 'View',

  // ---- shared helpers --------------------------------------------------
  loadFailed: 'Your week is here, the report just could not reach it.',
  retry: 'Try again',

  // ---- navigation affordances (web) ------------------------------------
  // The phone swipes between beats; a mouse needs something to click. These
  // are control labels, held to the same vocabulary rule as everything else.
  close: 'Close',
  previousBeat: 'Previous',
  nextBeat: 'Next',
  back: 'Back',

  minutes,
};
