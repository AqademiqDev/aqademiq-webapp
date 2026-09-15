import { useEffect, useRef, useState } from 'react';

import CoreColumn from '../../components/content/CoreColumn';
import Icon from '../../components/core/Icon';
import { shapeOnly, type WeeklyReport } from '../../lib/weeklyReport';
import { ReportCopy } from './reportCopy';
import { BeatSize, useStoryScale } from './storyScale';

/* ─────────────────────────────────────────────────────────────────────────
   "Share the shape" — the activity shape of the week, and nothing else.

   Port of the mobile app's `share_shape_sheet.dart`.

   Mood never leaves in a picture. Mood is health data, and nothing exported here
   may encode a mood value, tint, word, or anything derived from one. So the card
   is built from `shapeOnly(report)` — the week with every mood stripped — and not
   from the report with the tint merely left unpainted: a card that only chose not
   to paint it would be one styling change away from leaking it.

   The shared text is held to the same rule: a count of days, nothing about how
   the week felt. The browser's share sheet is used where there is one; elsewhere
   the text is copied to the clipboard.
   ───────────────────────────────────────────────────────────────────────── */

export default function ShareShape({ report, onBack }: { report: WeeklyReport; onBack: () => void }) {
  const s = useStoryScale();
  const stripped = shapeOnly(report);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function share() {
    const text = ReportCopy.shareText(report.activeDays);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        // Dismissing the sheet is a choice, not a failure — do not fall through to
        // the clipboard behind the student's back.
        if ((e as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard refused — nothing useful to tell them beyond the button doing nothing */
    }
  }

  return (
    <div
      className="aq-screen aq-scroll"
      style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{ width: '100%', maxWidth: BeatSize.column * s, padding: `${4 * s}px ${20 * s}px ${28 * s}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 * s, padding: `0 0 ${8 * s}px` }}>
          <button
            type="button"
            onClick={onBack}
            aria-label={ReportCopy.back}
            className="aq-press focus-ring"
            style={{
              width: 44,
              height: 44,
              marginLeft: -12,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="arrow_back_ios_new" size={18} color="var(--text-primary)" />
          </button>
          <div
            style={{
              font: `800 ${21 * s}px var(--font-sans)`,
              letterSpacing: `${-0.4 * s}px`,
              color: 'var(--text-primary)',
            }}
          >
            {ReportCopy.shareLabel}
          </div>
        </div>

        {/* The card as it will be sent. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 26 * s,
            padding: `${26 * s}px ${24 * s}px`,
            background: 'var(--surface-sunken)',
            borderRadius: 18 * s,
          }}
        >
          <CoreColumn days={stripped.days} width={96 * s} height={250 * s} animate={false} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div
              style={{
                font: `500 ${62 * s}px var(--font-numeral)`,
                lineHeight: 'normal',
                color: 'var(--text-primary)',
              }}
            >
              {report.activeDays}
            </div>
            <div style={{ height: 6 * s }} />
            <div
              style={{
                font: `800 ${9 * s}px/1.4 var(--font-sans)`,
                letterSpacing: '0.14em',
                color: 'var(--text-secondary)',
              }}
            >
              {ReportCopy.heroLabel}
            </div>
            <div style={{ height: 12 * s }} />
            <div style={{ font: `800 ${13 * s}px var(--font-sans)`, color: 'var(--accent)' }}>
              {ReportCopy.shareBrand}
            </div>
          </div>
        </div>

        <div style={{ height: 20 * s }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 * s }}>
          <Icon name="lock" size={16 * s} color="var(--text-secondary)" />
          <div style={{ font: `400 ${12.5 * s}px/1.45 var(--font-sans)`, color: 'var(--text-secondary)' }}>
            {ReportCopy.sharePrivacy}
          </div>
        </div>

        <div style={{ height: 24 * s }} />

        <button
          type="button"
          onClick={() => void share()}
          className="aq-press aq-darken focus-ring"
          style={{
            width: '100%',
            height: 52 * s,
            borderRadius: 100,
            background: 'var(--surface-ink)',
            color: 'var(--surface-page)',
            font: `800 ${15 * s}px var(--font-sans)`,
          }}
        >
          {ReportCopy.shareAction}
        </button>

        <div
          role="status"
          aria-live="polite"
          style={{
            minHeight: 18 * s,
            marginTop: 10 * s,
            textAlign: 'center',
            font: `700 ${12 * s}px var(--font-sans)`,
            color: 'var(--text-secondary)',
          }}
        >
          {copied ? ReportCopy.shareCopied : ''}
        </div>
      </div>
    </div>
  );
}
