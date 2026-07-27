import { useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Input, { Textarea } from '../../components/core/Input';
import Modal from '../../components/overlay/Modal';
import { TYPE_ICON, type SuggestionType } from '../../data/suggestions';

/* Frame 06b.3 — Make a suggestion (sheet). Modal, max-width 520. */

const TYPES: SuggestionType[] = ['Feature', 'Improvement', 'Bug'];

export default function SuggestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<SuggestionType>('Feature');
  const [title, setTitle] = useState('Sync deadlines from Google Calendar');
  const [details, setDetails] = useState(
    "Auto-import assignment due dates so I don't re-enter them each week — one less thing to forget.",
  );
  const [error, setError] = useState('');

  function share() {
    if (!title.trim()) {
      setError('Give your suggestion a title.');
      return;
    }
    setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} hideClose maxWidth={520} padding="24px 26px" aria-label="Make a suggestion">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ font: '800 18px var(--font-sans)', letterSpacing: '-.2px' }}>Make a suggestion</div>
          <div style={{ font: '600 12px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 3 }}>
            Share an idea — the community votes on what gets built.
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="aq-press focus-ring" style={{ display: 'flex', borderRadius: '50%' }}>
          <Icon name="close" size={20} color="var(--text-dim)" />
        </button>
      </div>

      <div role="radiogroup" aria-label="Suggestion type" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TYPES.map((t) => {
          const on = type === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setType(t)}
              className="aq-press focus-ring"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '11px 0',
                borderRadius: 12,
                border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-hairline)'}`,
                background: on ? 'var(--accent-soft)' : 'transparent',
                color: on ? 'var(--accent)' : 'var(--text-secondary)',
                font: '800 12.5px var(--font-sans)',
              }}
            >
              <Icon name={TYPE_ICON[t]} size={16} />
              {t}
            </button>
          );
        })}
      </div>

      <Input
        label="TITLE"
        value={title}
        focusedStyle
        error={error}
        onChange={(e) => {
          setTitle(e.target.value);
          setError('');
        }}
        style={{ fontSize: 14 }}
        wrapperStyle={{ marginBottom: 16 }}
      />

      <Textarea
        label="DETAILS (OPTIONAL)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        wrapperStyle={{ marginBottom: 22 }}
      />

      <Button full onClick={share}>
        Share suggestion
      </Button>
    </Modal>
  );
}
