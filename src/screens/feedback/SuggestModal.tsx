import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Input, { Textarea } from '../../components/core/Input';
import Modal from '../../components/overlay/Modal';
import { errorMessage } from '../../components/core/Async';
import { InlineError } from './parts';
import { useBoardMeta, useCreateBoardPost } from '../../hooks/data';
import { TYPE_BY_KEY, TYPE_ICON, type SuggestionType } from '../../data/suggestions';

/* Frame 06b.3 — Make a suggestion (sheet). Modal, max-width 520.
   POSTs `/v1/feedback/posts`; the server caps titles at 3–140 chars and the
   body at 5000, so the same limits are enforced before the call. */

const TITLE_MIN = 3;
const TITLE_MAX = 140;
const BODY_MAX = 5000;

interface TypeOption {
  key: string;
  label: SuggestionType;
}

/** Drawn while `/feedback/meta` is in flight so the type row never reflows. */
const DEFAULT_TYPES: TypeOption[] = [
  { key: 'feature', label: 'Feature' },
  { key: 'improvement', label: 'Improvement' },
  { key: 'bug', label: 'Bug' },
];

export default function SuggestModal({
  open,
  onClose,
  initialCategory,
}: {
  open: boolean;
  onClose: () => void;
  /** Pre-selects a category — the banner's "Found a bug?" opens on Bug. */
  initialCategory?: string;
}) {
  const meta = useBoardMeta();
  const create = useCreateBoardPost();

  const types = useMemo<TypeOption[]>(() => {
    const mapped = (meta.data?.categories ?? [])
      .filter((c) => TYPE_BY_KEY[c.key])
      .map((c) => ({ key: c.key, label: TYPE_BY_KEY[c.key] }));
    return mapped.length ? mapped : DEFAULT_TYPES;
  }, [meta.data]);

  const [category, setCategory] = useState(initialCategory ?? DEFAULT_TYPES[0].key);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [titleError, setTitleError] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [formError, setFormError] = useState('');

  /* Each opening starts from a clean sheet, on the requested category. */
  useEffect(() => {
    if (!open) return;
    setCategory(initialCategory ?? DEFAULT_TYPES[0].key);
    setTitle('');
    setDetails('');
    setTitleError('');
    setDetailsError('');
    setFormError('');
  }, [open, initialCategory]);

  /* If the server's vocabulary does not carry the selected key, fall back. */
  useEffect(() => {
    if (types.some((t) => t.key === category)) return;
    setCategory(types[0].key);
  }, [types, category]);

  function share() {
    const t = title.trim();
    const d = details.trim();

    if (!t) {
      setTitleError('Give your suggestion a title.');
      return;
    }
    if (t.length < TITLE_MIN) {
      setTitleError(`Titles need at least ${TITLE_MIN} characters.`);
      return;
    }
    if (t.length > TITLE_MAX) {
      setTitleError(`Keep the title under ${TITLE_MAX} characters.`);
      return;
    }
    if (d.length > BODY_MAX) {
      setDetailsError(`Keep the details under ${BODY_MAX} characters.`);
      return;
    }
    setTitleError('');
    setDetailsError('');
    setFormError('');

    create.mutate(
      { title: t, body: d || undefined, category },
      {
        onSuccess: () => onClose(),
        onError: (err) => setFormError(errorMessage(err)),
      },
    );
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
        {types.map((t) => {
          const on = category === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setCategory(t.key)}
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
              <Icon name={TYPE_ICON[t.label]} size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <Input
        label="TITLE"
        value={title}
        focusedStyle
        error={titleError}
        maxLength={TITLE_MAX}
        placeholder="Sync deadlines from Google Calendar"
        onChange={(e) => {
          setTitle(e.target.value);
          setTitleError('');
          setFormError('');
        }}
        style={{ fontSize: 14 }}
        wrapperStyle={{ marginBottom: 16 }}
      />

      <Textarea
        label="DETAILS (OPTIONAL)"
        value={details}
        error={detailsError}
        maxLength={BODY_MAX}
        placeholder="Auto-import assignment due dates so I don't re-enter them each week — one less thing to forget."
        onChange={(e) => {
          setDetails(e.target.value);
          setDetailsError('');
          setFormError('');
        }}
        wrapperStyle={{ marginBottom: 22 }}
      />

      {formError && <InlineError message={formError} style={{ marginTop: -14, marginBottom: 14 }} />}

      <Button full onClick={share} loading={create.isPending} disabled={create.isPending}>
        Share suggestion
      </Button>
    </Modal>
  );
}
