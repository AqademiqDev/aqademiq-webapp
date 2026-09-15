import type { CSSProperties, ReactNode } from 'react';

import AdaCube, { type CubeTone } from '../../components/brand/AdaCube';
import CoreColumn, { CoreDayLabels } from '../../components/content/CoreColumn';
import Icon from '../../components/core/Icon';
import {
  blankWeek,
  isGap,
  type ReportDay,
  type ReportMoment,
  type ReportRecovery,
  type WeekShape,
  type WeeklyReport,
} from '../../lib/weeklyReport';
import { ReportCopy, weekdayName } from './reportCopy';
import { BeatSize, useStoryScale } from './storyScale';

/* ─────────────────────────────────────────────────────────────────────────
   The beats of the weekly story, one component per page.

   Ports of the mobile app's `report_beats.dart`. Each beat is one screenful and
   is centred in the story column; every size is the phone's, times the story
   scale (see storyScale.ts), so the composition is the phone's at any height.

   Theme mapping from the mobile tokens:
     text → --text-primary · textMed → --text-secondary · textDim → --text-dim
     hilite → --surface-sunken · surface → --surface-card · accent → --accent
     accentSoft → --accent-soft · ink → --surface-ink · bg → --surface-page
   ───────────────────────────────────────────────────────────────────────── */

/** Mobile corner radii: cards 16, groups 18, pills full. */
const RADIUS_CARD = 16;

/** Common frame: the story column, vertically centred. */
export function BeatFrame({ children, stretch = false }: { children: ReactNode; stretch?: boolean }) {
  const s = useStoryScale();
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: stretch ? 'stretch' : 'center',
        width: '100%',
        maxWidth: BeatSize.column * s,
        margin: '0 auto',
        padding: `${12 * s}px ${BeatSize.gutter * s}px`,
        textAlign: stretch ? 'left' : 'center',
      }}
    >
      {children}
    </div>
  );
}

/** The small caps label above a statement. */
export function BeatLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const s = useStoryScale();
  return (
    <div
      style={{
        font: `800 ${BeatSize.label * s}px var(--font-sans)`,
        letterSpacing: '0.16em',
        color: 'var(--text-secondary)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** The one big sentence a beat exists to deliver. */
function BeatStatement({ children, quoted = false }: { children: string; quoted?: boolean }) {
  const s = useStoryScale();
  return (
    <div
      style={{
        font: `800 ${BeatSize.statement * s}px/1.22 var(--font-sans)`,
        letterSpacing: `${-0.6 * s}px`,
        color: 'var(--text-primary)',
      }}
    >
      {quoted ? `“${children}”` : children}
    </div>
  );
}

function BeatBody({ children }: { children: string }) {
  const s = useStoryScale();
  return (
    <div style={{ font: `400 ${BeatSize.body * s}px/1.5 var(--font-sans)`, color: 'var(--text-secondary)' }}>
      {children}
    </div>
  );
}

const Gap = ({ h }: { h: number }) => {
  const s = useStoryScale();
  return <div style={{ height: h * s, flexShrink: 0 }} />;
};

/* ── Beat 1 — the core freezes in ─────────────────────────────────────── */

/**
 * Not a spinner. The same column the story opens with, so the wait is the
 * drilling — the one place in this feature where making someone wait is the point.
 */
export function BeatDrilling({ days }: { days?: ReportDay[] }) {
  const s = useStoryScale();
  const shown = days && days.length ? days : blankWeek();
  return (
    <BeatFrame>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 12 * s }}>
        <CoreDayLabels days={shown} height={BeatSize.coreHeight * s} fontSize={BeatSize.label * s} />
        <CoreColumn days={shown} width={BeatSize.coreWidth * s} height={BeatSize.coreHeight * s} />
      </div>
      <Gap h={30} />
      <BeatBody>{ReportCopy.drilling}</BeatBody>
    </BeatFrame>
  );
}

/* ── Beat 2 — the shape of the week ───────────────────────────────────── */

export function BeatShape({ shape }: { shape: WeekShape }) {
  return (
    <BeatFrame>
      <BeatLabel>{ReportCopy.shapeLabel}</BeatLabel>
      <Gap h={22} />
      <BeatStatement quoted>{ReportCopy.shape(shape)}</BeatStatement>
    </BeatFrame>
  );
}

/* ── Beat 3 — the core itself. The screenshot. ────────────────────────── */

export function BeatCore({ report, play }: { report: WeeklyReport; play: boolean }) {
  const s = useStoryScale();
  // Name the first open day rather than explaining gaps in the abstract — and say
  // nothing at all when the week has none. `isGap` excludes days that have not
  // happened: Friday is not a gap on a Thursday.
  const firstGap = report.days.find(isGap);
  const caption = firstGap
    ? `${ReportCopy.coreCaption} ${ReportCopy.gapCaption(weekdayName(firstGap.weekday))}`
    : ReportCopy.coreCaption;

  return (
    <BeatFrame>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 12 * s }}>
        <CoreDayLabels
          days={report.days}
          height={BeatSize.coreHeight * s}
          fontSize={BeatSize.label * s}
          emphasise={firstGap?.weekday ?? null}
        />
        <CoreColumn
          days={report.days}
          width={BeatSize.coreWidth * s}
          height={BeatSize.coreHeight * s}
          play={play}
        />
      </div>
      <Gap h={26} />
      <BeatBody>{caption}</BeatBody>
    </BeatFrame>
  );
}

