import { useEffect, useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import { Slider } from '../../components/core/Misc';
import { FOCUS_MAX, FOCUS_MIN, FOCUS_PRESETS, FOCUS_STEP } from '../../hooks/useFocusTimer';

/* Frame 04.3 — Set time dialog. Modal, max-width 320.
   Slider bounds are the brief's pre-resolved item 10: min 5, max 120, step 5. */

export default function SetTimeDialog({
  open,
  onClose,
  minutes,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  minutes: number;
  onApply: (m: number) => void;
}) {
  const [value, setValue] = useState(minutes);

  useEffect(() => {
    if (open) setValue(minutes);
  }, [open, minutes]);

  const step = (delta: number) => setValue((v) => Math.min(FOCUS_MAX, Math.max(FOCUS_MIN, v + delta)));

  return (
    <Modal open={open} onClose={onClose} hideClose maxWidth={320} padding="22px 24px" aria-label="Set time">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ font: '800 18px var(--font-sans)' }}>Set time</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="aq-press aq-darken focus-ring"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--surface-page)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
          }}
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, margin: '18px 0' }}>
        <RoundStep icon="remove" label="Decrease" onClick={() => step(-FOCUS_STEP)} disabled={value <= FOCUS_MIN} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, lineHeight: 1 }}>
            {value}
          </span>
          <span style={{ font: '700 14px var(--font-sans)', color: 'var(--text-secondary)' }}>min</span>
        </div>
        <RoundStep icon="add" label="Increase" onClick={() => step(FOCUS_STEP)} disabled={value >= FOCUS_MAX} />
      </div>

      <Slider
        value={value}
        min={FOCUS_MIN}
        max={FOCUS_MAX}
        step={FOCUS_STEP}
        onChange={setValue}
        aria-label="Session length in minutes"
        style={{ marginBottom: 18 }}
      />

      <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
        {FOCUS_PRESETS.map((p) => {
          const on = p === value;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setValue(p)}
              aria-pressed={on}
              className="aq-press focus-ring"
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 0',
                borderRadius: 100,
                font: '700 12px var(--font-sans)',
                background: on ? 'var(--accent)' : 'var(--surface-page)',
                color: on ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {p}
            </button>
          );
        })}
      </div>

      <Button full onClick={() => onApply(value)}>
        Set · {value} min
      </Button>
    </Modal>
  );
}

function RoundStep({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="aq-press aq-darken focus-ring"
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: 'var(--surface-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={19} color="var(--text-secondary)" />
    </button>
  );
}
