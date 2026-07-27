import { useEffect, useRef, useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import MoodScale from '../../components/content/MoodScale';
import { EyebrowLabel } from '../../components/core/Misc';
import { ErrorState, Loading, errorMessage } from '../../components/core/Async';
import { useLogMood, useMood } from '../../hooks/data';
import { todayIso } from '../../lib/format';

/* Frame 07.1 — Morning check-in. Modal, max-width 480, padding 30. */

export default function MorningCheckIn({ open, onClose }: { open: boolean; onClose: () => void }) {
  const date = todayIso();
  const mood = useMood(date);
  const log = useLogMood();

  const [rating, setRating] = useState<number | null>(3);
  const [error, setError] = useState('');
  const hydrated = useRef(false);

  // Prefill from today's entry once per opening, so a re-check-in starts where
  // the last one left off without stamping over an in-progress change.
  useEffect(() => {
    if (!open) {
      hydrated.current = false;
      return;
    }
    if (hydrated.current || mood.isLoading) return;
    hydrated.current = true;
    setRating(mood.data?.mood_index ?? 3);
    setError('');
  }, [open, mood.isLoading, mood.data]);

  function save() {
    if (rating === null) return;
    setError('');
    log.mutate(
      // Mood and intention share one row, so the saved intention is re-sent —
      // omitting it clears it, and this frame draws no field for it.
      { date, moodIndex: rating, intention: mood.data?.intention ?? undefined },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideClose
      maxWidth={480}
      padding={30}
      panelStyle={{ textAlign: 'center' }}
      aria-label="Morning check-in"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 8 }}>
        <Icon name="wb_sunny" size={14} color="#e8a430" />
        <EyebrowLabel>MORNING CHECK-IN</EyebrowLabel>
      </div>

      <div className="h-serif" style={{ fontSize: 24, marginBottom: 6 }}>
        How are you feeling?
      </div>
      <div style={{ font: '600 12px var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 26 }}>
        The cube melts with your mood. Frozen is great.
      </div>

      {mood.isLoading ? (
        <Loading padding={34} label="Loading today…" />
      ) : (
        <>
          {/* A failed read should not block the write — the scale stays usable. */}
          {mood.isError && (
            <ErrorState error={mood.error} onRetry={() => void mood.refetch()} padding={8} />
          )}
          <MoodScale value={rating} onChange={setRating} size={46} style={{ marginBottom: 26 }} />
        </>
      )}

      {error && (
        <div
          style={{
            font: '600 10.5px var(--font-sans)',
            color: 'var(--aq-danger)',
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <Button full onClick={save} loading={log.isPending} disabled={rating === null || mood.isLoading}>
        Save check-in
      </Button>
    </Modal>
  );
}
