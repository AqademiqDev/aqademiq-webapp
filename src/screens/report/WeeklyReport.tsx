import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Icon from '../../components/core/Icon';
import { useWeeklyReport } from '../../hooks/data';
import { isEmptyWeek, type WeeklyReport as Report } from '../../lib/weeklyReport';
import {
  BeatAttention,
  BeatCore,
  BeatDrilling,
  BeatLanding,
  BeatMoment,
  BeatNumeral,
  BeatRecovery,
  BeatShape,
  BeatTexture,
  SupportBanner,
} from './beats';
import { ReportCopy } from './reportCopy';
import ShareShape from './ShareShape';
import { BeatSize, StoryScaleContext, scaleFor } from './storyScale';

/* ─────────────────────────────────────────────────────────────────────────
   The weekly report — eight beats, story first and evidence second.

   Port of the mobile app's `weekly_report_screen.dart`.

   A pager rather than a scroll, and that is the design rather than a preference.
   A dashboard puts everything on screen at once and asks the reader to work out
   what it means; a sequence decides what they read first. This one opens on one
   sentence about the *shape* of the week and shows a single count only after it,
   which is the difference between a report that describes a week and one that
   grades it.

   Everything after beat 3 is conditional: a beat with nothing true to say is
   absent, and the page dots shrink with it. Nothing is greyed out and nothing
   renders as a zero.

   What deliberately does not exist here:
   * No date picker and no back-browsing — the data hook cannot name another week.
   * No percentage, rate, change or `x of y`. Every number is a count of things
     that happened.
   * No account prompt. A guest's week is a real week.

   On the web the pager also answers to the arrow keys, Escape, and a pair of
   chevrons, because a mouse cannot swipe.
   ───────────────────────────────────────────────────────────────────────── */

/** The drill holds at least this long, so the core is seen forming rather than flashing. */
const MIN_DRILL_MS = 1450;

/** Height of the close-and-dots row above the beats. */
const CHROME_H = 56;

export default function WeeklyReport() {
  const query = useWeeklyReport();
  const close = useClose();

  const [drilled, setDrilled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDrilled(true), MIN_DRILL_MS);
    return () => window.clearTimeout(t);
  }, []);

  // One scale for the whole story, from the height actually available.
  const rootRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setScale(scaleFor(el.clientHeight - CHROME_H));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [sharing, setSharing] = useState(false);

  let body: ReactNode;
  // Failure only when there is nothing to show. A background refetch that fails
  // (the window regaining focus on a flaky connection) must not pull someone out
  // of a story they are reading; and a retry drills again while it refetches.
  if (!query.data && query.isError && !query.isFetching) {
    body = (
      <Shell pageCount={1} page={0} onClose={close}>
        <Failed onRetry={() => void query.refetch()} />
      </Shell>
    );
  } else if (!query.data || !drilled) {
    // Loading and "loaded but still drilling" are one tree, so the column keeps
    // freezing in as the real week replaces its blank bands.
    body = (
      <Shell pageCount={8} page={0} onClose={close}>
        <BeatDrilling days={query.data?.days} />
      </Shell>
    );
  } else {
    body = (
      <>
        <div hidden={sharing} style={{ flex: 1, display: sharing ? 'none' : 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Story report={query.data} active={!sharing} onClose={close} onShare={() => setSharing(true)} />
        </div>
        {sharing && <ShareShape report={query.data} onBack={() => setSharing(false)} />}
      </>
    );
  }

  return (
    <StoryScaleContext.Provider value={scale}>
      <main
        ref={rootRef}
        className="aq-screen"
        aria-label={ReportCopy.coreName}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--surface-page)',
        }}
      >
        {body}
      </main>
    </StoryScaleContext.Provider>
  );
}

/**
 * Leaving is one click and always in the same place. Back to wherever the report
 * was opened from; to Profile, where its entry lives, if it was opened directly.
 */
function useClose() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/profile', { replace: true });
  }, [location.key, navigate]);
}

/* ── the story ────────────────────────────────────────────────────────── */

interface Beat {
  key: string;
  node: (ctx: { active: boolean; played: boolean }) => ReactNode;
}

function Story({
  report,
  active,
  onClose,
  onShare,
}: {
  report: Report;
  /** False while Share the shape covers it — keys go to that view instead. */
  active: boolean;
  onClose: () => void;
  onShare: () => void;
}) {
  const beats = beatsFor(report, onClose, onShare);
  const count = beats.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(() => new Set([beats[0]?.key]));
  const [supportDismissed, setSupportDismissed] = useState(false);

  const current = Math.min(page, count - 1);
  const currentKey = beats[current]?.key;
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (currentKey) setSeen((prev) => (prev.has(currentKey) ? prev : new Set(prev).add(currentKey)));
  }, [currentKey]);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      const target = Math.max(0, Math.min(count - 1, i));
      el.scrollTo({ left: target * el.clientWidth });
    },
    [count],
  );

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== page) setPage(i);
  };

  // Coming back from Share the shape, land on the beat that was left — only when
  // the story becomes visible again, not on every page change.
  useLayoutEffect(() => {
    if (!active) return;
    const el = trackRef.current;
    if (el && el.clientWidth) el.scrollTo({ left: currentRef.current * el.clientWidth, behavior: 'instant' });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(current - 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, current, goTo, onClose]);

  const showSupport = isEmptyWeek(report) && report.daysOnBoard > 0 && !supportDismissed;

  return (
    <Shell
      pageCount={count}
      page={current}
      onClose={onClose}
      banner={showSupport ? <SupportBanner onView={onClose} onDismiss={() => setSupportDismissed(true)} /> : null}
    >
      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
        <div ref={trackRef} className="aq-story-track" onScroll={onScroll} style={{ flex: 1 }}>
          {beats.map((b, i) => (
            // No position in the label on purpose: "3 of 8" is the `x of y` the
            // design rules out, and a screen reader is a reader too.
            <section
              key={b.key}
              ref={(node) => {
                // Off-screen beats are out of the tab order, so Tab cannot drag
                // the track sideways to a button nobody is looking at.
                if (node) node.inert = i !== current;
              }}
              className="aq-story-beat"
              aria-roledescription="slide"
              aria-hidden={i !== current}
            >
              {b.node({ active: i === current, played: seen.has(b.key) || i === current })}
            </section>
          ))}
        </div>

        <Chevron side="left" hidden={current === 0} onClick={() => goTo(current - 1)} />
        <Chevron side="right" hidden={current >= count - 1} onClick={() => goTo(current + 1)} />
      </div>
    </Shell>
  );
}

