import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Popover from '../../components/overlay/Popover';
import { SEMESTERS } from '../../data/subjects';

/* Frame 03.3 — Semesters popover, anchored top:104px right:30px, width 330. */

export default function Semesters({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <Popover
      open={open}
      onClose={onClose}
      width={330}
      anchor={{ top: 104 - 58, right: 30 }}
      panelStyle={{ padding: '16px 16px 14px' }}
      aria-label="Semesters"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ font: '800 15px var(--font-sans)' }}>Semesters</div>
          <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 2 }}>
            Switch term — GPA rolls up per semester.
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="aq-press focus-ring" style={{ display: 'flex', borderRadius: '50%' }}>
          <Icon name="close" size={18} color="var(--text-dim)" />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {SEMESTERS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={onClose}
            aria-pressed={!!s.current}
            className="aq-press focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 13,
              border: `1.5px solid ${s.current ? 'var(--accent)' : 'var(--border-hairline)'}`,
              background: s.current ? 'var(--accent-soft)' : 'transparent',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div>
              <div style={{ font: '800 13px var(--font-sans)' }}>
                {s.name}
                {s.current && (
                  <span
                    style={{
                      font: '700 9px var(--font-sans)',
                      color: 'var(--accent)',
                      background: 'var(--surface-card)',
                      borderRadius: 6,
                      padding: '2px 6px',
                      marginLeft: 4,
                    }}
                  >
                    CURRENT
                  </span>
                )}
              </div>
              <div style={{ font: '600 10px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 2 }}>
                {s.subjects} subjects · {s.credits} credits
              </div>
            </div>
            <div className="h-num" style={{ fontSize: 22, color: s.current ? 'var(--accent)' : 'var(--text-dim)' }}>
              {s.gpa}
            </div>
          </button>
        ))}

        <Button
          variant="dashed"
          icon="add"
          iconSize={17}
          full
          onClick={onCreate}
          style={{ borderRadius: 13, padding: 12, font: '800 12px var(--font-sans)' }}
        >
          Create semester
        </Button>
      </div>
    </Popover>
  );
}
