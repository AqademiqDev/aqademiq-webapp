import { useState } from 'react';
import Button from '../../components/core/Button';
import Input, { FieldDisplay } from '../../components/core/Input';
import Modal from '../../components/overlay/Modal';
import Toggle from '../../components/core/Toggle';

/* Frame 03.4 — Create semester (sheet). Modal, max-width 460. */

export default function CreateSemester({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("Fall '26");
  const [asCurrent, setAsCurrent] = useState(true);
  const [error, setError] = useState('');

  function create() {
    if (!name.trim()) {
      setError('Name the semester.');
      return;
    }
    setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Create semester" maxWidth={460} panelStyle={{ padding: '24px 26px' }}>
      <Input
        label="NAME"
        value={name}
        focusedStyle
        error={error}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        wrapperStyle={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <FieldDisplay label="STARTS" value="Aug 2026" icon="today" />
        </div>
        <div style={{ flex: 1 }}>
          <FieldDisplay label="ENDS" value="Dec 2026" icon="today" />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 15px',
          borderRadius: 12,
          background: 'var(--surface-page)',
          marginBottom: 22,
        }}
      >
        <div>
          <div style={{ font: '800 12.5px var(--font-sans)' }}>Set as current</div>
          <div style={{ font: '600 10px var(--font-sans)', color: 'var(--text-dim)' }}>
            New subjects land here by default
          </div>
        </div>
        <Toggle checked={asCurrent} onChange={setAsCurrent} aria-label="Set as current semester" />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" onClick={onClose} style={{ padding: '0 22px' }}>
          Cancel
        </Button>
        <Button onClick={create} style={{ flex: 1 }}>
          Create semester
        </Button>
      </div>
    </Modal>
  );
}
