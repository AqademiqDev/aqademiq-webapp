import { useEffect, useState } from 'react';
import Button from '../../components/core/Button';
import Input from '../../components/core/Input';
import Modal from '../../components/overlay/Modal';
import Segmented from '../../components/core/Segmented';
import { EyebrowLabel } from '../../components/core/Misc';
import { SwatchRow } from '../../components/content/FormBits';
import { errorMessage } from '../../components/core/Async';
import { useCreateSubject, useSemesterCards, useUpdateSubject } from '../../hooks/data';
import { SUBJECT_SWATCHES } from '../../data/subjects';
import type { SubjectDto, SubjectInput } from '../../lib/api';

/* Frame 03.2 — Add / edit subject. Modal, max-width 520.
   POST /v1/subjects on create, PATCH /v1/subjects/:id when a `subject` is
   passed in (the sheet doubles as the edit sheet). */

/** The 03.2 swatch order differs from 01.6's — keep each frame's own run. */
const SWATCHES = ['#6b5cf0', '#5cbbff', '#e85476', '#2a9d6b', '#e8a430', '#c0497b'];

export default function AddSubject({
  open,
  onClose,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  /** When given, the sheet edits this subject instead of creating a new one. */
  subject?: SubjectDto;
}) {
  const semesters = useSemesterCards();
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const pending = create.isPending || update.isPending;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('');
  const [professor, setProfessor] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [scale, setScale] = useState<'gpa' | 'pct'>('gpa');
  const [target, setTarget] = useState('');
  const [errors, setErrors] = useState<{ name?: string; code?: string; credits?: string }>({});
  const [failure, setFailure] = useState('');

  // Re-seed every time the sheet opens so a cancelled edit never leaks forward.
  useEffect(() => {
    if (!open) return;
    setName(subject?.name ?? '');
    setCode(subject?.code ?? '');
    setCredits(subject?.credits != null ? String(subject.credits) : '');
    setProfessor(subject?.prof ?? '');
    setColor(subject?.color_hex || SWATCHES[0]);
    setTarget(subject?.target_grade ?? '');
    setErrors({});
    setFailure('');
  }, [open, subject]);

  function save() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Give the subject a name.';
    if (!code.trim()) next.code = 'Add a code.';
    const creditsNum = credits.trim() ? Number(credits) : undefined;
    if (creditsNum !== undefined && !Number.isFinite(creditsNum)) next.credits = 'Credits must be a number.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const input: SubjectInput = {
      name: name.trim(),
      color_hex: color,
      code: code.trim() || undefined,
      credits: creditsNum,
      prof: professor.trim() || undefined,
      target_grade: target.trim() || undefined,
      // New subjects land in the active term; an edit keeps the one it has.
      semester_id: subject?.semester_id ?? semesters.active?.id ?? undefined,
    };

    setFailure('');
    const handlers = {
      onSuccess: () => onClose(),
      onError: (e: unknown) => setFailure(errorMessage(e)),
    };
    if (subject) update.mutate({ id: subject.id, patch: input }, handlers);
    else create.mutate(input, handlers);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subject ? 'Edit subject' : 'Add subject'}
      maxWidth={520}
      panelStyle={{ padding: '24px 26px' }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          label="NAME"
          value={name}
          placeholder="Compiler Construction"
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
          wrapperStyle={{ flex: 2 }}
        />
        <Input
          label="CODE"
          value={code}
          placeholder="CC 401"
          error={errors.code}
          onChange={(e) => setCode(e.target.value)}
          wrapperStyle={{ flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          label="CREDITS"
          value={credits}
          placeholder="4"
          inputMode="numeric"
          error={errors.credits}
          onChange={(e) => setCredits(e.target.value)}
          wrapperStyle={{ flex: 1 }}
        />
        <Input
          label="PROFESSOR"
          value={professor}
          placeholder="Prof. S. Rao"
          onChange={(e) => setProfessor(e.target.value)}
          wrapperStyle={{ flex: 2 }}
        />
      </div>

      <EyebrowLabel style={{ marginBottom: 9 }}>COLOR</EyebrowLabel>
      <SwatchRow value={color} onChange={setColor} swatches={SWATCHES} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
        <EyebrowLabel>TARGET GRADE</EyebrowLabel>
        {/* no endpoint: the API stores `target_grade` as free text and has no
            scale field — the toggle switches the example the field asks for. */}
        <Segmented
          aria-label="Grade scale"
          value={scale}
          onChange={setScale}
          options={[
            { value: 'gpa', label: 'GPA' },
            { value: 'pct', label: '%' },
          ]}
          style={{ background: 'var(--surface-page)', borderRadius: 8, padding: 3, boxShadow: 'none' }}
        />
      </div>
      <Input
        value={target}
        placeholder={scale === 'gpa' ? 'A (9.0)' : '85%'}
        onChange={(e) => setTarget(e.target.value)}
        aria-label="Target grade"
        wrapperStyle={{ marginBottom: failure ? 12 : 22 }}
      />

      {failure && (
        <div
          role="alert"
          style={{
            font: '600 11px/1.5 var(--font-sans)',
            color: 'var(--aq-danger)',
            marginBottom: 14,
          }}
        >
          {failure}
        </div>
      )}

      <Button full onClick={save} loading={pending}>
        Save subject
      </Button>
    </Modal>
  );
}

export { SUBJECT_SWATCHES };
