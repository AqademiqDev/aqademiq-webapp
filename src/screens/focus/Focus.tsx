import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import IceTimer from '../../components/brand/IceTimer';
import PrismGlyph, { PRISM_MODES } from '../../components/brand/PrismGlyph';
import AdaCube from '../../components/brand/AdaCube';
import Icon from '../../components/core/Icon';
import Popover from '../../components/overlay/Popover';
import Toggle from '../../components/core/Toggle';
import { AsyncSection, EmptyState, errorMessage } from '../../components/core/Async';
import SetTimeDialog from './SetTimeDialog';
import GuestSavePrompt from './GuestSavePrompt';
import { MOOD_LABELS, moodExpr, moodMelt } from '../../data/tasks';
import type { LinkableTask } from '../../data/tasks';
import {
  useCheckpointFocusSession,
  useCompleteFocusSession,
  useLinkableTasks,
  usePrismModes,
  usePrismPreferences,
  useStartFocusSession,
  useUpdatePrismPreferences,
} from '../../hooks/data';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { useAppState } from '../../hooks/useAppState';
import { todayIso } from '../../lib/format';
import { splitOccurrenceId } from '../../lib/mappers';
import type { PrismModeDto } from '../../lib/api';

/* ─────────────────────────────────────────────────────────────────────────
   Section 04 — Focus (frames 04.1–04.7).

   One centred column across every state. The screen swaps between setup
   (04.1), running (04.5), frozen (04.6) and done (04.7) off the timer's
   status; the Prism picker (04.2), Set time (04.3) and Link a task (04.4)
   are local overlays.

   The clock stays client-side — `useFocusTimer` owns the tick and calls the
   handlers below to open, checkpoint and complete the server session row.
   ───────────────────────────────────────────────────────────────────────── */

/** Shown until the catalogue loads, so the pill is never blank. */
const SILENCE: PrismModeDto = { key: 'none', label: 'No sound', description: 'Silence', url: null };

/* The frames give every Prism row a colour, but the served catalogue is keyed
   by sound rather than by the design's five names — so the swatches are handed
   out in catalogue order and silence always takes the muted one. */
const MUTED_SWATCH = PRISM_MODES[PRISM_MODES.length - 1].color;
const SWATCHES = PRISM_MODES.filter((m) => m.id !== 'none').map((m) => m.color);

function prismColor(modes: PrismModeDto[], key: string): string {
  if (key === 'none') return MUTED_SWATCH;
  const i = modes.filter((m) => m.key !== 'none').findIndex((m) => m.key === key);
  return SWATCHES[(i < 0 ? 0 : i) % SWATCHES.length];
}

/** Prism streams are HLS; only play where the browser handles that natively. */
let nativeHls: boolean | null = null;
function playable(url: string | null): url is string {
  if (!url) return false;
  if (!/\.m3u8(\?|$)/i.test(url)) return true;
  if (nativeHls === null) {
    nativeHls = document.createElement('audio').canPlayType('application/vnd.apple.mpegurl') !== '';
  }
  return nativeHls;
}

