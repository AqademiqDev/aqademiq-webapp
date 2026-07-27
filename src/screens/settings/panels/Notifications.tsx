import { useState } from 'react';
import Icon from '../../../components/core/Icon';
import Modal from '../../../components/overlay/Modal';
import Toggle from '../../../components/core/Toggle';
import { EmptyState, ErrorState, Loading } from '../../../components/core/Async';
import { InlineError, PanelHead, Row, ValueRow } from '../Settings';
import {
  useNotificationPreferences,
  useSetNotificationChannel,
  useUpdateNotificationPreferences,
} from '../../../hooks/data';
import type { NotificationSound } from '../../../lib/api';

/* Frames 13.3 (Notifications) + 13.10 (Notification sound sheet).

   The rows are driven by whatever channels `/me/notification-preferences`
   returns — the live keys are morning, review, weekly_review, task_due,
   task_start, task_half and task_end. COPY holds the drawn wording for the
   channels 13.3 draws and matching wording for the rest.

   no endpoint: device tokens are mobile-only, so there is no web push
   registration (and no "send a test" row) on this panel. */

const COPY: Record<string, { title: string; sub: string }> = {
  morning: { title: 'Daily plan ready', sub: 'Every morning' },
  review: { title: 'Evening review', sub: 'A gentle look back at the day' },
  weekly_review: { title: 'Weekly review', sub: 'Once a week, on the whole week' },
  task_due: { title: 'Task reminders', sub: '10 min before planned tasks' },
  task_start: { title: 'When a task starts', sub: 'A nudge as a planned task begins' },
  task_half: { title: 'Halfway through', sub: 'Midway through a planned task' },
  task_end: { title: 'When a task ends', sub: 'As a planned task wraps up' },
};

const SOUNDS: NotificationSound[] = ['Chime', 'Pulse', 'Glass', 'Drop', 'None'];

/** The send time for a channel — 24h `HH:MM`, saved when the field is left. */
function TimeField({
  value,
  label,
  onCommit,
}: {
  value: string;
  label: string;
  onCommit: (hhmm: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft && draft !== value) onCommit(draft);
    setDraft(null);
  };

  return (
    <input
      type="time"
      value={draft ?? value}
      aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className="focus-ring"
      style={{
        height: 30,
        borderRadius: 100,
        border: '1.5px solid var(--border-hairline)',
        background: 'var(--surface-page)',
        color: 'var(--text-primary)',
        padding: '0 10px',
        font: '700 11px var(--font-sans)',
        outline: 'none',
      }}
    />
  );
}

export default function Notifications() {
  const prefs = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const setChannel = useSetNotificationChannel();

  const [soundOpen, setSoundOpen] = useState(false);

  const data = prefs.data;
  const channels = data?.channels ?? [];

  /** The two daily times live on the preferences record; the weekly one on its
      own channel row — so each time control writes to the right endpoint. */
  function saveTime(channelKey: string, enabled: boolean, hhmm: string) {
    if (!hhmm) return;
    if (channelKey === 'morning') updatePrefs.mutate({ notification_time_morning: hhmm });
    else if (channelKey === 'review') updatePrefs.mutate({ notification_time_review: hhmm });
    else setChannel.mutate({ channelKey, enabled, sendTime: hhmm });
  }

  return (
    <>
      <PanelHead title="Notifications" sub="Gentle nudges, never noisy." gap={20} />

      {prefs.isLoading && <Loading label="Loading your reminders…" padding="10px 0" />}
      {prefs.isError && <ErrorState error={prefs.error} onRetry={prefs.refetch} padding="10px 0" />}
      {!prefs.isLoading && !prefs.isError && channels.length === 0 && (
        <EmptyState
          icon="notifications_none"
          title="No reminders to tune"
          caption="Nothing is set up to nudge you yet."
          padding="10px 0"
        />
      )}

      {!prefs.isLoading &&
        !prefs.isError &&
        channels.map((c) => {
          const copy = COPY[c.channel_key] ?? { title: c.channel_key, sub: 'Reminder' };
          const busy = setChannel.isPending && setChannel.variables?.channelKey === c.channel_key;
          return (
            <Row
              key={c.channel_key}
              title={copy.title}
              sub={c.send_time ? `${copy.sub} at ${c.send_time}` : copy.sub}
              control={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.send_time && (
                    <TimeField
                      value={c.send_time}
                      label={`${copy.title} time`}
                      onCommit={(hhmm) => saveTime(c.channel_key, c.enabled, hhmm)}
                    />
                  )}
                  <Toggle
                    checked={c.enabled}
                    disabled={busy}
                    onChange={(v) => setChannel.mutate({ channelKey: c.channel_key, enabled: v })}
                    aria-label={copy.title}
                  />
                </div>
              }
            />
          );
        })}

      {/* Flow-graph edge "Notifications → Notification sound" (README §4.3).
          13.3 draws no sound row, so this reuses 13.4's ValueRow pattern.
          Noted in BUILD_NOTES.md. */}
      <ValueRow
        label="SOUND"
        value={data?.notification_sound ?? '—'}
        action="Change"
        onAction={() => setSoundOpen(true)}
        disabled={!data || updatePrefs.isPending}
        last
      />

      <InlineError error={setChannel.error ?? updatePrefs.error} />

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
            const on = s === data?.notification_sound;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={updatePrefs.isPending}
                onClick={() => {
                  updatePrefs.mutate({ notification_sound: s });
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
