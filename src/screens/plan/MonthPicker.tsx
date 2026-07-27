import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import { MONTH_DAYS, MONTH_LABEL, MONTH_LEGEND, MONTH_WEEKDAYS } from '../../data/tasks';

/* Frame 02.4 — Month picker. Modal, max-width 440. */

export default function MonthPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} hideClose maxWidth={440} padding={24} aria-label="Jump to date">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button type="button" aria-label="Previous month" className="aq-press focus-ring" style={{ display: 'flex', borderRadius: '50%' }}>
          <Icon name="chevron_left" size={22} color="var(--text-secondary)" />
        </button>
        <span style={{ font: '800 17px var(--font-sans)' }}>{MONTH_LABEL}</span>
        <button type="button" aria-label="Next month" className="aq-press focus-ring" style={{ display: 'flex', borderRadius: '50%' }}>
          <Icon name="chevron_right" size={22} color="var(--text-secondary)" />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7,1fr)',
          gap: 6,
          marginBottom: 8,
        }}
      >
        {MONTH_WEEKDAYS.map((w, i) => (
          <div
            key={i}
            style={{ textAlign: 'center', font: '800 9px var(--font-sans)', color: 'var(--text-dim)' }}
          >
            {w}
          </div>
        ))}
        {MONTH_DAYS.map((d) => (
          <div key={d.date} style={{ textAlign: 'center', padding: '9px 0', position: 'relative' }}>
            {d.today ? (
              <span
                style={{
                  display: 'inline-flex',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--surface-ink)',
                  color: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '800 12px var(--font-sans)',
                }}
              >
                {d.date}
              </span>
            ) : (
              <span
                style={{
                  font: '700 12px var(--font-sans)',
                  color: d.date === MONTH_LEGEND.date ? 'var(--accent)' : d.muted ? 'var(--text-dim)' : undefined,
                }}
              >
                {d.date}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 20px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ font: '600 11px var(--font-sans)', color: 'var(--text-secondary)' }}>{MONTH_LEGEND.text}</span>
      </div>

      <Button full onClick={onClose}>
        Jump to date
      </Button>
    </Modal>
  );
}
