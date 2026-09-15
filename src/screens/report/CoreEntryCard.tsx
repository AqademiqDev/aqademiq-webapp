import { Link } from 'react-router-dom';

import CoreColumn from '../../components/content/CoreColumn';
import { useWeeklyReport } from '../../hooks/data';
import { blankWeek } from '../../lib/weeklyReport';
import { ReportCopy } from './reportCopy';

/* ─────────────────────────────────────────────────────────────────────────
   The way into The Core, on Profile. Port of `_CoreEntry` in the mobile Stats tab.

   It waits here, the same way every week. Nothing about it announces a good week
   or a quiet one: a report that pushes on good weeks and stays silent on bad ones
   turns its own absence into a verdict.

   The thumbnail is the real core drawn small, from the real week — not a glyph.
   The student should recognise the object before they open it. Until the week
   loads it shows seven open bands, so the card does not change shape when the
   data lands.
   ───────────────────────────────────────────────────────────────────────── */

export default function CoreEntryCard() {
  const week = useWeeklyReport();
  const days = week.data?.days ?? blankWeek();

  return (
    <Link
      to="/report/week"
      className="aq-lift focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: 18,
        background: 'var(--surface-card)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-card)',
        color: 'inherit',
      }}
    >
      <CoreColumn days={days} width={46} height={108} animate={false} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            font: '800 9.5px var(--font-sans)',
            letterSpacing: '0.16em',
            color: 'var(--text-secondary)',
          }}
        >
          {ReportCopy.entryEyebrow}
        </div>
        <div
          style={{
            font: '800 22px var(--font-sans)',
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
            marginTop: 7,
          }}
        >
          {ReportCopy.coreName}
        </div>
        <div
          style={{
            font: '400 12.5px/1.35 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginTop: 5,
          }}
        >
          {ReportCopy.entryTagline}
        </div>
      </div>

      {/* The frost dot. Identical every week — it marks where the report is,
          never whether the week was any good. */}
      <span
        aria-hidden="true"
        style={{
          alignSelf: 'flex-start',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 10px 2px color-mix(in srgb, var(--accent) 45%, transparent)',
          flexShrink: 0,
        }}
      />
    </Link>
  );
}
