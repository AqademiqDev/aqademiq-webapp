import Button from '../../components/core/Button';
import Modal from '../../components/overlay/Modal';
import { Dropzone, FileRow } from '../../components/content/FormBits';

/* Frame 03.5 — Add file to subject (sheet). Modal, max-width 460.
   File upload only — no link / note / scan options (README §3). */

export default function AddFile({
  open,
  onClose,
  subjectCode,
}: {
  open: boolean;
  onClose: () => void;
  subjectCode: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add to ${subjectCode}`}
      maxWidth={460}
      panelStyle={{ padding: '24px 26px' }}
    >
      <div
        style={{
          font: '600 12px var(--font-sans)',
          color: 'var(--text-secondary)',
          marginTop: -12,
          marginBottom: 18,
        }}
      >
        Files, notes and links Ada can read for this subject.
      </div>

      <Dropzone
        hint="PDF, DOCX, PPTX, images · up to 20 MB"
        style={{ borderRadius: 16, padding: '34px 20px', textAlign: 'center', marginBottom: 20 }}
      />

      <FileRow
        name="Lecture 09 — SLR parsing.pdf"
        meta="1.4 MB · ready"
        sunken
        style={{ marginBottom: 20 }}
      />

      <Button full onClick={onClose}>
        Add file
      </Button>
    </Modal>
  );
}
