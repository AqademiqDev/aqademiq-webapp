import { useState } from 'react';
import Button from '../../../components/core/Button';
import Input from '../../../components/core/Input';
import Modal from '../../../components/overlay/Modal';
import { EyebrowLabel } from '../../../components/core/Misc';
import { SwatchRow } from '../../../components/content/FormBits';
import { PanelHead } from '../Settings';
import { TAG_COLORS } from '../../../components/core/TagChip';

/* Frames 13.2 (Study tags) + 13.11 (New study tag sheet). */

const TAG_SWATCHES = ['#5cbbff', '#6b5cf0', '#e85476', '#2a9d6b', '#e8a430', '#c0497b', '#9aa3b2'];

export default function StudyTags() {
  const [tags, setTags] = useState(Object.entries(TAG_COLORS).map(([name, color]) => ({ name, color })));
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Revision');
  const [color, setColor] = useState('#6b5cf0');
  const [error, setError] = useState('');

  function create() {
    if (!name.trim()) {
      setError('Name the tag.');
      return;
    }
    setTags((t) => [...t, { name: name.trim(), color }]);
    setError('');
    setOpen(false);
  }

  return (
    <>
      <PanelHead title="Study tags" sub="Categorise tasks. Ada uses these to pace and group your work." />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 520 }}>
        {tags.map((t) => (
          <span
            key={t.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 15px',
              borderRadius: 100,
              border: '1.5px solid var(--border-hairline)',
              font: '700 12px var(--font-sans)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
            {t.name}
          </span>
        ))}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="aq-press focus-ring"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 15px',
            borderRadius: 100,
            border: '1.5px dashed var(--accent)',
            color: 'var(--accent)',
            font: '800 12px var(--font-sans)',
          }}
        >
          + New tag
        </button>
      </div>

      {/* 13.11 — New study tag */}
      <Modal open={open} onClose={() => setOpen(false)} title="New study tag" maxWidth={420} panelStyle={{ padding: '24px 26px' }}>
        <Input
          label="TAG NAME"
          value={name}
          focusedStyle
          error={error}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          wrapperStyle={{ marginBottom: 18 }}
        />

        <EyebrowLabel style={{ marginBottom: 10 }}>COLOR</EyebrowLabel>
        <SwatchRow value={color} onChange={setColor} swatches={TAG_SWATCHES} style={{ marginBottom: 20 }} />

        <EyebrowLabel style={{ marginBottom: 10 }}>PREVIEW</EyebrowLabel>
        <div style={{ marginBottom: 22 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 14px',
              borderRadius: 100,
              border: `1.5px solid ${color}`,
              background: `${color}18`,
              font: '700 12px var(--font-sans)',
              color,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            {name || 'Tag'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={() => setOpen(false)} style={{ padding: '0 22px' }}>
            Cancel
          </Button>
          <Button onClick={create} style={{ flex: 1 }}>
            Create tag
          </Button>
        </div>
      </Modal>
    </>
  );
}
