import { useState } from 'react';
import Button from '../../../components/core/Button';
import Icon from '../../../components/core/Icon';
import Input from '../../../components/core/Input';
import Modal from '../../../components/overlay/Modal';
import { EmptyState, ErrorState, Loading, errorMessage } from '../../../components/core/Async';
import { EyebrowLabel } from '../../../components/core/Misc';
import { SwatchRow } from '../../../components/content/FormBits';
import { InlineError, PanelHead } from '../Settings';
import { useCreateStudyTag, useDeleteStudyTag, useStudyTags } from '../../../hooks/data';

/* Frames 13.2 (Study tags) + 13.11 (New study tag sheet). */

const TAG_SWATCHES = ['#5cbbff', '#6b5cf0', '#e85476', '#2a9d6b', '#e8a430', '#c0497b', '#9aa3b2'];

export default function StudyTags() {
  const tags = useStudyTags();
  const createTag = useCreateStudyTag();
  const deleteTag = useDeleteStudyTag();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Revision');
  const [color, setColor] = useState('#6b5cf0');
  const [error, setError] = useState('');

  const list = tags.data ?? [];
  const loaded = !tags.isLoading && !tags.isError;

  async function create() {
    if (!name.trim()) {
      setError('Name the tag.');
      return;
    }
    try {
      await createTag.mutateAsync({ label: name.trim(), color });
      setError('');
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <>
      <PanelHead title="Study tags" sub="Categorise tasks. Ada uses these to pace and group your work." />

      {tags.isLoading && <Loading label="Loading tags…" padding="6px 0 14px" style={{ alignItems: 'flex-start' }} />}
      {tags.isError && (
        <ErrorState
          error={tags.error}
          onRetry={tags.refetch}
          padding="6px 0 14px"
          style={{ alignItems: 'flex-start', textAlign: 'left' }}
        />
      )}
      {loaded && list.length === 0 && (
        <EmptyState
          icon="sell"
          title="No study tags yet"
          caption="Add one and Ada will use it to group and pace your work."
          padding="6px 0 14px"
          style={{ alignItems: 'flex-start', textAlign: 'left' }}
        />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 520 }}>
        {list.map((t) => (
          <span
            key={t.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 15px',
              borderRadius: 100,
              border: '1.5px solid var(--border-hairline)',
              font: '700 12px var(--font-sans)',
              opacity: deleteTag.isPending && deleteTag.variables === t.label ? 0.45 : 1,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
            {t.label}
            {/* The delete endpoint takes the label text, not the id. */}
            <button
              type="button"
              onClick={() => deleteTag.mutate(t.label)}
              disabled={deleteTag.isPending}
              aria-label={`Remove ${t.label}`}
              className="focus-ring aq-press"
              style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', borderRadius: 100 }}
            >
              <Icon name="close" size={13} />
            </button>
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

      <InlineError error={deleteTag.error} style={{ maxWidth: 520 }} />

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
          <Button onClick={create} loading={createTag.isPending} style={{ flex: 1 }}>
            Create tag
          </Button>
        </div>
      </Modal>
    </>
  );
}
