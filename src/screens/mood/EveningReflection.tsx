import { useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import MoodScale from '../../components/content/MoodScale';
import { EyebrowLabel } from '../../components/core/Misc';

/* Frame 07.2 — Evening reflection. Same shell as 07.1, 42px cubes,
   plus a sunken optional note field. */

export default function EveningReflection({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rating, setRating] = useState<number | null>(2);
  const [note, setNote] = useState('');

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
        You focused 55 minutes and finished 3 of 4 tasks.
      </div>

      <MoodScale value={rating} onChange={setRating} size={42} style={{ marginBottom: 20 }} />

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

      <Button full onClick={onClose} disabled={rating === null}>
        Save reflection
      </Button>
    </Modal>
  );
}