export default function Focus() {
  const navigate = useNavigate();
  const { guest } = useAppState();

  const linkable = useLinkableTasks();
  const modesQuery = usePrismModes();
  const prefs = usePrismPreferences();
  const updatePrefs = useUpdatePrismPreferences();

  const startSession = useStartFocusSession();
  const checkpoint = useCheckpointFocusSession();
  const completeSession = useCompleteFocusSession();

  const [modeKey, setModeKey] = useState<string | null>(null);
  const [autoplayLocal, setAutoplayLocal] = useState<boolean | null>(null);
  /** null until the picker is touched, so the first task links by default. */
  const [choice, setChoice] = useState<{ id: string | null } | null>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [sessionMood, setSessionMood] = useState<number | null>(3);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  /** The task as it was when the session opened — the plan refetches on finish. */
  const [sessionTask, setSessionTask] = useState<LinkableTask | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const sessionId = useRef<string | null>(null);
  const opening = useRef<Promise<string | null> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const modes = useMemo(() => modesQuery.data ?? [], [modesQuery.data]);
  const fallbackMode = modes.find((m) => m.key !== 'none') ?? modes[0] ?? SILENCE;
  const mode = modes.find((m) => m.key === (modeKey ?? prefs.data?.default_mode)) ?? fallbackMode;
  const swatch = prismColor(modes, mode.key);
  const autoplay = autoplayLocal ?? prefs.data?.play_in_focus ?? true;

  const items = linkable.items;
  const linkedId = choice ? choice.id : items[0]?.id ?? null;
  const selected = useMemo(
    () => items.find((t) => t.id === linkedId) ?? null,
    [items, linkedId],
  );

  /* ── Session plumbing ───────────────────────────────────────────── */

  const currentSession = useCallback(async () => {
    if (sessionId.current) return sessionId.current;
    if (opening.current) return await opening.current;
    return null;
  }, []);

  const pushCheckpoint = useCallback(
    async (elapsedSec: number, status: 'RUNNING' | 'PAUSED') => {
      const id = await currentSession();
      if (!id) return;
      try {
        await checkpoint.mutateAsync({ id, elapsedSec, status });
        setSessionError(null);
      } catch (err) {
        setSessionError(errorMessage(err));
      }
    },
    [currentSession, checkpoint],
  );

  /** Finalises the row; the server marks the linked task done and invalidates. */
  const finish = useCallback(
    async (elapsedSec: number, moodIndex?: number) => {
      const id = await currentSession();
      if (!id) return;
      try {
        await completeSession.mutateAsync({ id, elapsedSec, moodIndex });
        setSessionError(null);
      } catch (err) {
        setSessionError(errorMessage(err));
      }
    },
    [currentSession, completeSession],
  );

  // no endpoint: focus sessions cannot be cancelled, only checkpointed — so
  // letting go of a row parks it at the minutes it actually reached.
  const parkSession = useCallback(
    (elapsedSec: number) => {
      const pending = sessionId.current ? Promise.resolve(sessionId.current) : opening.current;
      sessionId.current = null;
      opening.current = null;
      if (!pending) return;
      void pending.then((id) => {
        if (id) checkpoint.mutate({ id, elapsedSec, status: 'PAUSED' });
      });
    },
    [checkpoint],
  );

  const timer = useFocusTimer(25, {
    onStart: (plannedMin) => {
      setSessionError(null);
      setSessionTask(selected);
      // The link picker holds an occurrence id; the session wants the series.
      const parts = selected ? splitOccurrenceId(selected.id) : null;
      opening.current = startSession
        .mutateAsync({
          planned_min: plannedMin,
          prism_mode: mode.key,
          task_id: parts?.seriesId,
          task_date: parts ? parts.date ?? todayIso() : undefined,
        })
        .then((s) => {
          sessionId.current = s.id;
          return s.id;
        })
        .catch((err: unknown) => {
          setSessionError(errorMessage(err));
          return null;
        });
    },
    // Freeze / resume / tab-hide / unmount only — never on a tick.
    onCheckpoint: (elapsedSec, status) => void pushCheckpoint(elapsedSec, status),
    onComplete: (elapsedSec) => void finish(elapsedSec, sessionMood ?? undefined),
  });

  /* Prism playback. Modes whose stream is still null stay selectable — they
     are stored on the session — they just have nothing to play. */
  const streamUrl = playable(mode.url) ? mode.url : null;
  const volume = Math.min(1, Math.max(0, (prefs.data?.volume_level ?? 50) / 100));

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!streamUrl || !autoplay || timer.status !== 'running') {
      el.pause();
      return;
    }
    el.volume = volume;
    // Autoplay policies can refuse this; the session is unaffected either way.
    void el.play().catch(() => undefined);
  }, [streamUrl, autoplay, volume, timer.status]);

  const restart = () => {
    sessionId.current = null;
    opening.current = null;
    setSessionTask(null);
    setSessionMood(3);
    setSessionError(null);
    timer.reset();
  };

  const setAutoplay = (next: boolean) => {
    setAutoplayLocal(next);
    setPrefsError(null);
    updatePrefs.mutate(
      { play_in_focus: next },
      {
        onError: (err) => {
          setAutoplayLocal(!next);
          setPrefsError(errorMessage(err));
        },
      },
    );
  };

  const dimmed = modeOpen || linkOpen;

  /* ── 04.7 Session done — full-bleed celebratory ground ─────────── */
  if (timer.status === 'done') {
    return (
      <>
        <main
          className="aq-screen"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#1a1320',
            background: 'linear-gradient(160deg,#f5f2ff 0%,#c9bcf8 46%,#6b5cf0 100%)',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,.6)',
              borderRadius: 100,
              padding: '7px 16px',
              font: '700 11px var(--font-sans)',
              color: '#1a1320',
              display: 'flex',
              gap: 7,
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <PrismGlyph size={15} color={swatch} muted={mode.key === 'none'} />
            {mode.label} · Prism
          </div>

          <div style={{ font: '800 32px var(--font-sans)', letterSpacing: '-.5px', marginBottom: 6 }}>
            Session done
          </div>
          <div style={{ font: '600 12.5px var(--font-sans)', color: 'rgba(36,24,52,.58)', marginBottom: 22 }}>
            {sessionTask
              ? `${sessionTask.title} · ${sessionTask.meta.split(' · ')[0]}`
              : 'Focus without a task'}
          </div>

          <div style={{ font: '800 56px var(--font-sans)', letterSpacing: '.5px', lineHeight: 1 }}>
            {timer.focusedClock}
          </div>
          <div style={{ font: '600 13px var(--font-sans)', color: 'rgba(36,24,52,.58)', margin: '8px 0 26px' }}>
            Focused
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,.78)',
              borderRadius: 20,
              padding: '18px 22px',
              marginBottom: 22,
              minWidth: 440,
            }}
          >
            <div style={{ font: '800 13px var(--font-sans)', marginBottom: 14 }}>How was that session?</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              {MOOD_LABELS.map((label, rating) => {
                const on = sessionMood === rating;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={label}
                    disabled={completeSession.isPending}
                    // Re-sends the completion so the mood lands on the row.
                    onClick={() => {
                      setSessionMood(rating);
                      void finish(timer.elapsedSec, rating);
                    }}
                    className="aq-press focus-ring"
                    style={{
                      padding: on ? 4 : 3,
                      borderRadius: '50%',
                      border: on ? '2px solid #6b5cf0' : undefined,
                      background: on ? '#6b5cf022' : undefined,
                      display: 'flex',
                    }}
                  >
                    <AdaCube size={on ? 36 : 34} rating={rating} melt={moodMelt(rating)} expr={moodExpr(rating)} />
                  </button>
                );
              })}
            </div>
          </div>

          {sessionError && (
            <div
              role="alert"
              style={{
                font: '700 11.5px/1.5 var(--font-sans)',
                color: '#8a1f3a',
                maxWidth: 360,
                marginBottom: 14,
              }}
            >
              {sessionError}
            </div>
          )}

          <button
            type="button"
            onClick={() => (guest ? setSavePromptOpen(true) : navigate('/plan'))}
            className="aq-press aq-darken focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#1a1320',
              color: '#fff',
              borderRadius: 100,
              padding: '14px 32px',
              font: '800 14px var(--font-sans)',
              marginBottom: 12,
            }}
          >
            Back to today →
          </button>
          <button
            type="button"
            onClick={restart}
            className="focus-ring"
            style={{ font: '700 12px var(--font-sans)', color: 'rgba(36,24,52,.58)', borderRadius: 4 }}
          >
            Start another session
          </button>
        </main>

        <GuestSavePrompt open={savePromptOpen} onClose={() => setSavePromptOpen(false)} />
      </>
    );
  }

  /* ── 04.1 setup / 04.5 running / 04.6 frozen ───────────────────── */
  const running = timer.status === 'running';
  const paused = timer.status === 'paused';
  const active = running || paused;
  const linked = active ? sessionTask : selected;

  return (
    <>
      <main
        className="aq-screen"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          ...(dimmed ? { filter: 'blur(2px)' } : null),
        }}
      >
        {/* Mode + Set time pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: active ? 20 : 22 }}>
          <button
            type="button"
            onClick={() => setModeOpen(true)}
            className="aq-press focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-soft)',
              border: '1px solid rgba(107,92,240,.4)',
              borderRadius: 100,
              padding: '9px 16px',
              font: '700 12px var(--font-sans)',
              color: 'var(--accent)',
            }}
          >
            <span style={{ fontSize: 13 }}>◈</span>
            {mode.label}
          </button>
          <button
            type="button"
            onClick={() => setTimeOpen(true)}
            className="aq-press aq-darken focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface-card)',
              boxShadow: 'var(--shadow-card)',
              borderRadius: 100,
              padding: '9px 16px',
              font: '700 12px var(--font-sans)',
            }}
          >
            <Icon name="timer" size={15} />
            Set time
          </button>
        </div>

        <div
          style={{
            font: '800 30px var(--font-sans)',
            letterSpacing: '-.5px',
            marginBottom: active ? 5 : 14,
          }}
        >
          {paused ? 'Frozen' : 'Focus'}
        </div>

        {active ? (
          <div style={{ font: '600 12px var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 22 }}>
            {linked ? `${linked.meta.split(' · ')[0]} · ${linked.title}` : 'Focus without a task'}
          </div>
        ) : (
          /* Linked-task chip — 04.1 */
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            className="aq-press aq-darken focus-ring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-card)',
              boxShadow: 'var(--shadow-card)',
              borderRadius: 100,
              padding: '8px 14px',
              marginBottom: 26,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: linked?.color ?? 'var(--text-dim)',
                flexShrink: 0,
              }}
            />
            <span style={{ font: '700 12px var(--font-sans)' }}>{linked?.title ?? 'Focus without a task'}</span>
            {linked && (
              <span style={{ font: '600 11px var(--font-sans)', color: 'var(--text-dim)' }}>
                {linked.meta.split(' · ')[0]}
              </span>
            )}
            <Icon name="expand_more" size={16} color="var(--text-dim)" />
          </button>
        )}

        <div
          style={{
            width: 216,
            height: 216,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IceTimer progress={timer.progress} expr="happy" size={216} drip={running} frost={paused} />
        </div>

        <div
          style={{
            font: '800 42px var(--font-sans)',
            letterSpacing: '.5px',
            margin: '22px 0 24px',
            ...(paused ? { color: 'var(--text-secondary)' } : null),
          }}
        >
          {timer.clock}
        </div>

        {active ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {/* The local clock is authoritative, so these stay live while a
                checkpoint is in flight. */}
            <SessionButton
              icon={paused ? 'play_arrow' : 'ac_unit'}
              label={paused ? 'Resume' : 'Freeze'}
              onClick={paused ? timer.resume : timer.freeze}
              primary
            />
            <SessionButton icon="stop_circle" label="End" onClick={timer.end} />
          </div>
        ) : (
          <button
            type="button"
            onClick={timer.start}
            disabled={startSession.isPending}
            className="aq-press aq-darken focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 48,
              borderRadius: 100,
              background: 'var(--surface-ink)',
              color: '#fff',
              font: '800 14px var(--font-sans)',
              padding: '0 44px',
            }}
          >
            <Icon name="play_arrow" size={18} />
            Start focus
          </button>
        )}

        {sessionError && (
          <div
            role="alert"
            style={{
              marginTop: 14,
              font: '700 11.5px/1.5 var(--font-sans)',
              color: 'var(--aq-danger)',
              maxWidth: 340,
            }}
          >
            {sessionError}
          </div>
        )}

        {/* Prism stream — not rendered by the browser, no `controls`. */}
        <audio ref={audioRef} src={streamUrl ?? undefined} loop preload="none" />
      </main>

      {/* ── 04.2 Prism mode picker ─────────────────────────────────── */}
      <Popover
        open={modeOpen}
        onClose={() => setModeOpen(false)}
        width={300}
        anchor={{ top: 118 - 58, left: 'calc(50% - 232px)' }}
        panelStyle={{ padding: '6px 0 0', overflow: 'hidden' }}
        aria-label="Prism mode"
      >
        <div
          style={{
            padding: '13px 16px 9px',
            font: '800 11px var(--font-sans)',
            letterSpacing: '.1em',
            color: 'var(--text-dim)',
          }}
        >
          PRISM MODE
        </div>

        <AsyncSection
          query={modesQuery}
          loadingLabel="Loading modes…"
          empty={{
            when: modes.length === 0,
            node: <EmptyState icon="graphic_eq" title="No modes yet" caption="Prism sounds aren't available right now." />,
          }}
        >
          {modes.map((m) => {
            const on = m.key === mode.key;
            return (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setModeKey(m.key);
                  setModeOpen(false);
                }}
                className="focus-ring"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderBottom: '1px solid var(--border-hairline)',
                  background: on ? 'var(--accent-soft)' : 'transparent',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <PrismGlyph size={20} color={prismColor(modes, m.key)} muted={m.key === 'none'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      font: `${on ? 800 : 700} 13.5px var(--font-sans)`,
                      color: on ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{ font: '600 10px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 1 }}
                  >
                    {m.description}
                  </div>
                </div>
                {on && <Icon name="check_circle" size={18} color="var(--accent)" />}
              </button>
            );
          })}
        </AsyncSection>

        <div
          style={{
            borderTop: '1px solid var(--border-hairline)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <Icon name="music_note" size={16} color="var(--text-secondary)" />
          <span style={{ flex: 1, font: '700 12px var(--font-sans)', textAlign: 'left' }}>Autoplay Prism</span>
          <Toggle
            checked={autoplay}
            onChange={setAutoplay}
            disabled={updatePrefs.isPending}
            small
            aria-label="Autoplay Prism"
          />
        </div>
        {prefsError && (
          <div
            role="alert"
            style={{
              padding: '0 16px 12px',
              font: '700 11px/1.5 var(--font-sans)',
              color: 'var(--aq-danger)',
              textAlign: 'left',
            }}
          >
            {prefsError}
          </div>
        )}
      </Popover>

      {/* ── 04.4 Link a task ───────────────────────────────────────── */}
      <Popover
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        width={340}
        anchor={{ top: 150 - 58, left: '50%' }}
        panelStyle={{ padding: '6px 0', overflow: 'hidden', transform: 'translateX(-50%)' }}
        aria-label="Link a task"
      >
        <div
          style={{
            padding: '13px 16px 9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              font: '800 11px var(--font-sans)',
              letterSpacing: '.1em',
              color: 'var(--text-dim)',
            }}
          >
            LINK A TASK
          </span>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            aria-label="Close"
            className="aq-press focus-ring"
            style={{ display: 'flex', borderRadius: '50%' }}
          >
            <Icon name="close" size={18} color="var(--text-dim)" />
          </button>
        </div>

        <AsyncSection
          query={linkable}
          loadingLabel="Loading today…"
          empty={{
            when: items.length === 0,
            node: (
              <EmptyState
                icon="task_alt"
                title="Nothing open today"
                caption="Nothing left to link — focus on its own instead."
              />
            ),
          }}
        >
          {items.map((t) => {
            const on = t.id === linkedId;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setChoice({ id: t.id });
                  setLinkOpen(false);
                }}
                className="focus-ring"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-hairline)',
                  background: on ? 'var(--accent-soft)' : 'transparent',
                  width: '100%',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div
                    style={{
                      font: `${on ? 800 : 700} 13px var(--font-sans)`,
                      color: on ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {t.title}
                  </div>
                  <div style={{ font: '600 10px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 1 }}>
                    {t.meta}
                  </div>
                </div>
                {on && <Icon name="check_circle" size={18} color="var(--accent)" />}
              </button>
            );
          })}
        </AsyncSection>

        <button
          type="button"
          onClick={() => {
            setChoice({ id: null });
            setLinkOpen(false);
          }}
          className="focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '12px 16px',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <Icon name="block" size={16} color="var(--text-dim)" />
          <span style={{ font: '700 12px var(--font-sans)', color: 'var(--text-secondary)' }}>
            Focus without a task
          </span>
        </button>
      </Popover>

      {/* ── 04.3 Set time ──────────────────────────────────────────── */}
      <SetTimeDialog
        open={timeOpen}
        onClose={() => setTimeOpen(false)}
        minutes={timer.minutes}
        onApply={(m) => {
          // Re-timing restarts the clock, so any open row is let go of first.
          if (active) parkSession(timer.elapsedSec);
          setSessionTask(null);
          setSessionError(null);
          timer.setMinutes(m);
          setTimeOpen(false);
        }}
      />
    </>
  );
}

function SessionButton({
  icon,
  label,
  onClick,
  primary = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aq-press aq-darken focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 100,
        font: '800 14px var(--font-sans)',
        ...(primary
          ? { background: 'var(--surface-ink)', color: '#fff', padding: '14px 28px' }
          : {
              background: 'var(--surface-card)',
              border: '1.5px solid var(--border-hairline)',
              color: '#e85476',
              padding: '14px 26px',
            }),
      }}
    >
      <Icon name={icon} size={18} />
      {label}
    </button>
  );
}
