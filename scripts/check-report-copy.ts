/* The weekly report's vocabulary rule, enforced.

   Port of the mobile app's `test/report_copy_test.dart`. The report's safety
   contract is that it never grades a week: no targets, no shortfalls, no
   denominators. A rule like that is only worth what it is checked against, so
   this runs every sentence the report can produce and fails on:

   * any word from REPORT_BANNED_WORDS, as a whole word, in any case;
   * any digit-slash-digit (`3/7`) — denominators are how targets get in — in
     the produced copy *and* anywhere in the report's source outside comments.

   Run with:  npm run check:report-copy
   (Node strips the types from reportCopy.ts directly; it has only type imports.) */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { REPORT_BANNED_WORDS, ReportCopy, weekdayName } from '../src/screens/report/reportCopy.ts';

const failures: string[] = [];

/* ── every sentence the copy can produce ──────────────────────────────── */

const produced: string[] = [];
const add = (s: string) => produced.push(s);

for (const v of Object.values(ReportCopy)) if (typeof v === 'string') add(v);

const shapes = ['empty', 'single', 'steady', 'frontLoaded', 'backLoaded', 'clustered', 'scattered'] as const;
for (const s of shapes) add(ReportCopy.shape(s));

for (let wd = 0; wd <= 8; wd++) {
  add(weekdayName(wd));
  add(ReportCopy.gapCaption(weekdayName(wd)));
  const day = {
    date: '2026-09-14',
    weekday: wd,
    moodIndex: null,
    hasActivity: true,
    isFuture: false,
    tasksCompleted: 1,
    focusMinutes: 25,
    focusSessions: 1,
  };
  add(ReportCopy.smallestTrueThing(day));
  const moment = { date: '2026-09-14', weekday: wd, title: 'Problem set', subjectId: null };
  add(ReportCopy.moment(moment));
  add(ReportCopy.momentWhere(moment, null));
  add(ReportCopy.momentWhere(moment, 'Linear Algebra'));
  for (const mins of [0, 1, 45, 59, 60, 61, 90, 120, 185]) {
    add(ReportCopy.longest({ minutes: mins, date: '2026-09-14', weekday: wd, taskTitle: null }));
    add(ReportCopy.longest({ minutes: mins, date: '2026-09-14', weekday: wd, taskTitle: 'Reading' }));
  }
}

for (const sessions of [0, 1, 2, 4]) {
  add(ReportCopy.recovery({ sessions, beforeAvg: 2, afterAvg: 3.5, lift: 1.5 }));
}
for (const mins of [0, 1, 18, 60, 75]) {
  add(ReportCopy.held(mins));
  add(ReportCopy.minutes(mins));
}
for (const days of [[], [1], [2, 3], [2, 3, 5], [1, 2, 3, 4, 5, 6, 7], [0, 9]]) {
  add(ReportCopy.rhythm(days));
}
add(ReportCopy.attentionCaption(null));
add(ReportCopy.attentionCaption(''));
add(ReportCopy.attentionCaption('Machine Learning'));
for (let n = 0; n <= 7; n++) add(ReportCopy.shareText(n));

const words = REPORT_BANNED_WORDS.map((w) => ({ w, re: new RegExp(`\\b${w}\\b`, 'i') }));
const denominator = /\d\s*\/\s*\d/;

for (const s of produced) {
  for (const { w, re } of words) {
    if (re.test(s)) failures.push(`banned word "${w}" in: ${JSON.stringify(s)}`);
  }
  if (denominator.test(s)) failures.push(`denominator in: ${JSON.stringify(s)}`);
}

/* ── the report's source, outside comments ───────────────────────────── */

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? filesUnder(p) : /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const sources = [
  ...filesUnder('src/screens/report'),
  'src/components/content/CoreColumn.tsx',
  'src/screens/settings/panels/WeeklyReport.tsx',
];
for (const file of sources) {
  const code = stripComments(readFileSync(file, 'utf8'));
  code.split('\n').forEach((line, i) => {
    if (denominator.test(line)) failures.push(`denominator in ${file}:${i + 1}: ${line.trim()}`);
  });
}

if (failures.length) {
  console.error(`✗ weekly report copy: ${failures.length} problem(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`✓ weekly report copy: ${produced.length} sentences and ${sources.length} source files clean`);
