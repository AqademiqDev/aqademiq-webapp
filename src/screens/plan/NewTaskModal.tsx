import { useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import TagChip, { TAG_COLORS } from '../../components/core/TagChip';
import { EyebrowLabel } from '../../components/core/Misc';
import { TASK_TAGS } from '../../data/tasks';

/* Frame 02.3 — New task (quick add). Modal, max-width 500. */

const TILES = [
  { icon: 'schedule', label: 'TIME', value: '11:30 AM' },
  { icon: 'today', label: 'DATE', value: 'Today' },
  { icon: 'hourglass_empty', label: 'DURATION', value: '30 min' },
  { icon: 'repeat', label: 'REPEAT', value: 'Never' },
];

export default function NewTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('Finish LL(1) parsing notes');
  const [tag, setTag] = useState<string>('Class');
  const [error, setError] = useState('');

  function add() {
    if (!title.trim()) {
      setError('Give the task a title.');
      return;
    }
    setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New task" maxWidth={500}>
      <input
        value={title}
        autoFocus
        aria-label="Task title"
        onChange={(e) => {
          setTitle(e.target.value);
          setError('');
        }}
        className="focus-ring"
        style={{
          width: '100%',
          font: '700 18px var(--font-sans)',
          padding: '10px 0',
          border: 0,
          borderBottom: `1.5px solid ${error ? 'var(--aq-danger)' : 'var(--accent)'}`,
          background: 'transparent',
          outline: 'none',
          color: 'var(--text-primary)',
          marginBottom: error ? 6 : 18,
          borderRadius: 0,
        }}
      />
      {error && (
        <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--aq-danger)', marginBottom: 14 }}>{error}</div>
      )}

      <EyebrowLabel style={{ marginBottom: 9 }}>TAG</EyebrowLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
        {TASK_TAGS.map((t) => (
          <TagChip
            key={t}
            label={t}
            color={TAG_COLORS[t]}
            selected={tag === t}
            onClick={() => setTag(t)}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        {TILES.map((t) => (
          <div
            key={t.label}
            className="aq-press"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-page)',
              borderRadius: 12,
              padding: '11px 13px',
              cursor: 'pointer',
            }}
          >
            <Icon name={t.icon} size={17} color="var(--text-secondary)" />
            <div>
              <div style={{ font: '700 9px var(--font-sans)', color: 'var(--text-dim)' }}>{t.label}</div>
              <div style={{ font: '800 12px var(--font-sans)' }}>{t.value}</div>
            </div>
          </div>
        ))}
      </div>

      <Button full onClick={add}>
        Add task
      </Button>
    </Modal>
  );
}
