import { useState } from 'react';
import Icon from '../../../components/core/Icon';
import Modal from '../../../components/overlay/Modal';
import Toggle from '../../../components/core/Toggle';
import { PanelHead, Row, ValueRow } from '../Settings';

/* Frames 13.3 (Notifications) + 13.10 (Notification sound sheet). */

const ROWS = [
  { id: 'plan', title: 'Daily plan ready', sub: 'Every morning at 8:00', on: true },
  { id: 'tasks', title: 'Task reminders', sub: '10 min before planned tasks', on: true },
  { id: 'focus', title: 'Focus nudges', sub: 'Suggest a session in free slots', on: false },
  { id: 'mood', title: 'Mood check-ins', sub: 'Morning & evening', on: true },
  { id: 'streak', title: 'Streak alerts', sub: 'Before a streak breaks', on: true },
];

const SOUNDS = ['Chime', 'Pulse', 'Glass', 'Drop', 'None'];

export default function Notifications() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(ROWS.map((r) => [r.id, r.on])),
  );
  const [sound, setSound] = useState('Chime');
  const [soundOpen, setSoundOpen] = useState(false);

  return (
    <>
      <PanelHead title="Notifications" sub="Gentle nudges, never noisy." gap={20} />

      {ROWS.map((r) => (
        <Row
          key={r.id}
          title={r.title}
          sub={r.sub}
          control={
            <Toggle
              checked={!!state[r.id]}
              onChange={(v) => setState((s) => ({ ...s, [r.id]: v }))}
              aria-label={r.title}
            />
          }
        />
      ))}

      {/* Flow-graph edge "Notifications → Notification sound" (README §4.3).
          13.3 draws no sound row, so this reuses 13.4's ValueRow pattern.
          Noted in BUILD_NOTES.md. */}
      <ValueRow label="SOUND" value={sound} action="Change" onAction={() => setSoundOpen(true)} last />

      {/* 13.10 — Notification sound */}
      <Modal
        open={soundOpen}
        onClose={() => setSoundOpen(false)}
        title="Notification sound"
        maxWidth={420}
        panelStyle={{ padding: '24px 26px' }}
      >
        <div role="radiogroup" aria-label="Notification sound" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {SOUNDS.map((s) => {
            const on = s === sound;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setSound(s);
                  setSoundOpen(false);
                }}
                className="aq-press focus-ring"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderRadius: 100,
                  border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-hairline)'}`,
                  background: on ? 'var(--accent-soft)' : 'var(--surface-page)',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    font: '700 13px var(--font-sans)',
                    color: on ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  {s}
                </span>
                {on ? (
                  <Icon name="check_circle" size={20} color="var(--accent)" />
                ) : (
                  <Icon name="volume_up" size={18} color="var(--text-dim)" />
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
