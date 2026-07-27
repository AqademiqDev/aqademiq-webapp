import { useState } from 'react';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Popover from '../../components/overlay/Popover';
import { AsyncSection, EmptyState, errorMessage } from '../../components/core/Async';
import { useActivateSemester, useDeleteSemester, useSemesterCards } from '../../hooks/data';

/* Frame 03.3 — Semesters popover, anchored top:104px right:30px, width 330.
   GET /v1/semesters for the rows, PATCH /v1/semesters/:id/activate to switch,
   DELETE /v1/semesters/:id to remove one (409 on the last remaining term). */

export default function Semesters({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  const semesters = useSemesterCards();
  const activate = useActivateSemester();
  const remove = useDeleteSemester();
  const [failure, setFailure] = useState('');

  const busy = activate.isPending || remove.isPending;

  function choose(id: string, current: boolean) {
    if (busy) return;
    if (current) {
      onClose();
      return;
    }
    setFailure('');
    activate.mutate(id, {
      onSuccess: () => onClose(),
      onError: (e) => setFailure(errorMessage(e)),
    });
  }

  function drop(id: string) {
    if (busy) return;
    setFailure('');
    // The server refuses the last remaining term with a 409 — show it inline.
    remove.mutate(id, { onError: (e) => setFailure(errorMessage(e)) });
  }

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
        <AsyncSection
          query={semesters}
          loadingLabel="Loading semesters…"
          empty={{
            when: semesters.cards.length === 0,
            node: (
              <EmptyState
                icon="school"
                title="No semesters yet"
                caption="Create one and your subjects will group under it."
                padding={18}
              />
            ),
          }}
        >
          {semesters.cards.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              aria-pressed={!!s.current}
              onClick={() => choose(s.id, !!s.current)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  choose(s.id, !!s.current);
                }
              }}
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
                cursor: 'pointer',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* no endpoint: GPA is not tracked server-side */}
                <div className="h-num" style={{ fontSize: 22, color: s.current ? 'var(--accent)' : 'var(--text-dim)' }}>
                  {s.gpa}
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${s.name}`}
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    drop(s.id);
                  }}
                  className="aq-press focus-ring"
                  style={{ display: 'flex', borderRadius: '50%', opacity: busy ? 0.45 : 1 }}
                >
                  <Icon name="delete_outline" size={17} color="var(--text-dim)" />
                </button>
              </div>
            </div>
          ))}
        </AsyncSection>

        {failure && (
          <div
            role="alert"
            style={{ font: '600 10.5px/1.5 var(--font-sans)', color: 'var(--aq-danger)' }}
          >
            {failure}
          </div>
        )}

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
