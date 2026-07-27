import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import IceTimer from '../../components/brand/IceTimer';
import PrismGlyph, { PRISM_MODES, type PrismModeId } from '../../components/brand/PrismGlyph';
import AdaCube from '../../components/brand/AdaCube';
import Icon from '../../components/core/Icon';
import Popover from '../../components/overlay/Popover';
import Toggle from '../../components/core/Toggle';
import SetTimeDialog from './SetTimeDialog';
import GuestSavePrompt from './GuestSavePrompt';
import { LINKABLE_TASKS, MOOD_LABELS, moodExpr, moodMelt } from '../../data/tasks';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { useAppState } from '../../hooks/useAppState';

/* ─────────────────────────────────────────────────────────────────────────
   Section 04 — Focus (frames 04.1–04.7).

   One centred column across every state. The screen swaps between setup
   (04.1), running (04.5), frozen (04.6) and done (04.7) off the timer's
   status; the Prism picker (04.2), Set time (04.3) and Link a task (04.4)
   are local overlays.
   ───────────────────────────────────────────────────────────────────────── */

export default function Focus() {
  const navigate = useNavigate();
  const { guest } = useAppState();
  const timer = useFocusTimer(25);

  const [mode, setMode] = useState<PrismModeId>('deep');
  const [autoplay, setAutoplay] = useState(true);
  const [linkedId, setLinkedId] = useState<string | null>(LINKABLE_TASKS[0].id);
  const [modeOpen, setModeOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [sessionMood, setSessionMood] = useState<number | null>(3);
  const [savePromptOpen, setSavePromptOpen] = useState(false);

  const prism = PRISM_MODES.find((m) => m.id === mode)!;
  const linked = LINKABLE_TASKS.find((t) => t.id === linkedId) ?? null;
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
            <PrismGlyph size={15} color={prism.color} muted={prism.id === 'none'} />
            {prism.name} · Prism
          </div>

          <div style={{ font: '800 32px var(--font-sans)', letterSpacing: '-.5px', marginBottom: 6 }}>
            Session done
          </div>
          <div style={{ font: '600 12.5px var(--font-sans)', color: 'rgba(36,24,52,.58)', marginBottom: 22 }}>
            {linked ? `${linked.title} · ${linked.meta.split(' · ')[0]}` : 'Focus without a task'}
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
                    onClick={() => setSessionMood(rating)}
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
            onClick={timer.reset}
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
            {prism.name}
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
        {PRISM_MODES.map((m) => {
          const on = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setMode(m.id);
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
              <PrismGlyph size={20} color={m.color} muted={m.id === 'none'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    font: `${on ? 800 : 700} 13.5px var(--font-sans)`,
                    color: on ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  {m.name}
                </div>
                <div
                  style={{ font: '600 10px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 1 }}
                >
                  {m.desc}
                </div>
              </div>
              {on && <Icon name="check_circle" size={18} color="var(--accent)" />}
            </button>
          );
        })}
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
          <Toggle checked={autoplay} onChange={setAutoplay} small aria-label="Autoplay Prism" />
        </div>
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

        {LINKABLE_TASKS.map((t) => {
          const on = t.id === linkedId;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setLinkedId(t.id);
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

        <button
          type="button"
          onClick={() => {
            setLinkedId(null);
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