/** Only the beats this week can honestly fill. */
function beatsFor(r: Report, onClose: () => void, onShare: () => void): Beat[] {
  const subjectsById = new Map(r.subjects.map((s) => [s.id, s]));
  const momentSubject = r.moment?.subjectId ? subjectsById.get(r.moment.subjectId) : undefined;

  const texture: [string, string][] = [];
  if (r.longestSession) texture.push([ReportCopy.longestTitle, ReportCopy.longest(r.longestSession)]);
  if (r.heldMinutes > 0) texture.push([ReportCopy.heldTitle, ReportCopy.held(r.heldMinutes)]);
  if (r.rhythmWeekdays.length) texture.push([ReportCopy.rhythmTitle, ReportCopy.rhythm(r.rhythmWeekdays)]);
  if (r.prismMix.length) texture.push([ReportCopy.prismTitle, r.prismMix.map((m) => m.name).join(' · ')]);

  const beats: Beat[] = [
    { key: 'shape', node: () => <BeatShape shape={r.shape} /> },
    { key: 'core', node: ({ played }) => <BeatCore report={r} play={played} /> },
  ];
  if (r.moment) {
    const moment = r.moment;
    beats.push({
      key: 'moment',
      node: () => (
        <BeatMoment
          moment={moment}
          subjectName={momentSubject?.name ?? null}
          subjectColor={momentSubject?.colorHex ?? null}
        />
      ),
    });
  }
  // The week's own count, not the lifetime one. A number above 7 over a
  // seven-band core reads as a mistake, because it is one.
  beats.push({ key: 'numeral', node: () => <BeatNumeral value={r.activeDays} /> });
  if (r.subjects.length) beats.push({ key: 'attention', node: () => <BeatAttention report={r} /> });
  if (r.recovery) {
    const recovery = r.recovery;
    beats.push({ key: 'recovery', node: () => <BeatRecovery recovery={recovery} /> });
  }
  if (texture.length) beats.push({ key: 'texture', node: () => <BeatTexture rows={texture} /> });
  beats.push({
    key: 'landing',
    node: () => (
      <BeatLanding isEmptyWeek={isEmptyWeek(r)} onKeep={onClose} onShare={onShare} onDismiss={onClose} />
    ),
  });
  return beats;
}

/* ── chrome ───────────────────────────────────────────────────────────── */

/** Shared by every state: the close affordance and the page dots. */
function Shell({
  children,
  pageCount,
  page,
  onClose,
  banner,
}: {
  children: ReactNode;
  pageCount: number;
  page: number;
  onClose: () => void;
  banner?: ReactNode;
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          height: CHROME_H,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: BeatSize.column + 40,
          margin: '0 auto',
          padding: '0 10px',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={ReportCopy.close}
          title={ReportCopy.close}
          className="aq-press focus-ring"
          style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="close" size={24} color="var(--text-secondary)" />
        </button>
        <Dots count={pageCount} active={page} />
        <div style={{ width: 44, flexShrink: 0 }} />
      </div>
      {children}
      {banner}
    </div>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <div aria-hidden="true" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            width: i === active ? 22 : 6,
            height: 6,
            margin: '0 3px',
            borderRadius: 3,
            background:
              i === active ? 'var(--accent)' : 'color-mix(in srgb, var(--text-dim) 55%, transparent)',
            transition: 'width 220ms ease-out, background 220ms ease-out',
          }}
        />
      ))}
    </div>
  );
}

function Chevron({ side, hidden, onClick }: { side: 'left' | 'right'; hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? ReportCopy.previousBeat : ReportCopy.nextBeat}
      title={side === 'left' ? ReportCopy.previousBeat : ReportCopy.nextBeat}
      tabIndex={hidden ? -1 : 0}
      className="aq-press aq-lift focus-ring"
      style={{
        position: 'absolute',
        top: '50%',
        [side]: `max(16px, calc(50% - ${BeatSize.column / 2}px - 72px))`,
        transform: 'translateY(-50%)',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
        transition: 'opacity var(--dur-fast) var(--ease-standard)',
      }}
    >
      <Icon name={side === 'left' ? 'chevron_left' : 'chevron_right'} size={24} color="var(--text-primary)" />
    </button>
  );
}

function Failed({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 326, font: '400 14.5px/1.45 var(--font-sans)', color: 'var(--text-primary)' }}>
        {ReportCopy.loadFailed}
      </div>
      <div style={{ height: 16 }} />
      <button
        type="button"
        onClick={onRetry}
        className="aq-press focus-ring"
        style={{ padding: '8px 12px', borderRadius: 8, font: '700 13px var(--font-sans)', color: 'var(--accent)' }}
      >
        {ReportCopy.retry}
      </button>
    </div>
  );
}
