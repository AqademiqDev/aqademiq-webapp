import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import AdaCube from '../../components/brand/AdaCube';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import { EyebrowLabel } from '../../components/core/Misc';
import AddSubject from './AddSubject';
import Semesters from './Semesters';
import CreateSemester from './CreateSemester';
import AddFile from './AddFile';
import { SEMESTERS, SUBJECTS, subjectById, type Subject } from '../../data/subjects';
import { useAppState } from '../../hooks/useAppState';

/* ─────────────────────────────────────────────────────────────────────────
   Section 03 — Subjects (frames 03.1–03.5).

   Master-detail: a list of subject rows on the left (flex:1) and the tinted
   detail pane on the right (flex:1.25). Guests see the empty state (00b.2).
   ───────────────────────────────────────────────────────────────────────── */

export default function Subjects({ semestersOpen = false }: { semestersOpen?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { guest } = useAppState();

  const [selectedId, setSelectedId] = useState(id ?? SUBJECTS[0].id);
  const [addOpen, setAddOpen] = useState(false);
  const [semOpen, setSemOpen] = useState(semestersOpen);
  const [createSemOpen, setCreateSemOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);

  const selected = subjectById(selectedId) ?? SUBJECTS[0];
  const current = SEMESTERS.find((s) => s.current) ?? SEMESTERS[0];

  /* ── 00b.2 Guest Subjects — empty ───────────────────────────────── */
  if (guest) {
    return (
      <>
        <Content padding="24px 26px" center>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <AdaCube size={62} expr="happy" />
          </div>
          <div style={{ font: '800 22px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 8 }}>
            No subjects yet
          </div>
          <div
            style={{
              font: '600 12.5px/1.6 var(--font-sans)',
              color: 'var(--text-secondary)',
              maxWidth: 420,
              marginBottom: 22,
            }}
          >
            Add the classes you&apos;re taking and I&apos;ll keep your materials, deadlines and grades in one place.
          </div>
          <Button onClick={() => setAddOpen(true)} style={{ width: 'auto', padding: '0 26px' }}>
            + Add your first subject
          </Button>
        </Content>
        <AddSubject open={addOpen} onClose={() => setAddOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Content padding="24px 26px">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span className="h-serif" style={{ fontSize: 28 }}>
              Subjects
            </span>
            <span style={{ font: '700 14px var(--font-sans)', color: 'var(--text-dim)' }}>{SUBJECTS.length}</span>
          </div>
          <button
            type="button"
            onClick={() => setSemOpen(true)}
            className="aq-press aq-darken focus-ring"
            style={{
              font: '800 11px var(--font-sans)',
              color: 'var(--text-secondary)',
              background: 'var(--surface-card)',
              borderRadius: 100,
              padding: '7px 13px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {current.name}
          </button>
        </div>

        <div className="aq-subject-cols aq-cols" style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          {/* Left — subject rows */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            {SUBJECTS.map((s) => (
              <SubjectRow
                key={s.id}
                subject={s}
                selected={s.id === selected.id}
                onSelect={() => {
                  setSelectedId(s.id);
                  navigate(`/subjects/${s.id}`, { replace: true });
                }}
              />
            ))}
            <Button
              variant="dashed"
              icon="add"
              iconSize={17}
              full
              onClick={() => setAddOpen(true)}
              style={{ borderRadius: 16, padding: 13, font: '800 12px var(--font-sans)' }}
            >
              Add a subject
            </Button>
          </div>

          {/* Right — detail pane */}
          <div
            className="aq-detail-pane"
            style={{
              flex: 1.25,
              background: 'var(--surface-card)',
              borderRadius: 20,
              boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <div style={{ padding: '22px 22px 18px', background: `${selected.color}12` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    background: `${selected.color}22`,
                    color: selected.textColor ?? selected.color,
                    borderRadius: 8,
                    padding: '4px 10px',
                    font: '800 12px var(--font-sans)',
                  }}
                >
                  {selected.code}
                </span>
                <span style={{ font: '700 11px var(--font-sans)', color: 'var(--text-secondary)' }}>
                  {selected.credits} credits
                </span>
              </div>
              <div className="h-serif" style={{ fontSize: 26, lineHeight: 1.1, marginBottom: 6 }}>
                {selected.name}
              </div>
              <div style={{ font: '600 12px var(--font-sans)', color: 'var(--text-secondary)' }}>
                {selected.professor}
              </div>
            </div>

            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <StatTile value={selected.grade} label="CURRENT" color={selected.textColor ?? selected.color} />
                <StatTile value={selected.target} label="TARGET" />
                <StatTile value={String(selected.fileCount)} label="FILES" numeral />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 11,
                }}
              >
                <EyebrowLabel>FILES &amp; MATERIALS</EyebrowLabel>
                <button
                  type="button"
                  onClick={() => setFileOpen(true)}
                  className="focus-ring"
                  style={{ font: '800 11px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}
                >
                  + Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {selected.files.map((f) => (
                  <div
                    key={f.name}
                    className="aq-press"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: '10px 11px',
                      background: 'var(--surface-page)',
                      borderRadius: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon name={f.icon} size={19} color="var(--accent)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '800 12px var(--font-sans)' }}>{f.name}</div>
                      <div style={{ font: '600 9.5px var(--font-sans)', color: 'var(--text-dim)' }}>{f.meta}</div>
                    </div>
                    <span style={{ color: 'var(--text-dim)' }}>›</span>
                  </div>
                ))}
              </div>

              {selected.nudge && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    background: 'var(--accent-soft)',
                    borderRadius: 14,
                    padding: '13px 14px',
                  }}
                >
                  <AdaCube size={30} expr="focused" />
                  <span style={{ flex: 1, font: '600 11px/1.45 var(--font-sans)' }}>{selected.nudge.text}</span>
                  <button
                    type="button"
                    onClick={() => navigate('/ada')}
                    className="aq-press aq-darken focus-ring"
                    style={{
                      font: '800 11px var(--font-sans)',
                      color: '#fff',
                      background: 'var(--surface-ink)',
                      borderRadius: 100,
                      padding: '7px 13px',
                      flexShrink: 0,
                    }}
                  >
                    {selected.nudge.action}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Content>

      <AddSubject open={addOpen} onClose={() => setAddOpen(false)} />
      <Semesters
        open={semOpen}
        onClose={() => {
          setSemOpen(false);
          if (semestersOpen) navigate('/subjects', { replace: true });
        }}
        onCreate={() => {
          setSemOpen(false);
          setCreateSemOpen(true);
        }}
      />
      <CreateSemester open={createSemOpen} onClose={() => setCreateSemOpen(false)} />
      <AddFile open={fileOpen} onClose={() => setFileOpen(false)} subjectCode={selected.code} />
    </>
  );
}

function SubjectRow({
  subject,
  selected,
  onSelect,
}: {
  subject: Subject;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = subject.textColor ?? subject.color;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="aq-press focus-ring"
      style={{
        display: 'flex',
        gap: 11,
        background: 'var(--surface-card)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: '13px 14px',
        border: selected ? `1.5px solid ${subject.color}` : '1.5px solid transparent',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color var(--dur-fast) var(--ease-standard)',
      }}
    >
      <div style={{ width: 5, borderRadius: 5, background: subject.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ font: '800 9px var(--font-sans)', color: label }}>{subject.code}</span>
          <span style={{ font: '700 9px var(--font-sans)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            · {subject.credits} cr
          </span>
          <span
            style={{
              marginLeft: 'auto',
              background: `${subject.color}1c`,
              color: label,
              borderRadius: 7,
              padding: '3px 8px',
              font: '800 11px var(--font-sans)',
            }}
          >
            {subject.grade}
          </span>
        </div>
        <div style={{ font: '800 14px var(--font-sans)', marginBottom: 4 }}>{subject.name}</div>
        <div style={{ font: '600 10px var(--font-sans)', color: 'var(--text-dim)' }}>
          {subject.meta} · <span style={{ color: label }}>{subject.metaHighlight}</span>
        </div>
      </div>
    </button>
  );
}

function StatTile({
  value,
  label,
  color,
  numeral = false,
}: {
  value: string;
  label: string;
  color?: string;
  numeral?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface-page)',
        borderRadius: 14,
        padding: 14,
        textAlign: 'center',
      }}
    >
      <div className={numeral ? 'h-num' : 'h-serif'} style={{ fontSize: 30, color }}>
        {value}
      </div>
      <EyebrowLabel style={{ marginTop: 4 }}>{label}</EyebrowLabel>
    </div>
  );
}
