import { useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import MoodScale from '../../components/content/MoodScale';
import { EyebrowLabel } from '../../components/core/Misc';

/* Frame 07.1 — Morning check-in. Modal, max-width 480, padding 30. */

export default function MorningCheckIn({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rating, setRating] = useState<number | null>(3);

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

      <MoodScale value={rating} onChange={setRating} size={46} style={{ marginBottom: 26 }} />

      <Button full onClick={onClose} disabled={rating === null}>
        Save check-in
      </Button>
    </Modal>
  );
}
