import { useState } from 'react';

import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import { errorMessage } from '../../components/core/Async';
import { useSubmitRating } from '../../hooks/data';

/* The star rating used to be a second "feedback" row sitting directly beside
   "Share feedback" on the stats screen — two doors to the same intent. It now
   lives on the feedback board itself, so there is exactly one place to go.

   Exported as `RateAppModal` for the board's header button. */

/** "Rate the app" — POST /ratings takes a 1–5 star score. */
export default function RateAppModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stars, setStars] = useState(0);
  const submit = useSubmitRating();

  const close = () => {
    submit.reset();
    setStars(0);
    onClose();
  };

  const send = () => {
    if (stars < 1) return;
    submit.mutate({ rating: stars }, { onSuccess: close });
  };

  return (
    <Modal open={open} onClose={close} title="Rate the app" maxWidth={420} aria-label="Rate the app">
      <div
        style={{
          font: '600 12px/1.5 var(--font-sans)',
          color: 'var(--text-secondary)',
          marginBottom: 14,
        }}
      >
        How is Aqademiq treating you so far?
      </div>

      <div role="radiogroup" aria-label="Rating" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={n === 1 ? '1 star' : `${n} stars`}
            onClick={() => setStars(n)}
            className="aq-press focus-ring"
            style={{ display: 'flex', borderRadius: 8, padding: 4 }}
          >
            <Icon
              name={n <= stars ? 'star' : 'star_outline'}
              size={30}
              color={n <= stars ? 'var(--accent)' : 'var(--text-dim)'}
            />
          </button>
        ))}
      </div>

      {submit.isError && (
        <div
          style={{
            font: '700 11.5px/1.5 var(--font-sans)',
            color: 'var(--aq-danger)',
            marginBottom: 12,
          }}
        >
          {errorMessage(submit.error)}
        </div>
      )}

      <Button full onClick={send} disabled={stars < 1} loading={submit.isPending}>
        Send rating
      </Button>
    </Modal>
  );
}