/* ── Beat 4 — one thing that happened ─────────────────────────────────── */

export function BeatMoment({
  moment,
  subjectName,
  subjectColor,
}: {
  moment: ReportMoment;
  subjectName: string | null;
  subjectColor: string | null;
}) {
  const s = useStoryScale();
  return (
    <BeatFrame>
      <BeatLabel>{ReportCopy.momentTitle}</BeatLabel>
      <Gap h={20} />
      <BeatStatement>{ReportCopy.moment(moment)}</BeatStatement>
      <Gap h={26} />
      {/* The receipt: the task as it actually sits in the planner. A named thing is
          what makes the beat non-aggregate. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13 * s,
          alignSelf: 'stretch',
          padding: `${14 * s}px ${18 * s}px ${14 * s}px ${16 * s}px`,
          background: 'var(--surface-sunken)',
          borderRadius: RADIUS_CARD * s,
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 9 * s,
            height: 9 * s,
            borderRadius: '50%',
            background: subjectColor ?? 'var(--accent)',
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              font: `800 ${14.5 * s}px/1.3 var(--font-sans)`,
              color: 'var(--text-primary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {moment.title}
          </div>
          <div style={{ height: 3 * s }} />
          <div style={{ font: `400 ${11.5 * s}px var(--font-sans)`, color: 'var(--text-secondary)' }}>
            {ReportCopy.momentWhere(moment, subjectName)}
          </div>
        </div>
      </div>
    </BeatFrame>
  );
}

/* ── Beat 5 — the one numeral ─────────────────────────────────────────── */

/**
 * Playfair, large, alone. Always a count of things that happened — never a rate,
 * percentage, score or change, and with nothing to divide it by.
 */
export function BeatNumeral({ value }: { value: number }) {
  const s = useStoryScale();
  return (
    <BeatFrame>
      <div
        style={{
          font: `500 ${BeatSize.numeral * s}px var(--font-numeral)`,
          lineHeight: 'normal',
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </div>
      <Gap h={14} />
      <div
        style={{
          font: `800 ${11 * s}px var(--font-sans)`,
          letterSpacing: '0.2em',
          color: 'var(--text-secondary)',
        }}
      >
        {ReportCopy.heroLabel}
      </div>
    </BeatFrame>
  );
}

/* ── Beat 6 — where attention went ────────────────────────────────────── */

function mix(hex: string, target: [number, number, number], t: number): string {
  const h = hex.replace('#', '');
  const channel = (i: number) => parseInt(h.slice(i, i + 2), 16);
  const [r, g, b] = [channel(0), channel(2), channel(4)].map((c, i) => Math.round(c + (target[i] - c) * t));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** The accent as a concrete hex, for tones computed in JS. */
function resolvedAccent(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v : '#6b5cf0';
}

/** A subject's cube: its colour as the border, lifted towards white for the body. */
function toneFor(hex: string | null): CubeTone {
  const c = hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : resolvedAccent();
  return { border: c, body: mix(c, [255, 255, 255], 0.72), ink: mix(c, [0, 0, 0], 0.35) };
}

/**
 * One cube per subject, melted by share: the crisper the cube, the more of the
 * week it held.
 */
export function BeatAttention({ report }: { report: WeeklyReport }) {
  const s = useStoryScale();
  // At most four cubes: more do not fit a phone's width with their labels, and
  // the tail of a distribution is not what this beat is for.
  const shown = report.subjects.slice(0, 4);
  const top = shown.length ? shown[0].share : 0;

  return (
    <BeatFrame>
      <BeatLabel>{ReportCopy.attentionTitle}</BeatLabel>
      <Gap h={30} />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 18 * s,
          rowGap: 16 * s,
        }}
      >
        {shown.map((sub) => (
          <div key={sub.id} style={{ width: 74 * s, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AdaCube
              size={BeatSize.cube * s}
              tone={toneFor(sub.colorHex)}
              expr="neutral"
              // Relative, not absolute: the busiest subject of the week is always
              // crisp, so a quiet week is not drawn as a row of puddles.
              melt={top <= 0 ? 0 : Math.min(0.55, Math.max(0, (1 - sub.share / top) * 0.55))}
              bubbles={2}
            />
            <div style={{ height: 8 * s }} />
            <div
              style={{
                font: `800 ${11 * s}px var(--font-sans)`,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                // A subject deleted after the work happened keeps its cube and
                // loses its name; the line keeps its height so cubes stay aligned.
                minHeight: `${11 * s * 1.25}px`,
              }}
            >
              {sub.name ?? ''}
            </div>
          </div>
        ))}
      </div>
      <Gap h={30} />
      <BeatBody>{ReportCopy.attentionCaption(shown[0]?.name ?? null)}</BeatBody>
    </BeatFrame>
  );
}

/* ── Beat 7 — what the week gave back ─────────────────────────────────── */

/**
 * The only beat that can read a hard week as recovery rather than shortfall.
 * It renders only when the lift points positive, which the server enforces by
 * returning nothing at all otherwise.
 */
export function BeatRecovery({ recovery }: { recovery: ReportRecovery }) {
  const s = useStoryScale();
  // Averages arrive on the stored 1–5 scale; faces are 0–4. Ada is never sad *at*
  // the student, so "going in" is drawn tired rather than miserable.
  const beforeIdx = Math.min(4, Math.max(0, Math.round(recovery.beforeAvg) - 1));
  const afterIdx = Math.min(4, Math.max(0, Math.round(recovery.afterAvg) - 1));

  return (
    <BeatFrame>
      <BeatLabel>{ReportCopy.recoveryTitle}</BeatLabel>
      <Gap h={20} />
      <BeatStatement>{ReportCopy.recovery(recovery)}</BeatStatement>
      <Gap h={30} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20 * s,
          padding: `${20 * s}px ${22 * s}px`,
          background: 'var(--surface-sunken)',
          borderRadius: RADIUS_CARD * s,
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        <Face label={ReportCopy.goingIn} rating={beforeIdx} expr="meh" melt={0.45} />
        <Icon name="arrow_forward" size={18 * s} color="var(--text-secondary)" />
        <Face label={ReportCopy.comingOut} rating={afterIdx} expr="smile" melt={0} />
      </div>
    </BeatFrame>
  );
}

function Face({ label, rating, expr, melt }: { label: string; rating: number; expr: 'meh' | 'smile'; melt: number }) {
  const s = useStoryScale();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AdaCube size={50 * s} rating={rating} expr={expr} melt={melt} bubbles={2} />
      <div style={{ height: 10 * s }} />
      <div
        style={{
          font: `800 ${9.5 * s}px var(--font-sans)`,
          letterSpacing: '0.14em',
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ── The quieter facts ────────────────────────────────────────────────── */

/**
 * Not one of the eight beats — one page for the things the design lists as
 * cards, so the work that measured them is not invisible, without giving any of
 * them a beat of its own. Rows arrive already filtered to ones with something
 * true to say: a row with nothing to say is absent, never zeroed.
 */
export function BeatTexture({ rows }: { rows: [string, string][] }) {
  const s = useStoryScale();
  return (
    <BeatFrame stretch>
      {rows.map(([label, line]) => (
        <div
          key={label}
          style={{
            marginBottom: 10 * s,
            padding: `${14 * s}px ${16 * s}px ${15 * s}px`,
            background: 'var(--surface-sunken)',
            borderRadius: RADIUS_CARD * s,
          }}
        >
          <BeatLabel>{label}</BeatLabel>
          <div style={{ height: 7 * s }} />
          <div style={{ font: `400 ${13.5 * s}px/1.35 var(--font-sans)`, color: 'var(--text-primary)' }}>{line}</div>
        </div>
      ))}
    </BeatFrame>
  );
}

/* ── Beat 8 — one small thing. The landing. ───────────────────────────── */

/**
 * Sized so that refusing it would feel absurd, and refusable in one click.
 * "Not this time" sits at the same weight as sharing: a landing with a single
 * forward action is a landing that asks for something.
 */
export function BeatLanding({
  isEmptyWeek,
  onKeep,
  onShare,
  onDismiss,
}: {
  isEmptyWeek: boolean;
  onKeep: () => void;
  onShare: () => void;
  onDismiss: () => void;
}) {
  const s = useStoryScale();
  return (
    <BeatFrame stretch>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 * s }}>
        <AdaCube size={34 * s} expr="smile" sparkles />
        <div style={{ flex: 1, font: `400 ${15 * s}px/1.45 var(--font-sans)`, color: 'var(--text-primary)' }}>
          {isEmptyWeek ? ReportCopy.closingEmpty : ReportCopy.closing}
        </div>
      </div>

      <Gap h={24} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13 * s,
          padding: `${13 * s}px ${16 * s}px ${13 * s}px ${14 * s}px`,
          background: 'var(--accent-soft)',
          borderRadius: RADIUS_CARD * s,
          border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
        }}
      >
        <span
          style={{
            width: 34 * s,
            height: 34 * s,
            borderRadius: 10 * s,
            background: 'var(--surface-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="nightlight_round" size={17 * s} color="var(--accent)" />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: `800 ${14.5 * s}px var(--font-sans)`, color: 'var(--text-primary)' }}>
            {ReportCopy.suggestionTitle}
          </div>
          <div style={{ height: 2 * s }} />
          <div style={{ font: `400 ${11.5 * s}px var(--font-sans)`, color: 'var(--text-secondary)' }}>
            {ReportCopy.suggestionSub}
          </div>
        </div>
      </div>

      <Gap h={20} />

      <button
        type="button"
        onClick={onKeep}
        className="aq-press aq-darken focus-ring"
        style={{
          height: 52 * s,
          borderRadius: 100,
          background: 'var(--surface-ink)',
          color: 'var(--surface-page)',
          font: `800 ${15 * s}px var(--font-sans)`,
        }}
      >
        {ReportCopy.keepIt}
      </button>

      <Gap h={14} />

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 22 * s }}>
        <button
          type="button"
          onClick={onShare}
          className="aq-press focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7 * s,
            padding: `${8 * s}px ${6 * s}px`,
            borderRadius: 8,
            font: `700 ${13.5 * s}px var(--font-sans)`,
            color: 'var(--text-primary)',
          }}
        >
          <Icon name="ios_share" size={15 * s} />
          {ReportCopy.shareLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="aq-press focus-ring"
          style={{
            padding: `${8 * s}px ${6 * s}px`,
            borderRadius: 8,
            font: `700 ${13.5 * s}px var(--font-sans)`,
            color: 'var(--text-secondary)',
          }}
        >
          {ReportCopy.notThisTime}
        </button>
      </div>
    </BeatFrame>
  );
}

/* ── A bad season, not a bad week ─────────────────────────────────────── */

/**
 * One quiet, dismissible line **outside** the story, in plain product voice
 * rather than the mascot's. It does not escalate, offers no productivity advice,
 * and Ada never comments on it — a cartoon ice cube diagnosing a run of hard
 * weeks is out of its depth.
 */
export function SupportBanner({ onView, onDismiss }: { onView: () => void; onDismiss: () => void }) {
  const s = useStoryScale();
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: `calc(100% - ${40 * s}px)`,
        maxWidth: (BeatSize.column - 40) * s,
        margin: `0 auto ${14 * s}px`,
        padding: `${13 * s}px ${8 * s}px ${13 * s}px ${16 * s}px`,
        background: 'var(--surface-sunken)',
        borderRadius: RADIUS_CARD * s,
      }}
    >
      <div style={{ flex: 1, font: `400 ${12.5 * s}px/1.4 var(--font-sans)`, color: 'var(--text-primary)' }}>
        {ReportCopy.supportBanner}{' '}
        <button
          type="button"
          onClick={onView}
          className="focus-ring"
          style={{ font: 'inherit', fontWeight: 800, color: 'var(--text-primary)', borderRadius: 4 }}
        >
          {ReportCopy.supportAction}
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={ReportCopy.close}
        className="aq-press focus-ring"
        style={{ display: 'flex', padding: 6, borderRadius: '50%' }}
      >
        <Icon name="close" size={16} color="var(--text-secondary)" />
      </button>
    </div>
  );
}
