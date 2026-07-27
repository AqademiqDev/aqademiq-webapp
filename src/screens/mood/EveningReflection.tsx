import { useEffect, useRef, useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import MoodScale from '../../components/content/MoodScale';
import { EyebrowLabel } from '../../components/core/Misc';
import { ErrorState, Loading, errorMessage } from '../../components/core/Async';
import { useDayPlan, useLogMood, useLogReflection, useMood } from '../../hooks/data';
import { todayIso } from '../../lib/format';

/* Frame 07.2 — Evening reflection. Same shell as 07.1, 42px cubes,
   plus a sunken optional note field. */

export default function EveningReflection({ open, onClose }: { open: boolean; onClose: () => void }) {
  const date = todayIso();
  const mood = useMood(date);
  const day = useDayPlan(date);
  const logMood = useLogMood();
  const logReflection = useLogReflection();

  const [rating, setRating] = useState<number | null>(2);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const hydrated = useRef(false);

  const busy = logMood.isPending || logReflection.isPending;

  // Prefill once per opening — today's mood and any reflection already written.
  useEffect(() => {
    if (!open) {
      hydrated.current = false;
      return;
    }
    if (hydrated.current || mood.isLoading) return;
    hydrated.current = true;
    setRating(mood.data?.mood_index ?? 2);
    setNote(mood.data?.reflection ?? '');
    setError('');
  }, [open, mood.isLoading, mood.data]);

  /* The frame's subtitle counts the day. Focus minutes are only exposed as a
     lifetime total, so the line reports what the plan actually knows.
     no endpoint: /me/stats has no per-day focus figure. */
  const total = day.tasks.length;
  const summary = day.isLoading
    ? 'Taking stock of today…'
    : day.isError
      ? 'Take a moment for today.'
      : total
        ? `You finished ${day.doneCount} of ${total} ${total === 1 ? 'task' : 'tasks'} today.`
        : 'Nothing was planned today.';

  async function save() {
    setError('');
    try {
      // One mood row per day (the morning check-in writes it), so moving the
      // evening scale updates that entry — and only when it actually changed.
      if (rating !== null && rating !== (mood.data?.mood_index ?? null)) {
        await logMood.mutateAsync({
          date,
          moodIndex: rating,
          intention: mood.data?.intention ?? undefined,
        });
      }
      await logReflection.mutateAsync({ date, reflection: note.trim() });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideClose
      maxWidth={480}
      padding={30}
      panelStyle={{ textAlign: 'center' }}
      aria-label="Evening reflection"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 8 }}>
        <Icon name="wb_twilight" size={14} color="#6b5cf0" />
        <EyebrowLabel>EVENING REFLECTION</EyebrowLabel>
      </div>

      <div className="h-serif" style={{ fontSize: 24, marginBottom: 6 }}>
        How did today go?
      </div>
      <div style={{ font: '600 12px var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 24 }}>
        {summary}
      </div>

      {mood.isLoading ? (
        <Loading padding={30} label="Loading today…" />
      ) : (
        <>
          {/* A failed read should not block the write — the scale stays usable. */}
          {mood.isError && (
            <ErrorState error={mood.error} onRetry={() => void mood.refetch()} padding={8} />
          )}
          <MoodScale value={rating} onChange={setRating} size={42} style={{ marginBottom: 20 }} />
        </>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note about today… (optional)"
        aria-label="Note about today"
        className="focus-ring"
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'var(--surface-page)',
          borderRadius: 14,
          padding: '12px 14px',
          font: '600 12px var(--font-sans)',
          color: 'var(--text-primary)',
          border: 0,
          outline: 'none',
          resize: 'vertical',
          minHeight: 44,
          marginBottom: 20,
        }}
      />

      {error && (
        <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--aq-danger)', marginBottom: 12 }}>
          {error}
        </div>
      )}

      <Button full onClick={save} loading={busy} disabled={rating === null || mood.isLoading}>
        Save reflection
      </Button>
    </Modal>
  );
}
