import { useState } from 'react';
import Button from '../../components/core/Button';
import Input from '../../components/core/Input';
import Modal from '../../components/overlay/Modal';
import Segmented from '../../components/core/Segmented';
import { EyebrowLabel } from '../../components/core/Misc';
import { SwatchRow } from '../../components/content/FormBits';
import { SUBJECT_SWATCHES } from '../../data/subjects';

/* Frame 03.2 — Add / edit subject. Modal, max-width 520. */

/** The 03.2 swatch order differs from 01.6's — keep each frame's own run. */
const SWATCHES = ['#6b5cf0', '#5cbbff', '#e85476', '#2a9d6b', '#e8a430', '#c0497b'];

export default function AddSubject({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('Compiler Construction');
  const [code, setCode] = useState('CC 401');
  const [credits, setCredits] = useState('4');
  const [professor, setProfessor] = useState('Prof. S. Rao');
  const [color, setColor] = useState(SWATCHES[0]);
  const [scale, setScale] = useState<'gpa' | 'pct'>('gpa');
  const [target, setTarget] = useState('A (9.0)');
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

  function save() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Give the subject a name.';
    if (!code.trim()) next.code = 'Add a code.';
    setErrors(next);
    if (Object.keys(next).length) return;
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add subject" maxWidth={520} panelStyle={{ padding: '24px 26px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          label="NAME"
          value={name}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
          wrapperStyle={{ flex: 2 }}
        />
        <Input
          label="CODE"
          value={code}
          error={errors.code}
          onChange={(e) => setCode(e.target.value)}
          wrapperStyle={{ flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          label="CREDITS"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          wrapperStyle={{ flex: 1 }}
        />
        <Input
          label="PROFESSOR"
          value={professor}
          onChange={(e) => setProfessor(e.target.value)}
          wrapperStyle={{ flex: 2 }}
        />
      </div>

      <EyebrowLabel style={{ marginBottom: 9 }}>COLOR</EyebrowLabel>
      <SwatchRow value={color} onChange={setColor} swatches={SWATCHES} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
        <EyebrowLabel>TARGET GRADE</EyebrowLabel>
        <Segmented
          aria-label="Grade scale"
          value={scale}
          onChange={setScale}
          options={[
            { value: 'gpa', label: 'GPA' },
            { value: 'pct', label: '%' },
          ]}
          style={{ background: 'var(--surface-page)', borderRadius: 8, padding: 3, boxShadow: 'none' }}
        />
      </div>
      <Input
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        aria-label="Target grade"
        wrapperStyle={{ marginBottom: 22 }}
      />

      <Button full onClick={save}>
        Save subject
      </Button>
    </Modal>
  );
}

export { SUBJECT_SWATCHES };
